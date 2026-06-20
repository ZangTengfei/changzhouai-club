export const ADMIN_PERMISSION_DEFINITIONS = [
  { key: "admin.access", label: "进入后台", module: "system", sensitivity: "L1" },

  { key: "events.read", label: "查看活动", module: "events", sensitivity: "L1" },
  { key: "events.write", label: "编辑活动", module: "events", sensitivity: "L1" },
  { key: "events.publish", label: "发布活动", module: "events", sensitivity: "L1" },
  { key: "events.delete", label: "删除活动", module: "events", sensitivity: "L4" },
  { key: "events.manage_photos", label: "管理活动图片", module: "events", sensitivity: "L1" },
  { key: "events.read_registrations", label: "查看报名名单", module: "events", sensitivity: "L1" },
  {
    key: "events.read_registration_contact",
    label: "查看报名联系方式",
    module: "events",
    sensitivity: "L2",
  },
  {
    key: "events.update_registration_status",
    label: "更新报名和签到状态",
    module: "events",
    sensitivity: "L1",
  },
  {
    key: "events.export_registrations",
    label: "导出报名名单",
    module: "events",
    sensitivity: "L3",
  },

  { key: "updates.read", label: "查看社区动态", module: "updates", sensitivity: "L1" },
  { key: "updates.review", label: "审核社区动态", module: "updates", sensitivity: "L1" },
  { key: "updates.publish", label: "发布社区动态", module: "updates", sensitivity: "L1" },
  { key: "updates.pin", label: "置顶和精选动态", module: "updates", sensitivity: "L1" },
  { key: "updates.delete", label: "删除社区动态", module: "updates", sensitivity: "L3" },
  { key: "social.write", label: "管理社交入口", module: "social", sensitivity: "L1" },

  { key: "workflows.read", label: "查看运营工作流", module: "workflows", sensitivity: "L1" },
  { key: "workflows.write", label: "编辑运营工作流", module: "workflows", sensitivity: "L1" },
  { key: "workflows.assign", label: "分配工作流任务", module: "workflows", sensitivity: "L1" },
  { key: "workflows.review", label: "审核工作流产物", module: "workflows", sensitivity: "L2" },
  { key: "workflows.publish", label: "确认工作流发布", module: "workflows", sensitivity: "L2" },
  {
    key: "workflows.manage_templates",
    label: "管理工作流模板",
    module: "workflows",
    sensitivity: "L3",
  },
  { key: "workflows.delete", label: "删除运营工作流", module: "workflows", sensitivity: "L4" },

  { key: "ai_jobs.run", label: "运行 AI 节点", module: "ai_jobs", sensitivity: "L1" },
  { key: "ai_jobs.review", label: "审核 AI 产物", module: "ai_jobs", sensitivity: "L2" },
  { key: "ai_jobs.cancel", label: "取消 AI 任务", module: "ai_jobs", sensitivity: "L2" },

  { key: "members.read", label: "查看成员", module: "members", sensitivity: "L1" },
  { key: "members.read_contact", label: "查看成员联系方式", module: "members", sensitivity: "L2" },
  { key: "members.write_profile", label: "编辑成员资料", module: "members", sensitivity: "L1" },
  { key: "members.manage_status", label: "管理成员状态", module: "members", sensitivity: "L3" },
  { key: "members.manage_co_builder", label: "管理共建身份", module: "members", sensitivity: "L2" },
  { key: "members.manage_roles", label: "管理成员后台角色", module: "members", sensitivity: "L4" },
  { key: "members.export", label: "导出成员数据", module: "members", sensitivity: "L4" },

  { key: "projects.read", label: "查看共建项目", module: "projects", sensitivity: "L1" },
  { key: "projects.write", label: "编辑共建项目", module: "projects", sensitivity: "L1" },
  {
    key: "projects.review_applications",
    label: "处理项目申请",
    module: "projects",
    sensitivity: "L2",
  },
  {
    key: "projects.read_application_contact",
    label: "查看项目申请联系方式",
    module: "projects",
    sensitivity: "L2",
  },
  {
    key: "projects.export_applications",
    label: "导出项目申请",
    module: "projects",
    sensitivity: "L3",
  },
  { key: "projects.delete", label: "删除共建项目", module: "projects", sensitivity: "L4" },

  { key: "works.read", label: "查看成员作品", module: "works", sensitivity: "L1" },
  { key: "works.write", label: "编辑成员作品", module: "works", sensitivity: "L1" },
  { key: "works.review", label: "审核成员作品", module: "works", sensitivity: "L1" },
  { key: "works.publish", label: "发布成员作品", module: "works", sensitivity: "L1" },
  { key: "works.delete", label: "删除成员作品", module: "works", sensitivity: "L3" },

  { key: "leads.read", label: "查看合作线索", module: "leads", sensitivity: "L1" },
  { key: "leads.read_sensitive", label: "查看合作敏感信息", module: "leads", sensitivity: "L3" },
  { key: "leads.write", label: "编辑合作线索", module: "leads", sensitivity: "L2" },
  { key: "leads.match_members", label: "匹配合作成员", module: "leads", sensitivity: "L2" },
  { key: "leads.export", label: "导出合作线索", module: "leads", sensitivity: "L4" },
  { key: "leads.delete", label: "删除合作线索", module: "leads", sensitivity: "L4" },

  { key: "sponsors.read", label: "查看赞助者", module: "sponsors", sensitivity: "L1" },
  { key: "sponsors.write", label: "编辑赞助者", module: "sponsors", sensitivity: "L1" },
  { key: "sponsors.manage_images", label: "管理赞助者图片", module: "sponsors", sensitivity: "L1" },
  { key: "sponsors.publish", label: "发布赞助展示", module: "sponsors", sensitivity: "L1" },
  { key: "sponsors.delete", label: "删除赞助者", module: "sponsors", sensitivity: "L4" },

  {
    key: "storage.upload_event_assets",
    label: "上传活动素材",
    module: "storage",
    sensitivity: "L1",
  },
  {
    key: "storage.upload_community_assets",
    label: "上传社区动态素材",
    module: "storage",
    sensitivity: "L1",
  },
  {
    key: "storage.upload_sponsor_assets",
    label: "上传赞助者素材",
    module: "storage",
    sensitivity: "L1",
  },
  { key: "storage.delete_assets", label: "删除上传素材", module: "storage", sensitivity: "L3" },

  { key: "system.manage_roles", label: "管理角色和授权", module: "system", sensitivity: "L4" },
  { key: "system.view_audit_logs", label: "查看审计日志", module: "system", sensitivity: "L4" },
  { key: "system.manage_settings", label: "管理系统设置", module: "system", sensitivity: "L4" },
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_DEFINITIONS)[number]["key"];

