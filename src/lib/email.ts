type NotificationChannelStatus = {
  channel: "email" | "wecom" | "feishu";
  ok: boolean;
  detail?: string;
};

type NotificationDispatchResult = {
  ok: boolean;
  channels: NotificationChannelStatus[];
};

type NotificationEnvelope = {
  subject: string;
  title: string;
  intro: string;
  fields: Array<{
    label: string;
    value: string | null;
  }>;
  adminUrl?: string | null;
};

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

type JoinRequestNotificationPayload = {
  displayName: string;
  wechat: string;
  city: string | null;
  roleLabel: string | null;
  organization: string | null;
  monthlyTime: string | null;
  skills: string[];
  interests: string[];
  note: string | null;
  willingToAttend: boolean;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
};

type CooperationLeadNotificationPayload = {
  companyName: string;
  contactName: string | null;
  contactWechat: string | null;
  contactPhone: string | null;
  requirementType: string | null;
  requirementSummary: string;
  budgetRange: string | null;
  desiredTimeline: string | null;
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

function formatPlainValue(value: string | null) {
  return value?.trim() ? value.trim() : "未填写";
}

function formatList(values: string[]) {
  return values.length > 0 ? escapeHtml(values.join("、")) : "未填写";
}

function formatPlainList(values: string[]) {
  return values.length > 0 ? values.join("、") : "未填写";
}

function formatBoolean(value: boolean) {
  return value ? "是" : "否";
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "").trim();
}

function getAdminUrl(path: string) {
  const siteUrl = getSiteUrl();
  return siteUrl ? `${siteUrl.replace(/\/$/, "")}${path}` : null;
}

function getEmailConfig() {
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

  if (!apiKey || recipients.length === 0) {
    return null;
  }

  return {
    apiKey,
    from,
    recipients,
  };
}

function getWecomWebhookUrl() {
  return (
    process.env.ADMIN_NOTIFICATION_WECOM_WEBHOOK ??
    process.env.WECOM_BOT_WEBHOOK_URL ??
    ""
  ).trim();
}

function getFeishuWebhookUrl() {
  return (
    process.env.ADMIN_NOTIFICATION_FEISHU_WEBHOOK ??
    process.env.FEISHU_BOT_WEBHOOK_URL ??
    ""
  ).trim();
}

function getFeishuWebhookSecret() {
  return (
    process.env.ADMIN_NOTIFICATION_FEISHU_SECRET ??
    process.env.FEISHU_BOT_WEBHOOK_SECRET ??
    ""
  ).trim();
}

function buildPlainText(envelope: NotificationEnvelope) {
  const lines = [envelope.intro, ""];

  envelope.fields.forEach((field) => {
    lines.push(`${field.label}：${formatPlainValue(field.value)}`);
  });

  if (envelope.adminUrl) {
    lines.push(`后台查看：${envelope.adminUrl}`);
  }

  return lines.join("\n");
}

function buildEmailHtml(envelope: NotificationEnvelope) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 16px;">${escapeHtml(envelope.title)}</h2>
      <p style="margin-bottom: 16px;">${escapeHtml(envelope.intro)}</p>
      <table style="border-collapse: collapse;">
        <tbody>
          ${envelope.fields
            .map(
              (field) =>
                `<tr><td style="padding: 6px 12px 6px 0;"><strong>${escapeHtml(field.label)}</strong></td><td>${formatValue(field.value)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      ${
        envelope.adminUrl
          ? `<p style="margin-top: 20px;"><a href="${escapeHtml(envelope.adminUrl)}">打开后台查看</a></p>`
          : ""
      }
    </div>
  `;
}

function buildMarkdownText(envelope: NotificationEnvelope) {
  const lines = [`# ${envelope.title}`, "", envelope.intro, ""];

  envelope.fields.forEach((field) => {
    lines.push(`- ${field.label}：${formatPlainValue(field.value)}`);
  });

  if (envelope.adminUrl) {
    lines.push("");
    lines.push(`后台查看：${envelope.adminUrl}`);
  }

  return lines.join("\n");
}

async function signFeishuPayload(timestamp: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${timestamp}\n${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(""));
  return Buffer.from(signature).toString("base64");
}

async function sendEmailNotification(
  envelope: NotificationEnvelope,
): Promise<NotificationChannelStatus> {
  const config = getEmailConfig();

  if (!config) {
    return {
      channel: "email",
      ok: false,
      detail: "email_not_configured",
    };
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
      subject: envelope.subject,
      text: buildPlainText(envelope),
      html: buildEmailHtml(envelope),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to send admin email notification.", {
      status: response.status,
      body,
      subject: envelope.subject,
    });

    return {
      channel: "email",
      ok: false,
      detail: `email_http_${response.status}`,
    };
  }

  return {
    channel: "email",
    ok: true,
  };
}

async function sendWecomNotification(
  envelope: NotificationEnvelope,
): Promise<NotificationChannelStatus> {
  const webhookUrl = getWecomWebhookUrl();

  if (!webhookUrl) {
    return {
      channel: "wecom",
      ok: false,
      detail: "wecom_not_configured",
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        content: buildMarkdownText(envelope),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to send WeCom admin notification.", {
      status: response.status,
      body,
      subject: envelope.subject,
    });

    return {
      channel: "wecom",
      ok: false,
      detail: `wecom_http_${response.status}`,
    };
  }

  return {
    channel: "wecom",
    ok: true,
  };
}

