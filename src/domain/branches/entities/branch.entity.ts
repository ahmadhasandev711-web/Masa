import { ValidationError } from '../../shared/errors/domain-error';

export interface BranchProps {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Branch {
  private constructor(private readonly props: BranchProps) {
    this.validate();
  }

  public static create(
    props: Omit<BranchProps, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & {
      id?: string;
      isActive?: boolean;
    }
  ): Branch {
    const now = new Date();
    return new Branch({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: BranchProps): Branch {
    return new Branch(props);
  }

  private validate(): void {
    if (!this.props.code || this.props.code.trim().length < 2) {
      throw new ValidationError('Branch code must be at least 2 characters');
    }
    if (!this.props.nameAr || this.props.nameAr.trim().length === 0) {
      throw new ValidationError('Branch Arabic name is required');
    }
    if (!this.props.nameEn || this.props.nameEn.trim().length === 0) {
      throw new ValidationError('Branch English name is required');
    }
    if (!this.props.phone || this.props.phone.trim().length < 5) {
      throw new ValidationError('Valid branch phone number is required');
    }
  }

  public get id(): string {
    return this.props.id;
  }
  public get code(): string {
    return this.props.code;
  }
  public get nameAr(): string {
    return this.props.nameAr;
  }
  public get nameEn(): string {
    return this.props.nameEn;
  }
  public get phone(): string {
    return this.props.phone;
  }
  public get address(): string {
    return this.props.address;
  }
  public get isActive(): boolean {
    return this.props.isActive;
  }
  public get createdAt(): Date {
    return this.props.createdAt;
  }
  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public activate(): Branch {
    return new Branch({ ...this.props, isActive: true, updatedAt: new Date() });
  }

  public deactivate(): Branch {
    return new Branch({ ...this.props, isActive: false, updatedAt: new Date() });
  }

  public toJSON(): BranchProps {
    return { ...this.props };
  }
}
