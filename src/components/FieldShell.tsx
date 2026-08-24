import type { ReactNode } from "react";

interface FieldShellProps {
  label?: string;
  icon?: ReactNode;
  error?: string | boolean;
  trailing?: ReactNode;
  className?: string;
  borderClassName?: string;
  paddingClassName?: string;
  children: ReactNode;
}

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
