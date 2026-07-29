"use client";

import type { CSSProperties, ReactNode } from "react";
import { HomeOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Card, Result, Tag } from "antd";
import Link from "next/link";

import { AdminNav } from "@/components/admin-nav";
import { SiteLogoMark } from "@/components/site-logo-mark";

const adminTheme = {
  "--surface-rgb": "255, 255, 255",
  "--surface-soft-rgb": "255, 255, 255",
  "--surface-muted-rgb": "249, 250, 251",
  "--surface-alt-rgb": "249, 250, 251",
  "--ink-rgb": "31, 41, 55",
  "--accent-rgb": "22, 119, 255",
  "--accent-strong-rgb": "9, 88, 217",
  "--surface": "#ffffff",
  "--surface-strong": "#ffffff",
  "--background": "#f5f5f5",
  "--foreground": "#1f2937",
  "--card": "#ffffff",
  "--card-foreground": "#1f2937",
  "--secondary": "#ffffff",
  "--secondary-foreground": "#374151",
  "--muted-surface": "#f9fafb",
  "--muted-foreground": "#6b7280",
  "--border": "#e5e7eb",
  "--input": "#d1d5db",
  "--primary": "#1677ff",
  "--primary-foreground": "#ffffff",
  "--accent": "#1677ff",
  "--accent-strong": "#0958d9",
  "--admin-panel": "#ffffff",
  "--admin-panel-alt": "#f9fafb",
  "--admin-border": "#e5e7eb",
  "--admin-border-strong": "#d1d5db",
  "--admin-text": "#1f2937",
  "--admin-text-muted": "#6b7280",
  "--admin-radius-sm": "6px",
  "--admin-radius-md": "8px",
  "--admin-radius-lg": "8px",
  "--admin-shadow": "0 1px 3px rgba(0, 0, 0, 0.05)",
} as CSSProperties;

export function AdminAccessDenied({ status, userId }: { status: string; userId: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f5f5] p-6">
      <Card className="w-[min(680px,100%)]">
        <Result
          status="403"
          title="当前账号还没有后台权限"
          subTitle={`当前成员状态：${status}。如需开通权限，请联系站点管理员。账号 ID：${userId}`}
          extra={<Link href="/"><Button type="primary" icon={<HomeOutlined />}>返回首页</Button></Link>}
        />
      </Card>
    </div>
  );
}

export function AdminShell({ permissions, children }: { permissions: string[]; children: ReactNode }) {
  return (
    <div
      className="admin-app-shell grid min-h-screen grid-cols-[240px_minmax(0,1fr)] bg-[#f5f5f5] font-['SF_Pro_Text','Segoe_UI','PingFang_SC','Microsoft_YaHei',sans-serif] text-[#1f2937] max-lg:block [&:has([data-admin-editor-fullscreen])]:grid-cols-[minmax(0,1fr)] [&:has([data-admin-editor-fullscreen])_.admin-desktop-sidebar]:hidden [&:has([data-admin-editor-fullscreen])_.admin-mobile-nav]:hidden [&:has([data-admin-editor-fullscreen])_.admin-mobile-topbar]:hidden [&_.admin-main-inner:has([data-admin-editor-fullscreen])]:w-full [&_.admin-main-inner:has([data-admin-editor-fullscreen])]:max-w-none [&_.admin-main-inner:has([data-admin-editor-fullscreen])]:p-0"
      data-admin-ui="antd"
      style={adminTheme}
    >
      <aside className="admin-desktop-sidebar relative z-10 min-h-screen border-r border-[#e5e7eb] bg-white max-lg:hidden">
        <div className="sticky top-0 flex h-screen w-60 flex-col px-3 py-4">
          <Link href="/admin" className="flex min-h-[58px] items-center gap-2.5 px-3 pt-2 pb-4 text-[#111827] no-underline">
            <span className="grid size-[38px] shrink-0 place-items-center"><SiteLogoMark className="size-[34px]" /></span>
            <div className="grid min-w-0 gap-0.5"><strong className="text-[15px] leading-[1.25]">常州 AI Club</strong><span className="text-xs text-[#8c8c8c]">管理后台</span></div>
          </Link>
          <div className="mx-2 mt-0.5 mb-3 grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2 rounded-[6px] border border-[#e6f4ff] bg-[#f0f7ff] px-3 py-2.5 text-[13px] text-[#1677ff]">
            <SafetyCertificateOutlined /><span>后台权限</span><Tag color="blue">{permissions.length} 项</Tag>
          </div>
          <AdminNav permissions={permissions} />
          <div className="mt-auto border-t border-[#f0f0f0] px-2 pt-3">
            <Link href="/" className="block"><Button block icon={<HomeOutlined />}>返回网站首页</Button></Link>
          </div>
        </div>
      </aside>
      <main className="min-w-0 bg-[#f5f5f5]">
        <header className="admin-mobile-topbar sticky top-0 z-20 hidden min-h-[60px] items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-2.5 max-lg:flex">
          <Link href="/admin" className="flex items-center gap-[9px] text-[#111827] no-underline">
            <SiteLogoMark className="size-[34px]" />
            <span className="grid"><strong className="text-sm">常州 AI Club</strong><small className="text-[11px] text-[#8c8c8c]">管理后台</small></span>
          </Link>
          <Link href="/"><Button size="small" icon={<HomeOutlined />}>首页</Button></Link>
        </header>
        <div className="admin-mobile-nav hidden overflow-x-auto border-b border-[#e5e7eb] bg-white max-lg:block max-lg:[&_.admin-antd-menu.ant-menu]:flex max-lg:[&_.admin-antd-menu.ant-menu]:min-w-max max-lg:[&_.admin-antd-menu.ant-menu]:px-2 max-lg:[&_.admin-antd-menu.ant-menu]:py-1 max-lg:[&_.ant-menu-item-group]:contents max-lg:[&_.ant-menu-item-group-title]:hidden max-lg:[&_.ant-menu-item-group-list]:m-0 max-lg:[&_.ant-menu-item-group-list]:flex max-lg:[&_.ant-menu-item]:w-auto max-lg:[&_.ant-menu-item]:min-w-max"><AdminNav permissions={permissions} /></div>
        <div className="admin-main-inner mx-auto min-h-screen w-[min(100%,1600px)] p-6 max-lg:p-4 max-sm:p-3">{children}</div>
      </main>
    </div>
  );
}
