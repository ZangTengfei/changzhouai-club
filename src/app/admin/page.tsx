import { redirect } from "next/navigation";

import { hasAdminPermission } from "@/lib/admin/permissions";
import { getAdminContext } from "@/lib/supabase/guards";

const adminLandingCandidates = [
  { href: "/admin/events", permission: "events.read" },
  { href: "/admin/updates", permission: "updates.read" },
  { href: "/admin/members", permission: "members.read" },
  { href: "/admin/projects", permission: "projects.read" },
  { href: "/admin/works", permission: "works.read" },
  { href: "/admin/leads", permission: "leads.read" },
  { href: "/admin/sponsors", permission: "sponsors.read" },
  { href: "/admin/social", permission: "social.write" },
] as const;

export default async function AdminPage() {
  const { permissions } = await getAdminContext();
  const target =
    adminLandingCandidates.find((candidate) =>
      hasAdminPermission(permissions, candidate.permission),
    )?.href ?? "/account?updated=staff_required";

  redirect(target);
}
