import { memberTags } from "@/lib/site-data";

export const MINIAPP_PRIVACY_POLICY_VERSION = "2026-07-18";

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
  wechat?: string | null;
  city?: string | null;
  roleLabel?: string | null;
  industryTags?: string[] | null;
  skills?: string[] | null;
  capabilitySummary?: string | null;
  seekingSummary?: string | null;
};

const completionChecks = [
  { key: "displayName", label: "昵称" },
  { key: "wechat", label: "微信号" },
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

export function isMiniappRegistrationReady(
  profile: Pick<MiniappProfileCompletionInput, "displayName" | "wechat">,
) {
  return hasText(profile.displayName) && hasText(profile.wechat);
}

export function getMiniappProfileCompletion(
  profile: MiniappProfileCompletionInput,
) {
  const values: Record<(typeof completionChecks)[number]["key"], boolean> = {
    displayName: hasText(profile.displayName),
    wechat: hasText(profile.wechat),
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
