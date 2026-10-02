import { ValidationError } from '../../shared/errors/domain-error';

export interface UserProps {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  isActive: boolean;
  roleId: string;
  assignedBranchIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {
    this.validate();
  }

  public static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & {
      id?: string;
      isActive?: boolean;
    }
  ): User {
    const now = new Date();
    return new User({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  private validate(): void {
    if (!this.props.username || this.props.username.trim().length < 3) {
      throw new ValidationError('Username must be at least 3 characters');
    }
    if (!this.props.fullName || this.props.fullName.trim().length === 0) {
      throw new ValidationError('Full name is required');
    }
    if (!this.props.phone || this.props.phone.trim().length < 5) {
      throw new ValidationError('Valid phone number is required');
    }
    if (!this.props.passwordHash || this.props.passwordHash.trim().length === 0) {
      throw new ValidationError('Password hash is required');
    }
    if (!this.props.roleId || this.props.roleId.trim().length === 0) {
      throw new ValidationError('User must be assigned to a role');
    }
  }

  public get id(): string { return this.props.id; }
  public get username(): string { return this.props.username; }
  public get fullName(): string { return this.props.fullName; }
  public get phone(): string { return this.props.phone; }
  public get passwordHash(): string { return this.props.passwordHash; }
  public get isActive(): boolean { return this.props.isActive; }
  public get roleId(): string { return this.props.roleId; }
  public get assignedBranchIds(): string[] { return [...this.props.assignedBranchIds]; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }

  public hasAccessToBranch(branchId: string, isSuperAdmin: boolean = false): boolean {
    if (isSuperAdmin) return true;
    return this.props.assignedBranchIds.includes(branchId);
  }

  public activate(): User {
    return new User({ ...this.props, isActive: true, updatedAt: new Date() });
  }

  public deactivate(): User {
    return new User({ ...this.props, isActive: false, updatedAt: new Date() });
  }
}
