export type Category = {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  isActive: boolean;
};

export type Size = {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
};

export type Group = {
  id: string;
  nameAr: string;
  nameEn: string;
  minSelect: number;
  maxSelect: number;
  modifiers: {
    id: string;
    nameAr: string;
    nameEn: string;
    priceDelta: number;
  }[];
};

export type Product = {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; nameAr: string };
  sizes: Size[];
  modifierGroups: { group: { id: string; nameAr: string } }[];
  branchAvailability: { branchId: string; isAvailable: boolean }[];
};

export type Branch = {
  id: string;
  code: string;
  nameAr: string;
  phone?: string | null;
};

export type CatalogProps = {
  categories: Category[];
  products: Product[];
  modifierGroups: Group[];
  branches: Branch[];
  currency: string | null;
  restaurantNameAr?: string;
  restaurantNameEn?: string;
};

export type Tab = 'products' | 'categories' | 'modifiers';

export type DraftSize = {
  nameAr: string;
  nameEn: string;
  price: string;
};

export type DraftModifier = {
  nameAr: string;
  nameEn: string;
  price: string;
};

export type DeleteTarget = {
  type: 'product' | 'category' | 'modifier';
  id: string;
  name: string;
};
