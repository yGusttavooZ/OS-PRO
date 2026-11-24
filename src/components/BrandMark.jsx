import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <path d="M42 152 106 44h28l-64 108H42Z" fill="#238f78" />
        <path d="m88 156 50-84h24l-50 84H88Z" fill="#34a987" />
        <circle cx="150" cy="48" r="12" fill="#0f766e" />
      </svg>
    </span>
  );
}
