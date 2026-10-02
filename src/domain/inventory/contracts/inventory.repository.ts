import { UnitOfMeasure, InventoryMovementType, PurchaseOrderStatus } from '../enums';

export interface InventoryItemDto {
  id: string;
  sku: string | null;
  nameAr: string;
  nameEn: string;
  unit: UnitOfMeasure;
  defaultCostMinor: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchStockItemDto extends InventoryItemDto {
  quantity: number;
  minThreshold: number;
  isLowStock: boolean;
  isNegative: boolean;
}

export interface RecipeItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemNameAr: string;
  inventoryItemNameEn: string;
  unit: UnitOfMeasure;
  productId?: string | null;
  productSizeId?: string | null;
  modifierId?: string | null;
  quantity: number;
}

export interface StockAdjustmentInput {
  branchId: string;
  inventoryItemId: string;
  type: InventoryMovementType.OPERATIONAL_CONSUMPTION | InventoryMovementType.WASTE | InventoryMovementType.ADJUSTMENT;
  quantityDelta: number; // e.g. -5 for 5kg consumed, +10 for found surplus
  unitCostMinor?: number;
  notes?: string;
  createdById?: string;
}

export interface SupplierDto {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface PurchaseOrderItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemNameAr: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitCostMinor: number;
  totalCostMinor: number;
}

export interface PurchaseOrderDto {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  branchName: string;
  status: PurchaseOrderStatus;
  totalMinor: number;
  notes: string | null;
  invoiceNumber: string | null;
  receivedAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  items: PurchaseOrderItemDto[];
}

export interface InventoryMovementDto {
  id: string;
  branchId: string;
  branchName: string;
  inventoryItemId: string;
  inventoryItemNameAr: string;
  unit: UnitOfMeasure;
  type: InventoryMovementType;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCostMinor: number;
  referenceId: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: Date;
}
