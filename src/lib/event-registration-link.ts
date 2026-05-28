const EXTERNAL_REGISTRATION_URL_PATTERN = /https?:\/\/[^\s<>"']+/i;
const TRAILING_URL_PUNCTUATION_PATTERN = /[),.;:，。；：、）】》>]+$/;
const TRAILING_NOTE_PUNCTUATION_PATTERN = /[\s,，.。;；:：、]+$/;

export function getExternalRegistrationUrl(
  registrationUrl?: string | null,
  registrationNote?: string | null,
) {
  const explicitUrl = registrationUrl?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  const match = registrationNote?.match(EXTERNAL_REGISTRATION_URL_PATTERN);

  if (!match) {
    return null;
  }

  return match[0].replace(TRAILING_URL_PUNCTUATION_PATTERN, "");
}

export function getRegistrationNoteWithoutUrl(
  registrationNote?: string | null,
  registrationUrl = getExternalRegistrationUrl(null, registrationNote),
) {
  if (!registrationNote) {
    return null;
  }

  if (!registrationUrl) {
    return registrationNote.trim() || null;
  }

  const note = registrationNote
    .replace(registrationUrl, "")
    .replace(TRAILING_NOTE_PUNCTUATION_PATTERN, "")
    .trim();

  return note || null;
}

export function getExternalRegistrationLabel(registrationUrl: string) {
  try {
    const { hostname } = new URL(registrationUrl);

    if (hostname.includes("feishu.cn") || hostname.includes("larksuite.com")) {
      return "飞书问卷报名";
    }
  } catch {
    return "前往报名链接";
  }

  return "前往报名链接";
}
