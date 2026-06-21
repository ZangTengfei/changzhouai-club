import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "antd";
import TextArea from "antd/es/input/TextArea";

import {
  updateAdminJoinRequest,
  updateAdminJoinRequestPipeline,
} from "@/app/admin/actions";
import {
  AdminAntdAlert,
  AdminAntdCard,
  AdminAntdPageHeader,
  AdminCheckboxRow,
  AdminField,
  AdminRecordCard,
  AdminStatusBadge,
  type AdminTone,
} from "@/components/admin-antd";
import { AdminToastSignals } from "@/components/admin-antd";
import { NativeSelect } from "@/components/admin-antd";
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
    <div className="grid gap-4">
      <AdminToastSignals
        success={getAdminSavedMessage(query.saved)}
        error={query.error ? getAdminErrorMessage(query.error) : null}
      />

      <AdminAntdPageHeader
        eyebrow="Join Request Detail"
        title={joinRequest.displayName}
        stats={[
          { label: "当前状态", value: formatAdminJoinRequestStatus(joinRequest.status) },
          { label: "城市", value: joinRequest.city },
          { label: "可投入", value: joinRequest.monthlyTime ?? "未填写" },
        ]}
        actions={
          <Link href={backHref}>
            <Button>返回申请列表</Button>
          </Link>
        }
      />

      {queryErrors.length > 0 ? (
        <AdminAntdAlert message={`后台数据读取出现问题：${queryErrors.join(" | ")}`} />
      ) : null}

      <AdminAntdCard eyebrow="Profile" title="申请者概览">
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1">
              <h3 className="text-base font-semibold text-foreground">
                {joinRequest.displayName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {joinRequest.roleLabel ?? "未填写角色"}
                {joinRequest.organization ? ` · ${joinRequest.organization}` : ""}
              </p>
            </div>

            <AdminStatusBadge tone={getAdminJoinRequestStatusTone(joinRequest.status) as AdminTone}>
              {formatAdminJoinRequestStatus(joinRequest.status)}
            </AdminStatusBadge>
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge tone="neutral">{joinRequest.city}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {joinRequest.monthlyTime ?? "未填写可投入时间"}
            </AdminStatusBadge>
            <AdminStatusBadge tone={joinRequest.willingToAttend ? "active" : "neutral"}>
              {joinRequest.willingToAttend ? "愿意线下参加" : "暂不线下参加"}
            </AdminStatusBadge>
            <AdminStatusBadge tone={joinRequest.willingToShare ? "active" : "neutral"}>
              {joinRequest.willingToShare ? "愿意分享" : "暂不分享"}
            </AdminStatusBadge>
            <AdminStatusBadge tone={joinRequest.willingToJoinProjects ? "active" : "neutral"}>
              {joinRequest.willingToJoinProjects ? "愿意共建" : "暂不共建"}
            </AdminStatusBadge>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <AdminRecordCard>
              <div className="bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                联系信息
              </p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>微信号：{joinRequest.wechat}</p>
                <p>所在城市：{joinRequest.city}</p>
                <p>可投入时间：{joinRequest.monthlyTime ?? "未填写"}</p>
              </div>
              </div>
            </AdminRecordCard>

            <AdminRecordCard>
              <div className="bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                跟进节点
              </p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>提交时间：{formatDate(joinRequest.createdAt)}</p>
                <p>最近联系：{formatDate(joinRequest.contactedAt)}</p>
                <p>通过时间：{formatDate(joinRequest.approvedAt)}</p>
                <p>正式成员：{joinRequest.convertedMemberDisplayName ?? "暂未关联"}</p>
              </div>
              </div>
            </AdminRecordCard>
          </div>

          <AdminRecordCard>
            <div className="p-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              转化进度
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {pipelineItems.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/20 p-3"
                >
                  <strong className="text-sm text-foreground">{label}</strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {value ? formatDate(value) : "尚未记录"}
                  </p>
                </div>
              ))}
            </div>
            </div>
          </AdminRecordCard>

          {joinRequest.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {joinRequest.skills.map((skill) => (
                <AdminStatusBadge key={`${joinRequest.id}-skill-${skill}`} tone="neutral">
                  {skill}
                </AdminStatusBadge>
              ))}
            </div>
          ) : null}

          {joinRequest.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {joinRequest.interests.map((interest) => (
                <AdminStatusBadge key={`${joinRequest.id}-interest-${interest}`} tone="neutral">
                  {interest}
                </AdminStatusBadge>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <AdminRecordCard>
              <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                申请者补充
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {joinRequest.note ?? "这位申请者暂未补充额外说明。"}
              </p>
              </div>
            </AdminRecordCard>

            <AdminRecordCard>
              <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                当前跟进备注
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {joinRequest.adminNote ?? "暂时还没有记录跟进备注。"}
              </p>
              </div>
            </AdminRecordCard>
          </div>
        </div>
      </AdminAntdCard>

      <AdminAntdCard eyebrow="Review" title="申请状态与备注">
        <form action={updateAdminJoinRequest} className="grid gap-4">
          <input type="hidden" name="request_id" value={joinRequest.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <AdminField label="申请状态">
              <NativeSelect name="status" defaultValue={joinRequest.status}>
                <option value="new">新申请</option>
                <option value="contacted">已联系</option>
                <option value="approved">已通过</option>
                <option value="archived">已归档</option>
              </NativeSelect>
            </AdminField>

            <AdminField label="跟进备注">
              <TextArea
                name="admin_note"
                rows={4}
                defaultValue={joinRequest.adminNote ?? ""}
                placeholder="例如：已加微信、适合哪类活动、是否适合项目协作"
              />
            </AdminField>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button htmlType="submit">保存申请状态</Button>
          </div>
        </form>
      </AdminAntdCard>

      <AdminAntdCard eyebrow="Pipeline" title="转化节点">
        <form action={updateAdminJoinRequestPipeline} className="grid gap-4">
          <input type="hidden" name="request_id" value={joinRequest.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="grid gap-3 md:grid-cols-2">
            <AdminCheckboxRow
              name="mark_invited_to_register"
              defaultChecked={Boolean(joinRequest.invitedToRegisterAt)}
            >
              <span>已邀请对方注册网站</span>
            </AdminCheckboxRow>

            <AdminCheckboxRow
              name="mark_joined_group"
              defaultChecked={Boolean(joinRequest.joinedGroupAt)}
            >
              <span>已加入微信社群或核心运营群</span>
            </AdminCheckboxRow>

            <AdminCheckboxRow
              name="mark_first_attended_event"
              defaultChecked={Boolean(joinRequest.firstAttendedEventAt)}
            >
              <span>已参加第一场线下活动</span>
            </AdminCheckboxRow>

            <AdminCheckboxRow
              name="mark_converted_to_member"
              defaultChecked={Boolean(joinRequest.convertedToMemberAt)}
            >
              <span>已转为正式成员</span>
            </AdminCheckboxRow>
          </div>

          <AdminField label="关联正式成员">
            <NativeSelect
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
            </NativeSelect>
          </AdminField>

          <div className="flex flex-wrap gap-2">
            <Button htmlType="submit" type="primary">
              保存转化节点
            </Button>
          </div>
        </form>
      </AdminAntdCard>
    </div>
  );
}
