import { Customer } from '../entities/customer.entity';
import { CustomerAddress } from '../entities/customer-address.entity';
import { PhoneNumber } from '../value-objects/phone-number';

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByPhone(phone: PhoneNumber): Promise<Customer | null>;
  search(query: { term?: string; skip?: number; take?: number }): Promise<{ customers: Customer[]; total: number }>;
  save(customer: Customer): Promise<Customer>;
  saveAddress(address: CustomerAddress): Promise<CustomerAddress>;
  deleteAddress(addressId: string, customerId: string): Promise<void>;
  setDefaultAddress(customerId: string, addressId: string): Promise<void>;
}
