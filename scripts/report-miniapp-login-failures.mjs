import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase server configuration.");
}

const reasonLabels = {
  "40029": "微信登录 code 无效",
  "40163": "微信登录 code 已被使用",
  account_snapshot_failed: "账号解析成功，但用户资料快照读取失败",
  miniapp_login_failed: "登录接口发生未分类异常",
  wechat_code_exchange_failed: "微信 code2Session 换码失败",
  wechat_request_failed: "请求微信 code2Session 失败或超时",
};

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const limit = 50;
const { data, error } = await supabase
  .from("miniapp_analytics_events")
  .select("created_at,event_data")
  .eq("event_name", "login_failed")
  .order("created_at", { ascending: false })
  .limit(limit);

if (error) throw error;

console.log(
  JSON.stringify(
    {
      source: new URL(supabaseUrl).host,
      count: data.length,
      failures: data.map((row) => {
        const eventData = row.event_data ?? {};
        const errorCode = String(eventData.errorCode ?? "unknown");
        return {
          createdAt: row.created_at,
          environment: eventData.envVersion ?? null,
          version: eventData.version ?? null,
          stage: eventData.stage ?? null,
          errorCode,
          reason: reasonLabels[errorCode] ?? "未识别错误，按诊断编号查询服务日志",
          requestId: eventData.requestId ?? null,
        };
      }),
    },
    null,
    2,
  ),
);
