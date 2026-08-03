"use client";

import Link from "next/link";
import { useState } from "react";
import { Tabs } from "antd";
import { toast } from "sonner";

import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import { Textarea } from "@/components/admin-antd/textarea";
import {
  AdminField,
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
  AdminAccessRequest,
  AdminFixedDeskRequest,
  AdminSpaceBooking,
  AdminSpacePhoto,
  AdminSpacesData,
} from "@/lib/admin/spaces";

const fixedStatusMeta: Record<AdminFixedDeskRequest["status"], { label: string; tone: AdminTone }> = {
  submitted: { label: "待审核", tone: "pending" },
  approved: { label: "已批准", tone: "active" },
  rejected: { label: "已驳回", tone: "cancelled" },
  withdrawn: { label: "已撤回", tone: "neutral" },
  released: { label: "已释放", tone: "neutral" },
};

const bookingStatusMeta: Record<AdminSpaceBooking["status"], { label: string; tone: AdminTone }> = {
  confirmed: { label: "已确认", tone: "active" },
  cancelled: { label: "已取消", tone: "cancelled" },
  completed: { label: "已完成", tone: "completed" },
  no_show: { label: "未到场", tone: "neutral" },
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
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? "request_failed");
}

export function AdminSpacesPageClient() {
  const { data, error, isLoading, reload } = useAdminResource<AdminSpacesData>("/api/admin/spaces");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [accessNotes, setAccessNotes] = useState<Record<string, string>>({});
  const [accessIdentifiers, setAccessIdentifiers] = useState<Record<string, string>>({});
  const [processingKey, setProcessingKey] = useState("");

  const pendingRequests = data?.requests.filter((item) => item.status === "submitted") ?? [];
  const historyRequests = data?.requests.filter((item) => item.status !== "submitted") ?? [];
  const pendingAccess = data?.accessRequests.filter((item) => item.status === "submitted") ?? [];
  const accessHistory = data?.accessRequests.filter((item) => item.status === "processed") ?? [];
  const currentTime = Date.now();
  const upcomingBookings = data?.bookings.filter((item) => item.status === "confirmed" && Date.parse(item.endsAt) > currentTime) ?? [];
  const bookingHistory = data?.bookings.filter((item) => item.status !== "confirmed" || Date.parse(item.endsAt) <= currentTime) ?? [];

  async function reviewRequest(request: AdminFixedDeskRequest, decision: "approve" | "reject") {
    const reviewNote = (reviewNotes[request.id] ?? "").trim();
    if (decision === "reject" && !reviewNote) {
      toast.error("驳回时请填写原因，方便申请人后续调整。");
      return;
    }
    setProcessingKey(`${decision}:${request.id}`);
    try {
      const response = await fetch(`/api/admin/spaces/fixed-desk-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNote }),
      });
      await readResult(response);
      toast.success(decision === "approve" ? "已批准并固定工位" : "已驳回申请");
      reload();
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "";
      toast.error(code === "fixed_desk_has_active_bookings" ? "该工位还有未来预约，请先取消预约。" : "处理失败，请刷新后重试。");
    } finally {
      setProcessingKey("");
    }
  }

  async function releaseAssignment(resourceId: string, resourceCode: string) {
    if (!window.confirm(`确认释放 ${resourceCode}？`)) return;
    setProcessingKey(`release:${resourceId}`);
    try {
      await readResult(await fetch(`/api/admin/spaces/fixed-desk-assignments/${resourceId}`, { method: "DELETE" }));
      toast.success(`${resourceCode} 已释放`);
      reload();
    } catch {
      toast.error("释放失败，请刷新后重试。");
    } finally {
      setProcessingKey("");
    }
  }

  async function toggleResource(resourceId: string, code: string, currentStatus: "active" | "disabled" | "retired") {
    const status = currentStatus === "active" ? "disabled" : "active";
    if (status === "disabled" && !window.confirm(`确认暂停 ${code}？暂停后小程序将不可预约。`)) return;
    setProcessingKey(`resource:${resourceId}`);
    try {
      await readResult(await fetch(`/api/admin/spaces/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }));
      toast.success(status === "active" ? `${code} 已启用` : `${code} 已暂停`);
      reload();
    } catch (caught) {
      const codeValue = caught instanceof Error ? caught.message : "";
      const message = codeValue === "resource_has_fixed_assignment"
        ? "该工位已有常驻成员，需先释放。"
        : codeValue === "resource_has_active_bookings"
          ? "该资源仍有未来预约，需先取消。"
          : codeValue === "minimum_flexible_desks_required"
            ? "暂停后可用流动工位不足 6 个，系统已阻止。"
            : "状态更新失败，请刷新后重试。";
      toast.error(message);
    } finally {
      setProcessingKey("");
    }
  }

  async function cancelBooking(booking: AdminSpaceBooking) {
    if (!window.confirm(`确认取消 ${booking.resourceCode} · ${booking.displayName} 的预约？`)) return;
    setProcessingKey(`booking:${booking.id}`);
    try {
      await readResult(await fetch(`/api/admin/spaces/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      }));
      toast.success("预约已取消");
      reload();
    } catch {
      toast.error("预约已变化，无法取消，请刷新后确认。");
    } finally {
      setProcessingKey("");
    }
  }

  async function processAccess(item: AdminAccessRequest, action: "process" | "reopen") {
    setProcessingKey(`access:${item.id}`);
    try {
      await readResult(await fetch(`/api/admin/spaces/access-requests/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNote: accessNotes[item.id] ?? "",
          accessIdentifier: accessIdentifiers[item.id] ?? "",
        }),
      }));
      toast.success(action === "process" ? "门禁申请已处理" : "已恢复为待处理");
      reload();
    } catch {
      toast.error("门禁记录更新失败，请刷新后重试。");
    } finally {
      setProcessingKey("");
    }
  }

  async function uploadPhoto(form: HTMLFormElement) {
    setProcessingKey("photo:create");
    try {
      await readResult(await fetch("/api/admin/spaces/photos", { method: "POST", body: new FormData(form) }));
      form.reset();
      toast.success("实景图片已上传到服务器");
      reload();
    } catch {
      toast.error("图片上传失败，请检查图片格式后重试。");
    } finally {
      setProcessingKey("");
    }
  }

  async function updatePhoto(photo: AdminSpacePhoto, form: HTMLFormElement) {
    const formData = new FormData(form);
    setProcessingKey(`photo:${photo.id}`);
    try {
      await readResult(await fetch(`/api/admin/spaces/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          sortOrder: Number(formData.get("sortOrder")),
          isHero: formData.get("isHero") === "on",
          status: formData.get("status"),
        }),
      }));
      toast.success("图片设置已保存");
      reload();
    } catch {
      toast.error("图片设置保存失败，请重试。");
    } finally {
      setProcessingKey("");
    }
  }

  async function archivePhoto(photo: AdminSpacePhoto) {
    if (!window.confirm(`确认归档“${photo.title}”？对象存储原图不会被删除。`)) return;
    setProcessingKey(`photo:${photo.id}`);
    try {
      await readResult(await fetch(`/api/admin/spaces/photos/${photo.id}`, { method: "DELETE" }));
      toast.success("图片已归档");
      reload();
    } catch {
      toast.error("归档失败，请重试。");
    } finally {
      setProcessingKey("");
    }
  }

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader eyebrow="SPACE OPERATIONS" title="空间管理" />
        <AdminPanelBody className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <AdminMetric label="启用工位" value={data?.metrics.deskCount ?? "—"} />
            <AdminMetric label="已常驻" value={data?.metrics.assignedCount ?? "—"} />
            <AdminMetric label="可预约 / 可申请" value={data?.metrics.availableCount ?? "—"} />
            <AdminMetric label="常驻待审" value={data?.metrics.submittedCount ?? "—"} />
            <AdminMetric label="门禁待处理" value={data?.metrics.accessSubmittedCount ?? "—"} />
            <AdminMetric label="未来预约" value={data?.metrics.upcomingBookingCount ?? "—"} />
          </div>
          <AdminNotice>工位、预约、常驻、门禁和实景图片统一在本页管理。暂停工位前，系统会检查未来预约和常驻归属。</AdminNotice>
          {error ? <AdminNotice>加载失败：{error}</AdminNotice> : null}
        </AdminPanelBody>
      </AdminPanel>

      <Tabs
        defaultActiveKey="bookings"
        items={[
          {
            key: "settings",
            label: "空间配置",
            children: (
              <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader eyebrow="SPACE PHOTOS" title={`社区实景图片（${data?.photos.filter((item) => item.status === "active").length ?? 0}）`} />
        <AdminPanelBody className="grid gap-4">
          {data?.capabilities.managePhotos ? (
            <form className="grid gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4 md:grid-cols-[1fr_120px_auto]" onSubmit={(event) => { event.preventDefault(); void uploadPhoto(event.currentTarget); }}>
              <AdminField label="图片与标题">
                <div className="grid gap-2"><Input name="title" required maxLength={80} placeholder="例如：AI Club OPC 共创办公区" /><input name="file" type="file" accept="image/*" required /></div>
              </AdminField>
              <AdminField label="排序"><Input name="sortOrder" type="number" defaultValue={30} /></AdminField>
              <label className="flex items-center gap-2 self-end pb-2 text-sm"><input name="isHero" type="checkbox" value="true" /> 设为头图</label>
              <Button className="md:col-span-3" type="submit" loading={processingKey === "photo:create"}>上传到服务器并加入图库</Button>
            </form>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            {data?.photos.map((photo) => (
              <form key={photo.id} className="grid gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); void updatePhoto(photo, event.currentTarget); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.imageUrl} alt={photo.title} className="aspect-video w-full rounded-admin object-cover" />
                <div className="flex gap-2"><AdminStatusBadge tone={photo.status === "active" ? "active" : "neutral"}>{photo.status === "active" ? "展示中" : "已归档"}</AdminStatusBadge>{photo.isHero ? <AdminStatusBadge tone="scheduled">小程序头图</AdminStatusBadge> : null}</div>
                <AdminField label="标题"><Input name="title" defaultValue={photo.title} maxLength={80} /></AdminField>
                <div className="grid grid-cols-2 gap-3">
                  <AdminField label="排序"><Input name="sortOrder" type="number" defaultValue={photo.sortOrder} /></AdminField>
                  <AdminField label="状态"><select name="status" defaultValue={photo.status} className="h-8 rounded-md border border-admin-border bg-white px-2"><option value="active">展示</option><option value="archived">归档</option></select></AdminField>
                </div>
                <label className="flex items-center gap-2 text-sm"><input name="isHero" type="checkbox" defaultChecked={photo.isHero} /> 设为小程序头图</label>
                {data.capabilities.managePhotos ? <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => void archivePhoto(photo)} disabled={Boolean(processingKey)}>归档</Button><Button type="submit" loading={processingKey === `photo:${photo.id}`} disabled={Boolean(processingKey)}>保存</Button></div> : null}
              </form>
            ))}
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="RESOURCES" title={`工位与会议室（${data?.resources.length ?? 0}）`} />
        <AdminPanelBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.resources.map((resource) => (
            <div key={resource.id} className="flex items-center justify-between gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4">
              <div><p className="m-0 font-semibold">{resource.code} · {resource.name}</p><p className="m-0 mt-1 text-sm text-muted-foreground">{resource.areaLabel}{resource.assignedTo ? ` · ${resource.assignedTo}` : ""}</p></div>
              <div className="grid justify-items-end gap-2"><AdminStatusBadge tone={resource.status === "active" ? "active" : "paused"}>{resource.status === "active" ? "可使用" : "已暂停"}</AdminStatusBadge>{data.capabilities.manageResources ? <Button size="sm" variant="outline" loading={processingKey === `resource:${resource.id}`} disabled={Boolean(processingKey)} onClick={() => void toggleResource(resource.id, resource.code, resource.status)}>{resource.status === "active" ? "暂停" : "启用"}</Button> : null}</div>
            </div>
          ))}
        </AdminPanelBody>
      </AdminPanel>

              </AdminPageStack>
            ),
          },
          {
            key: "bookings",
            label: `预约管理（未来 ${upcomingBookings.length}）`,
            children: (
              <AdminPageStack>

      <AdminPanel>
        <AdminPanelHeader eyebrow="BOOKINGS" title={`未来预约（${upcomingBookings.length}）`} />
        <AdminPanelBody className="grid gap-3">
          {upcomingBookings.length === 0 ? <p className="text-sm text-muted-foreground">当前没有未来预约。</p> : null}
          {upcomingBookings.map((booking) => (
            <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4">
              <div><p className="m-0 font-semibold">{booking.resourceCode} · {booking.displayName}</p><p className="m-0 mt-1 text-sm text-muted-foreground">{formatDateTime(booking.startsAt)} — {formatDateTime(booking.endsAt)}{booking.purpose ? ` · ${booking.purpose}` : ""}</p></div>
              {data?.capabilities.manageBookings ? <Button variant="outline" loading={processingKey === `booking:${booking.id}`} disabled={Boolean(processingKey)} onClick={() => void cancelBooking(booking)}>取消预约</Button> : null}
            </div>
          ))}
          <details><summary className="cursor-pointer text-sm font-semibold">查看历史预约（{bookingHistory.length}）</summary><div className="mt-3 grid gap-2">{bookingHistory.map((booking) => { const meta = bookingStatusMeta[booking.status]; return <div key={booking.id} className="flex justify-between gap-3 rounded-admin border border-admin-border p-3 text-sm"><span>{booking.resourceCode} · {booking.displayName} · {formatDateTime(booking.startsAt)}</span><AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge></div>; })}</div></details>
        </AdminPanelBody>
      </AdminPanel>

              </AdminPageStack>
            ),
          },
          {
            key: "fixed-desks",
            label: pendingRequests.length > 0 ? `常驻工位（待审 ${pendingRequests.length}）` : "常驻工位",
            children: (
              <AdminPageStack>

      <AdminPanel>
        <AdminPanelHeader eyebrow="FIXED DESK REQUESTS" title={`常驻工位待审核（${pendingRequests.length}）`} />
        <AdminPanelBody className="grid gap-4">
          {isLoading && !data ? <p className="text-sm text-muted-foreground">正在加载申请…</p> : null}
          {!isLoading && pendingRequests.length === 0 ? <p className="text-sm text-muted-foreground">当前没有待审核申请。</p> : null}
          {pendingRequests.map((request) => (
            <article key={request.id} className="grid gap-4 rounded-admin border border-admin-border bg-[#fafafa] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/admin/members/${request.userId}`} className="font-semibold hover:underline">{request.displayName}</Link><p className="m-0 mt-1 text-sm text-muted-foreground">{request.roleSummary || "社区成员"} · {formatDateTime(request.createdAt)}</p></div><div className="flex gap-2"><AdminStatusBadge tone="pending">待审核</AdminStatusBadge><AdminStatusBadge>{request.resourceCode}</AdminStatusBadge></div></div>
              <p className="m-0 rounded-admin border border-admin-divider bg-white p-3 text-sm">{request.note || "申请人未补充常驻计划。"}</p>
              <Textarea value={reviewNotes[request.id] ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={500} placeholder="审核备注；驳回时必填" />
              {data?.capabilities.manageFixedDesks ? <div className="flex justify-end gap-2"><Button variant="destructive" loading={processingKey === `reject:${request.id}`} disabled={Boolean(processingKey)} onClick={() => void reviewRequest(request, "reject")}>驳回</Button><Button loading={processingKey === `approve:${request.id}`} disabled={Boolean(processingKey)} onClick={() => void reviewRequest(request, "approve")}>批准并固定</Button></div> : null}
            </article>
          ))}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="ACTIVE ASSIGNMENTS" title={`当前常驻工位（${data?.assignments.length ?? 0}）`} />
        <AdminPanelBody className="grid gap-3">
          {data?.assignments.length === 0 ? <p className="text-sm text-muted-foreground">尚无常驻工位归属。</p> : null}
          {data?.assignments.map((assignment) => <div key={assignment.resourceId} className="flex flex-wrap items-center justify-between gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4"><div><p className="m-0 font-semibold">{assignment.resourceCode} · {assignment.displayName}</p><p className="m-0 mt-1 text-sm text-muted-foreground">自 {formatDateTime(assignment.assignedAt)} 起固定使用</p></div>{data.capabilities.manageFixedDesks ? <Button variant="outline" loading={processingKey === `release:${assignment.resourceId}`} disabled={Boolean(processingKey)} onClick={() => void releaseAssignment(assignment.resourceId, assignment.resourceCode)}>管理员释放</Button> : null}</div>)}
          <details><summary className="cursor-pointer text-sm font-semibold">查看常驻申请记录（{historyRequests.length}）</summary><div className="mt-3 grid gap-2">{historyRequests.map((request) => { const meta = fixedStatusMeta[request.status]; return <div key={request.id} className="flex justify-between gap-3 rounded-admin border border-admin-border p-3 text-sm"><span>{request.resourceCode} · {request.displayName} · {request.reviewNote || request.note || "无补充说明"}</span><AdminStatusBadge tone={meta.tone}>{meta.label}</AdminStatusBadge></div>; })}</div></details>
        </AdminPanelBody>
      </AdminPanel>

              </AdminPageStack>
            ),
          },

          ...(data?.capabilities.manageAccess ? [{
            key: "access",
            label: pendingAccess.length > 0 ? `门禁管理（待处理 ${pendingAccess.length}）` : "门禁管理",
            children: (
              <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader eyebrow="ACCESS REQUESTS" title={`门禁待处理（${pendingAccess.length}）`} />
        <AdminPanelBody className="grid gap-4">
          {pendingAccess.length === 0 ? <p className="text-sm text-muted-foreground">当前没有待处理门禁申请。</p> : null}
          {pendingAccess.map((item) => <article key={item.id} className="grid gap-3 rounded-admin border border-admin-border bg-[#fafafa] p-4"><div className="flex justify-between gap-3"><div><Link href={`/admin/members/${item.userId}`} className="font-semibold hover:underline">{item.displayName}</Link><p className="m-0 mt-1 text-sm text-muted-foreground">联系方式：{item.contact} · {formatDateTime(item.createdAt)}</p></div><AdminStatusBadge tone="pending">待处理</AdminStatusBadge></div><p className="m-0 text-sm">{item.note || "未补充门禁需求。"}</p><div className="grid gap-3 md:grid-cols-2"><Input value={accessIdentifiers[item.id] ?? ""} onChange={(event) => setAccessIdentifiers((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={100} placeholder="门禁卡号 / 权限标识（可选）" /><Input value={accessNotes[item.id] ?? ""} onChange={(event) => setAccessNotes((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={500} placeholder="处理备注（可选）" /></div><div className="flex justify-end"><Button loading={processingKey === `access:${item.id}`} disabled={Boolean(processingKey)} onClick={() => void processAccess(item, "process")}>标记已处理</Button></div></article>)}
          <details><summary className="cursor-pointer text-sm font-semibold">查看门禁处理记录（{accessHistory.length}）</summary><div className="mt-3 grid gap-2">{accessHistory.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-admin border border-admin-border p-3 text-sm"><span>{item.displayName} · {item.contact} · {item.accessIdentifier || item.reviewNote || "已处理"} · {formatDateTime(item.processedAt)}</span><Button size="sm" variant="outline" loading={processingKey === `access:${item.id}`} disabled={Boolean(processingKey)} onClick={() => void processAccess(item, "reopen")}>恢复待处理</Button></div>)}</div></details>
        </AdminPanelBody>
      </AdminPanel>
              </AdminPageStack>
            ),
          }] : []),
        ]}
      />
    </AdminPageStack>
  );
}
