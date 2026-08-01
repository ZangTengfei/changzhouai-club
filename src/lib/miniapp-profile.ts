import { memberTags } from "@/lib/site-data";

export const MINIAPP_PRIVACY_POLICY_VERSION = "2026-07-18";
export const MINIAPP_PHONE_CONTACT_POLICY_VERSION = "phone-contact:2026-08-01";

export const MINIAPP_CITY_OPTIONS = [
  "常州",
  "常州·天宁区",
  "常州·钟楼区",
  "常州·新北区",
  "常州·武进区",
  "常州·金坛区",
  "常州·溧阳市",
  "常州以外",
] as const;

export const MINIAPP_ROLE_OPTIONS = [
  "产品经理",
  "开发者/工程师",
  "设计师",
  "创业者",
  "企业管理者",
  "市场/销售",
  "教育/研究",
  "学生",
  "自由职业者",
] as const;

export const MINIAPP_MONTHLY_TIME_OPTIONS = [
  "每月 1–2 小时",
  "每月 3–5 小时",
  "每月 6–10 小时",
  "每月 10 小时以上",
  "暂不确定",
] as const;

export const MINIAPP_INDUSTRY_OPTIONS = [
  "制造业",
  "软件与信息服务",
  "互联网与电商",
  "企业服务",
  "教育与科研",
  "金融与投资",
  "医疗健康",
  "文化与传媒",
  "政府与公共服务",
  "零售与消费",
  "创业与自由职业",
  "其他",
] as const;

export const MINIAPP_SKILL_OPTIONS = memberTags;

type MiniappProfileCompletionInput = {
  displayName?: string | null;
  city?: string | null;
  roleLabel?: string | null;
  industryTags?: string[] | null;
  skills?: string[] | null;
  capabilitySummary?: string | null;
  seekingSummary?: string | null;
};

const completionChecks = [
  { key: "displayName", label: "昵称" },
  { key: "city", label: "城市/辖区" },
  { key: "roleLabel", label: "当前身份" },
  { key: "industryTags", label: "行业方向" },
  { key: "skills", label: "擅长方向" },
  { key: "connection", label: "可提供能力或当前需要" },
] as const;

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasItems(value: string[] | null | undefined) {
  return Boolean(value?.some((item) => item.trim()));
}

export function isMiniappDisplayNameReady(value: string | null | undefined) {
  const displayName = value?.trim();
  return Boolean(displayName && displayName !== "微信用户");
}

export function isMiniappRegistrationReady(
  profile: MiniappProfileCompletionInput,
) {
  return getMiniappProfileCompletion(profile).completed;
}

export function getMiniappProfileCompletion(
  profile: MiniappProfileCompletionInput,
) {
  const values: Record<(typeof completionChecks)[number]["key"], boolean> = {
    displayName: isMiniappDisplayNameReady(profile.displayName),
    city: hasText(profile.city),
    roleLabel: hasText(profile.roleLabel),
    industryTags: hasItems(profile.industryTags),
    skills: hasItems(profile.skills),
    connection:
      hasText(profile.capabilitySummary) || hasText(profile.seekingSummary),
  };
  const missingItems = completionChecks
    .filter((item) => !values[item.key])
    .map((item) => item.label);
  const totalCount = completionChecks.length;
  const completedCount = totalCount - missingItems.length;

  return {
    completed: completedCount === totalCount,
    percent: Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    missingItems,
  };
}
