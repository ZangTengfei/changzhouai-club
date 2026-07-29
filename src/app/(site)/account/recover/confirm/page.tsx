import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Merge, ShieldCheck } from "lucide-react";

import { loadAccountRecoveryPreview } from "@/lib/account-recovery";
import { MemberAvatar } from "@/components/member-avatar";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  accountPageClassName,
  accountWorkSubmitHeaderClassName,
  accountWorkSubmitSectionClassName,
} from "../../account-tailwind";
import { confirmWechatAccountRecovery } from "./actions";

const choiceGroupClass =
  "m-0 grid gap-2.5 rounded-md border border-[rgba(208,214,207,0.8)] p-4 [&_img]:rounded-full [&_img]:object-cover [&_label]:flex [&_label]:cursor-pointer [&_label]:items-center [&_label]:gap-2.5 [&_legend]:px-1.5 [&_legend]:font-semibold";

export const metadata: Metadata = {
  title: "确认合并账号",
  description: "确认原账号与当前微信账号的资料合并规则。",
};

function valueLabel(value: string | null, fallback: string) {
  return value?.trim() || fallback;
}

function ConflictChoice({
  name,
  label,
  targetValue,
  sourceValue,
}: {
  name: string;
  label: string;
  targetValue: string | null;
  sourceValue: string | null;
}) {
  if (!targetValue?.trim() || !sourceValue?.trim() || targetValue === sourceValue) {
    return null;
  }

  return (
    <fieldset className={choiceGroupClass}>
      <legend>{label}使用哪一边？</legend>
      <label>
        <input type="radio" name={`${name}_choice`} value="target" defaultChecked />
        <span>原账号：{targetValue}</span>
      </label>
      <label>
        <input type="radio" name={`${name}_choice`} value="source" />
        <span>当前微信账号：{sourceValue}</span>
      </label>
    </fieldset>
  );
}

export default async function ConfirmAccountRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent = "" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/account/recover/confirm?intent=${intent}`)}`);
  }

  if (!admin || !intent) {
    redirect("/account?error=account_recovery_invalid");
  }

  let preview;
  try {
    preview = await loadAccountRecoveryPreview(admin, intent, user);
  } catch (error) {
    if (error instanceof Error && error.message === "recovery_intent_consumed") {
      redirect("/account?updated=account_merged");
    }
    redirect("/account?error=account_recovery_invalid");
  }

  return (
    <div className={accountPageClassName}>
      <section className={accountWorkSubmitSectionClassName}>
        <div className={accountWorkSubmitHeaderClassName}>
          <div>
            <p className="home-kicker">Merge preview · 合并预览</p>
            <h1>确认合并两个账号</h1>
            <p>已验证 {preview.targetEmail}。合并后，原账号保留为主账号。</p>
          </div>
          <Link href="/account" className="button home-ghost-button">
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            暂不合并
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3.5 max-[720px]:grid-cols-1 [&_article]:grid [&_article]:gap-1.75 [&_article]:rounded-md [&_article]:border [&_article]:border-[rgba(208,214,207,0.8)] [&_article]:bg-white/60 [&_article]:p-4.5 [&_small]:text-muted-foreground [&_span]:text-muted-foreground [&_strong]:text-[1.08rem]">
          <article>
            <span>原账号 · 合并后保留</span>
            <strong>{valueLabel(preview.targetProfile.display_name, "原账号用户")}</strong>
            <small>
              {preview.targetCounts.registrations} 条报名 · {preview.targetCounts.works} 个作品
            </small>
          </article>
          <article>
            <span>当前微信账号 · 资料并入</span>
            <strong>{valueLabel(preview.sourceProfile.display_name, "微信用户")}</strong>
            <small>
              {preview.sourceCounts.registrations} 条报名 · {preview.sourceCounts.works} 个作品
            </small>
          </article>
        </div>

        <form action={confirmWechatAccountRecovery} className="grid max-w-170 gap-4.5 [&>.button]:justify-self-start">
          <input type="hidden" name="recovery_token" value={intent} />
          <ConflictChoice
            name="display_name"
            label="昵称"
            targetValue={preview.targetProfile.display_name}
            sourceValue={preview.sourceProfile.display_name}
          />
          <ConflictChoice
            name="wechat"
            label="微信号"
            targetValue={preview.targetProfile.wechat}
            sourceValue={preview.sourceProfile.wechat}
          />

          {preview.targetProfile.avatar_url && preview.sourceProfile.avatar_url &&
          preview.targetProfile.avatar_url !== preview.sourceProfile.avatar_url ? (
            <fieldset className={choiceGroupClass}>
              <legend>头像使用哪一边？</legend>
              <label>
                <input type="radio" name="avatar_url_choice" value="target" defaultChecked />
                <MemberAvatar
                  name={valueLabel(preview.targetProfile.display_name, "原账号用户")}
                  avatarUrl={preview.targetProfile.avatar_url}
                  size="sm"
                />
                <span>原账号头像</span>
              </label>
              <label>
                <input type="radio" name="avatar_url_choice" value="source" />
                <MemberAvatar
                  name={valueLabel(preview.sourceProfile.display_name, "微信用户")}
                  avatarUrl={preview.sourceProfile.avatar_url}
                  size="sm"
                />
                <span>微信账号头像</span>
              </label>
            </fieldset>
          ) : null}

          <div className="note-strip">
            <ShieldCheck aria-hidden="true" strokeWidth={1.9} />
            <span>技能和兴趣会合并去重；成员状态、公开设置和审核状态保留原账号设置。</span>
          </div>

          <button type="submit" className="button home-primary-button">
            <Merge aria-hidden="true" strokeWidth={2} />
            确认合并账号
          </button>
        </form>
      </section>
    </div>
  );
}
