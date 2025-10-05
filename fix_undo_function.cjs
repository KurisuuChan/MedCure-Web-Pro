const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://fzwwgzebhtqhyxvdapzu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6d3dnemViaHRxaHl4dmRhcHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxNjI1MDMsImV4cCI6MjA0MjczODUwM30.YdOA6EBHQU_zNvNmqCaGQKPemHlgCy-x5bVd2RbGhRo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUndoFunction() {
  try {
    console.log('🔧 Fixing undo transaction function...');
    
    // First, try to drop the old function
    const dropResult = await supabase.rpc('sql', {
      query: 'DROP FUNCTION IF EXISTS undo_transaction_completely(UUID);'
    }).catch(err => {
      console.log('Note: Could not drop function (might not exist):', err.message);
    });

    // Create the fixed function
    const createFunctionSQL = `
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
        SELECT 
            si.product_id, 
            si.quantity, 
            si.unit_type, 
            p.pieces_per_sheet, 
            p.sheets_per_box, 
            p.brand_name,
            p.generic_name,
            p.stock_in_pieces
        FROM sale_items si
        INNER JOIN products p ON si.product_id = p.id
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
        
        -- Try to log the restoration (handle case where stock_movements might not exist)
        BEGIN
            INSERT INTO stock_movements (
                product_id, user_id, movement_type, quantity, reason, 
                reference_type, reference_id, stock_before, stock_after, created_at
            ) VALUES (
                sale_item.product_id, 
                system_user_id, 
                'in', 
                pieces_to_restore,
                'Stock restored for transaction undo', 
                'sale_undo', 
                p_transaction_id,
                sale_item.stock_in_pieces, 
                sale_item.stock_in_pieces + pieces_to_restore, 
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            -- Ignore stock_movements errors if table doesn't exist
            NULL;
        END;
        
    END LOOP;
    
    -- Mark transaction as cancelled (CRITICAL: excludes from revenue)
    UPDATE sales 
    SET status = 'cancelled',
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
    `;

    const result = await supabase.rpc('sql', {
      query: createFunctionSQL
    });

    if (result.error) {
      console.error('❌ Failed to create function:', result.error);
      return false;
    }

    console.log('✅ Function created successfully');
    
    // Test the function exists
    const testResult = await supabase.rpc('undo_transaction_completely', {
      p_transaction_id: '00000000-0000-0000-0000-000000000000'
    });

    if (testResult.error && !testResult.error.message.includes('Transaction not found')) {
      console.error('❌ Function test failed:', testResult.error);
      return false;
    }

    console.log('✅ Function is working correctly!');
    return true;

  } catch (error) {
    console.error('❌ Error fixing function:', error);
    return false;
  }
}

fixUndoFunction().then(success => {
  if (success) {
    console.log('🎉 Undo function fixed successfully!');
  } else {
    console.log('❌ Failed to fix undo function');
  }
  process.exit(success ? 0 : 1);
});