async function sendFeishuNotification(
  envelope: NotificationEnvelope,
): Promise<NotificationChannelStatus> {
  const webhookUrl = getFeishuWebhookUrl();

  if (!webhookUrl) {
    return {
      channel: "feishu",
      ok: false,
      detail: "feishu_not_configured",
    };
  }

  const secret = getFeishuWebhookSecret();
  const payload: Record<string, unknown> = {
    msg_type: "text",
    content: {
      text: buildPlainText(envelope),
    },
  };

  if (secret) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    payload.timestamp = timestamp;
    payload.sign = await signFeishuPayload(timestamp, secret);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Failed to send Feishu admin notification.", {
      status: response.status,
      body,
      subject: envelope.subject,
    });

    return {
      channel: "feishu",
      ok: false,
      detail: `feishu_http_${response.status}`,
    };
  }

  return {
    channel: "feishu",
    ok: true,
  };
}

async function dispatchAdminNotification(
  envelope: NotificationEnvelope,
): Promise<NotificationDispatchResult> {
  const channels = await Promise.all([
    sendEmailNotification(envelope),
    sendWecomNotification(envelope),
    sendFeishuNotification(envelope),
  ]);

  const ok = channels.some((channel) => channel.ok);

  if (!ok) {
    console.error("All admin notification channels failed or are not configured.", {
      subject: envelope.subject,
      channels,
    });
  }

  return { ok, channels };
}

export async function sendAdminRegistrationNotification(
  payload: RegistrationNotificationPayload,
) {
  const result = await dispatchAdminNotification({
    subject: `新成员完成加入资料：${payload.displayName}`,
    title: "有新成员完成了加入资料",
    intro: "有新成员完成了加入资料，请尽快查看并跟进。",
    adminUrl: getAdminUrl("/admin/members"),
    fields: [
      { label: "显示名", value: payload.displayName },
      { label: "邮箱", value: payload.email },
      { label: "微信号", value: payload.wechat },
      { label: "城市", value: payload.city },
      { label: "身份 / 角色", value: payload.roleLabel },
      { label: "公司 / 学校 / 团队", value: payload.organization },
      { label: "每月可投入时间", value: payload.monthlyTime },
      { label: "技能标签", value: formatPlainList(payload.skills) },
      { label: "感兴趣主题", value: formatPlainList(payload.interests) },
      { label: "愿意参加线下活动", value: formatBoolean(payload.willingToAttend) },
      { label: "愿意分享", value: formatBoolean(payload.willingToShare) },
      { label: "愿意参与社区共建", value: formatBoolean(payload.willingToJoinProjects) },
      { label: "个人简介", value: payload.bio },
      { label: "用户 ID", value: payload.userId },
    ],
  });

  return result.ok;
}

export async function sendAdminJoinRequestNotification(
  payload: JoinRequestNotificationPayload,
) {
  const result = await dispatchAdminNotification({
    subject: `新的加入申请：${payload.displayName}`,
    title: "有新的加入申请",
    intro: "有人刚提交了加入社区申请，请尽快查看并决定后续跟进动作。",
    adminUrl: getAdminUrl("/admin/members"),
    fields: [
      { label: "显示名", value: payload.displayName },
      { label: "微信号", value: payload.wechat },
      { label: "城市", value: payload.city },
      { label: "身份 / 角色", value: payload.roleLabel },
      { label: "公司 / 学校 / 团队", value: payload.organization },
      { label: "每月可投入时间", value: payload.monthlyTime },
      { label: "技能标签", value: formatPlainList(payload.skills) },
      { label: "感兴趣主题", value: formatPlainList(payload.interests) },
      { label: "愿意参加线下活动", value: formatBoolean(payload.willingToAttend) },
      { label: "愿意分享", value: formatBoolean(payload.willingToShare) },
      { label: "愿意参与社区共建", value: formatBoolean(payload.willingToJoinProjects) },
      { label: "补充说明", value: payload.note },
    ],
  });

  return result.ok;
}

export async function sendAdminCooperationLeadNotification(
  payload: CooperationLeadNotificationPayload,
) {
  const result = await dispatchAdminNotification({
    subject: `新的合作线索：${payload.companyName}`,
    title: "有新的合作线索",
    intro: "有企业或机构提交了新的合作需求，请及时评估并分配跟进人。",
    adminUrl: getAdminUrl("/admin/leads"),
    fields: [
      { label: "公司名称", value: payload.companyName },
      { label: "联系人", value: payload.contactName },
      { label: "联系微信", value: payload.contactWechat },
      { label: "联系电话", value: payload.contactPhone },
      { label: "需求类型", value: payload.requirementType },
      { label: "需求摘要", value: payload.requirementSummary },
      { label: "预算范围", value: payload.budgetRange },
      { label: "期望时间", value: payload.desiredTimeline },
    ],
  });

  return result.ok;
}

