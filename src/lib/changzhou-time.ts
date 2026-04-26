export const CHANGZHOU_TIME_ZONE = "Asia/Shanghai";

export function formatChangzhouDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("zh-CN", {
    ...options,
    timeZone: CHANGZHOU_TIME_ZONE,
  }).format(new Date(value));
}

export function formatChangzhouIsoDate(value: string | Date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: CHANGZHOU_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
}
