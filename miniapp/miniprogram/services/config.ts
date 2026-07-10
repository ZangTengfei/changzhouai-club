const PRODUCTION_API_BASE_URL = "https://changzhouai.club";
const DEVELOPMENT_API_BASE_URL = "http://localhost:3000";
const API_OVERRIDE_STORAGE_KEY = "miniapp_api_base_url";

export function getApiBaseUrl() {
  const accountInfo = wx.getAccountInfoSync();
  const isDevelopment = accountInfo.miniProgram.envVersion === "develop";

  if (isDevelopment) {
    const override = wx.getStorageSync(API_OVERRIDE_STORAGE_KEY);
    if (typeof override === "string" && /^https?:\/\//.test(override)) {
      return override.replace(/\/$/, "");
    }

    return DEVELOPMENT_API_BASE_URL;
  }

  return PRODUCTION_API_BASE_URL;
}
