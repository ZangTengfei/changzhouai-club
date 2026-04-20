type SocialPlatformIconProps = {
  tone: "github" | "rednote" | "douyin" | "bilibili";
  className?: string;
  src?: string;
  alt?: string;
};

export function SocialPlatformIcon({ tone, className, src, alt = "" }: SocialPlatformIconProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={24}
        height={24}
        className={className}
      />
    );
  }

  if (tone === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.59 2 12.25c0 4.52 2.87 8.35 6.84 9.7.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.32 9.32 0 0 1 12 6.98c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.16 10.16 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
        />
      </svg>
    );
  }

  if (tone === "douyin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
        <path
          fill="currentColor"
          d="M15.76 3.05c.31 2.33 1.68 3.81 4.05 3.96v3.28a7.12 7.12 0 0 1-4-1.16v5.83c0 3.64-2.34 6.05-5.84 6.05a5.55 5.55 0 0 1-5.77-5.49c0-3.31 2.59-5.75 6.06-5.58.29.01.57.05.85.1v3.41a3.14 3.14 0 0 0-1.08-.18 2.14 2.14 0 0 0-2.29 2.16 2.1 2.1 0 0 0 2.16 2.15c1.45 0 2.3-.93 2.3-2.55V3.05h3.56Z"
        />
      </svg>
    );
  }

  if (tone === "bilibili") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
        <path
          fill="currentColor"
          d="M8.24 3.6a1.1 1.1 0 0 1 1.56 0L12 5.8l2.2-2.2a1.1 1.1 0 1 1 1.56 1.56L13.92 7h3.22A3.86 3.86 0 0 1 21 10.86v5.28A3.86 3.86 0 0 1 17.14 20H6.86A3.86 3.86 0 0 1 3 16.14v-5.28A3.86 3.86 0 0 1 6.86 7h3.22L8.24 5.16a1.1 1.1 0 0 1 0-1.56ZM6.86 9.2c-.92 0-1.66.74-1.66 1.66v5.28c0 .92.74 1.66 1.66 1.66h10.28c.92 0 1.66-.74 1.66-1.66v-5.28c0-.92-.74-1.66-1.66-1.66H6.86Zm2.07 3.06c.61 0 1.1.49 1.1 1.1v.55a1.1 1.1 0 1 1-2.2 0v-.55c0-.61.49-1.1 1.1-1.1Zm6.14 0c.61 0 1.1.49 1.1 1.1v.55a1.1 1.1 0 1 1-2.2 0v-.55c0-.61.49-1.1 1.1-1.1Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v10.8a2.6 2.6 0 0 1-2.6 2.6H6.6A2.6 2.6 0 0 1 4 17.4V6.6A2.6 2.6 0 0 1 6.6 4Zm2.1 4.3c-.55 0-1 .45-1 1v5.4c0 .55.45 1 1 1h6.6c.55 0 1-.45 1-1V9.3c0-.55-.45-1-1-1H8.7Zm1.05 2.1h4.5v1.35h-4.5V10.4Zm0 2.45h3.3v1.35h-3.3v-1.35Z"
      />
    </svg>
  );
}
