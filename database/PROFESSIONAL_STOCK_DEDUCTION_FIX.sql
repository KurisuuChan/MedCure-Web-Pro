-- =====================================================
-- PROFESSIONAL STOCK DEDUCTION FIX
-- =====================================================
-- SOLUTION: Modify the system so stock is deducted ONLY ONCE
-- at the right time, and properly restored on undo/edit
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: FIX THE create_sale_with_items FUNCTION
-- =====================================================
-- Option A: Remove stock deduction from payment completion
-- This way, stock is only deducted during editing/finalization

CREATE OR REPLACE FUNCTION create_sale_with_items(
    sale_data JSONB,
    sale_items JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_sale_id UUID;
    sale_item JSONB;
    current_stock INTEGER;
    result JSONB;
BEGIN
    -- Insert the sale record with 'pending' status initially
    INSERT INTO sales (
        user_id,
        total_amount,
        payment_method,
        customer_name,
        customer_phone,
        notes,
        discount_type,
        discount_percentage,
        discount_amount,
        subtotal_before_discount,
        pwd_senior_id,
        status
    ) VALUES (
        (sale_data->>'user_id')::UUID,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        sale_data->>'notes',
        COALESCE(sale_data->>'discount_type', 'none'),
        COALESCE((sale_data->>'discount_percentage')::DECIMAL, 0),
        COALESCE((sale_data->>'discount_amount')::DECIMAL, 0),
        COALESCE((sale_data->>'subtotal_before_discount')::DECIMAL, (sale_data->>'total_amount')::DECIMAL),
        sale_data->>'pwd_senior_id',
        'pending' -- Changed: Start as pending, not completed
    ) RETURNING id INTO new_sale_id;

    -- Process each sale item WITHOUT deducting stock
    FOR i IN array_lower(sale_items, 1) .. array_upper(sale_items, 1)
    LOOP
        sale_item := sale_items[i];
        
        -- Check stock availability (but don't deduct yet)
        SELECT stock_in_pieces INTO current_stock 
        FROM products 
        WHERE id = (sale_item->>'product_id')::UUID;

        IF current_stock < (sale_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock. Available: %, Required: %', current_stock, (sale_item->>'quantity')::INTEGER;
        END IF;
        
        -- Insert sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price
        ) VALUES (
            new_sale_id,
            (sale_item->>'product_id')::UUID,
            (sale_item->>'quantity')::INTEGER,
            sale_item->>'unit_type',
            (sale_item->>'unit_price')::DECIMAL,
            (sale_item->>'total_price')::DECIMAL
        );

        -- REMOVED: Stock deduction happens elsewhere now
        -- This eliminates the double deduction problem
        
    END LOOP;

    -- Return the complete sale with items
    SELECT jsonb_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'total_amount', s.total_amount,
        'payment_method', s.payment_method,
        'customer_name', s.customer_name,
        'customer_phone', s.customer_phone,
        'notes', s.notes,
        'discount_type', s.discount_type,
        'discount_percentage', s.discount_percentage,
        'discount_amount', s.discount_amount,
        'subtotal_before_discount', s.subtotal_before_discount,
        'pwd_senior_id', s.pwd_senior_id,
        'status', s.status,
        'created_at', s.created_at,
        'updated_at', s.updated_at,
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', si.id,
                        'product_id', si.product_id,
                        'quantity', si.quantity,
                        'unit_type', si.unit_type,
                        'unit_price', si.unit_price,
                        'total_price', si.total_price
                    )
                )
                FROM sale_items si
                WHERE si.sale_id = s.id
            ),
            '[]'::jsonb
        )
    ) INTO result
    FROM sales s
    WHERE s.id = new_sale_id;

    RETURN result;
END;
$$;

-- =====================================================
-- STEP 2: CREATE TRANSACTION COMPLETION FUNCTION
-- =====================================================
-- This function will be called to finalize the transaction and deduct stock

