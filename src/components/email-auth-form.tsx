"use client";

import { FormEvent, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type EmailAuthMode = "sign-in" | "sign-up";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeNextPath = getSafeNextPath(nextPath);
  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", safeNextPath);
    return callbackUrl.toString();
  }, [safeNextPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enabled) {
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

  const submitText =
    mode === "sign-in"
      ? pending
        ? "正在登录..."
        : "邮箱登录"
      : pending
        ? "正在注册..."
        : "邮箱注册";

  return (
    <form className="email-auth-form" onSubmit={handleSubmit}>
      <div className="auth-mode-tabs" role="tablist" aria-label="邮箱认证方式">
        <button
          type="button"
          className={mode === "sign-in" ? "auth-mode-tab active" : "auth-mode-tab"}
          onClick={() => {
            setMode("sign-in");
            setConfirmPassword("");
            setError(null);
            setMessage(null);
          }}
          aria-pressed={mode === "sign-in"}
        >
          登录
        </button>
        <button
          type="button"
          className={mode === "sign-up" ? "auth-mode-tab active" : "auth-mode-tab"}
          onClick={() => {
            setMode("sign-up");
            setError(null);
            setMessage(null);
          }}
          aria-pressed={mode === "sign-up"}
        >
          注册
        </button>
      </div>

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
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={!enabled || pending}
          required
        />
      </label>

      <label className="form-field">
        <span>密码</span>
        <input
          className="input"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          placeholder="至少 6 位字符"
          disabled={!enabled || pending}
          minLength={6}
          required
        />
      </label>

      {mode === "sign-up" ? (
        <label className="form-field">
          <span>确认密码</span>
          <input
            className="input"
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="再输入一次密码"
            disabled={!enabled || pending}
            minLength={6}
            required
          />
        </label>
      ) : null}

      {error ? <div className="note-strip auth-message">{error}</div> : null}
      {message ? <div className="note-strip auth-message">{message}</div> : null}

      <button
        type="submit"
        className="button auth-button"
        disabled={!enabled || pending}
      >
        {submitText}
      </button>
    </form>
  );
}
