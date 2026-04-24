"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminMembersData } from "@/lib/admin/members";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

const MEMBERS_PER_PAGE = 20;

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
  memberQuery: string,
  memberPage = 1,
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

  if (memberQuery.trim()) {
    params.set("member_query", memberQuery.trim());
  }

  if (memberPage > 1) {
    params.set("member_page", String(memberPage));
  }

  const query = params.toString();
  return query ? `/admin/members?${query}` : "/admin/members";
}

function parsePage(value: string | null) {
  const page = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
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
  const memberQueryInput = (searchParams.get("member_query") ?? "").trim();
  const requestedMemberPage = parsePage(searchParams.get("member_page"));
  const memberKeyword = normalizeSearchText(memberQueryInput);
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;

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
        [
          member.displayName,
          member.email,
          member.wechat,
          member.city,
          member.monthlyTime,
          member.bio,
          member.skills,
          member.interests,
        ],
        memberKeyword,
      );
    }) ?? [];

  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE));
  const currentMemberPage = Math.min(requestedMemberPage, totalMemberPages);
  const memberPageStartIndex = (currentMemberPage - 1) * MEMBERS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(
    memberPageStartIndex,
    memberPageStartIndex + MEMBERS_PER_PAGE,
  );
  const currentMembersPath = buildMembersFilterHref(
    statusFilter,
    visibilityFilter,
    intentFilter,
    memberQueryInput,
    currentMemberPage,
  );

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Members"
          title="成员列表"
          actions={
            <>
              <AdminMetric label="成员总数" value={data?.stats.totalMembers ?? "..."} />
              <AdminMetric label="愿意分享" value={data?.stats.willingToShare ?? "..."} />
              <AdminMetric
                label="愿意共建"
                value={data?.stats.willingToJoinProjects ?? "..."}
              />
            </>
          }
        />
      </AdminPanel>

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Filters" title="成员筛选" />
        <AdminPanelBody>
          <form
            action="/admin/members"
            className="grid gap-3 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_auto]"
          >
            <AdminField label="成员搜索">
              <Input
                type="search"
                name="member_query"
                defaultValue={memberQueryInput}
                placeholder="搜索姓名、邮箱、城市、技能"
              />
            </AdminField>

            <AdminField label="状态">
              <NativeSelect name="status" defaultValue={statusFilter}>
                <option value="all">全部状态</option>
                <option value="pending">待完善</option>
                <option value="active">活跃成员</option>
                <option value="organizer">组织者</option>
                <option value="admin">管理员</option>
                <option value="paused">暂停中</option>
              </NativeSelect>
            </AdminField>

            <AdminField label="公开展示">
              <NativeSelect name="visibility" defaultValue={visibilityFilter}>
                <option value="all">全部</option>
                <option value="public">公开展示中</option>
                <option value="private">未公开</option>
              </NativeSelect>
            </AdminField>

            <AdminField label="参与意愿">
              <NativeSelect name="intent" defaultValue={intentFilter}>
                <option value="all">全部</option>
                <option value="share">愿意分享</option>
                <option value="build">愿意共建</option>
              </NativeSelect>
            </AdminField>

            <div className="flex flex-wrap items-end gap-2">
              <Button type="submit" variant="secondary">
                筛选
              </Button>
              {memberQueryInput ||
              statusFilter !== "all" ||
              visibilityFilter !== "all" ||
              intentFilter !== "all" ? (
                <Button asChild variant="outline">
                  <Link href="/admin/members">重置</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Results"
          title="成员结果"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                第 {currentMemberPage} / {totalMemberPages} 页
              </span>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    1,
                  )}
                >
                  首页
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    Math.max(1, currentMemberPage - 1),
                  )}
                >
                  上一页
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    Math.min(totalMemberPages, currentMemberPage + 1),
                  )}
                >
                  下一页
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    totalMemberPages,
                  )}
                >
                  末页
                </Link>
              </Button>
            </div>
          }
        />
        <AdminPanelBody className="space-y-3 p-0">
          {isLoading ? (
            <div className="p-4">
              <AdminNotice>正在加载成员列表...</AdminNotice>
            </div>
          ) : paginatedMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">成员</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>公开</TableHead>
                  <TableHead>加入时间</TableHead>
                  <TableHead>活动</TableHead>
                  <TableHead>意愿</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="grid gap-1">
                        <Link
                          href={buildDetailHref(`/admin/members/${member.id}`, currentMembersPath)}
                          className="font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {member.displayName}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {member.email ?? "未提供邮箱"}
                        </span>
                        <span className="text-xs text-muted-foreground">{member.city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge tone={getAdminMemberStatusTone(member.status) as AdminTone}>
                        {formatAdminMemberStatus(member.status)}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.isPubliclyVisible
                        ? member.isFeaturedOnHome
                          ? "公开 / 首页"
                          : "公开"
                        : "未公开"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.registrationCount} 次
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[
                        member.willingToShare ? "分享" : null,
                        member.willingToJoinProjects ? "共建" : null,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "暂无"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={buildDetailHref(`/admin/members/${member.id}`, currentMembersPath)}
                        >
                          详情
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4">
              <AdminNotice>当前筛选条件下没有成员数据。</AdminNotice>
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
