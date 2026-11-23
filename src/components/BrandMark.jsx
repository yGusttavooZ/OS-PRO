import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#35D66F" strokeWidth="7" strokeLinecap="round">
          <path d="M32 5V12M32 52V59M5 32H12M52 32H59M12.9 12.9 17.9 17.9M46.1 46.1 51.1 51.1M51.1 12.9 46.1 17.9M17.9 46.1 12.9 51.1"/>
        </g>
        <circle cx="32" cy="32" r="20" fill="#35D66F"/>
        <circle cx="32" cy="32" r="8" fill="#10231F"/>
      </svg>
    </span>
  );
}
