interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="PDFPilot" className={className}>
      <defs>
        <linearGradient id="pdfpilot-brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4640DE" />
          <stop offset="55%" stopColor="#7C5CFC" />
          <stop offset="100%" stopColor="#FF7A59" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#pdfpilot-brand-gradient)" />
      <path
        d="M10 8h8l5 5v11a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M18 8v5h5" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path
        d="M12 19.5 15 16l2 2 3-3.5"
        stroke="white"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
