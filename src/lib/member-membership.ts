export const MEMBER_MEMBERSHIP_LEVELS = [
  {
    label: "社区成员",
    description: "完成社区注册",
  },
  {
    label: "共建伙伴",
    description: "参与社区共建并获得认证",
  },
  {
    label: "核心共建",
    description: "持续承担社区核心工作",
  },
  {
    label: "荣誉共建",
    description: "长期贡献并获得社区授予",
  },
] as const;

export const MEMBER_MEMBERSHIP_BADGE_CODES = new Set([
  "co_builder",
  "core_builder",
  "honor_builder",
]);

const MEMBER_COMMUNITY_ROLE_PRIORITIES = [
  new Set(["创始人", "社区发起人", "发起人"]),
  new Set(["联合发起人", "联合创始人"]),
] as const;

function normalizeMemberCommunityRole(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN").replace(/[\s·_-]+/g, "");
}

export function getMemberMembershipLevel(
  isCoBuilder: boolean,
  badgeCodes: Iterable<string>,
) {
  const codes = new Set(badgeCodes);
  if (codes.has("honor_builder")) return 3;
  if (codes.has("core_builder")) return 2;
  if (isCoBuilder || codes.has("co_builder")) return 1;
  return 0;
}

export function getMemberMembershipLabel(
  isCoBuilder: boolean,
  badgeCodes: Iterable<string>,
) {
  return MEMBER_MEMBERSHIP_LEVELS[
    getMemberMembershipLevel(isCoBuilder, badgeCodes)
  ].label;
}

export function isMemberMembershipBadgeCode(code: string) {
  return MEMBER_MEMBERSHIP_BADGE_CODES.has(code);
}

export function isMemberMembershipLabel(label: string) {
  const normalized = label.trim();
  return MEMBER_MEMBERSHIP_LEVELS.some((level) => level.label === normalized);
}

export function getMemberCommunityRolePriority(labels: Iterable<string>) {
  const normalizedLabels = new Set(
    Array.from(labels, normalizeMemberCommunityRole).filter(Boolean),
  );
  const priority = MEMBER_COMMUNITY_ROLE_PRIORITIES.findIndex((aliases) =>
    Array.from(aliases).some((alias) =>
      normalizedLabels.has(normalizeMemberCommunityRole(alias)),
    ),
  );
  return priority >= 0 ? priority : MEMBER_COMMUNITY_ROLE_PRIORITIES.length;
}
