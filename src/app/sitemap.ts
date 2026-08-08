import type { MetadataRoute } from "next";

import { getPublishedEventSummaries } from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getVisibleProjectOpportunities } from "@/lib/community-projects";
import { getPublicCommunityUpdatesDirectory } from "@/lib/community-updates";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import {
  SITE_URL,
  isSearchIndexablePublicMember,
} from "@/lib/seo";
import { getPublicSponsors } from "@/lib/sponsors";

const routes = [
  "",
  "/events",
  "/news",
  "/updates",
  "/works",
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
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    sponsors,
    memberDirectory,
    projectDirectory,
    events,
    updateDirectory,
  ] = await Promise.all([
    getPublicSponsors(),
    getPublicMembersDirectory(),
    getVisibleProjectOpportunities(),
    getPublishedEventSummaries(),
    getPublicCommunityUpdatesDirectory(),
  ]);
  const staticRoutes = routes.map((route) => ({
    url: `${SITE_URL}${route}`,
  }));

  const sponsorRoutes = sponsors.map((sponsor) => ({
    url: `${SITE_URL}/sponsors/${sponsor.slug}`,
  }));

  const memberRoutes = memberDirectory.members
    .filter(isSearchIndexablePublicMember)
    .map((member) => ({
      url: `${SITE_URL}${getMemberPublicSlugPath(member)}`,
    }));

  const projectRoutes = projectDirectory.opportunities
    .filter((opportunity) => opportunity.visibility === "public")
    .map((opportunity) => ({
      url: `${SITE_URL}${opportunity.href}`,
      lastModified: new Date(opportunity.updatedAt),
    }));

  const eventRoutes = events.map((event) => ({
    url: `${SITE_URL}/events/${event.slug}`,
    lastModified: event.updated_at ? new Date(event.updated_at) : undefined,
  }));

  const updateRoutes = updateDirectory.updates.map((update) => ({
    url: `${SITE_URL}${update.href}`,
    lastModified: new Date(update.updatedAt),
  }));

  return [
    ...staticRoutes,
    ...eventRoutes,
    ...projectRoutes,
    ...updateRoutes,
    ...memberRoutes,
    ...sponsorRoutes,
  ];
}
