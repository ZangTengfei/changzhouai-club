import { cn } from "@/lib/utils";

type ToneBadgeProps = {
  label: string;
  className?: string;
};

const TONE_BADGE_COUNT = 6;
const toneClasses = [
  "border-primary-border bg-primary-soft text-primary-strong",
  "border-[rgba(var(--accent-warm-rgb),0.18)] bg-[rgba(var(--accent-warm-rgb),0.12)] text-[var(--accent-warm-strong)]",
  "border-[rgba(56,118,195,0.18)] bg-[rgba(56,118,195,0.11)] text-[#325f97]",
  "border-[rgba(190,82,82,0.16)] bg-[rgba(190,82,82,0.1)] text-[#9c4545]",
  "border-[rgba(111,129,58,0.16)] bg-[rgba(111,129,58,0.11)] text-[#5f7130]",
  "border-[rgba(92,99,112,0.16)] bg-[rgba(92,99,112,0.1)] text-[#4c5260]",
] as const;

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
      className={cn(
        "inline-flex min-h-8.5 items-center rounded-full border px-3 py-2.25 text-[0.9rem] font-semibold",
        toneClasses[toneIndex],
        className,
      )}
      title={normalizedLabel}
    >
      {normalizedLabel}
    </span>
  );
}
