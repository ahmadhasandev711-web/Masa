import {
  InventoryItemDto,
  BranchStockItemDto,
  RecipeItemDto,
  SupplierDto,
  PurchaseOrderDto,
  InventoryMovementDto,
} from '../../../../domain/inventory/contracts/inventory.repository';

export interface CatalogProductForRecipe {
  id: string;
  nameAr: string;
  nameEn: string;
  categoryNameAr: string;
  sizes: Array<{ id: string; nameAr: string; nameEn: string }>;
  modifiers: Array<{ id: string; nameAr: string; nameEn: string; groupNameAr: string }>;
}

export interface InventoryPageData {
  branchId: string;
  branchName: string;
  currency: string;
  items: InventoryItemDto[];
  stock: BranchStockItemDto[];
  recipes: Record<string, RecipeItemDto[]>; // productId -> RecipeItemDto[]
  suppliers: SupplierDto[];
  purchaseOrders: PurchaseOrderDto[];
  movements: InventoryMovementDto[];
  catalogProducts: CatalogProductForRecipe[];
}
