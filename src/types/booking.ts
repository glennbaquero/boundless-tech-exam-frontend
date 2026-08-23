import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export type TripType = "one-way" | "hourly";
export type LocationMode = "location" | "airport";

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * `isKnownCustomer` is read lazily (as a getter) rather than baked into the schema so a
 * single schema/resolver instance can react to the phone-lookup result without being
 * rebuilt on every render.
 */
export function buildBookingSchema(isKnownCustomer: () => boolean) {
  return z
    .object({
      tripType: z.enum(["one-way", "hourly"]),
      pickupDate: z
        .string()
        .min(1, "Pickup date is required")
        .refine((val) => val >= todayISO(), "Pickup date can't be in the past"),
      pickupTime: z.string().min(1, "Pickup time is required"),
      pickupType: z.enum(["location", "airport"]),
      pickupLocation: z.string().trim().min(3, "Enter a pickup location"),
      stops: z.array(z.string().trim().min(1)).default([]),
      dropoffType: z.enum(["location", "airport"]),
      dropoffLocation: z.string().trim().min(3, "Enter a drop off location"),
      phone: z
        .string()
        .min(1, "Phone number is required")
        .refine((val) => isValidPhoneNumber(val, "US"), "Enter a valid US phone number"),
      firstName: z.string().trim().optional().default(""),
      lastName: z.string().trim().optional().default(""),
      email: z.string().trim().optional().default(""),
      passengers: z.coerce
        .number()
        .int("Passengers must be a whole number")
        .min(1, "At least 1 passenger is required")
        .max(20, "Max 20 passengers"),
    })
    .superRefine((data, ctx) => {
      if (isKnownCustomer()) return;
      if (!data.firstName) {
        ctx.addIssue({ code: "custom", path: ["firstName"], message: "First name is required" });
      }
      if (!data.lastName) {
        ctx.addIssue({ code: "custom", path: ["lastName"], message: "Last name is required" });
      }
      if (!data.email) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Email is required" });
      } else if (!z.email().safeParse(data.email).success) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email address" });
      }
    });
}

export type BookingFormValues = z.input<ReturnType<typeof buildBookingSchema>>;
export type BookingFormOutput = z.output<ReturnType<typeof buildBookingSchema>>;
