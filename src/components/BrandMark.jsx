import React from "react";
import { ClipboardCheck, Wrench } from "lucide-react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`relative inline-grid place-items-center ${className}`} aria-hidden="true">
      <ClipboardCheck className="h-[78%] w-[78%]" strokeWidth={2.1} />
      <span className="absolute -bottom-0.5 -right-0.5 grid h-[48%] w-[48%] place-items-center rounded-full bg-[hsl(152_72%_48%)] text-white ring-2 ring-[hsl(220_24%_12%)]">
        <Wrench className="h-[72%] w-[72%]" strokeWidth={2.5} />
      </span>
    </span>
  );
}
