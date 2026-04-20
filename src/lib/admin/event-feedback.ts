const adminSavedMessageMap: Record<string, string> = {
  event: "活动信息已保存。",
  deleted: "活动已删除。",
  lead: "合作线索状态已更新。",
  lead_detail: "合作线索详情已更新。",
  lead_match: "线索匹配成员已更新。",
  lead_match_deleted: "线索匹配成员已删除。",
  member: "成员设置已更新。",
  member_profile: "成员资料已更新。",
  join_request: "加入申请状态已更新。",
  join_request_pipeline: "加入申请转化节点已更新。",
  photo: "活动照片已保存。",
  photo_deleted: "活动照片已删除。",
  cover: "活动封面已更新。",
  sponsor: "赞助者信息已保存。",
  sponsor_deleted: "赞助者已删除。",
  sponsor_image: "赞助者图片已保存。",
  sponsor_image_deleted: "赞助者图片已删除。",
  wechat_qr: "微信群二维码已保存。",
  wechat_qr_deleted: "微信群二维码已删除。",
};

const adminErrorMessageMap: Record<string, string> = {
  missing_required_fields: "提交时缺少必要字段，请检查活动标题和 slug。",
  missing_photo_fields: "请至少填写活动照片路径，再提交。",
  missing_sponsor_image_fields: "请至少填写赞助者图片路径，再提交。",
  invalid_qr_expiration: "二维码过期时间必须晚于开始展示时间。",
  invalid_public_slug: "成员主页链接无效，请使用 3-32 位小写英文、数字或短横线。",
  public_slug_taken: "成员主页链接已被占用，请换一个。",
  database_write_failed: "保存失败，请稍后再试。",
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

const adminLeadStatusLabelMap: Record<string, string> = {
  new: "新线索",
  contacted: "已联系",
  qualified: "已判断可跟进",
  won: "已成交",
  lost: "已关闭",
};

const adminLeadMatchStatusLabelMap: Record<string, string> = {
  suggested: "候选建议",
  contacted: "已联系成员",
  introduced: "已引荐对接",
  active: "进入推进",
  not_fit: "暂不匹配",
};

const adminJoinRequestStatusLabelMap: Record<string, string> = {
  new: "新申请",
  contacted: "已联系",
  approved: "已通过",
  archived: "已归档",
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

export function formatAdminJoinRequestStatus(status: string) {
  return adminJoinRequestStatusLabelMap[status] ?? status;
}

export function formatAdminLeadStatus(status: string) {
  return adminLeadStatusLabelMap[status] ?? status;
}

export function formatAdminLeadMatchStatus(status: string) {
  return adminLeadMatchStatusLabelMap[status] ?? status;
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

export function getAdminJoinRequestStatusTone(status: string) {
  switch (status) {
    case "new":
      return "waitlist";
    case "contacted":
      return "registered";
    case "approved":
      return "scheduled";
    case "archived":
      return "completed";
    default:
      return "neutral";
  }
}

export function getAdminLeadStatusTone(status: string) {
  switch (status) {
    case "new":
      return "waitlist";
    case "contacted":
      return "registered";
    case "qualified":
      return "scheduled";
    case "won":
      return "completed";
    case "lost":
      return "cancelled";
    default:
      return "neutral";
  }
}

export function getAdminLeadMatchStatusTone(status: string) {
  switch (status) {
    case "suggested":
      return "waitlist";
    case "contacted":
      return "registered";
    case "introduced":
      return "scheduled";
    case "active":
      return "completed";
    case "not_fit":
      return "cancelled";
    default:
      return "neutral";
  }
}
