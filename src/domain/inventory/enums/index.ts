/**
 * Standard Units of Measure for raw inventory items.
 */
export enum UnitOfMeasure {
  GRAM = 'GRAM',
  KG = 'KG',
  ML = 'ML',
  LITER = 'LITER',
  PIECE = 'PIECE',
}

/**
 * Types of inventory movements in the immutable ledger.
 */
export enum InventoryMovementType {
  SALE_POS = 'SALE_POS',
  SALE_ONLINE = 'SALE_ONLINE',
  PURCHASE = 'PURCHASE',
  OPERATIONAL_CONSUMPTION = 'OPERATIONAL_CONSUMPTION',
  WASTE = 'WASTE',
  ADJUSTMENT = 'ADJUSTMENT',
}

/**
 * Lifecycle status of purchase orders.
 */
export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, { ar: string; en: string }> = {
  [UnitOfMeasure.GRAM]: { ar: 'جرام', en: 'Gram' },
  [UnitOfMeasure.KG]: { ar: 'كيلوجرام', en: 'Kilogram' },
  [UnitOfMeasure.ML]: { ar: 'مللي', en: 'Milliliter' },
  [UnitOfMeasure.LITER]: { ar: 'لتر', en: 'Liter' },
  [UnitOfMeasure.PIECE]: { ar: 'حبة / قطعة', en: 'Piece' },
};

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, { ar: string; en: string }> = {
  [InventoryMovementType.SALE_POS]: { ar: 'مبيعات الكاشير (POS)', en: 'POS Sale' },
  [InventoryMovementType.SALE_ONLINE]: { ar: 'مبيعات التوصيل الإلكتروني (Web)', en: 'Online Delivery Sale' },
  [InventoryMovementType.PURCHASE]: { ar: 'فاتورة شراء / توريد', en: 'Purchase Order' },
  [InventoryMovementType.OPERATIONAL_CONSUMPTION]: { ar: 'صرف تشغيل للمطبخ', en: 'Kitchen Issue' },
  [InventoryMovementType.WASTE]: { ar: 'هدر وتوالف', en: 'Waste' },
  [InventoryMovementType.ADJUSTMENT]: { ar: 'تسوية جردية', en: 'Stock Adjustment' },
};
