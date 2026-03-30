const adminSavedMessageMap: Record<string, string> = {
  event: "活动信息已保存。",
  deleted: "活动已删除。",
  photo: "活动照片已保存。",
  photo_deleted: "活动照片已删除。",
  cover: "活动封面已更新。",
};

const adminErrorMessageMap: Record<string, string> = {
  missing_required_fields: "提交时缺少必要字段，请检查活动标题和 slug。",
  missing_photo_fields: "请至少填写活动照片路径，再提交。",
  database_write_failed: "数据库写入失败，请稍后再试。",
};

const adminEventStatusLabelMap: Record<string, string> = {
  draft: "草稿",
  scheduled: "已发布",
  completed: "已结束",
  cancelled: "已取消",
};

const adminRegistrationStatusLabelMap: Record<string, string> = {
  registered: "已报名",
  waitlist: "候补",
  waitlisted: "候补",
  cancelled: "已取消",
};

const adminMemberStatusLabelMap: Record<string, string> = {
  pending: "待完善",
  active: "活跃成员",
  organizer: "组织者",
  admin: "管理员",
  paused: "暂停中",
};

export function getAdminSavedMessage(code?: string) {
  if (!code) {
    return null;
  }

  return adminSavedMessageMap[code] ?? "后台内容已更新。";
}

export function getAdminErrorMessage(code?: string) {
  if (!code) {
    return null;
  }

  return adminErrorMessageMap[code] ?? "提交失败，请检查表单内容后重试。";
}

export function formatAdminEventDate(value: string | null, withTime = true) {
  if (!value) {
    return "待定";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(new Date(value));
}

export function formatAdminEventStatus(status: string) {
  return adminEventStatusLabelMap[status] ?? status;
}

export function formatAdminRegistrationStatus(status: string) {
  return adminRegistrationStatusLabelMap[status] ?? status;
}

export function formatAdminMemberStatus(status: string) {
  return adminMemberStatusLabelMap[status] ?? status;
}

export function getAdminEventStatusTone(status: string) {
  switch (status) {
    case "draft":
      return "draft";
    case "scheduled":
      return "scheduled";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "neutral";
  }
}

export function getAdminRegistrationStatusTone(status: string) {
  switch (status) {
    case "registered":
      return "registered";
    case "waitlist":
    case "waitlisted":
      return "waitlist";
    case "cancelled":
      return "cancelled";
    default:
      return "neutral";
  }
}

export function getAdminMemberStatusTone(status: string) {
  switch (status) {
    case "pending":
      return "draft";
    case "active":
      return "scheduled";
    case "organizer":
      return "registered";
    case "admin":
      return "waitlist";
    case "paused":
      return "cancelled";
    default:
      return "neutral";
  }
}
