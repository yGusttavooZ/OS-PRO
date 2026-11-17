import React from "react";
import { Settings, FileText, Check } from "lucide-react";

export default function BrandMark({ className = "" }) {
  return (
    <span
      className={`relative inline-grid place-items-center ${className}`}
      aria-hidden="true"
    >
      <Settings
        className="absolute inset-0 h-full w-full text-current"
        strokeWidth={2.5}
      />
      <FileText
        className="absolute left-[25%] top-[23%] h-[52%] w-[52%] text-current"
        strokeWidth={2.4}
      />
      <span className="absolute bottom-[8%] right-[1%] grid h-[48%] w-[48%] place-items-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-[hsl(var(--sidebar))]">
        <Check className="h-[78%] w-[78%]" strokeWidth={3.5} />
      </span>
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <path
          d="M8 70 C20 91 58 94 91 36"
          stroke="#22c55e"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
