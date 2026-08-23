"use client";

import type { ReactNode } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
}

interface SegmentedToggleProps<T extends string> {
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
  fullWidth?: boolean;
  size?: "sm" | "md";
}

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  fullWidth = true,
  size = "md",
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex rounded-lg border border-gray-200 ${fullWidth ? "w-full" : ""}`}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={[
              "flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors",
              size === "md" ? "px-3.5 py-1 text-sm" : "px-2.5 py-1.5 text-xs",
              fullWidth ? "flex-1" : "",
              index === 0 ? "-mr-px" : "",
              active
                ? "border border-gold-500 text-gold-500 bg-gold-50 z-10"
                : "border border-transparent text-slate-400",
            ].join(" ")}
          >
            <span className={active ? "text-gold-500" : "text-gray-500"}>{option.icon}</span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
