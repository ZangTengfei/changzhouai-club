"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, Sparkles } from "lucide-react";

import { EmailAuthForm } from "@/components/email-auth-form";
import { WechatAuthButton } from "@/components/wechat-auth-button";

import styles from "./login-panel.module.css";

type LoginPanelProps = {
  enabled: boolean;
  wechatEnabled?: boolean;
  nextPath?: string;
  error?: string;
};

const errorMap: Record<string, string> = {
  oauth_callback: "登录回调失败，请稍后重试，或改用邮箱密码登录。",
  recovery_link: "密码重设链接不完整，请重新发送找回密码邮件。",
  recovery_link_expired: "这封邮件里的链接已失效或已经使用过，请重新发送找回密码邮件，或输入邮件里的 6 位验证码。",
};

export function LoginPanel({
  enabled,
  wechatEnabled = false,
  nextPath = "/account",
  error,
}: LoginPanelProps) {
  const isOnboardingFlow = nextPath.startsWith("/account?onboarding=1");

  return (
    <div className={`auth-stack ${styles.grid}`}>
      {error ? (
        <div className={`note-strip ${styles.errorNote}`}>
          {errorMap[error] ?? "登录过程中出现了未知错误。"}
        </div>
      ) : null}

      <div className={`auth-card ${styles.primaryCard}`}>
        <div className={styles.cardHeading}>
          <p className="home-kicker">Account</p>
          <div>
            <h2>{isOnboardingFlow ? "先登录，再完善加入资料" : "登录或注册社区账号"}</h2>
            <p>
              {isOnboardingFlow
                ? "登录后会直接进入资料完善页。显示名和微信号是必填项，其他内容可以稍后继续补充。"
                : "登录后可进入社区账号中心，完善资料、查看活动报名记录，并参与社区活动与协作。"}
            </p>
          </div>
        </div>

        <EmailAuthForm enabled={enabled} nextPath={nextPath} />
        <WechatAuthButton
          enabled={enabled && wechatEnabled}
          mode="sign-in"
          nextPath={nextPath}
        />

        <p className={styles.recoveryNote}>
          原 Google 登录用户请使用同一个邮箱找回密码，设置完成后即可用邮箱密码登录。
        </p>

        {!enabled ? (
          <p className={styles.hint}>
            当前登录服务暂未启用，请稍后再试。
          </p>
        ) : null}
      </div>

      <aside className={styles.sideStack}>
        <div className={`auth-card ${styles.infoCard}`}>
          <Sparkles aria-hidden="true" strokeWidth={1.9} />
          <h2>{isOnboardingFlow ? "加入后你可以做什么" : "账号能力"}</h2>
          <p>
            {isOnboardingFlow
              ? "社区账号会承载你的成员资料、活动参与记录与协作信息，后续都在同一个个人页里持续更新。"
              : "社区账号会承载成员资料、活动参与记录与协作信息，帮助你在社区内持续积累个人档案。"}
          </p>
          <ul className={styles.capabilityList}>
            <li>
              <BadgeCheck aria-hidden="true" strokeWidth={1.9} />
              {isOnboardingFlow ? "完成加入资料并持续更新" : "完善个人资料与技能方向"}
            </li>
            <li>
              <CalendarDays aria-hidden="true" strokeWidth={1.9} />
              查看活动报名与参与记录
            </li>
            <li>
              <Sparkles aria-hidden="true" strokeWidth={1.9} />
              逐步接入更多社区身份与协作能力
            </li>
          </ul>
        </div>

        <div className={`auth-card ${styles.accountCard}`}>
          <h2>{isOnboardingFlow ? "资料提交后还能继续更新" : "登录后将进入账号中心"}</h2>
          <p>
            {isOnboardingFlow
              ? "这不是一次性申请。你之后仍然可以在个人页维护资料、查看活动记录，并持续参与社区交流与合作。"
              : "你可以在账号中心维护个人资料、查看活动记录，并持续参与社区交流与合作。"}
          </p>
          <Link href="/account" className="button button-secondary auth-link">
            {isOnboardingFlow ? "查看个人页" : "查看账号中心"}
            <ArrowRight aria-hidden="true" strokeWidth={1.9} />
          </Link>
        </div>
      </aside>
    </div>
  );
}
