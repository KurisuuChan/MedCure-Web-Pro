console.log("🔧 PROFESSIONAL DATABASE FIX DEPLOYMENT");
console.log("=========================================");
console.log("");
console.log("🔍 ISSUES IDENTIFIED:");
console.log(
  "1. ❌ edit_transaction function references non-existent columns (amount_paid, change_amount)"
);
console.log(
  "2. ❌ undo_transaction function tries to set invalid status (voided)"
);
console.log("3. ✅ Stock deduction is working correctly (single deduction)");
console.log("");
console.log("🛠️ DEPLOYMENT REQUIRED:");
console.log("Please run this SQL in your Supabase SQL Editor:");
console.log("============================================");
console.log(`
-- Fix 1: Corrected undo function (no status violation)
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
    
    -- Mark transaction as undone (use edit flags instead of changing status)
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

-- Fix 2: Corrected edit function (no column errors)
CREATE OR REPLACE FUNCTION edit_transaction_with_stock_management(p_edit_data JSONB)
RETURNS JSONB AS $$
DECLARE
    p_transaction_id UUID;
    p_new_items JSONB;
    transaction_status TEXT;
    item JSONB;
    result JSONB;
BEGIN
    -- Extract data
    p_transaction_id := (p_edit_data->>'transaction_id')::UUID;
    p_new_items := p_edit_data->'items';
    
    -- Check current status
    SELECT status INTO transaction_status 
    FROM sales 
    WHERE id = p_transaction_id;
    
    -- If transaction is completed, first undo it completely
    IF transaction_status = 'completed' THEN
        SELECT undo_transaction_completely(p_transaction_id) INTO result;
        IF NOT (result->>'success')::BOOLEAN THEN
            RETURN result;
        END IF;
    END IF;
    
    -- Update transaction details (ONLY EXISTING COLUMNS)
    UPDATE sales SET
        total_amount = (p_edit_data->>'total_amount')::DECIMAL,
        subtotal_before_discount = (p_edit_data->>'subtotal_before_discount')::DECIMAL,
        discount_type = COALESCE(p_edit_data->>'discount_type', 'none'),
        discount_percentage = COALESCE((p_edit_data->>'discount_percentage')::DECIMAL, 0),
        discount_amount = COALESCE((p_edit_data->>'discount_amount')::DECIMAL, 0),
        pwd_senior_id = p_edit_data->>'pwd_senior_id',
        payment_method = p_edit_data->>'payment_method',
        is_edited = true,
        edited_at = NOW(),
        edit_reason = p_edit_data->>'edit_reason',
        status = 'pending', -- Reset to pending for re-completion
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Clear old sale items
    DELETE FROM sale_items WHERE sale_id = p_transaction_id;
    
    -- Insert new items (without deducting stock yet)
    FOR i IN 1..jsonb_array_length(p_new_items)
    LOOP
        item := p_new_items -> (i-1);
        
        INSERT INTO sale_items (
            id, sale_id, product_id, quantity, unit_type, unit_price, total_price, created_at
        ) VALUES (
            gen_random_uuid(), p_transaction_id, (item->>'product_id')::UUID, 
            (item->>'quantity')::INTEGER, COALESCE(item->>'unit_type', 'piece'), 
            (item->>'unit_price')::DECIMAL, (item->>'total_price')::DECIMAL, NOW()
        );
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction edited successfully - call complete_transaction_with_stock to finalize',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to edit transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;
`);
console.log("============================================");
console.log("");
console.log("After running the SQL above:");
console.log("✅ Edit function will work without column errors");
console.log("✅ Undo function will work without constraint violations");
console.log(
  "✅ Stock will be properly restored when editing/undoing transactions"
);
console.log("");
console.log("NEXT STEPS:");
console.log("1. Run the SQL in Supabase SQL Editor");
console.log("2. Test creating a successful transaction (with enough stock)");
console.log(
  "3. Test editing/undoing the transaction to verify stock restoration"
);
