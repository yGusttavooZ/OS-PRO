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
        <path
          d="M17 32H47"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".72"
        />
        <rect
          x="5.5"
          y="23.5"
          width="17"
          height="17"
          rx="5"
          transform="rotate(-45 5.5 23.5)"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <rect
          x="41.5"
          y="23.5"
          width="17"
          height="17"
          rx="5"
          transform="rotate(-45 41.5 23.5)"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <rect
          x="23"
          y="23"
          width="18"
          height="18"
          rx="5.5"
          transform="rotate(-45 23 23)"
          fill="#35D66F"
        />
        <path
          d="m28.5 32 2.5 2.5 5-5"
          stroke="#10231F"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13.5" cy="32" r="2.2" fill="#35D66F" />
        <circle cx="50.5" cy="32" r="2.2" fill="#35D66F" />
      </svg>
    </span>
  );
}
