"use client";

import Link from "next/link";

import { GoogleSignInButton } from "@/components/google-sign-in-button";

type LoginPanelProps = {
  enabled: boolean;
  nextPath?: string;
  error?: string;
};

const errorMap: Record<string, string> = {
  oauth_callback: "Google 登录回调失败，请确认 Supabase 和 Google OAuth 配置是否完整。",
};

export function LoginPanel({
  enabled,
  nextPath = "/account",
  error,
}: LoginPanelProps) {
  return (
    <div className="auth-stack">
      {error ? (
        <div className="note-strip">{errorMap[error] ?? "登录过程中出现了未知错误。"}</div>
      ) : null}

      <div className="auth-card">
        <h2>使用 Google 登录</h2>
        <p>
          登录后可进入社区账号中心，完善资料、查看活动报名记录，并参与社区活动与协作。
        </p>
        <GoogleSignInButton enabled={enabled} nextPath={nextPath} />
        {!enabled ? (
          <p className="auth-hint">
            当前登录服务暂未启用，请稍后再试。
          </p>
        ) : null}
      </div>

      <div className="auth-card">
        <h2>账号能力</h2>
        <p>
          社区账号会承载成员资料、活动参与记录与协作信息，帮助你在社区内持续积累个人档案。
        </p>
        <ul className="detail-list">
          <li>完善个人资料与技能方向</li>
          <li>查看活动报名与参与记录</li>
          <li>逐步接入更多社区身份与协作能力</li>
        </ul>
      </div>

      <div className="auth-card">
        <h2>登录后将进入账号中心</h2>
        <p>
          你可以在账号中心维护个人资料、查看活动记录，并持续参与社区交流与合作。
        </p>
        <Link href="/account" className="button button-secondary auth-link">
          查看账号中心
        </Link>
      </div>
    </div>
  );
}
