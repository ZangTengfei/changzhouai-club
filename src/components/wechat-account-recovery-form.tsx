"use client";

import { FormEvent, useState } from "react";
import { MailCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import styles from "./wechat-account-recovery-form.module.css";

type StartResponse = {
  message?: string;
  recoveryToken?: string;
  error?: string;
};

function getErrorMessage(error?: string) {
  if (error === "too_many_attempts") {
    return "请求次数过多，请一小时后再试。";
  }

  if (error === "invalid_email") {
    return "请输入有效的邮箱地址。";
  }

  if (error === "recovery_not_available") {
    return "当前账号不需要或不能使用旧账号找回。";
  }

  return "暂时无法发送验证邮件，请稍后再试。";
}

export function WechatAccountRecoveryForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [pending, setPending] = useState<"send" | "verify" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending("send");
    setError(null);
    setMessage(null);

    const response = await fetch("/api/account/recovery/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = (await response.json().catch(() => ({}))) as StartResponse;

    setPending(null);
    if (!response.ok || !body.recoveryToken) {
      setError(getErrorMessage(body.error));
      return;
    }

    setRecoveryToken(body.recoveryToken);
    setMessage(
      body.message ?? "如果这个邮箱属于已有账号，你会收到一封验证邮件。",
    );
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !recoveryToken) return;

    const token = code.trim().replace(/\s/g, "");
    if (!/^\d{6}$/.test(token)) {
      setError("请输入邮件里的 6 位数字验证码。");
      return;
    }

    setPending("verify");
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });

    if (verifyError) {
      setPending(null);
      setError("验证码无效或已经过期，请重新发送验证邮件。");
      return;
    }

    window.location.assign(
      `/account/recover/confirm?intent=${encodeURIComponent(recoveryToken)}`,
    );
  }

  return (
    <div className={styles.stack}>
      <form className={styles.form} onSubmit={sendVerification}>
        <label className="form-field">
          <span>原账号邮箱</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setRecoveryToken(null);
              setCode("");
              setMessage(null);
              setError(null);
            }}
            autoComplete="email"
            placeholder="你以前用于 Google 登录的邮箱"
            disabled={Boolean(pending)}
            required
          />
        </label>
        <button
          type="submit"
          className="button home-primary-button"
          disabled={Boolean(pending)}
        >
          <MailCheck aria-hidden="true" strokeWidth={2} />
          {pending === "send" ? "正在发送..." : "发送验证邮件"}
        </button>
      </form>

      {recoveryToken ? (
        <form className={styles.form} onSubmit={verifyCode}>
          <label className="form-field">
            <span>6 位验证码</span>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              maxLength={6}
              disabled={Boolean(pending)}
              required
            />
          </label>
          <button
            type="submit"
            className="button button-secondary"
            disabled={Boolean(pending)}
          >
            {pending === "verify" ? "正在验证..." : "验证并查看合并预览"}
          </button>
          <p className={styles.hint}>也可以直接点击邮件里的验证链接。</p>
        </form>
      ) : null}

      {message ? <p className="note-strip">{message}</p> : null}
      {error ? <p className={`note-strip ${styles.error}`}>{error}</p> : null}
    </div>
  );
}
