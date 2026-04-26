import type { MetadataRoute } from "next";

import { getPublicMembersDirectory } from "@/lib/community-members";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { getPublicSponsors } from "@/lib/sponsors";

const routes = [
  "",
  "/events",
  "/projects",
  "/members",
  "/join",
  "/cooperate",
  "/about",
  "/archive",
  "/faq",
  "/docs",
  "/docs/getting-started",
  "/docs/guides/co-build-workflow",
  "/docs/contributing",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sponsors, memberDirectory] = await Promise.all([
    getPublicSponsors(),
    getPublicMembersDirectory(),
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

  return [...staticRoutes, ...sponsorRoutes, ...memberRoutes];
}
