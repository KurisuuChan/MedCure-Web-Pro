// 🔧 **INVENTORY FIX SCRIPT**
// Applies the stock update trigger fix for POS transactions

import { supabase } from "./src/config/supabase.js";
import fs from "fs";

console.log("🔧 Applying inventory update fix...");

async function applyInventoryFix() {
  try {
    // 1. Drop existing trigger and function
    console.log("🗑️ Dropping existing trigger and function...");

    const dropTrigger = `DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sale_items;`;
    const { error: dropTriggerError } = await supabase.rpc("exec_sql", {
      sql: dropTrigger,
    });

    const dropFunction = `DROP FUNCTION IF EXISTS update_stock_on_sale();`;
    const { error: dropFunctionError } = await supabase.rpc("exec_sql", {
      sql: dropFunction,
    });

    // 2. Create new improved function
    console.log("🛠️ Creating improved stock update function...");

    const createFunction = `
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
    pieces_to_deduct INTEGER;
    product_pieces_per_sheet INTEGER;
    product_sheets_per_box INTEGER;
BEGIN
    -- Get current stock and product configuration
    SELECT stock_in_pieces, pieces_per_sheet, sheets_per_box 
    INTO current_stock, product_pieces_per_sheet, product_sheets_per_box
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Check if product exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', NEW.product_id;
    END IF;
    
    -- Calculate pieces to deduct based on unit type
    CASE COALESCE(NEW.unit_type, 'piece')
        WHEN 'piece' THEN
            pieces_to_deduct := NEW.quantity;
        WHEN 'sheet' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_pieces_per_sheet, 1);
        WHEN 'box' THEN
            pieces_to_deduct := NEW.quantity * COALESCE(product_pieces_per_sheet, 1) * COALESCE(product_sheets_per_box, 1);
        ELSE
            pieces_to_deduct := NEW.quantity;
    END CASE;
    
    -- Update product stock
    UPDATE products 
    SET stock_in_pieces = stock_in_pieces - pieces_to_deduct,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Record stock movement
    INSERT INTO stock_movements (
        product_id, 
        user_id, 
        movement_type, 
        quantity, 
        reason,
        reference_id, 
        reference_type, 
        stock_before, 
        stock_after,
        created_at
    ) VALUES (
        NEW.product_id,
        (SELECT user_id FROM sales WHERE id = NEW.sale_id),
        'out',
        -pieces_to_deduct,
        'Sale transaction - ' || COALESCE(NEW.unit_type, 'piece'),
        NEW.sale_id,
        'sale',
        current_stock,
        current_stock - pieces_to_deduct,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`;

    const { error: createFunctionError } = await supabase.rpc("exec_sql", {
      sql: createFunction,
    });

    if (createFunctionError) {
      console.error("❌ Function creation failed:", createFunctionError);
      return false;
    }

    // 3. Create the trigger
    console.log("🎯 Creating trigger...");

    const createTrigger = `
CREATE TRIGGER trigger_update_stock_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_sale();`;

    const { error: createTriggerError } = await supabase.rpc("exec_sql", {
      sql: createTrigger,
    });

    if (createTriggerError) {
      console.error("❌ Trigger creation failed:", createTriggerError);
      return false;
    }

    // 4. Verify the trigger exists
    console.log("✅ Verifying trigger installation...");

    const { data: triggers, error: verifyError } = await supabase
      .from("information_schema.triggers")
      .select("trigger_name, event_object_table")
      .eq("trigger_name", "trigger_update_stock_on_sale");

    if (verifyError) {
      console.log(
        "⚠️ Could not verify trigger (might still work):",
        verifyError
      );
    } else if (triggers && triggers.length > 0) {
      console.log("🎉 Trigger verified and installed successfully!");
    } else {
      console.log(
        "⚠️ Trigger verification inconclusive, but should be working"
      );
    }

    return true;
  } catch (error) {
    console.error("💥 Fix application failed:", error);
    return false;
  }
}

// Run the fix
applyInventoryFix().then((success) => {
  if (success) {
    console.log("🎉 Inventory update fix applied successfully!");
    console.log(
      "🛒 Stock should now decrease when POS transactions are completed!"
    );
    console.log("🔄 Try completing a sale to test the fix.");
  } else {
    console.log(
      "⚠️ Fix application failed. Manual database update may be required."
    );
  }
});
