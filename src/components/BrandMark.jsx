import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`inline-grid place-items-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 10h-5a5 5 0 0 0-5 5v37a5 5 0 0 0 5 5h28a5 5 0 0 0 5-5V15a5 5 0 0 0-5-5h-5" />
        <path d="M24 7h16a4 4 0 0 1 4 4v5H20v-5a4 4 0 0 1 4-4Z" fill="currentColor" stroke="currentColor" />
        <path d="M23 28h18M23 36h10" opacity=".72" />
        <path d="m31 45 5 5 10-12" strokeWidth="4" />
      </svg>
    </span>
  );
}
