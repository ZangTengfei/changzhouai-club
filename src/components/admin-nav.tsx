"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, CalendarDays, Handshake, Share2, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    href: "/admin/events",
    label: "活动管理",
    description: "活动列表、创建与编辑",
    icon: CalendarDays,
  },
  {
    href: "/admin/members",
    label: "成员管理",
    description: "成员资料与参与情况",
    icon: Users,
  },
  {
    href: "/admin/leads",
    label: "合作线索",
    description: "需求线索与合作跟进",
    icon: Handshake,
  },
  {
    href: "/admin/sponsors",
    label: "赞助者",
    description: "Logo、详情与图片排序",
    icon: BadgeCheck,
  },
  {
    href: "/admin/social",
    label: "社交入口",
    description: "平台入口与微信群二维码",
    icon: Share2,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "admin-nav-item group flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
              isActive ? "admin-nav-item-active" : null,
            )}
          >
            <span
              className={cn(
                "admin-nav-icon mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                isActive ? "admin-nav-icon-active" : null,
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="grid gap-0.5">
              <strong className="text-sm font-semibold">{item.label}</strong>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
