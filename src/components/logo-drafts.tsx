type LogoDraftProps = {
  className?: string;
};

export function LogoDraftCityNodes({ className }: LogoDraftProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M78 40H50L36 64L50 88H78"
        stroke="var(--logo-contrast)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M78 40L92 64L78 88"
        stroke="var(--logo-secondary)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="40" r="8" fill="var(--logo-contrast)" />
      <circle cx="50" cy="40" r="8" fill="var(--logo-contrast)" />
      <circle cx="36" cy="64" r="8" fill="var(--logo-contrast)" />
      <circle cx="50" cy="88" r="8" fill="var(--logo-contrast)" />
      <circle cx="78" cy="88" r="8" fill="var(--logo-contrast)" />
      <circle cx="92" cy="64" r="8" fill="var(--logo-secondary)" />
    </svg>
  );
}

export function LogoDraftBuildEngine({ className }: LogoDraftProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M94 39H60C49 39 41 47 41 57V71C41 81 49 89 60 89H94"
        stroke="var(--logo-contrast)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M62 48L79 64L62 80"
        stroke="var(--logo-secondary)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M80 51L92 64L80 77"
        stroke="var(--logo-highlight)"
        strokeWidth="5.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="41" cy="57" r="5.5" fill="var(--logo-contrast)" />
      <circle cx="41" cy="71" r="5.5" fill="var(--logo-contrast)" />
      <circle cx="94" cy="39" r="5.5" fill="var(--logo-contrast)" />
      <circle cx="94" cy="89" r="5.5" fill="var(--logo-contrast)" />
    </svg>
  );
}

export function LogoDraftCityAgent({ className }: LogoDraftProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M42 42H82C92.5 42 100 49.2 100 59V67C100 76.8 92.5 84 82 84H66L50 96V84H42C31.5 84 24 76.8 24 67V59C24 49.2 31.5 42 42 42Z"
        stroke="var(--logo-contrast)"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M42 66H68"
        stroke="var(--logo-contrast)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M80 54L94 64L80 74"
        stroke="var(--logo-secondary)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="66" r="6" fill="var(--logo-contrast)" />
      <circle cx="68" cy="66" r="6" fill="var(--logo-contrast)" />
      <circle cx="94" cy="64" r="6" fill="var(--logo-secondary)" />
    </svg>
  );
}

export function LogoDraftCAICMonogram({ className }: LogoDraftProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M33 44H24C18 44 14 48 14 54V74C14 80 18 84 24 84H33"
        stroke="var(--logo-contrast)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 84L50 44L60 84"
        stroke="var(--logo-secondary)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 68H56"
        stroke="var(--logo-highlight)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M68 44H80"
        stroke="var(--logo-secondary)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M74 44V84"
        stroke="var(--logo-secondary)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M68 84H80"
        stroke="var(--logo-secondary)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M114 44H105C99 44 95 48 95 54V74C95 80 99 84 105 84H114"
        stroke="var(--logo-contrast)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
