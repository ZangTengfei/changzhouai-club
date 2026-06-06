"use client";

import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { getPublicSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import styles from "./email-auth-form.module.css";

type EmailAuthMode = "sign-in" | "sign-up" | "reset";

type EmailAuthFormProps = {
  enabled: boolean;
  nextPath?: string;
};

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
  nextPath = "/account",
}: EmailAuthFormProps) {
  const [mode, setMode] = useState<EmailAuthMode>("sign-in");
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
  const renderPasswordToggle = () => (
    <button
      type="button"
      className={styles.passwordToggle}
      onClick={() => setShowPassword((current) => !current)}
      disabled={!enabled || pending}
      aria-label={passwordToggleLabel}
      title={passwordToggleLabel}
    >
      <PasswordIcon aria-hidden="true" strokeWidth={1.9} />
    </button>
  );

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {mode === "reset" ? (
        <div className={styles.resetHeading}>
          <strong>找回或设置邮箱密码</strong>
          <span>原 Google 登录用户也可以输入同一个邮箱，收到邮件后设置新的邮箱密码。</span>
        </div>
      ) : (
        <div className={styles.modeTabs} role="tablist" aria-label="邮箱认证方式">
          <button
            type="button"
            className={`${styles.modeTab} ${mode === "sign-in" ? styles.modeTabActive : ""}`}
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
            className={`${styles.modeTab} ${mode === "sign-up" ? styles.modeTabActive : ""}`}
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
      )}

      {mode === "sign-up" ? (
        <label className="form-field">
          <span>昵称</span>
          <input
            className="input"
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
          className="input"
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
          <span className={styles.passwordField}>
            <input
              className="input"
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

      {mode === "sign-up" ? (
        <label className="form-field">
          <span>确认密码</span>
          <span className={styles.passwordField}>
            <input
              className="input"
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

      {error ? <div className={`note-strip ${styles.message}`}>{error}</div> : null}
      {message ? <div className={`note-strip ${styles.message}`}>{message}</div> : null}

      {mode === "reset" && resetEmailSent ? (
        <div className={styles.resetCodePanel}>
          <div className={styles.resetCodeIntro}>
            <strong>输入验证码继续设置密码</strong>
            <span>邮件链接打不开时，复制邮件里的 6 位数字到这里。</span>
          </div>

          <label className="form-field">
            <span>6 位验证码</span>
            <input
              className="input"
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
            className="button auth-button"
            disabled={!enabled || pending}
          >
            {resetPendingAction === "verify" ? "正在验证..." : "使用验证码继续设置密码"}
          </button>

          <button
            type="button"
            className={styles.textButton}
            onClick={handleSendResetEmail}
            disabled={!enabled || pending}
          >
            {resetPendingAction === "send" ? "正在重新发送..." : "重新发送邮件"}
          </button>
        </div>
      ) : null}

      {mode !== "reset" || !resetEmailSent ? (
        <button
          type="submit"
          className="button auth-button"
          disabled={!enabled || pending}
        >
          {submitText}
        </button>
      ) : null}

      {mode === "sign-in" ? (
        <button
          type="button"
          className={styles.textButton}
          onClick={() => {
            setMode("reset");
            setPassword("");
            setConfirmPassword("");
            resetRecoveryState();
            setError(null);
            setMessage(null);
          }}
          disabled={!enabled || pending}
        >
          忘记密码，或为原 Google 账号设置邮箱密码
        </button>
      ) : null}

      {mode === "reset" ? (
        <button
          type="button"
          className={styles.textButton}
          onClick={() => {
            setMode("sign-in");
            resetRecoveryState();
            setError(null);
            setMessage(null);
          }}
          disabled={!enabled || pending}
        >
          返回邮箱登录
        </button>
      ) : null}
    </form>
  );
}
