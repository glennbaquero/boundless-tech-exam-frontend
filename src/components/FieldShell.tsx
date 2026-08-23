import type { ReactNode } from "react";

interface FieldShellProps {
  label?: string;
  icon?: ReactNode;
  /** Pass a message to show it under the field, or `true` to just highlight the border. */
  error?: string | boolean;
  trailing?: ReactNode;
  className?: string;
  /** Override the default border color (e.g. a darker border for the pickup date field). */
  borderClassName?: string;
  /** Override the default box padding (e.g. the taller pickup date/time fields). */
  paddingClassName?: string;
  children: ReactNode;
}

/**
 * Bordered input shell with a floating label notched into the top border line
 * (matches the reference design, where the label sits on the box outline rather
 * than above it).
 */
export default function FieldShell({
  label,
  icon,
  error,
  trailing,
  className,
  borderClassName,
  paddingClassName,
  children,
}: FieldShellProps) {
  return (
    <div className={className}>
      <div
        className={[
          "relative flex items-center gap-2 rounded-lg border bg-white",
          paddingClassName ?? "px-3 py-2",
          error ? "border-red-400" : (borderClassName ?? "border-gray-200 focus-within:border-gold-500"),
        ].join(" ")}
      >
        {label && (
          <span className="absolute -top-2 left-2.5 bg-white px-1 text-[11px] leading-none text-gray-400">
            {label}
          </span>
        )}
        {icon}
        {children}
        {trailing}
      </div>
      {typeof error === "string" && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
