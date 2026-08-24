import { postData } from "@/constants/api";

export interface Customer {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CustomerLookupResponse {
  recognized: boolean;
  first_name?: string;
  last_name?: string;
  email?: string | null;
}

export async function lookupCustomerByPhone(phone: string): Promise<Customer | null> {
  const response = await postData<CustomerLookupResponse>("/customers/lookup", { phone });

  if (!response.recognized) return null;

  return {
    phone,
    firstName: response.first_name ?? "",
    lastName: response.last_name ?? "",
    email: response.email ?? "",
  };
}
