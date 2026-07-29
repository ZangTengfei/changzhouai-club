"use client";

import { useState } from "react";
import { AtSign, Mail, MessageCircle } from "lucide-react";

import { EmailAuthForm } from "@/components/email-auth-form";
import { WechatQrLogin } from "@/components/wechat-qr-login";
import { cn } from "@/lib/utils";

type LoginPanelProps = {
  enabled: boolean;
  wechatEnabled: boolean;
  officialAccountEnabled: boolean;
  nextPath?: string;
  error?: string;
};

const errorMap: Record<string, string> = {
  oauth_callback: "登录回调失败，请稍后重试，或改用邮箱。",
  wechat_account_link: "微信账号归并失败，请稍后重试，或改用邮箱。",
  recovery_link: "密码重设链接不完整，请重新发送找回密码邮件。",
  recovery_link_expired:
    "这封邮件里的链接已失效或已经使用过，请重新发送找回密码邮件，或输入邮件里的 6 位验证码。",
};

type AuthIntent = "sign-in" | "sign-up";
type AuthMethod = "email" | "google" | "wechat";

const methodTabClassName =
  "relative inline-flex min-h-12 cursor-pointer items-center gap-2 border-0 bg-transparent px-0.5 pt-0 pb-3 font-[inherit] text-[1.08rem] leading-[1.2] font-[850] text-copy-subtle after:absolute after:right-0 after:-bottom-px after:left-0 after:h-0.75 after:rounded-full after:bg-transparent after:transition-colors after:duration-[180ms] hover:text-ink focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgba(var(--accent-rgb),0.26)] [&_svg]:size-4.5";

export function LoginPanel({
  enabled,
  wechatEnabled,
  officialAccountEnabled,
  nextPath = "/account",
  error,
}: LoginPanelProps) {
  const isOnboardingFlow = nextPath.startsWith("/account?onboarding=1");
  const [authIntent, setAuthIntent] = useState<AuthIntent>(
    isOnboardingFlow ? "sign-up" : "sign-in",
  );
  const [authMethod, setAuthMethod] = useState<AuthMethod>(
    isOnboardingFlow || !wechatEnabled ? "email" : "wechat",
  );
  const isSignIn = authIntent === "sign-in";
  const isEmailMethod = authMethod === "email";
  const isGoogleMethod = authMethod === "google";
  const isWechatMethod = authMethod === "wechat";

  function chooseIntent(nextIntent: AuthIntent) {
    setAuthIntent(nextIntent);

    setAuthMethod(
      nextIntent === "sign-in" && wechatEnabled ? "wechat" : "email",
    );
  }

  return (
    <div className="grid w-full max-w-114 grid-cols-[minmax(0,1fr)] items-start justify-items-center gap-4 max-sm:gap-3.5">
      {error ? (
        <div className="note-strip w-full">
          {errorMap[error] ?? "登录过程中出现了未知错误。"}
        </div>
      ) : null}

      <section className="relative grid w-full gap-5.5 overflow-hidden rounded-lg border border-[rgba(var(--ink-rgb),0.12)] bg-[radial-gradient(circle_at_96%_6%,rgba(var(--accent-rgb),0.12),transparent_28%),rgba(var(--surface-rgb),0.92)] px-7 pt-7 pb-6 shadow-[var(--shadow-md)] max-sm:px-4.5 max-sm:pt-5.5 max-sm:pb-4.5">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5">
          <div>
            <h1 className="m-0 text-[1.42rem] leading-[1.2] font-black tracking-normal text-ink max-sm:text-[1.3rem]">
              {isSignIn ? "登录" : "注册"}
            </h1>
          </div>

          <button
            type="button"
            className="-mt-7 -mr-7 min-h-12 min-w-19.5 cursor-pointer rounded-bl-lg border-0 bg-[rgba(var(--accent-rgb),0.12)] pr-4.5 pl-6 font-[inherit] text-[0.95rem] leading-none font-black text-primary-strong transition-colors duration-[180ms] hover:bg-[rgba(var(--accent-rgb),0.18)] hover:text-primary focus-visible:bg-[rgba(var(--accent-rgb),0.18)] focus-visible:text-primary focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[rgba(var(--accent-rgb),0.28)] max-sm:-mt-5.5 max-sm:-mr-4.5 max-sm:min-h-11 max-sm:min-w-17 max-sm:pr-3.5 max-sm:pl-4.5 max-sm:text-[0.9rem]"
            onClick={() => chooseIntent(isSignIn ? "sign-up" : "sign-in")}
          >
            {isSignIn ? "注册" : "登录"}
          </button>
        </div>

        <div
          className="flex min-w-0 justify-center gap-[clamp(28px,8vw,64px)] border-b border-site-border-subtle max-sm:gap-6"
          role="group"
          aria-label={isSignIn ? "选择登录方式" : "选择注册方式"}
        >
          {isSignIn && wechatEnabled ? (
            <button
              type="button"
              className={cn(
                methodTabClassName,
                isWechatMethod && "text-primary-strong after:bg-primary",
              )}
              onClick={() => setAuthMethod("wechat")}
              aria-pressed={isWechatMethod}
            >
              <MessageCircle aria-hidden="true" strokeWidth={1.9} />
              <span>微信</span>
            </button>
          ) : null}
          <button
            type="button"
            className={cn(
              methodTabClassName,
              isEmailMethod && "text-primary-strong after:bg-primary",
            )}
            onClick={() => setAuthMethod("email")}
            aria-pressed={isEmailMethod}
          >
            <Mail aria-hidden="true" strokeWidth={1.9} />
            <span>邮箱</span>
          </button>
          {isSignIn ? (
            <button
              type="button"
              className={cn(
                methodTabClassName,
                isGoogleMethod && "text-primary-strong after:bg-primary",
              )}
              onClick={() => setAuthMethod("google")}
              aria-pressed={isGoogleMethod}
            >
              <AtSign aria-hidden="true" strokeWidth={1.9} />
              <span>Google</span>
            </button>
          ) : null}
        </div>

        {isEmailMethod ? (
          <div className="grid min-w-0 gap-4">
            <EmailAuthForm
              key={isSignIn ? "email-sign-in" : "email-sign-up"}
              enabled={enabled}
              allowSignUp={!isSignIn}
              nextPath={nextPath}
              initialMode={isSignIn ? "sign-in" : "sign-up"}
              compact
              showModeTabs={false}
              showGoogleRecoveryAction={false}
            />
          </div>
        ) : null}

        {isSignIn && isGoogleMethod ? (
          <div className="grid min-w-0 gap-4">
            <EmailAuthForm
              key="google-recovery"
              enabled={enabled}
              allowSignUp={false}
              nextPath={nextPath}
              initialMode="reset"
              resetTitle="输入原 Google 邮箱"
              resetDescription="收到邮件后设置密码，下次选「邮箱」。"
              resetBackLabel="切换邮箱登录"
              onResetBack={() => setAuthMethod("email")}
              compact
              showGoogleRecoveryAction={false}
            />
          </div>
        ) : null}

        {isSignIn && isWechatMethod ? (
          <div className="grid min-w-0 gap-4">
            <WechatQrLogin
              enabled={enabled && wechatEnabled}
              officialAccountEnabled={officialAccountEnabled}
              nextPath={nextPath}
            />
          </div>
        ) : null}
      </section>

      {!enabled ? (
        <p className="m-0 w-full text-muted-foreground">当前登录服务暂未启用，请稍后再试。</p>
      ) : null}
    </div>
  );
}
