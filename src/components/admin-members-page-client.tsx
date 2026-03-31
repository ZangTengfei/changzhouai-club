"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminMembersData } from "@/lib/admin/members";
import {
  formatAdminJoinRequestStatus,
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminJoinRequestStatusTone,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesKeyword(fields: Array<string | null | undefined | string[]>, keyword: string) {
  if (!keyword) {
    return true;
  }

  return fields.some((field) => {
    if (Array.isArray(field)) {
      return field.some((item) => normalizeSearchText(item).includes(keyword));
    }

    return normalizeSearchText(field ?? "").includes(keyword);
  });
}

function buildMembersFilterHref(
  status: string,
  visibility: string,
  intent: string,
  requestStatus: string,
  memberQuery: string,
  requestQuery: string,
) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (visibility !== "all") {
    params.set("visibility", visibility);
  }

  if (intent !== "all") {
    params.set("intent", intent);
  }

  if (requestStatus !== "all") {
    params.set("request_status", requestStatus);
  }

  if (memberQuery.trim()) {
    params.set("member_query", memberQuery.trim());
  }

  if (requestQuery.trim()) {
    params.set("request_query", requestQuery.trim());
  }

  const query = params.toString();
  return query ? `/admin/members?${query}` : "/admin/members";
}

function buildDetailHref(basePath: string, currentPath: string) {
  const params = new URLSearchParams();
  params.set("from", currentPath);
  return `${basePath}?${params.toString()}`;
}

