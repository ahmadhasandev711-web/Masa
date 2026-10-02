import { DriverStatus, VehicleType } from '../enums';
import { ValidationError } from '../../shared/errors/domain-error';

export interface DeliveryDriverProps {
  id: string;
  branchId: string;
  fullName: string;
  phone: string;
  vehicleType: VehicleType;
  licensePlate?: string | null;
  status: DriverStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DeliveryDriverEntity {
  constructor(private readonly props: DeliveryDriverProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.fullName || this.props.fullName.trim().length < 2) {
      throw new ValidationError('اسم الطيار يجب ألا يقل عن حرفين');
    }
    if (!this.props.phone || this.props.phone.trim().length < 6) {
      throw new ValidationError('رقم هاتف الطيار غير صالح');
    }
    if (!this.props.branchId) {
      throw new ValidationError('يجب ربط الطيار بفرع تشغيلي محدد');
    }
  }

  public get id(): string {
    return this.props.id;
  }

  public get branchId(): string {
    return this.props.branchId;
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get phone(): string {
    return this.props.phone;
  }

  public get vehicleType(): VehicleType {
    return this.props.vehicleType;
  }

  public get licensePlate(): string | null | undefined {
    return this.props.licensePlate;
  }

  public get status(): DriverStatus {
    return this.props.status;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public canTakeOrders(): boolean {
    return this.props.isActive && this.props.status !== DriverStatus.INACTIVE;
  }

  public toJSON(): DeliveryDriverProps {
    return { ...this.props };
  }
}
