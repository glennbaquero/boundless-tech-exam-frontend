"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "@/utils/toast";
import {
  buildBookingSchema,
  type BookingFormOutput,
  type BookingFormValues,
  type LocationMode,
  type TripType,
} from "@/types/booking";
import { lookupCustomerByPhone, type Customer } from "@/utils/customers";
import { submitBooking } from "@/utils/bookings";
import { onError } from "@/utils/errorHandler";
import { getDistanceAndDuration, mapsProvider, type ResolvedPlace, type DistanceResult } from "@/utils/maps";
import { useDebouncedValue } from "@/utils/useDebouncedValue";
import { formatTime12h } from "@/utils/formatTime";
import SegmentedToggle from "./SegmentedToggle";
import LocationAutocomplete from "./LocationAutocomplete";
import PhoneInput from "./PhoneInput";
import FieldShell from "./FieldShell";
import {
  ArrowCircleIcon,
  AtIcon,
  CalendarIcon,
  ClockIcon,
  HashIcon,
  HourglassIcon,
  PersonIcon,
  SpinnerIcon,
} from "./icons";

const todayISO = new Date().toISOString().slice(0, 10);

type PhoneLookupState = "idle" | "checking" | "found" | "not-found";

export default function BookingForm() {
  const knownCustomerRef = useRef(false);
  const schema = useMemo(() => buildBookingSchema(() => knownCustomerRef.current), []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues, unknown, BookingFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      tripType: "one-way",
      pickupDate: todayISO,
      pickupTime: "",
      pickupType: "location",
      pickupLocation: "",
      stops: [],
      dropoffType: "location",
      dropoffLocation: "",
      phone: "",
      firstName: "",
      lastName: "",
      email: "",
      passengers: "" as unknown as number,
    },
  });

  const [stops, setStops] = useState<string[]>([]);
  const [stopPlaces, setStopPlaces] = useState<(ResolvedPlace | null)[]>([]);
  const [pickupPlace, setPickupPlace] = useState<ResolvedPlace | null>(null);
  const [dropoffPlace, setDropoffPlace] = useState<ResolvedPlace | null>(null);
  const [route, setRoute] = useState<DistanceResult | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const [phoneLookup, setPhoneLookup] = useState<PhoneLookupState>("idle");
  const [customer, setCustomer] = useState<Customer | null>(null);

  const tripType = watch("tripType");
  const pickupType = watch("pickupType");
  const dropoffType = watch("dropoffType");
  const pickupLocation = watch("pickupLocation");
  const dropoffLocation = watch("dropoffLocation");
  const pickupTime = watch("pickupTime");
  const phone = watch("phone");
  const debouncedPhone = useDebouncedValue(phone, 500);

  useEffect(() => {
    const parsed = parsePhoneNumberFromString(debouncedPhone ?? "", "US");
    if (!parsed || !parsed.isValid()) {
      knownCustomerRef.current = false;
      setCustomer(null);
      setPhoneLookup("idle");
      return;
    }
    let cancelled = false;
    setPhoneLookup("checking");
    lookupCustomerByPhone(parsed.number)
      .then((found) => {
        if (cancelled) return;
        if (found) {
          knownCustomerRef.current = true;
          setCustomer(found);
          setValue("firstName", found.firstName);
          setValue("lastName", found.lastName);
          setValue("email", found.email);
          setPhoneLookup("found");
        } else {
          knownCustomerRef.current = false;
          setCustomer(null);
          setPhoneLookup("not-found");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        onError(error);
        knownCustomerRef.current = false;
        setCustomer(null);
        setPhoneLookup("not-found");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedPhone, setValue]);

  useEffect(() => {
    if (!pickupPlace || !dropoffPlace) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    setIsRouteLoading(true);
    getDistanceAndDuration(pickupPlace, dropoffPlace).then((result) => {
      if (cancelled) return;
      setRoute(result);
      setIsRouteLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [pickupPlace, dropoffPlace]);

  function addStop() {
    setStops((prev) => [...prev, ""]);
    setStopPlaces((prev) => [...prev, null]);
  }

  function updateStop(index: number, text: string) {
    setStops((prev) => {
      const next = [...prev];
      next[index] = text;
      setValue("stops", next);
      return next;
    });
    setStopPlaces((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function selectStopPlace(index: number, place: ResolvedPlace) {
    setStopPlaces((prev) => {
      const next = [...prev];
      next[index] = place;
      return next;
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    const parsedPhone = parsePhoneNumberFromString(values.phone, "US");
    const e164 = parsedPhone?.number ?? values.phone;

    try {
      const response = await submitBooking({
        tripType: values.tripType,
        pickupDate: values.pickupDate,
        pickupTime: values.pickupTime,
        pickupType: values.pickupType,
        pickupLocation: values.pickupLocation,
        pickupLat: pickupPlace?.lat,
        pickupLng: pickupPlace?.lng,
        stops: stops
          .map((location, index) => ({
            location,
            lat: stopPlaces[index]?.lat,
            lng: stopPlaces[index]?.lng,
          }))
          .filter((stop) => stop.location.trim().length > 0),
        dropoffType: values.dropoffType,
        dropoffLocation: values.dropoffLocation,
        dropoffLat: dropoffPlace?.lat,
        dropoffLng: dropoffPlace?.lng,
        phone: e164,
        firstName: values.firstName || customer?.firstName || "",
        lastName: values.lastName || customer?.lastName || "",
        email: values.email || customer?.email || "",
        passengers: values.passengers,
      });

      toast.success(`Booking request received! Confirmation ${response.id}.`);
      reset();
      setStops([]);
      setStopPlaces([]);
      setPickupPlace(null);
      setDropoffPlace(null);
      setRoute(null);
      setPhoneLookup("idle");
      setCustomer(null);
    } catch (error) {
      onError(error);
      toast.error("Something went wrong submitting your booking. Please try again.");
    }
  });

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 pb-8 sm:pb-12">
      <h1 className="mb-6 text-xl font-medium leading-snug text-gray-900">Let&apos;s get you on your way!</h1>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <SegmentedToggle
          value={tripType}
          onChange={(v: TripType) => setValue("tripType", v)}
          options={[
            { value: "one-way", label: "One-way", icon: <ArrowCircleIcon className="h-4 w-4" /> },
            { value: "hourly", label: "Hourly", icon: <HourglassIcon className="h-4 w-4" /> },
          ]}
        />

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Pickup</h2>

          <div className="mb-3 flex gap-2">
            <FieldShell
              className="w-[232px] min-w-0"
              borderClassName="border-gray-400 focus-within:border-gold-500"
              paddingClassName="px-3 py-4"
              icon={<CalendarIcon className="h-4 w-4 shrink-0 text-gold-500" />}
              error={!!errors.pickupDate}
            >
              <input
                type="date"
                min={todayISO}
                {...register("pickupDate")}
                className="w-full min-w-0 flex-1 text-sm text-gray-900 outline-none"
              />
            </FieldShell>
            <FieldShell
              className="w-[142px] min-w-0"
              paddingClassName="px-3 py-4"
              icon={<ClockIcon className="h-4 w-4 shrink-0 text-gold-500" />}
              error={!!errors.pickupTime}
            >
              <div className="relative min-w-0 flex-1 text-sm leading-5">
                <input
                  type="time"
                  {...register("pickupTime")}
                  className="w-full min-w-0 cursor-pointer bg-transparent text-sm text-transparent caret-transparent outline-none"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center whitespace-nowrap text-sm text-gray-900">
                  {pickupTime ? (
                    formatTime12h(pickupTime)
                  ) : (
                    <span className="text-gray-400">Select time</span>
                  )}
                </div>
              </div>
            </FieldShell>
          </div>
          {(errors.pickupDate || errors.pickupTime) && (
            <p className="-mt-2 mb-3 text-xs text-red-500">
              {errors.pickupDate?.message ?? errors.pickupTime?.message}
            </p>
          )}

          <div className="mb-3">
            <SegmentedToggle
              fullWidth={false}
              size="sm"
              value={pickupType}
              onChange={(v: LocationMode) => setValue("pickupType", v)}
              options={[
                { value: "location", label: "Location", icon: null },
                { value: "airport", label: "Airport", icon: null },
              ]}
            />
          </div>

          <LocationAutocomplete
            label="Location"
            placeholder="Enter pickup address"
            value={pickupLocation}
            onTextChange={(text) => {
              setValue("pickupLocation", text);
              setPickupPlace(null);
            }}
            onSelect={(place) => setPickupPlace(place)}
            error={errors.pickupLocation?.message}
          />

          {stops.map((stop, index) => (
            <div key={index} className="mt-3">
              <LocationAutocomplete
                label={`Stop ${index + 1}`}
                placeholder="Enter stop address"
                value={stop}
                onTextChange={(text) => updateStop(index, text)}
                onSelect={(place) => selectStopPlace(index, place)}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addStop}
            className="mt-5 text-sm font-medium text-gold-500 hover:text-gold-600"
          >
            + Add a stop
          </button>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Drop off</h2>

          <div className="mb-3">
            <SegmentedToggle
              fullWidth={false}
              size="sm"
              value={dropoffType}
              onChange={(v: LocationMode) => setValue("dropoffType", v)}
              options={[
                { value: "location", label: "Location", icon: null },
                { value: "airport", label: "Airport", icon: null },
              ]}
            />
          </div>

          <LocationAutocomplete
            label="Location"
            placeholder="Enter drop off address"
            value={dropoffLocation}
            onTextChange={(text) => {
              setValue("dropoffLocation", text);
              setDropoffPlace(null);
            }}
            onSelect={(place) => setDropoffPlace(place)}
            error={errors.dropoffLocation?.message}
          />

          {(isRouteLoading || route) && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {isRouteLoading ? (
                <>
                  <SpinnerIcon className="h-3.5 w-3.5" />
                  Calculating distance &amp; travel time…
                </>
              ) : (
                route && (
                  <span>
                    Est. distance <strong className="text-gray-900">{route.distanceText}</strong> · Est. travel time{" "}
                    <strong className="text-gray-900">{route.durationText}</strong>
                    {mapsProvider === "osm" && (
                      <span className="ml-1 text-gray-400">(via free OpenStreetMap routing)</span>
                    )}
                  </span>
                )
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Contact Information</h2>

          <PhoneInput
            value={phone}
            onChange={(formatted) => setValue("phone", formatted)}
            error={errors.phone?.message}
          />

          {phoneLookup === "found" && customer && (
            <p className="mt-2 text-sm text-gray-700">
              Welcome back, <strong className="text-gray-900">{customer.firstName}</strong>! We&apos;ll use the
              contact details we have on file.
            </p>
          )}

          {phoneLookup === "not-found" && (
            <>
              <p className="mt-2 text-xs tracking-tight text-gray-500">
                We don&apos;t have that phone number on file. Please provide additional contact information.
              </p>

              <div className="mt-4 flex gap-2">
                <FieldShell
                  className="flex-1"
                  label="First name"
                  icon={<PersonIcon className="h-4 w-4 shrink-0 text-gold-500" />}
                  error={errors.firstName?.message}
                >
                  <input
                    type="text"
                    placeholder="First name"
                    {...register("firstName")}
                    className="min-w-0 flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </FieldShell>
                <FieldShell
                  className="flex-1"
                  label="Last name"
                  icon={<PersonIcon className="h-4 w-4 shrink-0 text-gold-500" />}
                  error={errors.lastName?.message}
                >
                  <input
                    type="text"
                    placeholder="Last name"
                    {...register("lastName")}
                    className="min-w-0 flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </FieldShell>
              </div>

              <FieldShell
                className="mt-3"
                label="Email"
                icon={<AtIcon className="h-4 w-4 shrink-0 text-gold-500" />}
                error={errors.email?.message}
              >
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  className="min-w-0 flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </FieldShell>
            </>
          )}

          <div className="mt-4">
            <p className="mb-3 text-sm text-gray-900">How many passengers are expected for the trip?</p>
            <FieldShell
              label="# Passengers"
              icon={<HashIcon className="h-4 w-4 shrink-0 text-gold-500" />}
              error={errors.passengers?.message}
            >
              <input
                type="number"
                min={1}
                max={20}
                {...register("passengers")}
                className="min-w-0 flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </FieldShell>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-600 disabled:opacity-60"
        >
          {isSubmitting && <SpinnerIcon className="h-4 w-4" />}
          Continue
        </button>
      </form>
    </div>
  );
}