export function AdminMembersPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading } = useAdminResource<AdminMembersData>("/api/admin/members");

  const statusFilter = searchParams.get("status") ?? "all";
  const visibilityFilter = searchParams.get("visibility") ?? "all";
  const intentFilter = searchParams.get("intent") ?? "all";
  const requestStatusFilter = searchParams.get("request_status") ?? "all";
  const memberQueryInput = (searchParams.get("member_query") ?? "").trim();
  const requestQueryInput = (searchParams.get("request_query") ?? "").trim();
  const memberKeyword = normalizeSearchText(memberQueryInput);
  const requestKeyword = normalizeSearchText(requestQueryInput);
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;

  const currentMembersPath = buildMembersFilterHref(
    statusFilter,
    visibilityFilter,
    intentFilter,
    requestStatusFilter,
    memberQueryInput,
    requestQueryInput,
  );

  const filteredMembers =
    data?.members.filter((member) => {
      if (statusFilter !== "all" && member.status !== statusFilter) {
        return false;
      }

      if (visibilityFilter === "public" && !member.isPubliclyVisible) {
        return false;
      }

      if (visibilityFilter === "private" && member.isPubliclyVisible) {
        return false;
      }

      if (intentFilter === "share" && !member.willingToShare) {
        return false;
      }

      if (intentFilter === "build" && !member.willingToJoinProjects) {
        return false;
      }

      return matchesKeyword(
        [member.displayName, member.email, member.city, member.bio, member.skills],
        memberKeyword,
      );
    }) ?? [];

  const filteredJoinRequests =
    data?.joinRequests.filter((request) => {
      if (requestStatusFilter !== "all" && request.status !== requestStatusFilter) {
        return false;
      }

      return matchesKeyword(
        [
          request.displayName,
          request.wechat,
          request.city,
          request.roleLabel,
          request.organization,
          request.monthlyTime,
          request.note,
          request.adminNote,
          request.skills,
          request.interests,
        ],
        requestKeyword,
      );
    }) ?? [];

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Members</p>
            <h2>成员列表</h2>
            <p>查看成员档案、参与意愿与公开状态，并进入详情页维护资料与运营设置。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{data?.stats.totalMembers ?? "..."}</strong>
              <span>成员总数</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{data?.stats.willingToShare ?? "..."}</strong>
              <span>愿意分享</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{data?.stats.willingToJoinProjects ?? "..."}</strong>
              <span>愿意共建</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{data?.stats.joinRequests ?? "..."}</strong>
              <span>加入申请</span>
            </div>
          </div>
        </div>
      </section>

      {saved ? <div className="note-strip">{getAdminSavedMessage(saved)}</div> : null}
      {queryError ? <div className="note-strip">{getAdminErrorMessage(queryError)}</div> : null}
      {error ? <div className="note-strip">后台数据读取出现问题：{error}</div> : null}
      {data && data.queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{data.queryErrors.join(" | ")}</div>
      ) : null}

      <section className="surface admin-card">
        <div className="section-heading">
          <p className="eyebrow">Filters</p>
          <h2>成员筛选</h2>
          <p>按成员状态、公开展示和参与意愿筛选，快速定位需要跟进的人群。</p>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">状态</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["pending", "待完善"],
              ["active", "活跃成员"],
              ["organizer", "组织者"],
              ["admin", "管理员"],
              ["paused", "暂停中"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildMembersFilterHref(
                  value,
                  visibilityFilter,
                  intentFilter,
                  requestStatusFilter,
                  memberQueryInput,
                  requestQueryInput,
                )}
                className={
                  statusFilter === value
                    ? "admin-filter-chip admin-filter-chip-active"
                    : "admin-filter-chip"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">公开展示</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["public", "公开展示中"],
              ["private", "未公开"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildMembersFilterHref(
                  statusFilter,
                  value,
                  intentFilter,
                  requestStatusFilter,
                  memberQueryInput,
                  requestQueryInput,
                )}
                className={
                  visibilityFilter === value
                    ? "admin-filter-chip admin-filter-chip-active"
                    : "admin-filter-chip"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">参与意愿</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["share", "愿意分享"],
              ["build", "愿意共建"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildMembersFilterHref(
                  statusFilter,
                  visibilityFilter,
                  value,
                  requestStatusFilter,
                  memberQueryInput,
                  requestQueryInput,
                )}
                className={
                  intentFilter === value
                    ? "admin-filter-chip admin-filter-chip-active"
                    : "admin-filter-chip"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <form action="/admin/members" className="admin-search-form">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="visibility" value={visibilityFilter} />
          <input type="hidden" name="intent" value={intentFilter} />
          <input type="hidden" name="request_status" value={requestStatusFilter} />
          <input type="hidden" name="request_query" value={requestQueryInput} />

          <label className="form-field admin-search-field">
            <span>成员搜索</span>
            <input
              className="input"
              type="search"
              name="member_query"
              defaultValue={memberQueryInput}
              placeholder="搜索姓名、邮箱、城市、技能"
            />
          </label>

          <div className="admin-search-actions">
            <button type="submit" className="button button-secondary">
              搜索成员
            </button>
            {memberQueryInput ? (
              <Link
                href={buildMembersFilterHref(
                  statusFilter,
                  visibilityFilter,
                  intentFilter,
                  requestStatusFilter,
                  "",
                  requestQueryInput,
                )}
                className="button button-secondary"
              >
                清空搜索
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="surface admin-card">
        <div className="section-heading">
          <p className="eyebrow">Members</p>
          <h2>成员结果</h2>
          <p>当前筛选后共有 {filteredMembers.length} 位成员。点击任意一行可进入详情页。</p>
        </div>

        {isLoading ? (
          <div className="note-strip">正在加载成员列表...</div>
        ) : filteredMembers.length > 0 ? (
          <div className="admin-list">
            <div className="admin-list-header admin-member-list-grid">
              <span>成员</span>
              <span>城市与加入时间</span>
              <span>状态</span>
              <span>参与概况</span>
              <span>意愿与技能</span>
            </div>

            {filteredMembers.map((member) => (
              <Link
                key={member.id}
                href={buildDetailHref(`/admin/members/${member.id}`, currentMembersPath)}
                className="admin-list-row admin-member-list-grid admin-list-link"
              >
                <div className="admin-list-primary">
                  <h3 className="admin-list-title">{member.displayName}</h3>
                  <p className="admin-compact-note">{member.email ?? "未提供邮箱"}</p>
                </div>

                <div className="admin-list-cell">
                  <span>{member.city}</span>
                  <span>加入于 {formatDate(member.joinedAt)}</span>
                </div>

                <div className="admin-list-cell">
                  <span
                    className={`pill admin-status-pill admin-status-pill-${getAdminMemberStatusTone(
                      member.status,
                    )}`}
                  >
                    {formatAdminMemberStatus(member.status)}
                  </span>
                  <span>{member.isPubliclyVisible ? "公开展示中" : "未公开展示"}</span>
                </div>

                <div className="admin-list-cell">
                  <span>活动报名 {member.registrationCount} 次</span>
                  <span>最近活跃 {formatDate(member.lastActiveAt)}</span>
                </div>

                <div className="admin-list-cell">
                  <span>
                    {member.willingToShare ? "愿意分享" : "暂不分享"} /{" "}
                    {member.willingToJoinProjects ? "愿意共建" : "暂不共建"}
                  </span>
                  <span>{member.skills.slice(0, 3).join(" · ") || "未填写技能标签"}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="note-strip">当前筛选条件下没有成员数据。</div>
        )}
      </section>

      <section className="surface admin-card">
        <div className="section-heading">
          <p className="eyebrow">Join Requests</p>
          <h2>加入申请列表</h2>
          <p>查看待处理申请、联系进度与转化情况，便于持续跟进潜在成员。</p>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">申请状态</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["new", "新申请"],
              ["contacted", "已联系"],
              ["approved", "已通过"],
              ["archived", "已归档"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildMembersFilterHref(
                  statusFilter,
                  visibilityFilter,
                  intentFilter,
                  value,
                  memberQueryInput,
                  requestQueryInput,
                )}
                className={
                  requestStatusFilter === value
                    ? "admin-filter-chip admin-filter-chip-active"
                    : "admin-filter-chip"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <form action="/admin/members" className="admin-search-form">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="visibility" value={visibilityFilter} />
          <input type="hidden" name="intent" value={intentFilter} />
          <input type="hidden" name="request_status" value={requestStatusFilter} />
          <input type="hidden" name="member_query" value={memberQueryInput} />

          <label className="form-field admin-search-field">
            <span>申请搜索</span>
            <input
              className="input"
              type="search"
              name="request_query"
              defaultValue={requestQueryInput}
              placeholder="搜索姓名、微信号、机构、备注"
            />
          </label>

          <div className="admin-search-actions">
            <button type="submit" className="button button-secondary">
              搜索申请
            </button>
            {requestQueryInput ? (
              <Link
                href={buildMembersFilterHref(
                  statusFilter,
                  visibilityFilter,
                  intentFilter,
                  requestStatusFilter,
                  memberQueryInput,
                  "",
                )}
                className="button button-secondary"
              >
                清空搜索
              </Link>
            ) : null}
          </div>
        </form>

        {isLoading ? (
          <div className="note-strip">正在加载加入申请...</div>
        ) : filteredJoinRequests.length > 0 ? (
          <div className="admin-list">
            <div className="admin-list-header admin-join-request-list-grid">
              <span>申请者</span>
              <span>联系与身份</span>
              <span>状态</span>
              <span>时间节点</span>
              <span>意向与备注</span>
            </div>

            {filteredJoinRequests.map((request) => (
              <Link
                key={request.id}
                href={buildDetailHref(
                  `/admin/members/requests/${request.id}`,
                  currentMembersPath,
                )}
                className="admin-list-row admin-join-request-list-grid admin-list-link"
              >
                <div className="admin-list-primary">
                  <h3 className="admin-list-title">{request.displayName}</h3>
                  <p className="admin-compact-note">微信：{request.wechat}</p>
                </div>

                <div className="admin-list-cell">
                  <span>{request.city}</span>
                  <span>{request.roleLabel ?? "未填写角色"}</span>
                  <span>{request.organization ?? "未填写组织"}</span>
                </div>

                <div className="admin-list-cell">
                  <span
                    className={`pill admin-status-pill admin-status-pill-${getAdminJoinRequestStatusTone(
                      request.status,
                    )}`}
                  >
                    {formatAdminJoinRequestStatus(request.status)}
                  </span>
                  <span>
                    {request.convertedMemberDisplayName
                      ? `已转成员：${request.convertedMemberDisplayName}`
                      : "尚未转为成员"}
                  </span>
                </div>

                <div className="admin-list-cell">
                  <span>申请于 {formatDate(request.createdAt)}</span>
                  <span>已联系 {formatDate(request.contactedAt)}</span>
                  <span>已通过 {formatDate(request.approvedAt)}</span>
                </div>

                <div className="admin-list-cell">
                  <span>
                    {request.willingToShare ? "愿意分享" : "暂不分享"} /{" "}
                    {request.willingToJoinProjects ? "愿意共建" : "暂不共建"}
                  </span>
                  <span>{request.skills.slice(0, 3).join(" · ") || "未填写技能标签"}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="note-strip">当前筛选条件下没有加入申请。</div>
        )}
      </section>
    </div>
  );
}
