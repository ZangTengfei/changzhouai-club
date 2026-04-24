import type { Metadata } from "next";

import {
  deleteAdminWechatQrCode,
  saveAdminWechatQrCode,
} from "@/app/admin/actions";
import {
  AdminCheckboxRow,
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminSocialData } from "@/lib/admin/social";

export const metadata: Metadata = {
  title: "社交入口管理",
  description: "管理社区外部平台入口和微信群二维码。",
};

type AdminSocialPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function toDatetimeLocal(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get(
    "day",
  )}T${valueByType.get("hour")}:${valueByType.get("minute")}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getQrCodeStatus(startsAt: string, expiresAt: string, isActive: boolean) {
  const now = Date.now();
  const startTime = new Date(startsAt).getTime();
  const expiryTime = new Date(expiresAt).getTime();

  if (!isActive) {
    return { label: "已停用", tone: "neutral" as const };
  }

  if (startTime > now) {
    return { label: "未开始", tone: "scheduled" as const };
  }

  if (expiryTime <= now) {
    return { label: "已过期", tone: "cancelled" as const };
  }

  return { label: "展示中", tone: "completed" as const };
}

export default async function AdminSocialPage({
  searchParams,
}: AdminSocialPageProps) {
  const params = await searchParams;
  const { qrCodes, currentQrCode, queryErrors } = await loadAdminSocialData();
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(params.saved)}
        error={params.error ? getAdminErrorMessage(params.error) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Social"
          title="社交入口与微信群二维码"
          actions={
            <>
              <AdminMetric label="二维码" value={qrCodes.length} />
              <AdminMetric label="当前状态" value={currentQrCode ? "可扫码" : "需更新"} />
            </>
          }
        />
        <AdminPanelBody className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              微信群二维码通常 7 天过期。上传新二维码时，默认从当前时间开始展示，并在
              7 天后自动从首页隐藏，避免用户扫到失效入口。
            </p>
            <AdminNotice>
              小红书、抖音、B 站等公开平台入口目前仍从代码配置读取；微信群二维码已经接入后台管理。
            </AdminNotice>
          </div>

          <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/30 p-3">
            {currentQrCode ? (
              <div className="grid gap-3">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-background">
                  <img
                    src={currentQrCode.image_url}
                    alt={currentQrCode.title}
                    width={288}
                    height={288}
                    className="h-full w-full object-contain p-3"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {currentQrCode.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    有效至 {formatDateTime(currentQrCode.expires_at)}
                  </p>
                </div>
              </div>
            ) : (
              <AdminNotice>当前没有可公开展示的微信群二维码，请上传新二维码。</AdminNotice>
            )}
          </div>
        </AdminPanelBody>
      </AdminPanel>

      {queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="WeChat QR" title="发布新的微信群二维码" />
        <AdminPanelBody>
          <form action={saveAdminWechatQrCode} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="标题">
                <Input
                  name="title"
                  defaultValue="常州 AI Club 微信群"
                  placeholder="例如：常州 AI Club 微信群"
                  required
                />
              </AdminField>

              <AdminField label="二维码图片" className="md:col-span-2">
                <StorageImageUrlField
                  name="image_url"
                  eventSlug="wechat-group"
                  uploadScope="community"
                  mode="upload-only"
                  placeholder="上传图片后会自动填写，也可以粘贴 Supabase Storage 图片地址"
                  uploadLabel="上传微信群二维码"
                  clearLabel="清空二维码"
                  filledStatusText="已设置二维码"
                  emptyStatusText="当前未设置二维码"
                  required
                />
              </AdminField>
            </div>

            <details className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                高级设置
              </summary>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <AdminCheckboxRow className="self-end">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked
                    className="size-4"
                  />
                  <span>立即启用</span>
                </AdminCheckboxRow>

                <div aria-hidden="true" />

                <AdminField label="开始展示时间">
                  <Input
                    type="datetime-local"
                    name="starts_at"
                    defaultValue={toDatetimeLocal(startsAt)}
                    required
                  />
                </AdminField>

                <AdminField label="过期时间">
                  <Input
                    type="datetime-local"
                    name="expires_at"
                    defaultValue={toDatetimeLocal(expiresAt)}
                    required
                  />
                </AdminField>

                <AdminField label="备注" className="md:col-span-2">
                  <Textarea
                    name="note"
                    rows={3}
                    placeholder="可选：例如这张二维码对应哪个群、何时从微信生成。备注只在后台显示。"
                  />
                </AdminField>
              </div>
            </details>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit">保存并发布二维码</Button>
              <span className="text-sm text-muted-foreground">默认有效期 7 天。</span>
            </div>
          </form>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="History" title="二维码历史" />
        <AdminPanelBody className="space-y-2">
          {qrCodes.length > 0 ? (
            qrCodes.map((qrCode) => {
              const status = getQrCodeStatus(
                qrCode.starts_at,
                qrCode.expires_at,
                qrCode.is_active,
              );

              return (
                <article
                  key={qrCode.id}
                  className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background"
                >
                  <div className="grid gap-3 p-3 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center">
                    <div className="relative size-[72px] overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                      <img
                        src={qrCode.image_url}
                        alt={qrCode.title}
                        width={72}
                        height={72}
                        className="h-full w-full object-contain p-1.5"
                      />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">{qrCode.title}</h2>
                        <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(qrCode.starts_at)} 至 {formatDateTime(qrCode.expires_at)}
                      </p>
                      {qrCode.note ? (
                        <p className="line-clamp-1 text-sm text-muted-foreground">{qrCode.note}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <form action={deleteAdminWechatQrCode}>
                        <input type="hidden" name="qr_code_id" value={qrCode.id} />
                        <Button type="submit" variant="outline" size="sm">
                          删除
                        </Button>
                      </form>
                    </div>
                  </div>

                  <details className="border-t border-border/70">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
                      展开编辑表单
                    </summary>
                    <form action={saveAdminWechatQrCode} className="grid gap-3 p-3 pt-1">
                      <input type="hidden" name="qr_code_id" value={qrCode.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <AdminField label="标题">
                          <Input name="title" defaultValue={qrCode.title} required />
                        </AdminField>
                        <AdminCheckboxRow className="self-end">
                          <input
                            type="checkbox"
                            name="is_active"
                            defaultChecked={qrCode.is_active}
                            className="size-4"
                          />
                          <span>启用</span>
                        </AdminCheckboxRow>
                        <AdminField label="开始展示时间">
                          <Input
                            type="datetime-local"
                            name="starts_at"
                            defaultValue={toDatetimeLocal(new Date(qrCode.starts_at))}
                            required
                          />
                        </AdminField>
                        <AdminField label="过期时间">
                          <Input
                            type="datetime-local"
                            name="expires_at"
                            defaultValue={toDatetimeLocal(new Date(qrCode.expires_at))}
                            required
                          />
                        </AdminField>
                        <AdminField label="图片地址" className="md:col-span-2">
                          <StorageImageUrlField
                            name="image_url"
                            defaultValue={qrCode.image_url}
                            eventSlug="wechat-group"
                            uploadScope="community"
                            mode="upload-only"
                            placeholder="微信群二维码图片地址"
                            uploadLabel="重新上传二维码"
                            clearLabel="清空二维码"
                            filledStatusText="已设置二维码"
                            emptyStatusText="当前未设置二维码"
                            required
                          />
                        </AdminField>
                        <AdminField label="备注" className="md:col-span-2">
                          <Textarea
                            name="note"
                            defaultValue={qrCode.note ?? ""}
                            rows={2}
                          />
                        </AdminField>
                      </div>
                      <Button type="submit" variant="secondary" size="sm">
                        保存这张二维码
                      </Button>
                    </form>
                  </details>
                </article>
              );
            })
          ) : (
            <AdminNotice>还没有二维码记录。上传第一张后，首页会展示它。</AdminNotice>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
