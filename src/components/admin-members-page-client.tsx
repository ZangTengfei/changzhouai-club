"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { EyeOutlined, LoadingOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Input,
  Space,
  Statistic,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";

import { AdminStatusTag } from "@/components/admin-antd";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { NativeSelect } from "@/components/admin-antd";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminMember, AdminMembersData } from "@/lib/admin/members";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

const MEMBERS_PER_PAGE = 10;

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
  return Number.isNaN(page) || page < 1 ? 1 : page;
}

function buildDetailHref(basePath: string, currentPath: string) {
  const params = new URLSearchParams();
  params.set("from", currentPath);
  return `${basePath}?${params.toString()}`;
}

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。");
  }

  return payload;
}

export function AdminMembersPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } =
    useAdminResource<AdminMembersData>("/api/admin/members");
  const publishingMemberIdsRef = useRef(new Set<string>());
  const [publishingMemberIds, setPublishingMemberIds] = useState<Set<string>>(() => new Set());
  const [publishedMemberIds, setPublishedMemberIds] = useState<Set<string>>(() => new Set());
  const { message } = AntApp.useApp();

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

      if (intentFilter === "co_builder" && !member.isCoBuilder) {
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
      const response = await fetch(`/api/admin/members/${memberId}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_publicly_visible: true,
        }),
      });
      const result = await readApiResult(response);

      setPublishedMemberIds((current) => new Set(current).add(memberId));
      message.success(
        getAdminSavedMessage(result?.saved ?? "member_public_visibility") ??
          `${displayName} 已公开展示。`,
      );
      reload();
    } catch (requestError) {
      message.error(requestError instanceof Error ? requestError.message : "公开失败，请稍后再试。");
    } finally {
      setMemberPublishing(memberId, false);
    }
  }

  const columns: TableColumnsType<AdminMember> = [
    {
      title: "成员",
      dataIndex: "displayName",
      render: (_, member) => (
        <Space orientation="vertical" size={2}>
          <Link
            href={buildDetailHref(`/admin/members/${member.id}`, currentMembersPath)}
            className="font-semibold text-foreground hover:text-primary"
          >
            {member.displayName}
          </Link>
          <Typography.Text type="secondary">{member.email ?? "未提供邮箱"}</Typography.Text>
          <Typography.Text type="secondary">{member.city}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "状态",
      width: 110,
      render: (_, member) => (
        <AdminStatusTag status={member.status} label={formatAdminMemberStatus(member.status)} />
      ),
    },
    {
      title: "公开",
      width: 120,
      render: (_, member) => {
        const isPubliclyVisible = member.isPubliclyVisible || publishedMemberIds.has(member.id);
        return (
          <AdminStatusTag
            status={isPubliclyVisible ? "published" : "draft"}
            label={isPubliclyVisible ? (member.isFeaturedOnHome ? "公开 / 首页" : "公开") : "未公开"}
          />
        );
      },
    },
    {
      title: "加入时间",
      width: 170,
      render: (_, member) => <Typography.Text type="secondary">{formatDate(member.joinedAt)}</Typography.Text>,
    },
    {
      title: "活动",
      width: 80,
      render: (_, member) => `${member.registrationCount} 次`,
    },
    {
      title: "身份 / 意愿",
      render: (_, member) => (
        <Space wrap>
          {member.isCoBuilder ? <AdminStatusTag status="registered" label="共建成员" /> : null}
          {member.willingToShare ? <AdminStatusTag status="active" label="分享" /> : null}
          {member.willingToJoinProjects ? <AdminStatusTag status="active" label="共建" /> : null}
          {!member.isCoBuilder && !member.willingToShare && !member.willingToJoinProjects ? (
            <Typography.Text type="secondary">暂无</Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: "操作",
      width: 190,
      align: "right",
      render: (_, member) => {
        const isPublishing = publishingMemberIds.has(member.id);
        const isPubliclyVisible = member.isPubliclyVisible || publishedMemberIds.has(member.id);

        return (
          <Space wrap>
            {!isPubliclyVisible ? (
              <Button
                icon={isPublishing ? <LoadingOutlined /> : <EyeOutlined />}
                loading={isPublishing}
                onClick={() => {
                  void handlePublishMember(member.id, member.displayName);
                }}
              >
                {isPublishing ? "公开中" : "一键公开"}
              </Button>
            ) : null}
            <Button href={buildDetailHref(`/admin/members/${member.id}`, currentMembersPath)}>
              详情
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="grid gap-4">
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      <Card className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Typography.Text type="secondary">Members</Typography.Text>
            <Typography.Title level={2} style={{ margin: "4px 0 0" }}>
              成员列表
            </Typography.Title>
          </div>
          <Space wrap size="large">
            <Statistic title="成员总数" value={data?.stats.totalMembers ?? 0} />
            <Statistic title="共建成员" value={data?.stats.coBuilders ?? 0} />
            <Statistic title="愿意分享" value={data?.stats.willingToShare ?? 0} />
            <Statistic title="愿意共建" value={data?.stats.willingToJoinProjects ?? 0} />
          </Space>
        </div>
      </Card>

      {error ? <Alert title={`后台数据读取出现问题：${error}`} type="warning" showIcon /> : null}
      {data && data.queryErrors.length > 0 ? (
        <Alert title={`后台数据读取出现问题：${data.queryErrors.join(" | ")}`} type="warning" showIcon />
      ) : null}

      <Card className="min-w-0" title="成员筛选">
        <form
          action="/admin/members"
          className="grid gap-3 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_auto]"
        >
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">成员搜索</span>
            <Input
              type="search"
              name="member_query"
              defaultValue={memberQueryInput}
              placeholder="搜索姓名、邮箱、城市、技能"
              prefix={<SearchOutlined />}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">状态</span>
            <NativeSelect name="status" defaultValue={statusFilter}>
              <option value="all">全部状态</option>
              <option value="pending">待完善</option>
              <option value="active">活跃成员</option>
              <option value="organizer">组织者</option>
              <option value="admin">管理员</option>
              <option value="paused">暂停中</option>
            </NativeSelect>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">公开展示</span>
            <NativeSelect name="visibility" defaultValue={visibilityFilter}>
              <option value="all">全部</option>
              <option value="public">公开展示中</option>
              <option value="private">未公开</option>
            </NativeSelect>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">参与意愿</span>
            <NativeSelect name="intent" defaultValue={intentFilter}>
              <option value="all">全部</option>
              <option value="co_builder">共建成员</option>
              <option value="share">愿意分享</option>
              <option value="build">愿意共建</option>
            </NativeSelect>
          </label>

          <Space align="end" wrap>
            <Button type="primary" htmlType="submit">
              筛选
            </Button>
            {memberQueryInput ||
            statusFilter !== "all" ||
            visibilityFilter !== "all" ||
            intentFilter !== "all" ? (
              <Button href="/admin/members">重置</Button>
            ) : null}
          </Space>
        </form>
      </Card>

      <Card
        className="min-w-0"
        title="成员结果"
        extra={
          <Typography.Text type="secondary">
            共 {filteredMembers.length} 位 · 第 {currentMemberPage} / {totalMemberPages} 页
          </Typography.Text>
        }
      >
        <Table
          columns={columns}
          dataSource={paginatedMembers}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          scroll={{ x: 1120 }}
          locale={{
            emptyText: "当前筛选条件下没有成员数据。",
          }}
        />

        {filteredMembers.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Typography.Text type="secondary">
              第 {currentMemberPage} / {totalMemberPages} 页
            </Typography.Text>
            <Space wrap>
              <Button href={buildMembersFilterHref(statusFilter, visibilityFilter, intentFilter, memberQueryInput, 1)}>
                首页
              </Button>
              <Button
                href={buildMembersFilterHref(
                  statusFilter,
                  visibilityFilter,
                  intentFilter,
                  memberQueryInput,
                  Math.max(1, currentMemberPage - 1),
                )}
              >
                上一页
              </Button>
              <Button
                href={buildMembersFilterHref(
                  statusFilter,
                  visibilityFilter,
                  intentFilter,
                  memberQueryInput,
                  Math.min(totalMemberPages, currentMemberPage + 1),
                )}
              >
                下一页
              </Button>
              <Button
                href={buildMembersFilterHref(
                  statusFilter,
                  visibilityFilter,
                  intentFilter,
                  memberQueryInput,
                  totalMemberPages,
                )}
              >
                末页
              </Button>
            </Space>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
