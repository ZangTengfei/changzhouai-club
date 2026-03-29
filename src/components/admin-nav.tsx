"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin/events", label: "活动管理", description: "活动列表、创建与编辑" },
  { href: "/admin/members", label: "成员管理", description: "成员资料与参与情况" },
  { href: "/admin/leads", label: "合作线索", description: "需求线索与合作跟进" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "admin-nav-item admin-nav-item-active" : "admin-nav-item"}
          >
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}
