import type { MetadataRoute } from "next";

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
  "/docs/tools/nextra-vs-mintlify",
  "/docs/contributing",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sponsors = await getPublicSponsors();
  const staticRoutes = routes.map((route) => ({
    url: `https://changzhouai.club${route}`,
    lastModified: new Date(),
  }));

  const sponsorRoutes = sponsors.map((sponsor) => ({
    url: `https://changzhouai.club/sponsors/${sponsor.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...sponsorRoutes];
}
