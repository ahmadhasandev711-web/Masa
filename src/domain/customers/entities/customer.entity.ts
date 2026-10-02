import { ValidationError } from '../../shared/errors/domain-error';
import { Money } from '../../shared/value-objects/money';
import { PhoneNumber } from '../value-objects/phone-number';
import { CustomerAddress } from './customer-address.entity';

export interface CustomerProps {
  id: string;
  phone: PhoneNumber;
  fullName: string;
  email?: string | null;
  notes?: string | null;
  totalOrders: number;
  totalSpent: Money;
  lastOrderAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses?: CustomerAddress[];
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {
    this.validate();
  }

  public static create(
    props: Omit<CustomerProps, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'totalOrders' | 'totalSpent' | 'lastOrderAt'> & {
      id?: string;
      isActive?: boolean;
      totalOrders?: number;
      totalSpent?: Money;
      currency?: string;
      lastOrderAt?: Date | null;
    }
  ): Customer {
    const now = new Date();
    const currency = props.totalSpent ? props.totalSpent.currency : (props.currency ?? 'EGP');
    return new Customer({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      email: props.email ?? null,
      notes: props.notes ?? null,
      totalOrders: props.totalOrders ?? 0,
      totalSpent: props.totalSpent ?? Money.zero(currency),
      lastOrderAt: props.lastOrderAt ?? null,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      addresses: props.addresses ?? [],
    });
  }

  public static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  private validate(): void {
    if (!this.props.fullName || this.props.fullName.trim().length < 2) {
      throw new ValidationError('اسم العميل يجب ألا يقل عن حرفين');
    }
    if (this.props.totalOrders < 0) {
      throw new ValidationError('إجمالي عدد الطلبات لا يمكن أن يكون سالباً');
    }
    if (this.props.totalSpent.amount < 0) {
      throw new ValidationError('إجمالي إنفاق العميل لا يمكن أن يكون سالباً');
    }
  }

  public get id(): string { return this.props.id; }
  public get phone(): PhoneNumber { return this.props.phone; }
  public get fullName(): string { return this.props.fullName; }
  public get email(): string | null { return this.props.email ?? null; }
  public get notes(): string | null { return this.props.notes ?? null; }
  public get totalOrders(): number { return this.props.totalOrders; }
  public get totalSpent(): Money { return this.props.totalSpent; }
  public get lastOrderAt(): Date | null { return this.props.lastOrderAt ?? null; }
  public get isActive(): boolean { return this.props.isActive; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
  public get addresses(): CustomerAddress[] { return [...(this.props.addresses ?? [])]; }

  public updateProfile(fullName: string, email?: string | null, notes?: string | null): Customer {
    return new Customer({
      ...this.props,
      fullName: fullName.trim(),
      email: email?.trim() || null,
      notes: notes?.trim() || null,
      updatedAt: new Date(),
    });
  }

  public recordOrder(orderTotal: Money, orderDate: Date = new Date()): Customer {
    return new Customer({
      ...this.props,
      totalOrders: this.props.totalOrders + 1,
      totalSpent: this.props.totalSpent.add(orderTotal),
      lastOrderAt: orderDate,
      updatedAt: new Date(),
    });
  }

  public activate(): Customer {
    return new Customer({ ...this.props, isActive: true, updatedAt: new Date() });
  }

  public deactivate(): Customer {
    return new Customer({ ...this.props, isActive: false, updatedAt: new Date() });
  }
}
