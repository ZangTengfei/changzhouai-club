"use client";

import { Empty, Table, type TableColumnsType, Tag } from "antd";
import { LockKeyhole, RefreshCw } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import { NativeSelect } from "@/components/admin-antd/native-select";
import {
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { useAdminResource } from "@/components/use-admin-resource";
import type {
  AdminPrivateMemberProfile,
  AdminPrivateProfilesData,
} from "@/lib/admin/member-private-profiles";

const PROFILES_PER_PAGE = 15;

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function formatDate(value: string | null) {
  if (!value) return "暂无";
  return new Date(`${value}T00:00:00+08:00`).toLocaleDateString("zh-CN");
}

function formatReviewStatus(status: AdminPrivateMemberProfile["reviewStatus"]) {
  if (status === "reviewed") return "已复核";
  if (status === "needs_confirmation") return "身份待确认";
  return "待复核";
}

function formatConsentStatus(
  status: AdminPrivateMemberProfile["sharingConsentStatus"],
) {
  if (status === "granted") return "已取得授权";
  if (status === "pending") return "授权确认中";
  if (status === "revoked") return "授权已撤回";
  return "未请求授权";
}

function ProfileTags({ values }: { values: string[] }) {
  if (!values.length) return <span className="text-muted-foreground">暂无</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <Tag key={value} className="m-0 rounded-full">
          {value}
        </Tag>
      ))}
    </div>
  );
}

