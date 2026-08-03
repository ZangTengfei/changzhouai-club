"use client";

import {
  CalendarOutlined,
  DesktopOutlined,
  FileTextOutlined,
  FundProjectionScreenOutlined,
  GiftOutlined,
  NotificationOutlined,
  ProjectOutlined,
  ReadOutlined,
  SettingOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Menu, type MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { hasAnyAdminPermission, type AdminPermissionKey } from "@/lib/admin/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  permissions: AdminPermissionKey[];
};

type NavGroup = { key: string; label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    key: "content",
    label: "内容运营",
    items: [
      { href: "/admin/events", label: "活动管理", icon: <CalendarOutlined />, permissions: ["events.read"] },
      { href: "/admin/updates", label: "社区动态", icon: <NotificationOutlined />, permissions: ["updates.read"] },
      { href: "/admin/reports", label: "群聊日报", icon: <ReadOutlined />, permissions: ["updates.publish"] },
      { href: "/admin/social", label: "社媒素材", icon: <ShareAltOutlined />, permissions: ["social.write"] },
    ],
  },
  {
    key: "community",
    label: "成员生态",
    items: [
      { href: "/admin/members", label: "成员管理", icon: <TeamOutlined />, permissions: ["members.read"] },
      { href: "/admin/spaces", label: "空间管理", icon: <DesktopOutlined />, permissions: ["spaces.read"] },
      { href: "/admin/projects", label: "共建项目", icon: <ProjectOutlined />, permissions: ["projects.read"] },
      { href: "/admin/works", label: "成员作品", icon: <FundProjectionScreenOutlined />, permissions: ["works.read", "updates.review"] },
    ],
  },
  {
    key: "partnership",
    label: "合作资源",
    items: [
      { href: "/admin/leads", label: "合作线索", icon: <UserSwitchOutlined />, permissions: ["leads.read"] },
      { href: "/admin/sponsors", label: "赞助者", icon: <GiftOutlined />, permissions: ["sponsors.read"] },
    ],
  },
  {
    key: "system",
    label: "系统管理",
    items: [
      { href: "/admin/settings", label: "站点设置", icon: <SettingOutlined />, permissions: ["system.manage_settings"] },
    ],
  },
];

export function AdminNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = useMemo<MenuProps["items"]>(() => groups.map((group) => {
    const children = group.items
      .filter((item) => hasAnyAdminPermission(permissions, item.permissions))
      .map((item) => ({ key: item.href, label: item.label, icon: item.icon }));

    return children.length ? { type: "group" as const, key: group.key, label: group.label, children } : null;
  }).filter(Boolean), [permissions]);

  const selectedKey = groups
    .flatMap((group) => group.items)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;

  return (
    <Menu
      className="admin-antd-menu flex-1 overflow-y-auto border-e-0! bg-transparent! [&_.ant-menu-item-group-title]:px-4 [&_.ant-menu-item-group-title]:pt-3.5 [&_.ant-menu-item-group-title]:pb-1.5 [&_.ant-menu-item-group-title]:text-[11px] [&_.ant-menu-item-group-title]:font-semibold [&_.ant-menu-item-group-title]:tracking-[0.08em] [&_.ant-menu-item-group-title]:text-[#8c8c8c] [&_.ant-menu-item]:mx-1 [&_.ant-menu-item]:w-[calc(100%-8px)]"
      mode="inline"
      items={items}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onClick={({ key }) => router.push(key)}
    />
  );
}
