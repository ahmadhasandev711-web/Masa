import { CustomerAddress } from '../entities/customer-address.entity';

export interface IncomingAddressData {
  area: string;
  street: string;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
}

/**
 * Domain service for customer identity resolution and address deduplication.
 */
export class CustomerMatchingService {
  /**
   * Evaluates whether an incoming address already exists for the customer.
   * Compares normalized text of area, street, building, and apartment.
   */
  public static matchExistingAddress(
    existingAddresses: CustomerAddress[],
    incoming: IncomingAddressData
  ): CustomerAddress | null {
    if (!existingAddresses || existingAddresses.length === 0) {
      return null;
    }

    const norm = (val?: string | null) => (val ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

    const inArea = norm(incoming.area);
    const inStreet = norm(incoming.street);
    const inBuilding = norm(incoming.building);
    const inApartment = norm(incoming.apartment);

    for (const address of existingAddresses) {
      const matchArea = norm(address.area) === inArea;
      const matchStreet = norm(address.street) === inStreet;
      const matchBuilding = norm(address.building) === inBuilding;
      const matchApartment = norm(address.apartment) === inApartment;

      if (matchArea && matchStreet && matchBuilding && matchApartment) {
        return address;
      }
    }

    return null;
  }

  /**
   * Determines whether the existing customer name should be enriched with incoming name.
   * If existing name is short or placeholder and incoming name is fuller, suggest update.
   */
  public static shouldEnrichName(existingName: string, incomingName: string): boolean {
    const cleanExisting = existingName.trim();
    const cleanIncoming = incomingName.trim();

    if (!cleanIncoming || cleanIncoming === cleanExisting) {
      return false;
    }

    // If incoming name has more words/details and isn't just whitespace
    const existingWords = cleanExisting.split(/\s+/).length;
    const incomingWords = cleanIncoming.split(/\s+/).length;

    return incomingWords > existingWords || (existingWords === 1 && incomingWords >= 1 && cleanIncoming.length > cleanExisting.length);
  }
}