export function AdminMemberProfilesPageClient() {
  const { data, error, isLoading, reload } =
    useAdminResource<AdminPrivateProfilesData>("/api/admin/member-profiles");
  const [keyword, setKeyword] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filteredProfiles = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(keyword);

    return (data?.profiles ?? []).filter((profile) => {
      if (reviewFilter !== "all" && profile.reviewStatus !== reviewFilter) {
        return false;
      }
      if (linkFilter === "linked" && !profile.linkedUserId) return false;
      if (linkFilter === "unlinked" && profile.linkedUserId) return false;
      if (!normalizedKeyword) return true;

      return [
        profile.displayName,
        profile.profileSummary ?? "",
        profile.linkedDisplayName ?? "",
        ...profile.aliases,
        ...profile.roles,
        ...profile.organizations,
        ...profile.industryTags,
        ...profile.capabilityTags,
        ...profile.interestTags,
        ...profile.needs,
        ...profile.offers,
      ].some((value) =>
        normalizeSearchText(value).includes(normalizedKeyword),
      );
    });
  }, [data?.profiles, keyword, linkFilter, reviewFilter]);

  function handleSave(profile: AdminPrivateMemberProfile, formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/member-profiles/${profile.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linked_user_id: String(formData.get("linked_user_id") ?? ""),
            review_status: String(formData.get("review_status") ?? "pending"),
            sharing_consent_status: String(
              formData.get("sharing_consent_status") ?? "not_requested",
            ),
            sharing_consent_scope: String(
              formData.get("sharing_consent_scope") ?? "",
            ),
          }),
        });
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        if (!response.ok) {
          if (result?.error === "member_profile_account_already_linked") {
            throw new Error("该社区账号已经关联到另一份历史画像。");
          }
          if (result?.error === "sharing_consent_scope_required") {
            throw new Error("记录为已授权时，必须填写具体授权展示范围。");
          }
          throw new Error("画像保存失败，请检查账号关联和授权状态。");
        }

        toast.success(`${profile.displayName}的私有画像已保存。`);
        reload();
      } catch (requestError) {
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "画像保存失败，请稍后再试。",
        );
      }
    });
  }

  const columns: TableColumnsType<AdminPrivateMemberProfile> = [
    {
      title: "成员线索",
      key: "member",
      width: 230,
      render: (_, profile) => (
        <div className="grid gap-1">
          <strong className="text-sm text-foreground">{profile.displayName}</strong>
          <span className="text-xs text-muted-foreground">
            {profile.aliases.length ? `别名：${profile.aliases.join("、")}` : "暂无别名"}
          </span>
          {profile.identityStatus !== "named" ? (
            <AdminStatusBadge tone="pending">身份信息不完整</AdminStatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      title: "画像摘要",
      dataIndex: "profileSummary",
      key: "profileSummary",
      width: 430,
      render: (summary: string | null) => (
        <p className="m-0 line-clamp-4 text-sm leading-6 text-muted-foreground">
          {summary ?? "暂无摘要"}
        </p>
      ),
    },
    {
      title: "行业 / 能力",
      key: "tags",
      width: 280,
      render: (_, profile) => (
        <ProfileTags
          values={[...profile.industryTags, ...profile.capabilityTags].slice(0, 6)}
        />
      ),
    },
    {
      title: "活动证据",
      key: "events",
      width: 160,
      render: (_, profile) => (
        <div className="grid gap-1 text-sm text-muted-foreground">
          <span>{profile.activityCount} 场活动</span>
          <span>
            {formatDate(profile.firstEventDate)}–{formatDate(profile.lastEventDate)}
          </span>
          <span>{profile.matchedEventCount} 条已按日期匹配</span>
        </div>
      ),
    },
    {
      title: "账号关联",
      key: "linked",
      width: 160,
      render: (_, profile) => (
        <div className="grid gap-1">
          <AdminStatusBadge tone={profile.linkedUserId ? "completed" : "neutral"}>
            {profile.linkedUserId ? "已关联" : "待关联"}
          </AdminStatusBadge>
          {profile.linkedDisplayName ? (
            <span className="text-xs text-muted-foreground">
              {profile.linkedDisplayName}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      title: "复核状态",
      key: "review",
      width: 130,
      render: (_, profile) => (
        <AdminStatusBadge
          tone={profile.reviewStatus === "reviewed" ? "completed" : "pending"}
        >
          {formatReviewStatus(profile.reviewStatus)}
        </AdminStatusBadge>
      ),
    },
  ];

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Private Member Intelligence"
          title="成员私有画像"
          actions={
            <>
              <AdminMetric label="画像线索" value={data?.stats.totalProfiles ?? "..."} />
              <AdminMetric label="已关联账号" value={data?.stats.linkedProfiles ?? "..."} />
              <AdminMetric label="待复核" value={data?.stats.pendingReview ?? "..."} />
              <AdminMetric label="活动来源" value={data?.stats.distinctEvents ?? "..."} />
            </>
          }
        />
        <AdminPanelBody className="grid gap-3">
          <AdminNotice className="flex items-start gap-2">
            <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              本页信息来自活动逐字稿和内部总结，仅供获得 L3 权限的后台人员使用。即使记录为“已取得授权”，现有网站与小程序也不会读取或公开本表内容。
            </span>
          </AdminNotice>
          <AdminNotice>
            活动只按日期关联网站历史记录，AI 自动总结的活动标题仅作为来源标题保存。同日多场或无对应活动时保持待确认，不自动硬匹配。
          </AdminNotice>
        </AdminPanelBody>
      </AdminPanel>

      {error ? <AdminNotice>画像数据读取失败：{error}</AdminNotice> : null}
      {data?.queryErrors.length ? (
        <AdminNotice>部分数据读取失败：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Filters" title="画像筛选" />
        <AdminPanelBody className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px_auto] md:items-end">
          <AdminField label="搜索画像">
            <Input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="姓名、别名、行业、能力、需求"
            />
          </AdminField>
          <AdminField label="复核状态">
            <NativeSelect
              value={reviewFilter}
              onChange={(event) => setReviewFilter(event.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">待复核</option>
              <option value="needs_confirmation">身份待确认</option>
              <option value="reviewed">已复核</option>
            </NativeSelect>
          </AdminField>
          <AdminField label="账号关联">
            <NativeSelect
              value={linkFilter}
              onChange={(event) => setLinkFilter(event.target.value)}
            >
              <option value="all">全部</option>
              <option value="linked">已关联</option>
              <option value="unlinked">待关联</option>
            </NativeSelect>
          </AdminField>
          <Button type="button" variant="outline" onClick={reload}>
            <RefreshCw className="size-4" aria-hidden="true" />
            刷新
          </Button>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Results"
          title="历史活动成员画像"
          actions={
            <span className="text-sm text-muted-foreground">
              当前 {filteredProfiles.length} 份 · 共 {data?.stats.evidenceCount ?? "..."} 条来源证据
            </span>
          }
        />
        <AdminPanelBody className="p-0">
          <Table<AdminPrivateMemberProfile>
            rowKey="id"
            columns={columns}
            dataSource={filteredProfiles}
            loading={{ spinning: isLoading, description: "正在加载成员画像" }}
            size="middle"
            tableLayout="fixed"
            scroll={{ x: 1390 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前没有符合条件的成员画像"
                />
              ),
            }}
            pagination={{
              pageSize: PROFILES_PER_PAGE,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 份画像`,
            }}
            expandable={{
              expandedRowRender: (profile) => (
                <div className="grid gap-4 bg-[#fafafa] p-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-admin border border-admin-border bg-white p-4">
                        <h3 className="mb-3 text-sm font-semibold">身份与能力线索</h3>
                        <div className="grid gap-3 text-sm">
                          <div><strong>角色：</strong><ProfileTags values={profile.roles} /></div>
                          <div><strong>组织：</strong><ProfileTags values={profile.organizations} /></div>
                          <div><strong>行业：</strong><ProfileTags values={profile.industryTags} /></div>
                          <div><strong>能力：</strong><ProfileTags values={profile.capabilityTags} /></div>
                          <div><strong>关注：</strong><ProfileTags values={profile.interestTags} /></div>
                        </div>
                      </div>
                      <div className="rounded-admin border border-admin-border bg-white p-4">
                        <h3 className="mb-3 text-sm font-semibold">合作画像</h3>
                        <div className="grid gap-3 text-sm text-muted-foreground">
                          <div>
                            <strong className="text-foreground">需求：</strong>
                            {profile.needs.length ? profile.needs.join("；") : "暂无明确线索"}
                          </div>
                          <div>
                            <strong className="text-foreground">可提供：</strong>
                            {profile.offers.length ? profile.offers.join("；") : "暂无明确线索"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-admin border border-admin-border bg-white p-4">
                      <h3 className="mb-3 text-sm font-semibold">按活动日期排列的来源证据</h3>
                      <div className="divide-y divide-admin-divider">
                        {profile.evidence.map((evidence) => (
                          <article key={evidence.id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-sm">{evidence.eventDate}</strong>
                              <AdminStatusBadge tone={evidence.eventId ? "completed" : "pending"}>
                                {evidence.eventId ? "已按日期匹配网站活动" : "网站活动待匹配"}
                              </AdminStatusBadge>
                              <span className="text-xs text-muted-foreground">
                                置信度 {Math.round(evidence.confidence * 100)}%
                              </span>
                            </div>
                            {evidence.eventTitle ? (
                              <p className="m-0 text-sm text-foreground">
                                网站活动：{evidence.eventTitle}
                              </p>
                            ) : null}
                            <p className="m-0 text-sm leading-6 text-muted-foreground">
                              {evidence.observation}
                            </p>
                            <p className="m-0 text-xs text-muted-foreground">
                              AI 总结来源：{evidence.summaryFilename}
                              {evidence.transcriptFilename
                                ? ` · 配套逐字稿：${evidence.transcriptFilename}`
                                : ""}
                            </p>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>

                  <form
                    className="grid content-start gap-4 rounded-admin border border-admin-border bg-white p-4"
                    onSubmit={(formEvent) => {
                      formEvent.preventDefault();
                      handleSave(profile, new FormData(formEvent.currentTarget));
                    }}
                  >
                    <div>
                      <h3 className="text-sm font-semibold">人工复核与账号关联</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        关联前请根据姓名、活动和背景人工确认。同名或别名不确定时保持未关联。
                      </p>
                    </div>
                    <AdminField label="社区 / 小程序账号">
                      <NativeSelect
                        name="linked_user_id"
                        defaultValue={profile.linkedUserId ?? ""}
                        disabled={!data?.canWrite}
                      >
                        <option value="">暂不关联</option>
                        {(data?.accountOptions ?? []).map((account) => (
                          <option
                            key={account.id}
                            value={account.id}
                            disabled={
                              Boolean(account.linkedProfileId) &&
                              account.linkedProfileId !== profile.id
                            }
                          >
                            {account.displayName}
                            {account.linkedProfileId && account.linkedProfileId !== profile.id
                              ? "（已关联其他画像）"
                              : ""}
                          </option>
                        ))}
                      </NativeSelect>
                    </AdminField>
                    <AdminField label="复核状态">
                      <NativeSelect
                        name="review_status"
                        defaultValue={profile.reviewStatus}
                        disabled={!data?.canWrite}
                      >
                        <option value="pending">待复核</option>
                        <option value="needs_confirmation">身份待确认</option>
                        <option value="reviewed">已复核</option>
                      </NativeSelect>
                    </AdminField>
                    <AdminField label="公开展示授权状态">
                      <NativeSelect
                        name="sharing_consent_status"
                        defaultValue={profile.sharingConsentStatus}
                        disabled={!data?.canWrite}
                      >
                        <option value="not_requested">未请求授权</option>
                        <option value="pending">授权确认中</option>
                        <option value="granted">已取得明确授权</option>
                        <option value="revoked">授权已撤回</option>
                      </NativeSelect>
                    </AdminField>
                    <AdminField label="授权范围（仅已授权时填写）">
                      <Input
                        name="sharing_consent_scope"
                        defaultValue={profile.sharingConsentScope ?? ""}
                        disabled={!data?.canWrite}
                        maxLength={500}
                        placeholder="例如：仅允许展示行业方向与技能标签"
                      />
                    </AdminField>
                    <AdminNotice>
                      当前授权状态：{formatConsentStatus(profile.sharingConsentStatus)}。本版本不会把私有画像同步到公开页面。
                    </AdminNotice>
                    {data?.canWrite ? (
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "保存中..." : "保存复核结果"}
                      </Button>
                    ) : (
                      <AdminNotice>当前账号只有查看权限，不能修改关联或复核状态。</AdminNotice>
                    )}
                  </form>
                </div>
              ),
            }}
          />
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
