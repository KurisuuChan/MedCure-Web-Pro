-- =====================================================
-- ROOT CAUSE ANALYSIS: FRONTEND-BACKEND MISMATCH
-- =====================================================

-- The issue is likely a mismatch between frontend and backend calculations:

-- FRONTEND sends (from usePOS.js):
-- {
--   product_id: item.productId,
--   quantity_in_pieces: item.quantityInPieces,  // ← Already calculated in pieces!
--   unit_type: item.unit,
--   unit_quantity: item.quantity,               // ← Display quantity (1 box, 2 sheets, etc.)
--   price_per_unit: item.pricePerUnit,
--   total_price: item.totalPrice,
-- }

-- But salesServiceFixed.js maps it as:
-- {
--   product_id: item.product_id,
--   quantity: item.unit_quantity,               // ← This is display quantity, not pieces!
--   unit_type: item.unit_type,
--   unit_price: item.price_per_unit,
--   total_price: item.total_price,
-- }

-- And database calculates AGAIN:
-- WHEN 'box' THEN pieces_needed := sale_item.quantity * pieces_per_sheet * sheets_per_box

-- RESULT: Double conversion! If user buys 1 box (50 pieces), database thinks it's:
-- quantity=1, unit='box' → 1 * pieces_per_sheet * sheets_per_box = MORE than 50!

-- SOLUTION: Use the already-calculated quantity_in_pieces from frontend

DO $$ 
BEGIN
    RAISE NOTICE '🚨 CRITICAL ISSUE IDENTIFIED: DOUBLE UNIT CONVERSION';
    RAISE NOTICE '';
    RAISE NOTICE 'Frontend calculates: 1 box = 50 pieces';
    RAISE NOTICE 'Sends: quantity=1, unit_type=box';
    RAISE NOTICE 'Database recalculates: 1 * pieces_per_sheet * sheets_per_box';
    RAISE NOTICE 'If pieces_per_sheet=10, sheets_per_box=5: 1 * 10 * 5 = 50';
    RAISE NOTICE 'But if values are different: WRONG CALCULATION!';
    RAISE NOTICE '';
    RAISE NOTICE 'FIX: Use quantity_in_pieces from frontend instead of recalculating';
END $$;
