type SiteLogoMarkProps = {
  className?: string;
};

const SITE_LOGO_SRC = "/logo-mark.webp?v=20260605";

export function SiteLogoMark({ className }: SiteLogoMarkProps) {
  return (
    <img
      src={SITE_LOGO_SRC}
      alt=""
      aria-hidden="true"
      width={320}
      height={234}
      className={className}
    />
  );
}
