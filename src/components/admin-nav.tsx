"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Handshake,
  MessagesSquare,
  Newspaper,
  Share2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  hasAnyAdminPermission,
  type AdminPermissionKey,
} from "@/lib/admin/permissions";
import { cn, cssModuleCxWithGlobals } from "@/lib/utils";

import styles from "@/app/admin/admin-layout.module.css";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions: AdminPermissionKey[];
};

type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

const adminNavGroups: AdminNavGroup[] = [
  {
    id: "content",
    label: "内容运营",
    items: [
      {
        href: "/admin/events",
        label: "活动管理",
        icon: CalendarDays,
        permissions: ["events.read"],
      },
      {
        href: "/admin/updates",
        label: "社区动态",
        icon: MessagesSquare,
        permissions: ["updates.read"],
      },
      {
        href: "/admin/reports",
        label: "群聊日报",
        icon: Newspaper,
        permissions: ["updates.publish"],
      },
      {
        href: "/admin/social",
        label: "社媒素材",
        icon: Share2,
        permissions: ["social.write"],
      },
    ],
  },
  {
    id: "community",
    label: "成员生态",
    items: [
      {
        href: "/admin/members",
        label: "成员管理",
        icon: Users,
        permissions: ["members.read"],
      },
      {
        href: "/admin/projects",
        label: "共建项目",
        icon: BriefcaseBusiness,
        permissions: ["projects.read"],
      },
      {
        href: "/admin/works",
        label: "成员作品",
        icon: Boxes,
        permissions: ["works.read", "updates.review"],
      },
    ],
  },
  {
    id: "partnership",
    label: "合作资源",
    items: [
      {
        href: "/admin/leads",
        label: "合作线索",
        icon: Handshake,
        permissions: ["leads.read"],
      },
      {
        href: "/admin/sponsors",
        label: "赞助者",
        icon: BadgeCheck,
        permissions: ["sponsors.read"],
      },
    ],
  },
];

const cx = cssModuleCxWithGlobals.bind(null, styles);

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const visibleGroups = useMemo(
    () =>
      adminNavGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            hasAnyAdminPermission(permissions, item.permissions),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [permissions],
  );
  const activeGroupId = useMemo<string | null>(
    () =>
      visibleGroups.find((group) =>
        group.items.some((item) => isActivePath(pathname, item.href)),
      )?.id ?? visibleGroups[0]?.id ?? null,
    [pathname, visibleGroups],
  );
  const [openGroupId, setOpenGroupId] = useState<string | null>(activeGroupId);

  useEffect(() => {
    setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

  return (
    <nav className={cx("admin-nav")} aria-label="后台导航">
      {visibleGroups.map((group) => {
        const isOpen = openGroupId === group.id;
        const isGroupActive = activeGroupId === group.id;
        const panelId = `admin-nav-group-${group.id}`;

        return (
          <section
            key={group.id}
            className={cn(
              cx("admin-nav-group"),
              isGroupActive ? cx("admin-nav-group-active") : null,
            )}
          >
            <button
              type="button"
              className={cx("admin-nav-group-trigger")}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() =>
                setOpenGroupId((currentGroupId) =>
                  currentGroupId === group.id && group.id !== activeGroupId
                    ? null
                    : group.id,
                )
              }
            >
              <span className={cx("admin-nav-group-copy")}>
                <strong>{group.label}</strong>
              </span>
              <span className={cx("admin-nav-group-meta")}>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    cx("admin-nav-group-chevron"),
                    isOpen ? cx("admin-nav-group-chevron-open") : null,
                  )}
                />
              </span>
            </button>

            {isOpen ? (
              <div id={panelId} className={cx("admin-nav-group-items")}>
                {group.items.map((item) => {
                  const isActive = isActivePath(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        cx("admin-nav-item group transition-colors"),
                        isActive ? cx("admin-nav-item-active") : null,
                      )}
                    >
                      <span
                        className={cn(
                          cx("admin-nav-icon flex size-8 shrink-0 items-center justify-center rounded-lg"),
                          isActive ? cx("admin-nav-icon-active") : null,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className={cx("admin-nav-item-copy")}>
                        <strong className="text-sm font-semibold">{item.label}</strong>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
