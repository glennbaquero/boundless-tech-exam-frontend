"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";

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

const GOLD = "#c9a83a";
const GOLD_TINT = "#fbf9f2";
const OUTER_BORDER = "#e8e8e8";
const INACTIVE_TEXT = "#6b7280";
const RADIUS = 8;

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  fullWidth = true,
  size = "md",
}: SegmentedToggleProps<T>) {
  const isSm = size === "sm";

  const containerStyle: CSSProperties = {
    display: "inline-flex",
    width: fullWidth ? "100%" : undefined,
  };

  return (
    <div role="tablist" style={containerStyle}>
      {options.map((option, index) => {
        const active = option.value === value;
        const isFirst = index === 0;
        const previousActive = index > 0 && options[index - 1].value === value;
        const dividerColor = previousActive || active ? GOLD : OUTER_BORDER;

        const buttonStyle: CSSProperties = {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: option.icon ? 6 : 0,
          flex: fullWidth ? 1 : undefined,
          borderTopLeftRadius: isFirst ? RADIUS : 0,
          borderBottomLeftRadius: isFirst ? RADIUS : 0,
          borderTopRightRadius: isFirst ? 0 : RADIUS,
          borderBottomRightRadius: isFirst ? 0 : RADIUS,
          borderTop: `1px solid ${active ? GOLD : OUTER_BORDER}`,
          borderBottom: `1px solid ${active ? GOLD : OUTER_BORDER}`,
          borderLeft: isFirst ? `1px solid ${active ? GOLD : OUTER_BORDER}` : "none",
          borderRight: isFirst ? "none" : `1px solid ${active ? GOLD : OUTER_BORDER}`,
          background: active ? GOLD_TINT : "#fff",
          color: active ? GOLD : INACTIVE_TEXT,
          fontWeight: 600,
          fontSize: isSm ? 13 : 14,
          lineHeight: "18px",
          padding: isSm ? "6px 14px" : "8px 14px",
          transition: "color 150ms ease, background-color 150ms ease, border-color 150ms ease",
          cursor: "pointer",
          whiteSpace: "nowrap",
        };

        return (
          <Fragment key={option.value}>
            {!isFirst && (
              <div style={{ width: 1, alignSelf: "stretch", background: dividerColor }} />
            )}
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              style={buttonStyle}
            >
              {option.icon && (
                <span style={{ display: "inline-flex", color: active ? GOLD : INACTIVE_TEXT }}>
                  {option.icon}
                </span>
              )}
              {option.label}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
