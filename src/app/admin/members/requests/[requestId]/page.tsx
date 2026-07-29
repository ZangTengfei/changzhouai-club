import type { Metadata } from "next";
import Link from "next/link";

import {
  updateAdminJoinRequest,
  updateAdminJoinRequestPipeline,
} from "@/app/admin/actions";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { ToneBadge } from "@/components/tone-badge";
import {
  formatAdminJoinRequestStatus,
  getAdminErrorMessage,
  getAdminJoinRequestStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminJoinRequestOrThrow } from "@/lib/admin/members";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "加入申请详情",
  description: "查看加入申请资料并记录跟进状态。",
};

type SearchParams = {
  from?: string;
  saved?: string;
  error?: string;
};

const statusToneClassName = {
  waitlist: "border-amber-200 bg-amber-100 text-amber-700",
  registered: "border-teal-200 bg-teal-100 text-teal-700",
  scheduled:
    "border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(var(--accent-rgb),0.14)] text-primary-strong",
  completed:
    "border-[rgba(var(--ink-rgb),0.12)] bg-[rgba(var(--ink-rgb),0.1)] text-[var(--status-muted)]",
  neutral:
    "border-[rgba(var(--ink-rgb),0.12)] bg-[rgba(var(--ink-rgb),0.08)] text-[var(--status-muted)]",
} satisfies Record<ReturnType<typeof getAdminJoinRequestStatusTone>, string>;

const adminMemberBioClassName =
  "m-0 line-clamp-4 max-h-[calc(1.7em*4)] leading-[1.7] text-admin-muted [overflow-wrap:anywhere]";

