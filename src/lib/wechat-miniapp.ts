const WECHAT_CODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";
const WECHAT_REQUEST_TIMEOUT_MS = 8_000;

type WechatCode2SessionResponse = {
  openid?: string;
  session_key?: string;
  unionid?: string;
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
