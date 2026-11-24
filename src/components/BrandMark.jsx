import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`inline-grid place-items-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ospro-slash-a" x1="42" y1="152" x2="134" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#238f78" />
            <stop offset="1" stopColor="#5eead4" />
          </linearGradient>
          <linearGradient id="ospro-slash-b" x1="88" y1="156" x2="162" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f766e" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <path d="M42 152 106 44h28l-64 108H42Z" fill="url(#ospro-slash-a)" />
        <path d="m88 156 50-84h24l-50 84H88Z" fill="url(#ospro-slash-b)" />
        <circle cx="150" cy="48" r="12" fill="#0f172a" />
      </svg>
    </span>
  );
}
