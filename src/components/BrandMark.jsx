import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={className} aria-hidden="true">
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".9"
        >
          <path d="M32 9 50 19.5V44.5L32 55 14 44.5V19.5L32 9Z" />
          <path d="M32 32 32 9M32 32 50 19.5M32 32 50 44.5M32 32 32 55M32 32 14 44.5M32 32 14 19.5" />
        </g>
        <g fill="#35D66F" stroke="#10231F" strokeWidth="1.5">
          <circle cx="32" cy="9" r="4.2" />
          <circle cx="50" cy="19.5" r="4.2" />
          <circle cx="50" cy="44.5" r="4.2" />
          <circle cx="32" cy="55" r="4.2" />
          <circle cx="14" cy="44.5" r="4.2" />
          <circle cx="14" cy="19.5" r="4.2" />
        </g>
        <circle cx="32" cy="32" r="7" fill="#35D66F" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="32" cy="32" r="2.2" fill="#10231F" />
      </svg>
    </span>
  );
}
