import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { WechatArticleComposer } from "@/components/wechat-article-composer";
import { loadAdminSocialMaterial } from "@/lib/admin/social";

export const metadata: Metadata = {
  title: "公众号素材编辑器",
  description: "全屏编辑、保存和复制公众号底稿。",
};

type AdminWechatComposerPageProps = {
  searchParams: Promise<{ draft?: string }>;
};

export default async function AdminWechatComposerPage({
  searchParams,
}: AdminWechatComposerPageProps) {
  const { draft } = await searchParams;
  const result = draft
    ? await loadAdminSocialMaterial(draft)
    : { material: null, error: null };

  return (
    <div data-admin-editor-fullscreen>
      <AdminPageStack>
        <AdminPanel>
          <AdminPanelHeader
            eyebrow="Wechat"
            title={result.material ? "编辑公众号底稿" : "新建公众号底稿"}
            actions={
              <Button asChild variant="outline">
                <Link href="/admin/social">
                  <ArrowLeft className="size-4" />
                  返回素材列表
                </Link>
              </Button>
            }
          />
        </AdminPanel>

        {result.error ? (
          <AdminNotice>底稿读取失败：{result.error}</AdminNotice>
        ) : draft && !result.material ? (
          <AdminNotice>没有找到这篇底稿，你可以返回列表后重新选择。</AdminNotice>
        ) : (
          <WechatArticleComposer initialMaterial={result.material} />
        )}
      </AdminPageStack>
    </div>
  );
}
