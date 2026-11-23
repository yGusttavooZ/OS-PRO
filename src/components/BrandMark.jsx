import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`inline-grid place-items-center ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="27" cy="25" r="17" opacity=".78" />
        <circle cx="27" cy="25" r="9" stroke="#55D6A4" strokeWidth="3" />
        <path d="M27 4v5M27 41v5M6 25h5M43 25h5M12.2 10.2l3.6 3.6M38.2 36.2l3.6 3.6M41.8 10.2l-3.6 3.6M15.8 36.2l-3.6 3.6" opacity=".78" />
        <rect x="13" y="22" width="39" height="29" rx="4.5" fill="currentColor" fillOpacity=".12" />
        <path d="M17 26h31v19H17z" strokeWidth="2.5" />
        <path d="m25 30 14 12M39 30 25 42" stroke="#55D6A4" strokeWidth="3.2" />
        <path d="M10 53h45l-4 5H14z" fill="currentColor" fillOpacity=".18" />
        <path d="M10 53h45" strokeWidth="2.8" />
      </svg>
    </span>
  );
}
