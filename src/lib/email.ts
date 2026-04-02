type RegistrationNotificationPayload = {
  userId: string;
  email: string | null;
  displayName: string;
  wechat: string;
  city: string;
  roleLabel: string | null;
  organization: string | null;
  monthlyTime: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  willingToAttend: boolean;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatValue(value: string | null) {
  return value?.trim() ? escapeHtml(value.trim()) : "未填写";
}

function formatList(values: string[]) {
  return values.length > 0 ? escapeHtml(values.join("、")) : "未填写";
}

function formatBoolean(value: boolean) {
  return value ? "是" : "否";
}

function getAdminNotificationConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.ADMIN_NOTIFICATION_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    "Changzhou AI Club <onboarding@resend.dev>";
  const recipients = (
    process.env.ADMIN_NOTIFICATION_EMAILS ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? ""
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? ""
  ).trim();

  if (!apiKey || recipients.length === 0) {
    return null;
  }

  return {
    apiKey,
    from,
    recipients,
    adminUrl: siteUrl ? `${siteUrl.replace(/\/$/, "")}/admin/members` : null,
  };
}

export async function sendAdminRegistrationNotification(
  payload: RegistrationNotificationPayload,
) {
  const config = getAdminNotificationConfig();

  if (!config) {
    return false;
  }

  const subject = `新成员完成加入资料：${payload.displayName}`;
  const textLines = [
    "有新成员完成了加入资料。",
    "",
    `显示名：${payload.displayName}`,
    `邮箱：${payload.email ?? "未提供"}`,
    `微信号：${payload.wechat}`,
    `城市：${payload.city}`,
    `身份 / 角色：${payload.roleLabel ?? "未填写"}`,
    `公司 / 学校 / 团队：${payload.organization ?? "未填写"}`,
    `每月可投入时间：${payload.monthlyTime ?? "未填写"}`,
    `技能标签：${payload.skills.length > 0 ? payload.skills.join("、") : "未填写"}`,
    `感兴趣主题：${payload.interests.length > 0 ? payload.interests.join("、") : "未填写"}`,
    `愿意参加线下活动：${formatBoolean(payload.willingToAttend)}`,
    `愿意分享：${formatBoolean(payload.willingToShare)}`,
    `愿意参与社区共建：${formatBoolean(payload.willingToJoinProjects)}`,
    `个人简介：${payload.bio ?? "未填写"}`,
    `用户 ID：${payload.userId}`,
  ];

  if (config.adminUrl) {
    textLines.push(`后台查看：${config.adminUrl}`);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: config.recipients,
      subject,
      text: textLines.join("\n"),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 16px;">有新成员完成了加入资料</h2>
          <table style="border-collapse: collapse;">
            <tbody>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>显示名</strong></td><td>${formatValue(payload.displayName)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>邮箱</strong></td><td>${formatValue(payload.email)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>微信号</strong></td><td>${formatValue(payload.wechat)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>城市</strong></td><td>${formatValue(payload.city)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>身份 / 角色</strong></td><td>${formatValue(payload.roleLabel)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>公司 / 学校 / 团队</strong></td><td>${formatValue(payload.organization)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>每月可投入时间</strong></td><td>${formatValue(payload.monthlyTime)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>技能标签</strong></td><td>${formatList(payload.skills)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>感兴趣主题</strong></td><td>${formatList(payload.interests)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>愿意参加线下活动</strong></td><td>${formatBoolean(payload.willingToAttend)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>愿意分享</strong></td><td>${formatBoolean(payload.willingToShare)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>愿意参与社区共建</strong></td><td>${formatBoolean(payload.willingToJoinProjects)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>个人简介</strong></td><td>${formatValue(payload.bio)}</td></tr>
              <tr><td style="padding: 6px 12px 6px 0;"><strong>用户 ID</strong></td><td>${formatValue(payload.userId)}</td></tr>
            </tbody>
          </table>
          ${
            config.adminUrl
              ? `<p style="margin-top: 20px;"><a href="${escapeHtml(config.adminUrl)}">打开成员后台</a></p>`
              : ""
          }
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to send admin registration notification email.", {
      status: response.status,
      body,
    });
    return false;
  }

  return true;
}
