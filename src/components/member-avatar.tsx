import { cn } from "@/lib/utils";
import { RevealImage } from "./reveal-image";

type MemberAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "lg";
};

function getAvatarInitials(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return "AI";
  }

  const latin = trimmed.replace(/[^a-zA-Z0-9]/g, "");

  if (latin.length >= 2) {
    return latin.slice(0, 2).toUpperCase();
  }

  if (trimmed.length >= 2) {
    return trimmed.slice(0, 2).toUpperCase();
  }

  return trimmed.slice(0, 1).toUpperCase();
}

export function MemberAvatar({
  name,
  avatarUrl,
  size = "lg",
}: MemberAvatarProps) {
  const className = cn(
    "member-avatar inline-grid size-16 place-items-center overflow-hidden rounded-lg border border-primary-border bg-white/90 shadow-md",
    size === "sm" && "member-avatar-sm size-13 rounded-md",
  );
  const imageClassName =
    "member-avatar-image grid size-full place-items-center object-cover";
  const fallbackClassName =
    "member-avatar-fallback grid size-full place-items-center bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.9),rgba(var(--accent-warm-rgb),0.86))] text-[0.9rem] font-extrabold tracking-[0.04em] text-white";

  if (avatarUrl) {
    return (
      <span className={className}>
        <RevealImage
          src={avatarUrl}
          alt={name}
          className={imageClassName}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return (
    <span className={className}>
      <span className={fallbackClassName}>{getAvatarInitials(name)}</span>
    </span>
  );
}