export type AdminRoleDefinition = {
  key: string;
  name: string;
  description: string;
  permissions: AdminPermissionKey[];
};

export const ALL_ADMIN_PERMISSION_KEYS = ADMIN_PERMISSION_DEFINITIONS.map(
  (permission) => permission.key,
) as AdminPermissionKey[];

const OPS_LEAD_PERMISSIONS = ALL_ADMIN_PERMISSION_KEYS.filter(
  (permission) =>
    ![
      "events.delete",
      "workflows.manage_templates",
      "workflows.delete",
      "members.manage_roles",
      "members.export",
      "projects.delete",
      "leads.export",
      "leads.delete",
      "sponsors.delete",
      "storage.delete_assets",
      "system.manage_roles",
      "system.view_audit_logs",
      "system.manage_settings",
    ].includes(permission),
);

export const ADMIN_ROLE_DEFINITIONS: AdminRoleDefinition[] = [
  {
    key: "super_admin",
    name: "超级管理员",
    description: "拥有全部后台权限，含角色授权、审计日志和系统设置。",
    permissions: ALL_ADMIN_PERMISSION_KEYS,
  },
  {
    key: "ops_lead",
    name: "运营负责人",
    description: "负责日常运营，可管理大部分内容、成员、项目和合作数据。",
    permissions: OPS_LEAD_PERMISSIONS,
  },
  {
    key: "event_publisher",
    name: "活动发布员",
    description: "可创建、编辑、发布活动并管理活动图片。",
    permissions: [
      "admin.access",
      "events.read",
      "events.write",
      "events.publish",
      "events.manage_photos",
      "events.read_registrations",
      "workflows.read",
      "workflows.write",
      "workflows.assign",
      "workflows.review",
      "workflows.publish",
      "ai_jobs.run",
      "ai_jobs.review",
      "storage.upload_event_assets",
    ],
  },
  {
    key: "event_assistant",
    name: "活动协助员",
    description: "可查看活动与报名名单，更新报名或签到状态。",
    permissions: [
      "admin.access",
      "events.read",
      "events.read_registrations",
      "events.update_registration_status",
      "workflows.read",
    ],
  },
  {
    key: "event_operator",
    name: "活动协作者",
    description: "兼具活动发布和现场协助权限，不含导出和删除。",
    permissions: [
      "admin.access",
      "events.read",
      "events.write",
      "events.publish",
      "events.manage_photos",
      "events.read_registrations",
      "events.update_registration_status",
      "workflows.read",
      "workflows.write",
      "workflows.assign",
      "workflows.review",
      "workflows.publish",
      "ai_jobs.run",
      "ai_jobs.review",
      "storage.upload_event_assets",
    ],
  },
  {
    key: "content_operator",
    name: "内容协作者",
    description: "负责社区动态和社交入口。",
    permissions: [
      "admin.access",
      "updates.read",
      "updates.review",
      "updates.publish",
      "updates.pin",
      "social.write",
      "workflows.read",
      "workflows.write",
      "workflows.review",
      "ai_jobs.run",
      "ai_jobs.review",
      "events.manage_photos",
      "storage.upload_community_assets",
      "storage.upload_event_assets",
    ],
  },
  {
    key: "project_operator",
    name: "项目协作者",
    description: "负责共建项目机会和项目申请处理。",
    permissions: [
      "admin.access",
      "projects.read",
      "projects.write",
      "projects.review_applications",
      "projects.read_application_contact",
    ],
  },
  {
    key: "member_operator",
    name: "成员协作者",
    description: "负责成员基础资料、加入申请和共建身份维护。",
    permissions: [
      "admin.access",
      "members.read",
      "members.write_profile",
      "members.manage_co_builder",
    ],
  },
  {
    key: "partner_operator",
    name: "合作协作者",
    description: "负责合作线索跟进、成员匹配和赞助者资料维护。",
    permissions: [
      "admin.access",
      "leads.read",
      "leads.write",
      "leads.match_members",
      "sponsors.read",
      "sponsors.write",
      "sponsors.manage_images",
      "storage.upload_sponsor_assets",
    ],
  },
  {
    key: "viewer",
    name: "只读观察者",
    description: "可查看基础后台模块，不含敏感字段和写操作。",
    permissions: [
      "admin.access",
      "events.read",
      "workflows.read",
      "updates.read",
      "members.read",
      "projects.read",
      "works.read",
      "sponsors.read",
    ],
  },
];

export const SENSITIVE_VALUE_PLACEHOLDER = "已填写，需要权限查看";

export function hasAdminPermission(
  permissions: readonly string[] | ReadonlySet<string>,
  permission: AdminPermissionKey,
) {
  return "has" in permissions ? permissions.has(permission) : permissions.includes(permission);
}

export function hasAnyAdminPermission(
  permissions: readonly string[] | ReadonlySet<string>,
  permissionKeys: readonly AdminPermissionKey[],
) {
  return permissionKeys.some((permission) => hasAdminPermission(permissions, permission));
}

export function redactSensitiveValue(value: string | null | undefined) {
  return value?.trim() ? SENSITIVE_VALUE_PLACEHOLDER : null;
}

export function getLegacyAdminPermissionsForMemberStatus(status: string | null | undefined) {
  if (status === "admin") {
    return ALL_ADMIN_PERMISSION_KEYS;
  }

  if (status === "organizer") {
    return ADMIN_ROLE_DEFINITIONS.find((role) => role.key === "ops_lead")?.permissions ?? [];
  }

  return [];
}
