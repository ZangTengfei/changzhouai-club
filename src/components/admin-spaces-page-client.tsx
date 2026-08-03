"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/admin-antd/button";
import { Textarea } from "@/components/admin-antd/textarea";
import {
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
  type AdminTone,
} from "@/components/admin-ui";
import { useAdminResource } from "@/components/use-admin-resource";
import type {
  AdminFixedDeskRequest,
  AdminSpacesData,
} from "@/lib/admin/spaces";

const statusMeta: Record<
  AdminFixedDeskRequest["status"],
  { label: string; tone: AdminTone }
> = {
  submitted: { label: "待审核", tone: "pending" },
  approved: { label: "已批准", tone: "active" },
  rejected: { label: "已驳回", tone: "cancelled" },
  withdrawn: { label: "已撤回", tone: "neutral" },
  released: { label: "已释放", tone: "neutral" },
};

function formatDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "暂无";
}

async function readResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  if (!response.ok) throw new Error(payload?.error ?? "request_failed");
}

export function AdminSpacesPageClient() {
  const { data, error, isLoading, reload } =
    useAdminResource<AdminSpacesData>("/api/admin/spaces");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingKey, setProcessingKey] = useState("");

  const pendingRequests =
    data?.requests.filter((request) => request.status === "submitted") ?? [];
  const historyRequests =
    data?.requests.filter((request) => request.status !== "submitted") ?? [];

  async function reviewRequest(
    request: AdminFixedDeskRequest,
    decision: "approve" | "reject",
  ) {
    const reviewNote = (reviewNotes[request.id] ?? "").trim();
    if (decision === "reject" && !reviewNote) {
      toast.error("驳回时请填写原因，方便申请人后续调整。");
      return;
    }

    setProcessingKey(`${decision}:${request.id}`);
    try {
      const response = await fetch(
        `/api/admin/spaces/fixed-desk-requests/${request.id}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, reviewNote }),
        },
      );
      await readResult(response);
      toast.success(decision === "approve" ? "已批准并固定工位" : "已驳回申请");
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === "fixed_desk_has_active_bookings"
          ? "该工位还有进行中或未来预约，请先处理预约后再批准。"
          : "处理失败，工位可能已被其他申请占用，请刷新后重试。",
      );
    } finally {
      setProcessingKey("");
    }
  }

  async function releaseAssignment(resourceId: string, resourceCode: string) {
    if (!window.confirm(`确认释放 ${resourceCode}？释放后申请人将不再占用该工位。`)) {
      return;
    }
    setProcessingKey(`release:${resourceId}`);
    try {
      const response = await fetch(
        `/api/admin/spaces/fixed-desk-assignments/${resourceId}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      await readResult(response);
      toast.success(`${resourceCode} 已释放`);
      reload();
    } catch {
      toast.error("释放失败，请刷新后重试。");
    } finally {
      setProcessingKey("");
    }
  }

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader eyebrow="SPACE OPERATIONS" title="空间工位" />
        <AdminPanelBody className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetric label="工位总数" value={data?.metrics.deskCount ?? "—"} />
            <AdminMetric label="已固定" value={data?.metrics.assignedCount ?? "—"} />
            <AdminMetric label="可预约 / 可申请" value={data?.metrics.availableCount ?? "—"} />
            <AdminMetric label="待审核" value={data?.metrics.submittedCount ?? "—"} />
          </div>
          <AdminNotice>
            未固定工位同时支持流动预约和固定申请。批准后会长期绑定申请人并停止接受预约；如仍有进行中或未来预约，系统会阻止批准，需先处理预约。
          </AdminNotice>
          {error ? <AdminNotice>加载失败：{error}</AdminNotice> : null}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="FIXED DESK REQUESTS"
          title={`待审核申请（${pendingRequests.length}）`}
        />
        <AdminPanelBody className="grid gap-4">
          {isLoading && !data ? <p className="text-sm text-muted-foreground">正在加载申请…</p> : null}
          {!isLoading && pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">当前没有待审核申请。</p>
          ) : null}
          {pendingRequests.map((request) => (
            <article
              key={request.id}
              className="grid gap-4 rounded-admin border border-admin-border bg-[#fafafa] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {request.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={request.avatarUrl}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
                      {request.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/members/${request.userId}`}
                      className="font-semibold text-admin-foreground hover:underline"
                    >
                      {request.displayName}
                    </Link>
                    <p className="m-0 text-sm text-muted-foreground">
                      {request.roleSummary || "社区成员"} · {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AdminStatusBadge tone="pending">待审核</AdminStatusBadge>
                  <AdminStatusBadge tone="neutral">{request.resourceCode}</AdminStatusBadge>
                </div>
              </div>
              <div className="rounded-admin border border-admin-divider bg-white p-3 text-sm text-[#4b5563]">
                {request.note || "申请人未补充常驻计划。"}
              </div>
              <Textarea
                value={reviewNotes[request.id] ?? ""}
                onChange={(event) =>
                  setReviewNotes((current) => ({
                    ...current,
                    [request.id]: event.target.value,
                  }))
                }
                maxLength={500}
                placeholder="审核备注；驳回时必填，批准时可选"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="destructive"
                  loading={processingKey === `reject:${request.id}`}
                  disabled={Boolean(processingKey)}
                  onClick={() => void reviewRequest(request, "reject")}
                >
                  驳回
                </Button>
                <Button
                  loading={processingKey === `approve:${request.id}`}
                  disabled={Boolean(processingKey)}
                  onClick={() => void reviewRequest(request, "approve")}
                >
                  批准并固定
                </Button>
              </div>
            </article>
          ))}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="ACTIVE ASSIGNMENTS"
          title={`当前固定工位（${data?.assignments.length ?? 0}）`}
        />
        <AdminPanelBody className="grid gap-3">
          {data?.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚无固定工位归属。</p>
          ) : null}
          {data?.assignments.map((assignment) => (
            <div
              key={assignment.resourceId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4"
            >
              <div>
                <p className="m-0 font-semibold text-admin-foreground">
                  {assignment.resourceCode} · {assignment.displayName}
                </p>
                <p className="m-0 mt-1 text-sm text-muted-foreground">
                  自 {formatDateTime(assignment.assignedAt)} 起固定使用
                </p>
              </div>
              <Button
                variant="outline"
                loading={processingKey === `release:${assignment.resourceId}`}
                disabled={Boolean(processingKey)}
                onClick={() =>
                  void releaseAssignment(
                    assignment.resourceId,
                    assignment.resourceCode,
                  )
                }
              >
                管理员释放
              </Button>
            </div>
          ))}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="HISTORY" title="申请记录" />
        <AdminPanelBody className="grid gap-3">
          {historyRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无历史记录。</p>
          ) : null}
          {historyRequests.map((request) => {
            const meta = statusMeta[request.status];
            return (
              <div
                key={request.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4"
              >
                <div>
                  <p className="m-0 font-semibold text-admin-foreground">
                    {request.resourceCode} · {request.displayName}
                  </p>
                  <p className="m-0 mt-1 text-sm text-muted-foreground">
                    {request.reviewNote || request.note || "无补充说明"}
                  </p>
                </div>
                <AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge>
              </div>
            );
          })}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
