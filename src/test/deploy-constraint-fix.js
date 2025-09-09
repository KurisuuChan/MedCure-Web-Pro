// Quick fix deployment using Node.js and environment variables

// Set environment variables for this script
process.env.VITE_SUPABASE_URL = "https://kbvdfgmlqakvjuhmfvjw.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmRmZ21scWFrdmp1aG1mdmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2OTc1NDEsImV4cCI6MjA0MTI3MzU0MX0.Q3-cBE9Jyx0Xa9W0-VpMXuNHwDFWiD9jDMYjOg8vGPk";

async function deployQuickFix() {
  try {
    console.log("🚀 Deploying quick constraint fix...");

    // Simulate manual database update
    const constraintFix = `
CREATE OR REPLACE FUNCTION undo_transaction_completely(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    pieces_to_restore INTEGER;
    system_user_id UUID;
    result JSONB;
BEGIN
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Check if transaction exists and is completed
    IF NOT EXISTS (SELECT 1 FROM sales WHERE id = p_transaction_id AND status = 'completed') THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'Transaction not found or not completed'
        );
        RETURN result;
    END IF;
    
    -- Restore stock for each item in the transaction
    FOR sale_item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.name, p.stock_in_pieces
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces to restore based on unit type
        CASE COALESCE(sale_item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_to_restore := sale_item.quantity;
            WHEN 'sheet' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_to_restore := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1) * COALESCE(sale_item.sheets_per_box, 1);
            ELSE pieces_to_restore := sale_item.quantity;
        END CASE;
        
        -- Restore the stock
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces + pieces_to_restore,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log the restoration
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'in', pieces_to_restore,
            'Stock restored for transaction undo', 'sale_undo', p_transaction_id,
            sale_item.stock_in_pieces, sale_item.stock_in_pieces + pieces_to_restore, NOW()
        );
    END LOOP;
    
    -- Mark transaction as undone (use edit flags instead of voided status)
    UPDATE sales 
    SET is_edited = true,
        edited_at = NOW(),
        edit_reason = 'Transaction undone and stock restored',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction undone and stock restored',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to undo transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;
    `;

    console.log("✅ CRITICAL FIX IDENTIFIED:");
    console.log('1. The undo function was trying to set status to "voided" ❌');
    console.log(
      "2. Database constraint only allows: pending, in_progress, completed ✅"
    );
    console.log(
      "3. Updated function uses edit flags instead of changing status ✅"
    );
    console.log("");
    console.log("🔧 MANUAL DEPLOYMENT REQUIRED:");
    console.log("Please run this SQL in your Supabase SQL Editor:");
    console.log("----------------------------------------");
    console.log(constraintFix);
    console.log("----------------------------------------");
    console.log("");
    console.log(
      "After running the SQL above, test the undo/edit functionality again."
    );
  } catch (error) {
    console.error("❌ Deployment failed:", error);
  }
}

deployQuickFix();
