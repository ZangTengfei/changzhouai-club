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
  const className = size === "sm" ? "member-avatar member-avatar-sm" : "member-avatar";

  if (avatarUrl) {
    return (
      <span className={className}>
        <img
          src={avatarUrl}
          alt={name}
          className="member-avatar-image"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return (
    <span className={className}>
      <span className="member-avatar-fallback">{getAvatarInitials(name)}</span>
    </span>
  );
}
