import type { MetadataRoute } from "next";

import { getPublicMembersDirectory } from "@/lib/community-members";
import { getVisibleProjectOpportunities } from "@/lib/community-projects";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { getPublicSponsors } from "@/lib/sponsors";

const routes = [
  "",
  "/events",
  "/news",
  "/projects",
  "/members",
  "/join",
  "/cooperate",
  "/about",
  "/archive",
  "/reports",
  "/reports/ai-office-course-survey",
  "/reports/opc-package-survey",
  "/reports/training-demand-survey",
  "/faq",
  "/docs",
  "/docs/getting-started",
  "/docs/agents/install-guide",
  "/docs/agents/codex-guide",
  "/docs/events/2026-03-21-ai-salon",
  "/docs/events/2026-04-11-gov-ai-salon",
  "/docs/events/2026-04-25-ai-salon",
  "/docs/events/2026-05-23-jintan-opc-salon",
  "/docs/guides/co-build-workflow",
  "/docs/contributing",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sponsors, memberDirectory, projectDirectory] = await Promise.all([
    getPublicSponsors(),
    getPublicMembersDirectory(),
    getVisibleProjectOpportunities(),
  ]);
  const staticRoutes = routes.map((route) => ({
    url: `https://changzhouai.club${route}`,
    lastModified: new Date(),
  }));

  const sponsorRoutes = sponsors.map((sponsor) => ({
    url: `https://changzhouai.club/sponsors/${sponsor.slug}`,
    lastModified: new Date(),
  }));

  const memberRoutes = memberDirectory.members.map((member) => ({
    url: `https://changzhouai.club${getMemberPublicSlugPath(member)}`,
    lastModified: new Date(),
  }));

  const projectRoutes = projectDirectory.opportunities
    .filter((opportunity) => opportunity.visibility === "public")
    .map((opportunity) => ({
      url: `https://changzhouai.club${opportunity.href}`,
      lastModified: new Date(opportunity.updatedAt),
    }));

  return [...staticRoutes, ...sponsorRoutes, ...memberRoutes, ...projectRoutes];
}
