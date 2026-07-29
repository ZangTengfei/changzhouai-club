"use client";

import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { getPublicSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type EmailAuthMode = "sign-in" | "sign-up" | "reset";

type EmailAuthFormProps = {
  enabled: boolean;
  allowSignUp?: boolean;
  nextPath?: string;
  compact?: boolean;
  initialMode?: EmailAuthMode;
  resetTitle?: string;
  resetDescription?: string;
  resetBackLabel?: string;
  showGoogleRecoveryAction?: boolean;
  showModeTabs?: boolean;
  onResetBack?: () => void;
};

const textButtonClassName =
  "w-fit cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-[0.9rem] leading-[1.5] font-extrabold text-primary hover:text-primary-strong hover:underline hover:underline-offset-4 focus-visible:text-primary-strong focus-visible:underline focus-visible:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgba(var(--accent-rgb),0.26)] disabled:cursor-not-allowed disabled:opacity-50";

const passwordToggleClassName =
  "absolute top-1/2 right-2 grid size-8.5 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-transparent bg-transparent p-0 text-[rgba(var(--ink-rgb),0.58)] transition-colors duration-[180ms] hover:border-[rgba(var(--accent-rgb),0.16)] hover:bg-primary-soft hover:text-primary focus-visible:border-[rgba(var(--accent-rgb),0.16)] focus-visible:bg-primary-soft focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(var(--accent-rgb),0.26)] disabled:cursor-not-allowed disabled:opacity-46 [&_svg]:size-4.5";

function getSafeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/account";
  }

  return nextPath;
}

function getPasswordResetPath() {
  return "/account/password";
}

function getSiteOrigin() {
  return getPublicSiteUrl() ?? (typeof window === "undefined" ? "" : window.location.origin);
}

function getAuthCallbackUrl(nextPath: string) {
  const siteOrigin = getSiteOrigin();

  if (!siteOrigin) {
    return "";
  }

  const callbackUrl = new URL("/auth/callback", siteOrigin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "邮箱或密码不正确，请检查后再试。";
  }

  if (normalized.includes("email not confirmed")) {
    return "这个邮箱还没有完成确认，请先打开确认邮件。";
  }

  if (normalized.includes("user already registered")) {
    return "这个邮箱已经注册过，可以直接登录。";
  }

  if (normalized.includes("token") || normalized.includes("otp")) {
    return "验证码无效或已过期，请重新发送找回密码邮件。";
  }

  if (normalized.includes("password")) {
    return "密码不符合要求，请至少输入 6 位字符。";
  }

  return message || "认证失败，请稍后再试。";
}

