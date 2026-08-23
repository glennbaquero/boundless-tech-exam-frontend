import { STORAGE_KEYS } from "@/constants/storage";
import { isBrowser } from "@/constants/url";

export interface Customer {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
}

function readCustomers(): Record<string, Customer> {
  if (!isBrowser) return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) ?? "{}");
  } catch {
    return {};
  }
}

function writeCustomers(customers: Record<string, Customer>) {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

/** Mock "on file" lookup. In a real system this would be a backend call keyed by phone. */
export function lookupCustomerByPhone(phone: string): Customer | null {
  const customers = readCustomers();
  return customers[phone] ?? null;
}

export function saveCustomer(customer: Customer) {
  const customers = readCustomers();
  customers[customer.phone] = customer;
  writeCustomers(customers);
}
