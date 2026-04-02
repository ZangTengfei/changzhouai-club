type ToneBadgeProps = {
  label: string;
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

export function ToneBadge({ label }: ToneBadgeProps) {
  const toneIndex = getToneBadgeIndex(label);

  return <span className={`tone-badge tone-badge-${toneIndex}`}>{label}</span>;
}
