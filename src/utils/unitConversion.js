// Unit conversion utilities for product variants (Box, Sheet, Piece)

export const UNITS = {
  PIECE: "piece",
  SHEET: "sheet",
  BOX: "box",
};

export const UNIT_LABELS = {
  [UNITS.PIECE]: "Piece",
  [UNITS.SHEET]: "Sheet",
  [UNITS.BOX]: "Box",
};

/**
 * Convert quantity from any unit to pieces (base unit)
 */
export function convertToBaseUnit(quantity, unit, product) {
  const piecesPerSheet = product.pieces_per_sheet || 1;
  const sheetsPerBox = product.sheets_per_box || 1;

  switch (unit) {
    case UNITS.PIECE:
      return quantity;
    case UNITS.SHEET:
      return quantity * piecesPerSheet;
    case UNITS.BOX:
      return quantity * sheetsPerBox * piecesPerSheet;
    default:
      return quantity;
  }
}

/**
 * Convert quantity from pieces to specified unit
 */
export function convertFromBaseUnit(quantityInPieces, unit, product) {
  const piecesPerSheet = product.pieces_per_sheet || 1;
  const sheetsPerBox = product.sheets_per_box || 1;

  switch (unit) {
    case UNITS.PIECE:
      return quantityInPieces;
    case UNITS.SHEET:
      return Math.floor(quantityInPieces / piecesPerSheet);
    case UNITS.BOX:
      return Math.floor(quantityInPieces / (sheetsPerBox * piecesPerSheet));
    default:
      return quantityInPieces;
  }
}

/**
 * Calculate price per unit based on base price per piece
 */
export function calculatePricePerUnit(pricePerPiece, unit, product) {
  const piecesPerSheet = product.pieces_per_sheet || 1;
  const sheetsPerBox = product.sheets_per_box || 1;

  switch (unit) {
    case UNITS.PIECE:
      return pricePerPiece;
    case UNITS.SHEET:
      return pricePerPiece * piecesPerSheet;
    case UNITS.BOX:
      return pricePerPiece * sheetsPerBox * piecesPerSheet;
    default:
      return pricePerPiece;
  }
}

/**
 * Get available units for a product based on its configuration
 */
export function getAvailableUnits(product) {
  const units = [UNITS.PIECE];

  if (product.pieces_per_sheet && product.pieces_per_sheet > 1) {
    units.push(UNITS.SHEET);
  }

  if (product.sheets_per_box && product.sheets_per_box > 1) {
    units.push(UNITS.BOX);
  }

  return units;
}

/**
 * Format unit display with quantity
 */
export function formatUnitDisplay(quantity, unit) {
  const unitLabel = UNIT_LABELS[unit] || unit;
  return `${quantity} ${unitLabel}${quantity !== 1 ? "s" : ""}`;
}

/**
 * Calculate stock breakdown by units
 */
export function getStockBreakdown(stockInPieces, product) {
  const piecesPerSheet = product.pieces_per_sheet || 1;
  const sheetsPerBox = product.sheets_per_box || 1;
  const piecesPerBox = sheetsPerBox * piecesPerSheet;

  if (piecesPerBox > 1) {
    const boxes = Math.floor(stockInPieces / piecesPerBox);
    const remainingAfterBoxes = stockInPieces % piecesPerBox;
    const sheets = Math.floor(remainingAfterBoxes / piecesPerSheet);
    const pieces = remainingAfterBoxes % piecesPerSheet;

    return { boxes, sheets, pieces };
  } else if (piecesPerSheet > 1) {
    const sheets = Math.floor(stockInPieces / piecesPerSheet);
    const pieces = stockInPieces % piecesPerSheet;

    return { boxes: 0, sheets, pieces };
  } else {
    return { boxes: 0, sheets: 0, pieces: stockInPieces };
  }
}