CREATE OR REPLACE FUNCTION complete_transaction_with_stock(p_transaction_id UUID)
RETURNS JSONB AS $$
DECLARE
    sale_item RECORD;
    current_stock INTEGER;
    pieces_needed INTEGER;
    product_name TEXT;
    system_user_id UUID;
    result JSONB;
BEGIN
    -- Get system user
    SELECT id INTO system_user_id FROM users LIMIT 1;
    
    -- Deduct stock for each item in the transaction
    FOR sale_item IN 
        SELECT si.product_id, si.quantity, si.unit_type, p.pieces_per_sheet, p.sheets_per_box, p.name, p.stock_in_pieces
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_transaction_id
    LOOP
        -- Calculate pieces needed based on unit type
        CASE COALESCE(sale_item.unit_type, 'piece')
            WHEN 'piece' THEN pieces_needed := sale_item.quantity;
            WHEN 'sheet' THEN pieces_needed := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1);
            WHEN 'box' THEN pieces_needed := sale_item.quantity * COALESCE(sale_item.pieces_per_sheet, 1) * COALESCE(sale_item.sheets_per_box, 1);
            ELSE pieces_needed := sale_item.quantity;
        END CASE;
        
        -- Final stock check
        IF sale_item.stock_in_pieces < pieces_needed THEN
            RAISE EXCEPTION 'Insufficient stock for %: needed %, available %', 
                sale_item.name, pieces_needed, sale_item.stock_in_pieces;
        END IF;
        
        -- Deduct stock (SINGLE DEDUCTION)
        UPDATE products 
        SET stock_in_pieces = stock_in_pieces - pieces_needed,
            updated_at = NOW()
        WHERE id = sale_item.product_id;
        
        -- Log stock movement
        INSERT INTO stock_movements (
            product_id, user_id, movement_type, quantity, reason, 
            reference_type, reference_id, stock_before, stock_after, created_at
        ) VALUES (
            sale_item.product_id, system_user_id, 'out', pieces_needed,
            'Stock deducted for completed transaction', 'sale_complete', p_transaction_id,
            sale_item.stock_in_pieces, sale_item.stock_in_pieces - pieces_needed, NOW()
        );
    END LOOP;
    
    -- Mark transaction as completed
    UPDATE sales 
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Transaction completed and stock deducted',
        'transaction_id', p_transaction_id
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to complete transaction'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: ENHANCED UNDO/RESTORE FUNCTION
-- =====================================================

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
    
    -- Mark transaction as cancelled (CRITICAL: Change status so it's excluded from revenue)
    UPDATE sales 
    SET status = 'cancelled', -- ✅ CRITICAL: Change status to exclude from revenue
        is_edited = true,
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

-- =====================================================
-- STEP 4: UPDATED EDIT FUNCTION (NO DOUBLE DEDUCTION)
-- =====================================================

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
    
    -- Update transaction details
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

COMMIT;

-- =====================================================
-- SUCCESS MESSAGES
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=========================================================';
    RAISE NOTICE 'PROFESSIONAL STOCK DEDUCTION FIX DEPLOYED';
    RAISE NOTICE '=========================================================';
    RAISE NOTICE '✅ create_sale_with_items: NO LONGER deducts stock';
    RAISE NOTICE '✅ complete_transaction_with_stock: Deducts stock ONCE';
    RAISE NOTICE '✅ undo_transaction_completely: Properly restores ALL stock';
    RAISE NOTICE '✅ edit_transaction: Undos first, then allows re-completion';
    RAISE NOTICE '=========================================================';
    RAISE NOTICE 'NEW FLOW:';
    RAISE NOTICE '1. Add to cart → create_sale_with_items (no stock deduction)';
    RAISE NOTICE '2. Complete payment → complete_transaction_with_stock';
    RAISE NOTICE '3. Edit transaction → undo completely, then re-edit';
    RAISE NOTICE '4. Undo transaction → undo_transaction_completely';
    RAISE NOTICE '=========================================================';
END $$;
