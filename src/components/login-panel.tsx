"use client";

import { useState } from "react";
import { AtSign, Mail, MessageCircle } from "lucide-react";

import { EmailAuthForm } from "@/components/email-auth-form";
import { WechatQrLogin } from "@/components/wechat-qr-login";

import styles from "./login-panel.module.css";

type LoginPanelProps = {
  enabled: boolean;
  wechatEnabled: boolean;
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

export function LoginPanel({
  enabled,
  wechatEnabled,
  nextPath = "/account",
  error,
}: LoginPanelProps) {
  const isOnboardingFlow = nextPath.startsWith("/account?onboarding=1");
  const [authIntent, setAuthIntent] = useState<AuthIntent>(
    isOnboardingFlow ? "sign-up" : "sign-in",
  );
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const isSignIn = authIntent === "sign-in";
  const isEmailMethod = authMethod === "email";
  const isGoogleMethod = authMethod === "google";
  const isWechatMethod = authMethod === "wechat";

  function chooseIntent(nextIntent: AuthIntent) {
    setAuthIntent(nextIntent);

    if (nextIntent === "sign-up") {
      setAuthMethod("email");
    }
  }

  return (
    <div className={`auth-stack ${styles.grid}`}>
      {error ? (
        <div className={`note-strip ${styles.errorNote}`}>
          {errorMap[error] ?? "登录过程中出现了未知错误。"}
        </div>
      ) : null}

      <section className={`auth-card ${styles.flowCard}`}>
        <div className={styles.authHeader}>
          <div>
            <h1>{isSignIn ? "登录" : "注册"}</h1>
          </div>

          <button
            type="button"
            className={styles.intentSwitch}
            onClick={() => chooseIntent(isSignIn ? "sign-up" : "sign-in")}
          >
            {isSignIn ? "注册" : "登录"}
          </button>
        </div>

        <div
          className={`${styles.methodTabs} ${isSignIn ? "" : styles.methodTabsSingle}`}
          role="group"
          aria-label={isSignIn ? "选择登录方式" : "选择注册方式"}
        >
          <button
            type="button"
            className={`${styles.methodTab} ${isEmailMethod ? styles.methodTabActive : ""}`}
            onClick={() => setAuthMethod("email")}
            aria-pressed={isEmailMethod}
          >
            <Mail aria-hidden="true" strokeWidth={1.9} />
            <span>邮箱</span>
          </button>

          {isSignIn ? (
            <>
              <button
                type="button"
                className={`${styles.methodTab} ${isGoogleMethod ? styles.methodTabActive : ""}`}
                onClick={() => setAuthMethod("google")}
                aria-pressed={isGoogleMethod}
              >
                <AtSign aria-hidden="true" strokeWidth={1.9} />
                <span>Google</span>
              </button>
              {wechatEnabled ? (
                <button
                  type="button"
                  className={`${styles.methodTab} ${isWechatMethod ? styles.methodTabActive : ""}`}
                  onClick={() => setAuthMethod("wechat")}
                  aria-pressed={isWechatMethod}
                >
                  <MessageCircle aria-hidden="true" strokeWidth={1.9} />
                  <span>微信</span>
                </button>
              ) : null}
            </>
          ) : null}
        </div>

        {isEmailMethod ? (
          <div className={styles.activePane}>
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
          <div className={styles.activePane}>
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
          <div className={styles.activePane}>
            <WechatQrLogin
              enabled={enabled && wechatEnabled}
              nextPath={nextPath}
            />
          </div>
        ) : null}
      </section>

      {!enabled ? (
        <p className={styles.hint}>当前登录服务暂未启用，请稍后再试。</p>
      ) : null}
    </div>
  );
}
