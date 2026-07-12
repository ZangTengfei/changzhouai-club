const WECHAT_CODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";
const WECHAT_ACCESS_TOKEN_URL = "https://api.weixin.qq.com/cgi-bin/token";
const WECHAT_SUBSCRIBE_SEND_URL =
  "https://api.weixin.qq.com/cgi-bin/message/subscribe/send";
const WECHAT_REQUEST_TIMEOUT_MS = 8_000;

type WechatCode2SessionResponse = {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

type WechatApiResponse = {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
};

export class WechatMiniappApiError extends Error {
  constructor(
    readonly code: string,
    readonly wechatErrorCode?: number,
  ) {
    super(code);
    this.name = "WechatMiniappApiError";
  }
}

export function getWechatMiniappConfig() {
  const appId = process.env.WECHAT_MINIAPP_APP_ID?.trim();
  const appSecret = process.env.WECHAT_MINIAPP_APP_SECRET?.trim();

  if (!appId || !appSecret) {
    return null;
  }

  return { appId, appSecret };
}

export async function exchangeWechatMiniappCode(
  config: NonNullable<ReturnType<typeof getWechatMiniappConfig>>,
  code: string,
) {
  const url = new URL(WECHAT_CODE2SESSION_URL);
  url.searchParams.set("appid", config.appId);
  url.searchParams.set("secret", config.appSecret);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(WECHAT_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new WechatMiniappApiError("wechat_request_failed");
  }

  const body = (await response.json().catch(() => null)) as WechatCode2SessionResponse | null;

  if (
    !response.ok ||
    !body ||
    body.errcode ||
    !body.openid ||
    !body.session_key
  ) {
    throw new WechatMiniappApiError(
      "wechat_code_exchange_failed",
      body?.errcode,
    );
  }

  // session_key is intentionally discarded and never crosses this boundary.
  return {
    openid: body.openid,
    unionid: body.unionid?.trim() || null,
  };
}

export function getWechatMiniappReminderConfig() {
  const templateId = process.env.WECHAT_MINIAPP_REMINDER_TEMPLATE_ID?.trim();
  if (!templateId) return null;

  return {
    templateId,
    titleKey:
      process.env.WECHAT_MINIAPP_REMINDER_TITLE_KEY?.trim() || "thing1",
    timeKey: process.env.WECHAT_MINIAPP_REMINDER_TIME_KEY?.trim() || "time2",
    locationKey:
      process.env.WECHAT_MINIAPP_REMINDER_LOCATION_KEY?.trim() || "thing3",
  };
}

export async function getWechatMiniappAccessToken(
  config: NonNullable<ReturnType<typeof getWechatMiniappConfig>>,
) {
  const url = new URL(WECHAT_ACCESS_TOKEN_URL);
  url.searchParams.set("grant_type", "client_credential");
  url.searchParams.set("appid", config.appId);
  url.searchParams.set("secret", config.appSecret);

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(WECHAT_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new WechatMiniappApiError("wechat_access_token_request_failed");
  }

  const body = (await response.json().catch(() => null)) as WechatApiResponse | null;
  if (!response.ok || !body?.access_token || body.errcode) {
    throw new WechatMiniappApiError(
      "wechat_access_token_failed",
      body?.errcode,
    );
  }

  return body.access_token;
}

export async function sendWechatMiniappSubscribeMessage(input: {
  accessToken: string;
  openid: string;
  templateId: string;
  page: string;
  data: Record<string, { value: string }>;
}) {
  let response: Response;
  try {
    response = await fetch(
      `${WECHAT_SUBSCRIBE_SEND_URL}?access_token=${encodeURIComponent(input.accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touser: input.openid,
          template_id: input.templateId,
          page: input.page,
          miniprogram_state:
            process.env.WECHAT_MINIAPP_MESSAGE_STATE === "developer"
              ? "developer"
              : process.env.WECHAT_MINIAPP_MESSAGE_STATE === "trial"
                ? "trial"
                : "formal",
          lang: "zh_CN",
          data: input.data,
        }),
        signal: AbortSignal.timeout(WECHAT_REQUEST_TIMEOUT_MS),
      },
    );
  } catch {
    throw new WechatMiniappApiError("wechat_subscribe_send_request_failed");
  }

  const body = (await response.json().catch(() => null)) as WechatApiResponse | null;
  if (!response.ok || !body || body.errcode) {
    throw new WechatMiniappApiError(
      "wechat_subscribe_send_failed",
      body?.errcode,
    );
  }
}
