import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`inline-grid place-items-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M25 5v6M25 45v6M5 25h6M45 25h6M11 11l4.3 4.3M39.7 39.7 44 44M44 11l-4.3 4.3M15.3 39.7 11 44" />
        <circle cx="25" cy="25" r="17" />
        <circle cx="25" cy="25" r="10" strokeWidth="2.4" />
        <rect x="17" y="25" width="42" height="28" rx="3.5" fill="currentColor" stroke="currentColor" strokeWidth="2.5" />
        <path d="M13 57h50l-4 4H17z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
        <path d="m29 32 17 14M46 32 29 46" stroke="var(--brand-mark-cutout, #123b32)" strokeWidth="4" />
        <circle cx="29" cy="32" r="2.3" fill="var(--brand-mark-cutout, #123b32)" stroke="none" />
        <circle cx="46" cy="32" r="2.3" fill="var(--brand-mark-cutout, #123b32)" stroke="none" />
        <circle cx="29" cy="46" r="2.3" fill="var(--brand-mark-cutout, #123b32)" stroke="none" />
        <circle cx="46" cy="46" r="2.3" fill="var(--brand-mark-cutout, #123b32)" stroke="none" />
      </svg>
    </span>
  );
}
