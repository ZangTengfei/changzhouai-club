"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import styles from "./password-update-form.module.css";

type PasswordUpdateFormProps = {
  enabled: boolean;
};

function getPasswordUpdateErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("same password")) {
    return "新密码不能和旧密码完全一致。";
  }

  if (normalized.includes("password")) {
    return "密码不符合要求，请至少输入 6 位字符。";
  }

  return message || "密码更新失败，请稍后再试。";
}

export function PasswordUpdateForm({ enabled }: PasswordUpdateFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enabled || pending) {
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要 6 位字符。");
      setMessage(null);
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请重新确认。");
      setMessage(null);
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(getPasswordUpdateErrorMessage(updateError.message));
      setPending(false);
      return;
    }

    setMessage("密码已更新，正在返回账号中心。");
    window.location.assign("/account?updated=password");
  }

  const inputType = showPassword ? "text" : "password";
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
      <label className="form-field">
        <span>新密码</span>
        <span className={styles.passwordField}>
          <input
            className="input"
            type={inputType}
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="至少 6 位字符"
            disabled={!enabled || pending}
            minLength={6}
            required
          />
          {renderPasswordToggle()}
        </span>
      </label>

      <label className="form-field">
        <span>确认新密码</span>
        <span className={styles.passwordField}>
          <input
            className="input"
            type={inputType}
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

      {error ? <div className={`note-strip ${styles.message}`}>{error}</div> : null}
      {message ? <div className={`note-strip ${styles.message}`}>{message}</div> : null}

      <button
        type="submit"
        className="button auth-button"
        disabled={!enabled || pending}
      >
        {pending ? "正在更新..." : "更新密码"}
      </button>
    </form>
  );
}
