import { UnitOfMeasure } from '../enums';
import { Money } from '../../shared/value-objects/money';
import { ValidationError } from '../../shared/errors/domain-error';

export interface InventoryItemProps {
  id?: string;
  sku?: string | null;
  nameAr: string;
  nameEn: string;
  unit: UnitOfMeasure;
  defaultCost: Money;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InventoryItem {
  public readonly id?: string;
  public readonly sku?: string | null;
  public readonly nameAr: string;
  public readonly nameEn: string;
  public readonly unit: UnitOfMeasure;
  public readonly defaultCost: Money;
  public readonly isActive: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: InventoryItemProps) {
    this.validate(props);
    this.id = props.id;
    this.sku = props.sku ? props.sku.trim().toUpperCase() : null;
    this.nameAr = props.nameAr.trim();
    this.nameEn = props.nameEn.trim();
    this.unit = props.unit;
    this.defaultCost = props.defaultCost;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validate(props: InventoryItemProps): void {
    if (!props.nameAr || props.nameAr.trim().length < 2) {
      throw new ValidationError('اسم المكون بالعربية يجب أن يحتوي على حرفين على الأقل');
    }
    if (!props.nameEn || props.nameEn.trim().length < 2) {
      throw new ValidationError('اسم المكون بالإنجليزية يجب أن يحتوي على حرفين على الأقل');
    }
    if (!Object.values(UnitOfMeasure).includes(props.unit)) {
      throw new ValidationError('وحدة القياس المحددة غير صالحة');
    }
    if (props.defaultCost.amount < 0) {
      throw new ValidationError('تكلفة الشراء الافتراضية لا يمكن أن تكون سالبة');
    }
  }

  public static create(props: InventoryItemProps): InventoryItem {
    return new InventoryItem(props);
  }
}
