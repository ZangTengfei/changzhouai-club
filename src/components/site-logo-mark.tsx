type SiteLogoMarkProps = {
  className?: string;
};

export function SiteLogoMark({ className }: SiteLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(64 64) scale(1.28) translate(-64 -64)">
        <path
          d="M94 39H60C49 39 41 47 41 57V71C41 81 49 89 60 89H94"
          stroke="#0F7A6A"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M62 48L79 64L62 80"
          stroke="#EE9650"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M80 51L92 64L80 77"
          stroke="#F5B775"
          strokeWidth="5.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="41" cy="57" r="5.5" fill="#0F7A6A" />
        <circle cx="41" cy="71" r="5.5" fill="#0F7A6A" />
        <circle cx="94" cy="39" r="5.5" fill="#0F7A6A" />
        <circle cx="94" cy="89" r="5.5" fill="#0F7A6A" />
      </g>
    </svg>
  );
}
