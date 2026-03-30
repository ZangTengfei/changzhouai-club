import type { Metadata } from "next";
import Link from "next/link";

import {
  updateAdminJoinRequest,
  updateAdminJoinRequestPipeline,
} from "@/app/admin/actions";
import {
  formatAdminJoinRequestStatus,
  getAdminErrorMessage,
  getAdminJoinRequestStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminJoinRequestOrThrow } from "@/lib/admin/members";

export const metadata: Metadata = {
  title: "加入申请详情",
  description: "查看加入申请资料并记录跟进状态。",
};

type SearchParams = {
  from?: string;
  saved?: string;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function getBackHref(from?: string) {
  if (from?.startsWith("/admin/members")) {
    return from;
  }

  return "/admin/members";
}

function buildCurrentPath(requestId: string, from?: string) {
  const params = new URLSearchParams();

  if (from?.startsWith("/admin/members")) {
    params.set("from", from);
  }

  const query = params.toString();
  return query
    ? `/admin/members/requests/${requestId}?${query}`
    : `/admin/members/requests/${requestId}`;
}

function getPipelineItems(joinRequest: {
  invitedToRegisterAt: string | null;
  joinedGroupAt: string | null;
  firstAttendedEventAt: string | null;
  convertedToMemberAt: string | null;
}) {
  return [
    ["已邀请注册", joinRequest.invitedToRegisterAt],
    ["已加入社群", joinRequest.joinedGroupAt],
    ["已参加首次活动", joinRequest.firstAttendedEventAt],
    ["已转正式成员", joinRequest.convertedToMemberAt],
  ] as const;
}

export default async function AdminJoinRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const { joinRequest, memberOptions, queryErrors } = await loadAdminJoinRequestOrThrow(
    routeParams.requestId,
  );
  const backHref = getBackHref(query.from);
  const currentPath = buildCurrentPath(routeParams.requestId, query.from);
  const pipelineItems = getPipelineItems(joinRequest);

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Join Request Detail</p>
            <h2>{joinRequest.displayName}</h2>
            <p>这里集中查看申请资料、跟进节点和管理员备注，方便你持续把申请转成真实社区关系。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{formatAdminJoinRequestStatus(joinRequest.status)}</strong>
              <span>当前状态</span>
            </div>

            <Link href={backHref} className="button button-secondary">
              返回申请列表
            </Link>
          </div>
        </div>

        <div className="pill-row">
          <span
            className={`pill admin-status-pill admin-status-pill-${getAdminJoinRequestStatusTone(
              joinRequest.status,
            )}`}
          >
            {formatAdminJoinRequestStatus(joinRequest.status)}
          </span>
          <span className="pill">{joinRequest.city}</span>
          <span className="pill">{joinRequest.monthlyTime ?? "未填写可投入时间"}</span>
        </div>
      </section>

      {query.saved ? (
        <div className="note-strip">{getAdminSavedMessage(query.saved)}</div>
      ) : null}

      {query.error ? (
        <div className="note-strip">{getAdminErrorMessage(query.error)}</div>
      ) : null}

      {queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{queryErrors.join(" | ")}</div>
      ) : null}

      <section className="surface admin-card admin-member-card">
        <div className="admin-join-request-header">
          <div>
            <h3>{joinRequest.displayName}</h3>
            <p>
              {joinRequest.roleLabel ?? "未填写角色"}
              {joinRequest.organization ? ` · ${joinRequest.organization}` : ""}
            </p>
          </div>

          <span
            className={`pill admin-status-pill admin-status-pill-${getAdminJoinRequestStatusTone(
              joinRequest.status,
            )}`}
          >
            {formatAdminJoinRequestStatus(joinRequest.status)}
          </span>
        </div>

        <div className="admin-member-card-meta">
          <div className="admin-note-panel">
            <span className="admin-card-label">联系信息</span>
            <p className="admin-member-bio">微信号：{joinRequest.wechat}</p>
            <p className="admin-member-bio">所在城市：{joinRequest.city}</p>
            <p className="admin-member-bio">
              可投入时间：{joinRequest.monthlyTime ?? "未填写"}
            </p>
          </div>

          <div className="admin-note-panel">
            <span className="admin-card-label">跟进节点</span>
            <p className="admin-member-bio">提交时间：{formatDate(joinRequest.createdAt)}</p>
            <p className="admin-member-bio">最近联系：{formatDate(joinRequest.contactedAt)}</p>
            <p className="admin-member-bio">通过时间：{formatDate(joinRequest.approvedAt)}</p>
            <p className="admin-member-bio">
              正式成员：
              {joinRequest.convertedMemberDisplayName ?? "暂未关联"}
            </p>
          </div>
        </div>

        <section className="admin-note-panel">
          <span className="admin-card-label">转化进度</span>
          <div className="admin-progress-grid">
            {pipelineItems.map(([label, value]) => (
              <article
                key={label}
                className={
                  value ? "admin-progress-item admin-progress-item-complete" : "admin-progress-item"
                }
              >
                <strong>{label}</strong>
                <p>{value ? formatDate(value) : "尚未记录"}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="pill-row">
          <span className="pill member-signal-pill">
            {joinRequest.willingToAttend ? "愿意线下参加" : "暂不线下参加"}
          </span>
          <span className="pill member-signal-pill">
            {joinRequest.willingToShare ? "愿意分享" : "暂不分享"}
          </span>
          <span className="pill member-signal-pill member-signal-pill-warm">
            {joinRequest.willingToJoinProjects ? "愿意共建" : "暂不共建"}
          </span>
        </div>

        {joinRequest.skills.length > 0 ? (
          <div className="member-skill-list">
            {joinRequest.skills.map((skill) => (
              <span key={`${joinRequest.id}-skill-${skill}`}>{skill}</span>
            ))}
          </div>
        ) : null}

        {joinRequest.interests.length > 0 ? (
          <div className="member-skill-list">
            {joinRequest.interests.map((interest) => (
              <span key={`${joinRequest.id}-interest-${interest}`}>{interest}</span>
            ))}
          </div>
        ) : null}

        <div className="admin-join-request-notes">
          <div className="admin-note-panel">
            <span className="admin-card-label">申请者补充</span>
            <p className="admin-member-bio">
              {joinRequest.note ?? "这位申请者暂未补充额外说明。"}
            </p>
          </div>

          <div className="admin-note-panel">
            <span className="admin-card-label">当前跟进备注</span>
            <p className="admin-member-bio">
              {joinRequest.adminNote ?? "暂时还没有记录跟进备注。"}
            </p>
          </div>
        </div>

        <form action={updateAdminJoinRequest} className="admin-inline-form">
          <input type="hidden" name="request_id" value={joinRequest.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="form-grid admin-join-request-settings-grid">
            <label className="form-field">
              <span>申请状态</span>
              <select className="input" name="status" defaultValue={joinRequest.status}>
                <option value="new">新申请</option>
                <option value="contacted">已联系</option>
                <option value="approved">已通过</option>
                <option value="archived">已归档</option>
              </select>
            </label>

            <label className="form-field admin-join-request-note-field">
              <span>跟进备注</span>
              <textarea
                className="input textarea"
                name="admin_note"
                rows={4}
                defaultValue={joinRequest.adminNote ?? ""}
                placeholder="例如：已加微信、适合哪类活动、是否适合项目协作"
              />
            </label>
          </div>

          <div className="cta-row">
            <button type="submit" className="button button-secondary">
              保存申请状态
            </button>
          </div>
        </form>

        <form action={updateAdminJoinRequestPipeline} className="admin-inline-form">
          <input type="hidden" name="request_id" value={joinRequest.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="section-heading">
            <p className="eyebrow">Pipeline</p>
            <h2>转化节点</h2>
            <p>记录申请者从初次接触到成为正式成员的关键节点，方便持续跟进。</p>
          </div>

          <div className="checkbox-list">
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="mark_invited_to_register"
                defaultChecked={Boolean(joinRequest.invitedToRegisterAt)}
              />
              <span>已邀请对方注册网站</span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="mark_joined_group"
                defaultChecked={Boolean(joinRequest.joinedGroupAt)}
              />
              <span>已加入微信社群或核心运营群</span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="mark_first_attended_event"
                defaultChecked={Boolean(joinRequest.firstAttendedEventAt)}
              />
              <span>已参加第一场线下活动</span>
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="mark_converted_to_member"
                defaultChecked={Boolean(joinRequest.convertedToMemberAt)}
              />
              <span>已转为正式成员</span>
            </label>
          </div>

          <div className="form-grid admin-join-request-settings-grid">
            <label className="form-field">
              <span>关联正式成员</span>
              <select
                className="input"
                name="converted_member_id"
                defaultValue={joinRequest.convertedMemberId ?? ""}
              >
                <option value="">暂不关联</option>
                {memberOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                    {member.email ? ` · ${member.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="cta-row">
            <button type="submit" className="button">
              保存转化节点
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
