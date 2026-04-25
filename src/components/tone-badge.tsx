import styles from "./tone-badge.module.css";

type ToneBadgeProps = {
  label: string;
  className?: string;
};

const TONE_BADGE_COUNT = 6;

function getToneBadgeIndex(label: string) {
  const normalized = label.trim();

  if (!normalized) {
    return 0;
  }

  const firstChar = Array.from(normalized)[0] ?? normalized[0] ?? "A";
  const codePoint = firstChar.toLocaleLowerCase("zh-CN").codePointAt(0) ?? 0;

  return codePoint % TONE_BADGE_COUNT;
}

export function ToneBadge({ label, className }: ToneBadgeProps) {
  const toneIndex = getToneBadgeIndex(label);
  const normalizedLabel = label.trim();

  return (
    <span
      className={[styles["tone-badge"], styles[`tone-badge-${toneIndex}`], className]
        .filter(Boolean)
        .join(" ")}
      title={normalizedLabel}
    >
      {normalizedLabel}
    </span>
  );
}
