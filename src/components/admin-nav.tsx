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
  Radar,
  Share2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn, cssModuleCxWithGlobals } from "@/lib/utils";

import styles from "@/app/admin/admin-layout.module.css";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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
      },
      {
        href: "/admin/updates",
        label: "社区动态",
        icon: MessagesSquare,
      },
      {
        href: "/admin/ai-news-radar",
        label: "AI 信息雷达",
        icon: Radar,
      },
      {
        href: "/admin/social",
        label: "社交入口",
        icon: Share2,
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
      },
      {
        href: "/admin/projects",
        label: "共建项目",
        icon: BriefcaseBusiness,
      },
      {
        href: "/admin/works",
        label: "成员作品",
        icon: Boxes,
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
      },
      {
        href: "/admin/sponsors",
        label: "赞助者",
        icon: BadgeCheck,
      },
    ],
  },
];

const cx = cssModuleCxWithGlobals.bind(null, styles);
const defaultAdminNavGroupId = adminNavGroups[0]?.id ?? null;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const activeGroupId = useMemo<string | null>(
    () =>
      adminNavGroups.find((group) =>
        group.items.some((item) => isActivePath(pathname, item.href)),
      )?.id ?? defaultAdminNavGroupId,
    [pathname],
  );
  const [openGroupId, setOpenGroupId] = useState<string | null>(activeGroupId);

  useEffect(() => {
    setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

  return (
    <nav className={cx("admin-nav")} aria-label="后台导航">
      {adminNavGroups.map((group) => {
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
