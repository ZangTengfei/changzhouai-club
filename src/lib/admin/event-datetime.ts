const CHANGZHOU_TIMEZONE_OFFSET = "+08:00";
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

export function normalizeAdminEventDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (TIMEZONE_SUFFIX_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  if (!DATETIME_LOCAL_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  const valueWithSeconds =
    trimmedValue.length === "YYYY-MM-DDTHH:mm".length ? `${trimmedValue}:00` : trimmedValue;

  return `${valueWithSeconds}${CHANGZHOU_TIMEZONE_OFFSET}`;
}
