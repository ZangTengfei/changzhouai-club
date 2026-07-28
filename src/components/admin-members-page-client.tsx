"use client";

import { Eye, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Empty, Table, type TableColumnsType } from "antd";

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
import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import { NativeSelect } from "@/components/admin-antd/native-select";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminMember, AdminMembersData } from "@/lib/admin/members";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

const MEMBERS_PER_PAGE = 10;

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesKeyword(
  fields: Array<string | null | undefined | string[]>,
  keyword: string,
) {
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
  completion: string,
  industry: string,
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

  if (completion !== "all") {
    params.set("completion", completion);
  }

  if (industry !== "all") {
    params.set("industry", industry);
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

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    saved?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。",
    );
  }

  return payload;
}

export function AdminMembersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } =
    useAdminResource<AdminMembersData>("/api/admin/members");
  const publishingMemberIdsRef = useRef(new Set<string>());
  const [publishingMemberIds, setPublishingMemberIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [publishedMemberIds, setPublishedMemberIds] = useState<Set<string>>(
    () => new Set(),
  );

  const statusFilter = searchParams.get("status") ?? "all";
  const visibilityFilter = searchParams.get("visibility") ?? "all";
  const intentFilter = searchParams.get("intent") ?? "all";
  const completionFilter = searchParams.get("completion") ?? "all";
  const industryFilter = searchParams.get("industry") ?? "all";
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

      if (intentFilter === "co_builder" && !member.isCoBuilder) {
        return false;
      }

      if (
        completionFilter === "complete" &&
        !member.profileCompletion.completed
      ) {
        return false;
      }

      if (
        completionFilter === "incomplete" &&
        member.profileCompletion.completed
      ) {
        return false;
      }

      if (
        industryFilter !== "all" &&
        !member.industryTags.includes(industryFilter)
      ) {
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
          member.industryTags,
          member.skills,
          member.interests,
          member.capabilitySummary,
          member.seekingSummary,
        ],
        memberKeyword,
      );
    }) ?? [];

  const totalMemberPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE),
  );
  const currentMemberPage = Math.min(requestedMemberPage, totalMemberPages);
  const currentMembersPath = buildMembersFilterHref(
    statusFilter,
    visibilityFilter,
    intentFilter,
    completionFilter,
    industryFilter,
    memberQueryInput,
    currentMemberPage,
  );

  function setMemberPublishing(memberId: string, isPublishing: boolean) {
    if (isPublishing) {
      publishingMemberIdsRef.current.add(memberId);
    } else {
      publishingMemberIdsRef.current.delete(memberId);
    }

    setPublishingMemberIds(new Set(publishingMemberIdsRef.current));
  }

  async function handlePublishMember(memberId: string, displayName: string) {
    if (publishingMemberIdsRef.current.has(memberId)) {
      return;
    }

    setMemberPublishing(memberId, true);

    try {
      const response = await fetch(
        `/api/admin/members/${memberId}/visibility`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_publicly_visible: true,
          }),
        },
      );
      const result = await readApiResult(response);

      setPublishedMemberIds((current) => new Set(current).add(memberId));
      toast.success(
        getAdminSavedMessage(result?.saved ?? "member_public_visibility") ??
          `${displayName} 已公开展示。`,
      );
      reload();
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "公开失败，请稍后再试。",
      );
    } finally {
      setMemberPublishing(memberId, false);
    }
  }

  const columns: TableColumnsType<AdminMember> = [
    {
      title: "成员",
      key: "member",
      width: 250,
      render: (_, member) => (
        <div className="grid gap-1">
          <Link
            href={buildDetailHref(
              `/admin/members/${member.id}`,
              currentMembersPath,
            )}
            className="font-semibold leading-6 text-foreground transition-colors hover:text-primary"
          >
            {member.displayName}
          </Link>
          <span className="text-sm text-muted-foreground">
            {member.email ?? "未提供邮箱"}
          </span>
          <span className="text-xs text-muted-foreground">{member.city}</span>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => (
        <AdminStatusBadge tone={getAdminMemberStatusTone(status) as AdminTone}>
          {formatAdminMemberStatus(status)}
        </AdminStatusBadge>
      ),
    },
    {
      title: "公开",
      key: "visibility",
      width: 110,
      render: (_, member) => {
        const isPubliclyVisible =
          member.isPubliclyVisible || publishedMemberIds.has(member.id);
        return (
          <span className="text-sm text-muted-foreground">
            {isPubliclyVisible
              ? member.isFeaturedOnHome
                ? "公开 / 首页"
                : "公开"
              : "未公开"}
          </span>
        );
      },
    },
    {
      title: "资料",
      key: "completion",
      width: 90,
      align: "center",
      render: (_, member) => (
        <span className="text-sm text-muted-foreground">
          {member.profileCompletion.percent}%
        </span>
      ),
    },
    {
      title: "加入时间",
      dataIndex: "joinedAt",
      key: "joinedAt",
      width: 190,
      render: (joinedAt: string | null) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(joinedAt)}
        </span>
      ),
    },
    {
      title: "活动",
      dataIndex: "registrationCount",
      key: "registrationCount",
      width: 90,
      align: "center",
      render: (count: number) => (
        <span className="text-sm text-muted-foreground">{count} 次</span>
      ),
    },
    {
      title: "身份 / 意愿",
      key: "intent",
      width: 190,
      render: (_, member) => (
        <span className="text-sm text-muted-foreground">
          {[
            member.isCoBuilder ? "共建成员" : null,
            member.willingToShare ? "分享" : null,
            member.willingToJoinProjects ? "共建" : null,
          ]
            .filter(Boolean)
            .join(" / ") || "暂无"}
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 190,
      align: "right",
      fixed: "right",
      render: (_, member) => {
        const isPublishing = publishingMemberIds.has(member.id);
        const isPubliclyVisible =
          member.isPubliclyVisible || publishedMemberIds.has(member.id);

        return (
          <div className="flex justify-end gap-2">
            {!isPubliclyVisible ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPublishing}
                aria-label={`公开展示 ${member.displayName}`}
                onClick={() => {
                  void handlePublishMember(member.id, member.displayName);
                }}
              >
                {isPublishing ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
                {isPublishing ? "公开中..." : "一键公开"}
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link
                href={buildDetailHref(
                  `/admin/members/${member.id}`,
                  currentMembersPath,
                )}
              >
                详情
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

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
              <AdminMetric
                label="成员总数"
                value={data?.stats.totalMembers ?? "..."}
              />
              <AdminMetric
                label="共建成员"
                value={data?.stats.coBuilders ?? "..."}
              />
              <AdminMetric
                label="愿意分享"
                value={data?.stats.willingToShare ?? "..."}
              />
              <AdminMetric
                label="愿意共建"
                value={data?.stats.willingToJoinProjects ?? "..."}
              />
              <AdminMetric
                label="能力档案完成"
                value={data?.stats.completedProfiles ?? "..."}
              />
            </>
          }
        />
      </AdminPanel>

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>
          后台数据读取出现问题：{data.queryErrors.join(" | ")}
        </AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Filters" title="成员筛选" />
        <AdminPanelBody>
          <form
            action="/admin/members"
            className="grid gap-3 lg:grid-cols-3 xl:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.9fr_0.9fr_auto]"
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
                <option value="co_builder">共建成员</option>
                <option value="share">愿意分享</option>
                <option value="build">愿意共建</option>
              </NativeSelect>
            </AdminField>

            <AdminField label="档案完成度">
              <NativeSelect name="completion" defaultValue={completionFilter}>
                <option value="all">全部</option>
                <option value="complete">已完成</option>
                <option value="incomplete">待完善</option>
              </NativeSelect>
            </AdminField>

            <AdminField label="行业方向">
              <NativeSelect name="industry" defaultValue={industryFilter}>
                <option value="all">全部行业</option>
                {(data?.industryOptions ?? []).map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </NativeSelect>
            </AdminField>

            <div className="flex flex-wrap items-end gap-2">
              <Button type="submit" variant="secondary">
                筛选
              </Button>
              {memberQueryInput ||
              statusFilter !== "all" ||
              visibilityFilter !== "all" ||
              intentFilter !== "all" ||
              completionFilter !== "all" ||
              industryFilter !== "all" ? (
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
            <span className="text-sm text-muted-foreground">
              共 {filteredMembers.length} 位 · 第 {currentMemberPage} /{" "}
              {totalMemberPages} 页
            </span>
          }
        />
        <AdminPanelBody className="p-0">
          <Table<AdminMember>
            rowKey="id"
            columns={columns}
            dataSource={filteredMembers}
            loading={{
              spinning: isLoading,
              description: "正在加载成员列表",
            }}
            size="middle"
            tableLayout="fixed"
            scroll={{ x: 1420 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前筛选条件下没有成员数据"
                />
              ),
            }}
            pagination={{
              current: currentMemberPage,
              pageSize: MEMBERS_PER_PAGE,
              total: filteredMembers.length,
              showSizeChanger: false,
              showTotal: (total, range) =>
                total > 0
                  ? `第 ${range[0]}–${range[1]} 位，共 ${total} 位成员`
                  : "共 0 位成员",
              onChange: (page) => {
                router.push(
                  buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    completionFilter,
                    industryFilter,
                    memberQueryInput,
                    page,
                  ),
                );
              },
            }}
          />
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
