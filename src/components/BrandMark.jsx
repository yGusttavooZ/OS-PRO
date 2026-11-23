import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 10H17.5A5.5 5.5 0 0 0 12 15.5V49a5 5 0 0 0 5 5h21" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
        <path d="M24 7h13a4 4 0 0 1 4 4v5H20v-5a4 4 0 0 1 4-4Z" fill="currentColor" />
        <path d="m19 27 4 4 7-8M19 39l4 4 7-8" stroke="#35D66F" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M35 27h7M35 39h4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        <path d="M7 48c8 10 26 10 38 1" stroke="#35D66F" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M44 21.5a12.5 12.5 0 0 0-2.2 15.7l-7.2 7.2a3.2 3.2 0 0 0 4.5 4.5l7.2-7.2A12.5 12.5 0 0 0 62 31.4l-7.1 3.1-5.2-5.2 3.1-7.1a12.4 12.4 0 0 0-8.8-.7Z" fill="#35D66F" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
