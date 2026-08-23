import { STORAGE_KEYS } from "@/constants/storage";
import { isBrowser } from "@/constants/url";

export interface BookingPayload {
  tripType: "one-way" | "hourly";
  pickupDate: string;
  pickupTime: string;
  pickupType: "location" | "airport";
  pickupLocation: string;
  stops: string[];
  dropoffType: "location" | "airport";
  dropoffLocation: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  passengers: number;
  distanceText?: string;
  durationText?: string;
}

export interface BookingResponse {
  id: string;
  status: "confirmed";
  submittedAt: string;
}

/**
 * Stand-in for a real backend endpoint. Simulates network latency and persists to
 * localStorage so the "Submit to a mock API endpoint" flow is fully demonstrable
 * without a server. Swap this out for a real `fetch(STAGING_URL + "/bookings")`
 * once a backend exists.
 */
export async function submitBooking(payload: BookingPayload): Promise<BookingResponse> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const response: BookingResponse = {
    id: `bk_${Date.now().toString(36)}`,
    status: "confirmed",
    submittedAt: new Date().toISOString(),
  };

  if (isBrowser) {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) ?? "[]");
    existing.push({ ...payload, ...response });
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(existing));
  }

  return response;
}
