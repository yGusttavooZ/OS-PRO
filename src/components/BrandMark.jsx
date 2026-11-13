import React from "react";
import { ClipboardCheck } from "lucide-react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`inline-grid place-items-center ${className}`} aria-hidden="true">
      <ClipboardCheck className="h-full w-full" strokeWidth={2.1} />
    </span>
  );
}
