type SiteLogoMarkProps = {
  className?: string;
};

const SITE_LOGO_SRC = "/logo.png?v=20260424";

export function SiteLogoMark({ className }: SiteLogoMarkProps) {
  return (
    <img
      src={SITE_LOGO_SRC}
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}
