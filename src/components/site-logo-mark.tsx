type SiteLogoMarkProps = {
  className?: string;
};

export function SiteLogoMark({ className }: SiteLogoMarkProps) {
  return (
    <svg
      viewBox="8 36 112 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M33 44H24C18 44 14 48 14 54V74C14 80 18 84 24 84H33"
        stroke="#0F7A6A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 84L50 44L60 84"
        stroke="#EE9650"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 68H56"
        stroke="#F5B775"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M68 44H80"
        stroke="#EE9650"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M74 44V84"
        stroke="#EE9650"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M68 84H80"
        stroke="#EE9650"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M114 44H105C99 44 95 48 95 54V74C95 80 99 84 105 84H114"
        stroke="#0F7A6A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
