import Image from "next/image";

type SiteLogoMarkProps = {
  className?: string;
};

export function SiteLogoMark({ className }: SiteLogoMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden="true"
      className={className}
      width={512}
      height={512}
      priority
    />
  );
}
