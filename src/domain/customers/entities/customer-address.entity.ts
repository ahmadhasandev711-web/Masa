import { ValidationError } from '../../shared/errors/domain-error';

export interface CustomerAddressProps {
  id: string;
  customerId: string;
  title: string;
  city: string;
  area: string;
  street: string;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  deliveryNotes?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerAddress {
  private constructor(private readonly props: CustomerAddressProps) {
    this.validate();
  }

  public static create(
    props: Omit<CustomerAddressProps, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'> & {
      id?: string;
      isDefault?: boolean;
    }
  ): CustomerAddress {
    const now = new Date();
    return new CustomerAddress({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      building: props.building ?? null,
      floor: props.floor ?? null,
      apartment: props.apartment ?? null,
      landmark: props.landmark ?? null,
      deliveryNotes: props.deliveryNotes ?? null,
      isDefault: props.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: CustomerAddressProps): CustomerAddress {
    return new CustomerAddress(props);
  }

  private validate(): void {
    if (!this.props.customerId || this.props.customerId.trim().length === 0) {
      throw new ValidationError('معرف العميل مطلوب للعنوان');
    }
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new ValidationError('عنوان الموقع مطلوب (مثال: المنزل، العمل)');
    }
    if (!this.props.city || this.props.city.trim().length === 0) {
      throw new ValidationError('المدينة مطلوبة');
    }
    if (!this.props.area || this.props.area.trim().length === 0) {
      throw new ValidationError('المنطقة أو الحي مطلوب');
    }
    if (!this.props.street || this.props.street.trim().length === 0) {
      throw new ValidationError('اسم الشارع مطلوب');
    }
  }

  public get id(): string { return this.props.id; }
  public get customerId(): string { return this.props.customerId; }
  public get title(): string { return this.props.title; }
  public get city(): string { return this.props.city; }
  public get area(): string { return this.props.area; }
  public get street(): string { return this.props.street; }
  public get building(): string | null { return this.props.building ?? null; }
  public get floor(): string | null { return this.props.floor ?? null; }
  public get apartment(): string | null { return this.props.apartment ?? null; }
  public get landmark(): string | null { return this.props.landmark ?? null; }
  public get deliveryNotes(): string | null { return this.props.deliveryNotes ?? null; }
  public get isDefault(): boolean { return this.props.isDefault; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public markAsDefault(): CustomerAddress {
    return new CustomerAddress({
      ...this.props,
      isDefault: true,
      updatedAt: new Date(),
    });
  }

  public unmarkAsDefault(): CustomerAddress {
    return new CustomerAddress({
      ...this.props,
      isDefault: false,
      updatedAt: new Date(),
    });
  }

  public toSingleLineSummary(): string {
    const parts = [
      this.props.area,
      this.props.street,
      this.props.building ? `عمارة ${this.props.building}` : null,
      this.props.floor ? `طابق ${this.props.floor}` : null,
      this.props.apartment ? `شقة ${this.props.apartment}` : null,
      this.props.landmark ? `(علامة: ${this.props.landmark})` : null,
    ].filter(Boolean);

    return parts.join('، ');
  }
}
