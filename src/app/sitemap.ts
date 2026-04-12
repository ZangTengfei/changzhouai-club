import type { MetadataRoute } from "next";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://changzhouai.club${route}`,
    lastModified: new Date(),
  }));
}
