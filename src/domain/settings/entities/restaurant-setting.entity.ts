import { ValidationError } from '../../shared/errors/domain-error';
import { Money } from '../../shared/value-objects/money';

export interface RestaurantSettingProps {
  id: string;
  nameAr: string;
  nameEn: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  taxRatePercent: number;
  deliveryFee: Money;
  phone?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RestaurantSetting {
  private constructor(private readonly props: RestaurantSettingProps) {
    this.validate();
  }

  public static create(
    props: Omit<RestaurantSettingProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): RestaurantSetting {
    const now = new Date();
    return new RestaurantSetting({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: RestaurantSettingProps): RestaurantSetting {
    return new RestaurantSetting(props);
  }

  private validate(): void {
    if (!this.props.nameAr || this.props.nameAr.trim().length === 0) {
      throw new ValidationError('Restaurant Arabic name is required');
    }
    if (!this.props.nameEn || this.props.nameEn.trim().length === 0) {
      throw new ValidationError('Restaurant English name is required');
    }
    if (!this.props.currency || !/^[A-Z]{3}$/.test(this.props.currency)) {
      throw new ValidationError('Currency must be a valid 3-letter ISO code');
    }
    if (!this.props.currencySymbol || this.props.currencySymbol.trim().length === 0) {
      throw new ValidationError('Currency symbol is required');
    }
    if (!this.props.locale || this.props.locale.trim().length === 0) {
      throw new ValidationError('Locale is required');
    }
    if (this.props.taxRatePercent < 0 || this.props.taxRatePercent > 100) {
      throw new ValidationError('Tax rate must be between 0 and 100 percent');
    }
    if (this.props.deliveryFee.currency !== this.props.currency) {
      throw new ValidationError('Delivery fee currency must match restaurant base currency');
    }
  }

  public get id(): string { return this.props.id; }
  public get nameAr(): string { return this.props.nameAr; }
  public get nameEn(): string { return this.props.nameEn; }
  public get currency(): string { return this.props.currency; }
  public get currencySymbol(): string { return this.props.currencySymbol; }
  public get locale(): string { return this.props.locale; }
  public get taxRatePercent(): number { return this.props.taxRatePercent; }
  public get deliveryFee(): Money { return this.props.deliveryFee; }
  public get phone(): string | null | undefined { return this.props.phone; }
  public get address(): string | null | undefined { return this.props.address; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public updateCurrency(currency: string, currencySymbol: string): RestaurantSetting {
    const updatedFee = Money.fromMinor(this.props.deliveryFee.amount, currency.toUpperCase());
    return new RestaurantSetting({
      ...this.props,
      currency: currency.toUpperCase(),
      currencySymbol,
      deliveryFee: updatedFee,
      updatedAt: new Date(),
    });
  }

  public toJSON() {
    return {
      ...this.props,
      deliveryFee: this.props.deliveryFee.toJSON(),
    };
  }
}
