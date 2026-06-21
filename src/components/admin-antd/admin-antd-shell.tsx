"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  GiftOutlined,
  HomeOutlined,
  ProjectOutlined,
  RobotOutlined,
  SettingOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Card, Layout, Menu, Space, Typography, type MenuProps } from "antd";

import {
  hasAnyAdminPermission,
  type AdminPermissionKey,
} from "@/lib/admin/permissions";

import styles from "./admin-antd-shell.module.css";

type AdminNavLeaf = {
  key: string;
  href: string;
  label: string;
  icon: ReactNode;
  permissions: AdminPermissionKey[];
};

type AdminNavGroup = {
  key: string;
  label: string;
  children: AdminNavLeaf[];
};

const navGroups: AdminNavGroup[] = [
  {
    key: "workspace",
    label: "工作台",
    children: [
      {
        key: "/admin",
        href: "/admin",
        label: "运营总控台",
        icon: <BarChartOutlined />,
        permissions: ["admin.access"],
      },
    ],
  },
  {
    key: "content",
    label: "内容运营",
    children: [
      {
        key: "/admin/events",
        href: "/admin/events",
        label: "活动管理",
        icon: <CalendarOutlined />,
        permissions: ["events.read"],
      },
      {
        key: "/admin/updates",
        href: "/admin/updates",
        label: "内容发布",
        icon: <FileDoneOutlined />,
        permissions: ["updates.read"],
      },
      {
        key: "/admin/workflows",
        href: "/admin/workflows",
        label: "工作流中枢",
        icon: <ProjectOutlined />,
        permissions: ["workflows.read"],
      },
      {
        key: "/admin/works",
        href: "/admin/works",
        label: "资料与作品",
        icon: <FolderOpenOutlined />,
        permissions: ["works.read", "updates.review"],
      },
    ],
  },
  {
    key: "community",
    label: "成员生态",
    children: [
      {
        key: "/admin/members",
        href: "/admin/members",
        label: "成员管理",
        icon: <TeamOutlined />,
        permissions: ["members.read"],
      },
      {
        key: "/admin/projects",
        href: "/admin/projects",
        label: "共建项目",
        icon: <AppstoreOutlined />,
        permissions: ["projects.read"],
      },
      {
        key: "/admin/social",
        href: "/admin/social",
        label: "社群运营",
        icon: <UsergroupAddOutlined />,
        permissions: ["social.write"],
      },
    ],
  },
  {
    key: "partnership",
    label: "合作资源",
    children: [
      {
        key: "/admin/leads",
        href: "/admin/leads",
        label: "合作线索",
        icon: <BankOutlined />,
        permissions: ["leads.read"],
      },
      {
        key: "/admin/sponsors",
        href: "/admin/sponsors",
        label: "合作机构",
        icon: <GiftOutlined />,
        permissions: ["sponsors.read"],
      },
    ],
  },
  {
    key: "system",
    label: "工作流中枢",
    children: [
      {
        key: "/admin/workflows/review",
        href: "/admin/workflows",
        label: "审批中心",
        icon: <CheckSquareOutlined />,
        permissions: ["workflows.review"],
      },
      {
        key: "/admin/workflows/ai",
        href: "/admin/workflows",
        label: "AI 任务队列",
        icon: <RobotOutlined />,
        permissions: ["ai_jobs.run", "ai_jobs.review"],
      },
      {
        key: "/admin/workflows/assets",
        href: "/admin/works",
        label: "资产中心",
        icon: <DatabaseOutlined />,
        permissions: ["works.read", "workflows.read"],
      },
      {
        key: "/admin/settings",
        href: "/admin",
        label: "系统设置",
        icon: <SettingOutlined />,
        permissions: ["system.manage_settings"],
      },
    ],
  },
];

function getSelectedKey(pathname: string) {
  const candidates = navGroups.flatMap((group) => group.children);
  const active = candidates
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return active?.key ?? "/admin";
}

function getOpenKeys(selectedKey: string) {
  return navGroups
    .filter((group) => group.children.some((item) => item.key === selectedKey))
    .map((group) => group.key);
}

function buildMenuItems(permissions: string[]): MenuProps["items"] {
  const items: NonNullable<MenuProps["items"]> = [];

  for (const group of navGroups) {
    const children = group.children.filter((item) =>
      hasAnyAdminPermission(permissions, item.permissions),
    );

    if (children.length === 0) {
      continue;
    }

    items.push({
      key: group.key,
      label: group.label,
      type: group.key === "workspace" ? "group" : undefined,
      children: children.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: <Link href={item.href}>{item.label}</Link>,
      })),
    });
  }

  return items;
}

function getInitials(email: string | null) {
  return email?.slice(0, 1).toUpperCase() || "AI";
}

export function AdminAntdShell({
  children,
  permissions,
  userEmail,
  memberStatus,
}: {
  children: ReactNode;
  permissions: string[];
  userEmail: string | null;
  memberStatus: string | null;
}) {
  const pathname = usePathname();
  const selectedKey = getSelectedKey(pathname);
  const menuItems = buildMenuItems(permissions);

  return (
    <Layout className={styles.shell}>
      <Layout.Sider className={styles.sider} width={236} breakpoint="lg" collapsedWidth={0}>
        <div className={styles.brand}>
          <div className={styles.logo}>AI</div>
          <div>
            <Typography.Text strong>Changzhou AI Club</Typography.Text>
            <div className={styles.brandSub}>社区运营操作系统</div>
          </div>
        </div>

        <Menu
          mode="inline"
          className={styles.menu}
          items={menuItems}
          selectedKeys={[selectedKey]}
          defaultOpenKeys={getOpenKeys(selectedKey)}
        />

        <Card className={styles.sidebarStats} variant="outlined">
          <Typography.Text strong>本周运营概览</Typography.Text>
          <div className={styles.statLine}>
            <span>活动数</span>
            <strong>8</strong>
          </div>
          <div className={styles.statLine}>
            <span>进行中</span>
            <strong>3</strong>
          </div>
          <div className={styles.statLine}>
            <span>待审批</span>
            <strong>3</strong>
          </div>
          <Button type="link" href="/admin" className={styles.statsLink}>
            查看全部数据
          </Button>
        </Card>

        <div className={styles.profile}>
          <Space>
            <Avatar>{getInitials(userEmail)}</Avatar>
            <span>
              <Typography.Text strong>运营同学</Typography.Text>
              <div className={styles.brandSub}>{memberStatus === "admin" ? "超级管理员" : "运营成员"}</div>
            </span>
          </Space>
        </div>
      </Layout.Sider>

      <Layout.Content className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </Layout.Content>
    </Layout>
  );
}

export function AdminAccessDenied({
  userId,
  memberStatus,
}: {
  userId: string;
  memberStatus: string | null;
}) {
  return (
    <div className={styles.accessState}>
      <Card className={styles.accessCard}>
        <Space align="start" size={18}>
          <div className={styles.logo}>AI</div>
          <div>
            <Typography.Text type="secondary">Admin</Typography.Text>
            <Typography.Title level={2}>当前账号还没有后台权限</Typography.Title>
            <Typography.Paragraph>
              当前成员状态是 {memberStatus ?? "pending"}。社区后台仅对已授权后台角色开放。
            </Typography.Paragraph>
            <Typography.Text code>{userId}</Typography.Text>
            <div className={styles.accessActions}>
              <Button type="primary" href="/">
                <HomeOutlined />
                返回首页
              </Button>
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
}
