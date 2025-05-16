
import type { SVGProps } from 'react';

export function CampusKartIcon(props: SVGProps<SVGSVGElement>) {
  // This is a simplified SVG representation of the provided logo.
  // For a pixel-perfect match, using an actual SVG file (if available) would be best.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64" // Adjusted viewBox for clarity
      fill="currentColor" // Assumes the icon primarily uses the current text color
      strokeWidth="0" // Default to no stroke unless paths specify otherwise
      {...props}
    >
      {/* Cart Body and Handle */}
      <path
        d="M12 16 H52 L47 42 H17 L12 16 Z M12 16 C6 16 6 22 6 28 C6 34 12 34 12 34"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Cart Slits */}
      <rect x="15" y="20" width="28" height="3" rx="1" fill="currentColor" />
      <rect x="15" y="26" width="28" height="3" rx="1" fill="currentColor" />
      <rect x="15" y="32" width="28" height="3" rx="1" fill="currentColor" />
      {/* Wheels */}
      <circle cx="20" cy="48" r="4.5" fill="currentColor" />
      <circle cx="42" cy="48" r="4.5" fill="currentColor" />

      {/* Books Stack (Simplified) - Positioned inside cart */}
      <rect x="20" y="15" width="24" height="5" rx="1" fill="currentColor" /> {/* Bottom Book */}
      <rect x="22" y="10" width="20" height="5" rx="1" fill="currentColor" /> {/* Middle Book */}
      
      {/* Graduation Cap (Simplified) - On top of books */}
      <polygon points="18,9 32,4 46,9 32,14" fill="currentColor" /> {/* Mortarboard Top */}
      <path d="M24 13 H40 V10 H24 Z" fill="currentColor" /> {/* Cap Body */}
      {/* Tassel */}
      <line x1="32" y1="4" x2="35" y2="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="35.5" cy="0.5" r="1.5" fill="currentColor" stroke="currentColor" strokeWidth="0.5"/>
    </svg>
  );
}
