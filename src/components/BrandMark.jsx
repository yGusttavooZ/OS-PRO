import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={`inline-grid aspect-square place-items-center rounded-[22%] border-[2.5px] border-current font-heading text-[0.62em] font-extrabold tracking-[-0.09em] ${className}`} aria-hidden="true">
      OS
    </span>
  );
}