const adminNotePanelClassName =
  "grid gap-1.5 rounded-admin border border-admin-border bg-[#f9fafb] px-3.5 py-3";

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
  const requestStatusClassName =
    statusToneClassName[getAdminJoinRequestStatusTone(joinRequest.status)];

  return (
    <div className="admin-page-stack grid gap-5">
      <AdminToastSignals
        success={getAdminSavedMessage(query.saved)}
        error={query.error ? getAdminErrorMessage(query.error) : null}
      />

      <section className="surface admin-card">
        <div className="flex items-start justify-between gap-3.5 max-[820px]:flex-col">
          <div className="section-heading">
            <p className="eyebrow">Join Request Detail</p>
            <h2>{joinRequest.displayName}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="grid min-w-26 gap-0.5 rounded-admin border border-admin-border bg-[#f9fafb] px-3 py-2.5">
              <strong className="text-base leading-[1.1]">
                {formatAdminJoinRequestStatus(joinRequest.status)}
              </strong>
              <span className="text-[0.78rem] text-admin-muted">当前状态</span>
            </div>

            <Link href={backHref} className="button button-secondary">
              返回申请列表
            </Link>
          </div>
        </div>

        <div className="pill-row">
          <span
            className={cn(
              "pill justify-self-start border border-transparent font-bold",
              requestStatusClassName,
            )}
          >
            {formatAdminJoinRequestStatus(joinRequest.status)}
          </span>
          <span className="pill">{joinRequest.city}</span>
          <span className="pill">{joinRequest.monthlyTime ?? "未填写可投入时间"}</span>
        </div>
      </section>

      {queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{queryErrors.join(" | ")}</div>
      ) : null}

      <section className="surface admin-card grid content-start gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 max-[820px]:grid-cols-1">
          <div>
            <h3 className="m-0">{joinRequest.displayName}</h3>
            <p className="m-0 text-admin-muted">
              {joinRequest.roleLabel ?? "未填写角色"}
              {joinRequest.organization ? ` · ${joinRequest.organization}` : ""}
            </p>
          </div>

          <span
            className={cn(
              "pill justify-self-start border border-transparent font-bold",
              requestStatusClassName,
            )}
          >
            {formatAdminJoinRequestStatus(joinRequest.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 max-[820px]:grid-cols-1">
          <div className={adminNotePanelClassName}>
            <span className="text-[0.74rem] font-bold tracking-[0.06em] text-admin-muted uppercase">联系信息</span>
            <p className={adminMemberBioClassName}>微信号：{joinRequest.wechat}</p>
            <p className={adminMemberBioClassName}>所在城市：{joinRequest.city}</p>
            <p className={adminMemberBioClassName}>
              可投入时间：{joinRequest.monthlyTime ?? "未填写"}
            </p>
          </div>

          <div className={adminNotePanelClassName}>
            <span className="text-[0.74rem] font-bold tracking-[0.06em] text-admin-muted uppercase">跟进节点</span>
            <p className={adminMemberBioClassName}>提交时间：{formatDate(joinRequest.createdAt)}</p>
            <p className={adminMemberBioClassName}>最近联系：{formatDate(joinRequest.contactedAt)}</p>
            <p className={adminMemberBioClassName}>通过时间：{formatDate(joinRequest.approvedAt)}</p>
            <p className={adminMemberBioClassName}>
              正式成员：
              {joinRequest.convertedMemberDisplayName ?? "暂未关联"}
            </p>
          </div>
        </div>

        <section className={adminNotePanelClassName}>
          <span className="text-[0.74rem] font-bold tracking-[0.06em] text-admin-muted uppercase">转化进度</span>
          <div className="grid grid-cols-2 gap-3 max-[820px]:grid-cols-1">
            {pipelineItems.map(([label, value]) => (
              <article
                key={label}
                className={cn(
                  "grid gap-1.5 rounded-admin border border-dashed border-[rgba(var(--ink-rgb),0.16)] bg-[#f9fafb] px-3.5 py-3 [&_p]:m-0 [&_p]:text-admin-muted [&_strong]:m-0",
                  value &&
                    "border-solid border-[rgba(var(--accent-rgb),0.18)] bg-primary-soft",
                )}
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
              <ToneBadge key={`${joinRequest.id}-skill-${skill}`} label={skill} />
            ))}
          </div>
        ) : null}

        {joinRequest.interests.length > 0 ? (
          <div className="member-skill-list">
            {joinRequest.interests.map((interest) => (
              <ToneBadge key={`${joinRequest.id}-interest-${interest}`} label={interest} />
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 max-[820px]:grid-cols-1">
          <div className={adminNotePanelClassName}>
            <span className="text-[0.74rem] font-bold tracking-[0.06em] text-admin-muted uppercase">申请者补充</span>
            <p className={adminMemberBioClassName}>
              {joinRequest.note ?? "这位申请者暂未补充额外说明。"}
            </p>
          </div>

          <div className={adminNotePanelClassName}>
            <span className="text-[0.74rem] font-bold tracking-[0.06em] text-admin-muted uppercase">当前跟进备注</span>
            <p className={adminMemberBioClassName}>
              {joinRequest.adminNote ?? "暂时还没有记录跟进备注。"}
            </p>
          </div>
        </div>

        <form action={updateAdminJoinRequest} className="mt-1 grid gap-3 border-t border-dashed border-[rgba(15,23,42,0.12)] pt-3">
          <input type="hidden" name="request_id" value={joinRequest.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="form-grid grid-cols-[minmax(180px,240px)_minmax(0,1fr)] items-start max-[820px]:grid-cols-1">
            <label className="form-field">
              <span>申请状态</span>
              <select className="input" name="status" defaultValue={joinRequest.status}>
                <option value="new">新申请</option>
                <option value="contacted">已联系</option>
                <option value="approved">已通过</option>
                <option value="archived">已归档</option>
              </select>
            </label>

            <label className="form-field min-w-0">
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

        <form action={updateAdminJoinRequestPipeline} className="mt-1 grid gap-3 border-t border-dashed border-[rgba(15,23,42,0.12)] pt-3">
          <input type="hidden" name="request_id" value={joinRequest.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="section-heading">
            <p className="eyebrow">Pipeline</p>
            <h2>转化节点</h2>
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

          <div className="form-grid grid-cols-[minmax(180px,240px)_minmax(0,1fr)] items-start max-[820px]:grid-cols-1">
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
