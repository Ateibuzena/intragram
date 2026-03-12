import "../styles/Sidebar.css";
import type { SVGProps } from "react";

export const IcNewSms = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5l-4 3V5a2 2 0 0 1 2-2h7"/>
    <path d="M18 2l4 4-10 10-4 1 1-4z"/>
  </svg>
);

export const IcChats = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
  </svg>
);

export const IcRequests = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h8"/>
    <path d="M16 5l2 2 4-4"/>
  </svg>
);

export const IcSearch = ({ className }: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="10" cy="10" r="6" />
    <line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