export function EmailAuthForm({
  enabled,
  allowSignUp = true,
  nextPath = "/account",
  compact = false,
  initialMode = "sign-in",
  resetTitle = "找回或设置邮箱密码",
  resetDescription = "原 Google 登录用户也可以输入同一个邮箱，收到邮件后设置新的邮箱密码。",
  resetBackLabel = "返回邮箱登录",
  showGoogleRecoveryAction = true,
  showModeTabs = true,
  onResetBack,
}: EmailAuthFormProps) {
  const [mode, setMode] = useState<EmailAuthMode>(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [resetPendingAction, setResetPendingAction] = useState<
    "send" | "verify" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeNextPath = getSafeNextPath(nextPath);
  const redirectTo = useMemo(() => {
    return getAuthCallbackUrl(safeNextPath);
  }, [safeNextPath]);
  const resetRedirectTo = useMemo(() => {
    return getAuthCallbackUrl(getPasswordResetPath());
  }, []);
  const inputClassName = cn(
    "input",
    compact && "min-h-11.5! rounded-md! bg-[rgba(255,252,247,0.94)]!",
  );
  const authButtonClassName = cn(
    "button auth-button",
    compact &&
      "min-h-11! border-[rgba(var(--accent-strong-rgb),0.22)]! bg-[#0f6f62]! text-white! shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_24px_rgba(var(--accent-rgb),0.18)]! transition-[transform,background-color,border-color,box-shadow] duration-[180ms] hover:border-[rgba(var(--accent-strong-rgb),0.34)]! hover:bg-primary-strong! hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_28px_rgba(var(--accent-strong-rgb),0.2)]! focus-visible:border-[rgba(var(--accent-strong-rgb),0.34)]! focus-visible:bg-primary-strong! focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_28px_rgba(var(--accent-strong-rgb),0.2)]! disabled:shadow-none!",
  );

  function handleEmailChange(value: string) {
    setEmail(value);

    if (mode === "reset" && resetEmailSent) {
      setResetEmailSent(false);
      setResetCode("");
      setMessage(null);
      setError(null);
    }
  }

  function resetRecoveryState() {
    setResetCode("");
    setResetEmailSent(false);
    setResetPendingAction(null);
  }

  async function handleSendResetEmail() {
    if (!enabled || pending) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("请输入用于登录的邮箱。");
      setMessage(null);
      return;
    }

    setPending(true);
    setResetPendingAction("send");
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      trimmedEmail,
      {
        redirectTo: resetRedirectTo,
      },
    );

    setPending(false);
    setResetPendingAction(null);

    if (resetError) {
      setError(getAuthErrorMessage(resetError.message));
      return;
    }

    setResetEmailSent(true);
    setResetCode("");
    setMessage("重设密码邮件已发送，请查看邮箱里的链接或 6 位验证码。");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enabled) {
      return;
    }

    if (mode === "reset") {
      if (resetEmailSent) {
        await handleVerifyResetCode();
        return;
      }

      await handleSendResetEmail();
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();

    if (!trimmedEmail || !password) {
      setError("请输入邮箱和密码。");
      setMessage(null);
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要 6 位字符。");
      setMessage(null);
      return;
    }

    if (mode === "sign-up") {
      if (!trimmedDisplayName) {
        setError("请输入社区昵称。");
        setMessage(null);
        return;
      }

      if (password !== confirmPassword) {
        setError("两次输入的密码不一致，请重新确认。");
        setMessage(null);
        return;
      }
    }

    setPending(true);
    setResetPendingAction(null);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setError(getAuthErrorMessage(signInError.message));
        setPending(false);
        return;
      }

      window.location.assign(safeNextPath);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          display_name: trimmedDisplayName,
          full_name: trimmedDisplayName,
          name: trimmedDisplayName,
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (signUpError) {
      setError(getAuthErrorMessage(signUpError.message));
      setPending(false);
      return;
    }

    if (data.session) {
      window.location.assign(safeNextPath);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPending(false);
    setMessage("注册确认邮件已发送，请打开邮箱完成确认后再登录。");
  }

  async function handleVerifyResetCode() {
    if (!enabled || pending) {
      return;
    }

    const trimmedEmail = email.trim();
    const token = resetCode.trim().replace(/\s/g, "");

    if (!trimmedEmail) {
      setError("请输入收到验证码的邮箱。");
      setMessage(null);
      return;
    }

    if (!/^\d{6}$/.test(token)) {
      setError("请输入邮件里的 6 位数字验证码。");
      setMessage(null);
      return;
    }

    setPending(true);
    setResetPendingAction("verify");
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token,
      type: "recovery",
    });

    if (verifyError) {
      setError(getAuthErrorMessage(verifyError.message));
      setPending(false);
      setResetPendingAction(null);
      return;
    }

    window.location.assign(getPasswordResetPath());
  }

  const submitText =
    mode === "sign-in"
      ? pending
        ? "正在登录..."
        : "邮箱登录"
      : mode === "sign-up"
        ? pending
          ? "正在注册..."
          : "邮箱注册"
        : pending
          ? "正在发送..."
          : "发送重设邮件";
  const passwordInputType = showPassword ? "text" : "password";
  const PasswordIcon = showPassword ? EyeOff : Eye;
  const passwordToggleLabel = showPassword ? "隐藏密码" : "显示密码";
  function openPasswordReset() {
    setMode("reset");
    setPassword("");
    setConfirmPassword("");
    resetRecoveryState();
    setError(null);
    setMessage(null);
  }

  function handleResetBack() {
    if (onResetBack) {
      onResetBack();
      return;
    }

    setMode("sign-in");
    resetRecoveryState();
    setError(null);
    setMessage(null);
  }

  const renderPasswordToggle = () => (
    <button
      type="button"
      className={passwordToggleClassName}
      onClick={() => setShowPassword((current) => !current)}
      disabled={!enabled || pending}
      aria-label={passwordToggleLabel}
      title={passwordToggleLabel}
    >
      <PasswordIcon aria-hidden="true" strokeWidth={1.9} />
    </button>
  );

  return (
    <form className="mt-0 grid gap-4" onSubmit={handleSubmit}>
      {mode === "reset" ? (
        <div className="grid gap-1.5">
          <strong className="text-base leading-[1.35] font-black text-ink">{resetTitle}</strong>
          <span className="text-[0.92rem] leading-[1.68] text-muted-foreground">{resetDescription}</span>
        </div>
      ) : allowSignUp && showModeTabs ? (
        <div className="inline-grid w-fit grid-cols-[repeat(2,minmax(86px,1fr))] rounded-full border border-primary-border bg-[rgba(var(--surface-muted-rgb),0.86)] p-1" role="tablist" aria-label="邮箱认证方式">
          <button
            type="button"
            className={cn(
              "min-h-9.5 cursor-pointer rounded-full border-0 bg-transparent px-4.5 py-0 font-[inherit] font-extrabold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(var(--accent-rgb),0.36)]",
              mode === "sign-in" && "bg-primary text-white",
            )}
            onClick={() => {
              setMode("sign-in");
              setConfirmPassword("");
              setResetCode("");
              setError(null);
              setMessage(null);
            }}
            aria-pressed={mode === "sign-in"}
          >
            登录
          </button>
          <button
            type="button"
            className={cn(
              "min-h-9.5 cursor-pointer rounded-full border-0 bg-transparent px-4.5 py-0 font-[inherit] font-extrabold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(var(--accent-rgb),0.36)]",
              mode === "sign-up" && "bg-primary text-white",
            )}
            onClick={() => {
              setMode("sign-up");
              setResetCode("");
              setError(null);
              setMessage(null);
            }}
            aria-pressed={mode === "sign-up"}
          >
            注册
          </button>
        </div>
      ) : compact ? null : (
        <div className="grid gap-1.5">
          <strong className="text-base leading-[1.35] font-black text-ink">邮箱账号登录</strong>
          <span className="text-[0.92rem] leading-[1.68] text-muted-foreground">
            使用原邮箱账号进入账号中心，再绑定微信作为新的登录方式。
          </span>
        </div>
      )}

      {allowSignUp && mode === "sign-up" ? (
        <label className="form-field">
          <span>昵称</span>
          <input
            className={inputClassName}
            type="text"
            name="display_name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            placeholder="你希望大家怎么称呼你"
            disabled={!enabled || pending}
            required
          />
        </label>
      ) : null}

      <label className="form-field">
        <span>邮箱</span>
        <input
          className={inputClassName}
          type="email"
          name="email"
          value={email}
          onChange={(event) => handleEmailChange(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={!enabled || pending}
          required
        />
      </label>

      {mode !== "reset" ? (
        <label className="form-field">
          <span>密码</span>
          <span className="relative block min-w-0">
            <input
              className={cn(inputClassName, "pr-12.5!")}
              type={passwordInputType}
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              placeholder="至少 6 位字符"
              disabled={!enabled || pending}
              minLength={6}
              required
            />
            {renderPasswordToggle()}
          </span>
        </label>
      ) : null}

      {allowSignUp && mode === "sign-up" ? (
        <label className="form-field">
          <span>确认密码</span>
          <span className="relative block min-w-0">
            <input
              className={cn(inputClassName, "pr-12.5!")}
              type={passwordInputType}
              name="confirm_password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="再输入一次密码"
              disabled={!enabled || pending}
              minLength={6}
              required
            />
            {renderPasswordToggle()}
          </span>
        </label>
      ) : null}

      {error ? <div className="note-strip px-3.5 py-3">{error}</div> : null}
      {message ? <div className="note-strip px-3.5 py-3">{message}</div> : null}

      {mode === "reset" && resetEmailSent ? (
        <div className="mt-0.5 grid gap-3.5 border-t border-site-border-subtle pt-4.5 [&_.auth-button]:w-full!">
          <div className="grid gap-1 border-l-3 border-primary bg-[rgba(var(--accent-rgb),0.06)] px-3.5 py-3">
            <strong className="text-[0.95rem] leading-[1.45] font-black text-ink">
              输入验证码继续设置密码
            </strong>
            <span className="text-[0.88rem] leading-[1.62] text-muted-foreground">
              邮件链接打不开时，复制邮件里的 6 位数字到这里。
            </span>
          </div>

          <label className="form-field">
            <span>6 位验证码</span>
            <input
              className={inputClassName}
              type="text"
              name="reset_code"
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="邮件里的 6 位数字"
              disabled={!enabled || pending}
            />
          </label>

          <button
            type="submit"
            className={cn(authButtonClassName, "w-full!")}
            disabled={!enabled || pending}
          >
            {resetPendingAction === "verify" ? "正在验证..." : "使用验证码继续设置密码"}
          </button>

          <button
            type="button"
            className={textButtonClassName}
            onClick={handleSendResetEmail}
            disabled={!enabled || pending}
          >
            {resetPendingAction === "send" ? "正在重新发送..." : "重新发送邮件"}
          </button>
        </div>
      ) : null}

      {mode === "sign-up" ? (
        <button
          type="submit"
          className={authButtonClassName}
          disabled={!enabled || pending}
        >
          {submitText}
        </button>
      ) : null}

      {mode === "reset" && !resetEmailSent ? (
        <div className="flex items-center justify-between gap-3.5 max-[360px]:flex-col max-[360px]:items-start">
          <button
            type="submit"
            className={cn(authButtonClassName, "min-w-33! flex-[0_0_auto]!")}
            disabled={!enabled || pending}
          >
            {submitText}
          </button>

          <button
            type="button"
            className={cn(
              textButtonClassName,
              "ml-auto flex-[0_0_auto] text-right whitespace-nowrap max-[360px]:ml-0 max-[360px]:text-left",
            )}
            onClick={handleResetBack}
            disabled={!enabled || pending}
          >
            {resetBackLabel}
          </button>
        </div>
      ) : null}

      {mode === "sign-in" ? (
        <div className="grid gap-2.5">
          {showGoogleRecoveryAction ? (
            <button
              type="button"
              className="grid min-h-14.5 w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-md border border-[rgba(238,127,24,0.2)] bg-[rgba(255,247,235,0.92)] px-3 py-2.5 text-left font-[inherit] text-[#8d4a10] transition-[background-color,border-color,box-shadow,color] duration-[180ms] hover:border-[rgba(238,127,24,0.34)] hover:bg-[rgba(255,241,217,0.98)] hover:text-[#7a3f0c] hover:shadow-[0_10px_22px_rgba(238,127,24,0.12)] focus-visible:border-[rgba(238,127,24,0.34)] focus-visible:bg-[rgba(255,241,217,0.98)] focus-visible:text-[#7a3f0c] focus-visible:shadow-[0_10px_22px_rgba(238,127,24,0.12)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[rgba(238,127,24,0.28)] disabled:cursor-not-allowed disabled:opacity-58 disabled:shadow-none [&>span]:grid [&>span]:min-w-0 [&>span]:gap-0.5 [&_small]:text-[0.82rem] [&_small]:leading-[1.45] [&_small]:font-bold [&_small]:text-copy-subtle [&_strong]:text-[0.94rem] [&_strong]:leading-[1.32] [&_strong]:font-black [&_strong]:text-inherit [&_svg]:size-5"
              onClick={openPasswordReset}
              disabled={!enabled || pending}
            >
              <KeyRound aria-hidden="true" strokeWidth={1.9} />
              <span>
                <strong>原 Google 登录用户</strong>
                <small>发送邮件，设置邮箱密码后登录原账号</small>
              </span>
            </button>
          ) : null}

          <div className="flex items-center justify-between gap-3.5 max-[360px]:flex-col max-[360px]:items-start">
            <button
              type="submit"
              className={cn(authButtonClassName, "min-w-33! flex-[0_0_auto]!")}
              disabled={!enabled || pending}
            >
              {submitText}
            </button>

            <button
              type="button"
              className={cn(
                textButtonClassName,
                "ml-auto flex-[0_0_auto] text-right whitespace-nowrap max-[360px]:ml-0 max-[360px]:text-left",
              )}
              onClick={openPasswordReset}
              disabled={!enabled || pending}
            >
              忘记邮箱密码
            </button>
          </div>
        </div>
      ) : null}

      {mode === "reset" && resetEmailSent ? (
        <button
          type="button"
          className={textButtonClassName}
          onClick={handleResetBack}
          disabled={!enabled || pending}
        >
          {resetBackLabel}
        </button>
      ) : null}
    </form>
  );
}
