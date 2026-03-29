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
        <h2>先接入 Google 登录</h2>
        <p>
          这一步会先把社区账号体系搭起来，后续成员资料、活动报名、分享记录和权限都可以落在同一个用户体系上。
        </p>
        <GoogleSignInButton enabled={enabled} nextPath={nextPath} />
        {!enabled ? (
          <p className="auth-hint">
            还没有配置 Supabase 环境变量。把 `.env.example` 里的两个公开变量填好后，这个按钮就可以直接工作。
          </p>
        ) : null}
      </div>

      <div className="auth-card">
        <h2>微信绑定怎么做</h2>
        <p>
          后续更建议做“先登录，再绑定微信”的模式。这样你可以先把统一用户 ID 和资料体系跑起来，再把微信身份补到同一个账号上。
        </p>
        <ul className="detail-list">
          <li>第一阶段：Google 登录 + 完善资料</li>
          <li>第二阶段：账号中心里增加微信扫码绑定</li>
          <li>第三阶段：视需求再决定是否开放微信直接登录</li>
        </ul>
        <p className="auth-hint">
          这样做的好处是开发成本更低，也不会把第一版登录流程做得太重。
        </p>
      </div>

      <div className="auth-card">
        <h2>登录后会去哪</h2>
        <p>
          登录成功后会跳转到账号页，后面我们会把“成员资料完善”“分享意愿”“活动参与记录”都放在那里。
        </p>
        <Link href="/account" className="button button-secondary auth-link">
          查看账号页结构
        </Link>
      </div>
    </div>
  );
}
