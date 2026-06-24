"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  KeyRound,
  Link2,
  Mail,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { EmailAuthForm } from "@/components/email-auth-form";
import { WechatQrLogin } from "@/components/wechat-qr-login";

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

      <div className={styles.entryGrid}>
        <section className={`auth-card ${styles.entryCard} ${styles.newUserCard}`}>
          <div className={styles.cardHeading}>
            <p className="home-kicker">New members</p>
            <div>
              <h2>{isOnboardingFlow ? "新用户，用微信加入" : "新用户，用微信登录"}</h2>
              <p>
                {isOnboardingFlow
                  ? "第一次加入社区时，直接使用微信创建账号，随后进入资料完善页。"
                  : "第一次使用社区账号时，直接使用微信创建账号，后续都可以用微信回来。"}
              </p>
            </div>
          </div>

          <WechatQrLogin
            enabled={enabled && wechatEnabled}
            nextPath={nextPath}
          />

          <div className={styles.entryNotice}>
            <UserPlus aria-hidden="true" strokeWidth={1.9} />
            <span>适合第一次注册、第一次报名活动或第一次完善成员资料。</span>
          </div>

          <p className={styles.cautionNote}>
            已有邮箱账号或原 Google 账号时，请走右侧入口，避免创建出第二个账号。
          </p>
        </section>

        <section className={`auth-card ${styles.entryCard} ${styles.existingUserCard}`}>
          <div className={styles.cardHeading}>
            <p className="home-kicker">Existing account</p>
            <div>
              <h2>已有账号，先用原方式登录</h2>
              <p>登录到账号中心后，再在账号页绑定微信。绑定完成后，下次就能直接用微信进入同一个账号。</p>
            </div>
          </div>

          <ul className={styles.legacyFlowList}>
            <li>
              <Mail aria-hidden="true" strokeWidth={1.9} />
              邮箱密码账号：直接用邮箱登录。
            </li>
            <li>
              <KeyRound aria-hidden="true" strokeWidth={1.9} />
              原 Google 登录账号：输入同一个 Google 邮箱，先找回并设置邮箱密码。
            </li>
            <li>
              <Link2 aria-hidden="true" strokeWidth={1.9} />
              登录成功后进入账号中心，点击「绑定微信」。
            </li>
          </ul>

          <EmailAuthForm enabled={enabled} allowSignUp={false} nextPath={nextPath} />
        </section>
      </div>

      {!enabled ? (
        <p className={styles.hint}>
          当前登录服务暂未启用，请稍后再试。
        </p>
      ) : null}

      <aside className={styles.sideStack}>
        <div className={`auth-card ${styles.infoCard}`}>
          <UserCheck aria-hidden="true" strokeWidth={1.9} />
          <h2>{isOnboardingFlow ? "加入后你可以做什么" : "账号绑定以后"}</h2>
          <p>
            {isOnboardingFlow
              ? "社区账号会承载你的成员资料、活动参与记录与协作信息，后续都在同一个个人页里持续更新。"
              : "绑定微信不会覆盖原账号，只是给同一个社区账号增加一种更方便的登录方式。"}
          </p>
          <ul className={styles.capabilityList}>
            <li>
              <BadgeCheck aria-hidden="true" strokeWidth={1.9} />
              {isOnboardingFlow ? "完成加入资料并持续更新" : "保留个人资料与报名记录"}
            </li>
            <li>
              <CalendarDays aria-hidden="true" strokeWidth={1.9} />
              查看活动报名与参与记录
            </li>
            <li>
              <Sparkles aria-hidden="true" strokeWidth={1.9} />
              后续用微信更快回到账号中心
            </li>
          </ul>
        </div>

        <div className={`auth-card ${styles.accountCard}`}>
          <h2>{isOnboardingFlow ? "资料提交后还能继续更新" : "不确定自己是哪类账号？"}</h2>
          <p>
            {isOnboardingFlow
              ? "这不是一次性申请。你之后仍然可以在个人页维护资料、查看活动记录，并持续参与社区交流与合作。"
              : "如果你以前报名过活动、填过成员资料或用 Google 登录过，优先按已有账号处理。"}
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
