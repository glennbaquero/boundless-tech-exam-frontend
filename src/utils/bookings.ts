import { postData } from "@/constants/api";

export interface BookingStopPayload {
  location: string;
  lat?: number | null;
  lng?: number | null;
}

export interface BookingPayload {
  tripType: "one-way" | "hourly";
  pickupDate: string;
  pickupTime: string;
  pickupType: "location" | "airport";
  pickupLocation: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  stops: BookingStopPayload[];
  dropoffType: "location" | "airport";
  dropoffLocation: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  passengers: number;
}

export interface BookingResponse {
  id: string | number;
  status: string;
  service_type: string;
  passengers: number;
  pickup: {
    date: string;
    time: string;
    type: string;
    location: string;
    lat: number | null;
    lng: number | null;
    stops: { location: string; lat: number | null; lng: number | null }[];
  };
  dropoff: {
    type: string;
    location: string;
    lat: number | null;
    lng: number | null;
  };
  distance: {
    meters: number | null;
    text: string | null;
    duration_seconds: number | null;
    duration_text: string | null;
  };
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  created_at: string;
}

interface BookingResourceResponse {
  data: BookingResponse;
}

export async function submitBooking(payload: BookingPayload): Promise<BookingResponse> {
  const body = {
    service_type: payload.tripType === "one-way" ? "one_way" : "hourly",
    pickup_date: payload.pickupDate,
    pickup_time: payload.pickupTime,
    pickup_type: payload.pickupType,
    pickup_location: payload.pickupLocation,
    pickup_lat: payload.pickupLat ?? null,
    pickup_lng: payload.pickupLng ?? null,
    stops: payload.stops,
    dropoff_type: payload.dropoffType,
    dropoff_location: payload.dropoffLocation,
    dropoff_lat: payload.dropoffLat ?? null,
    dropoff_lng: payload.dropoffLng ?? null,
    passengers: payload.passengers,
    phone: payload.phone,
    first_name: payload.firstName || undefined,
    last_name: payload.lastName || undefined,
    email: payload.email || undefined,
  };

  const { data } = await postData<BookingResourceResponse>("/bookings", body);
  return data;
}
