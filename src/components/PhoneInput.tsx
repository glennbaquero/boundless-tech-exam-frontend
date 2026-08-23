"use client";

import { AsYouType, isValidPhoneNumber } from "libphonenumber-js";
import { USFlagIcon } from "./icons";
import FieldShell from "./FieldShell";

interface PhoneInputProps {
  value: string;
  onChange: (formatted: string, isValid: boolean) => void;
  error?: string;
}

export default function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  function handleChange(raw: string) {
    const formatted = new AsYouType("US").input(raw);
    onChange(formatted, isValidPhoneNumber(formatted, "US"));
  }

  return (
    <FieldShell error={error} icon={<USFlagIcon className="h-4 w-5 shrink-0 rounded-sm" />}>
      <input
        type="tel"
        inputMode="tel"
        value={value}
        placeholder="+1 774 415 3244"
        onChange={(e) => handleChange(e.target.value)}
        className="min-w-0 flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
      />
    </FieldShell>
  );
}
