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
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://changzhouai.club${route}`,
    lastModified: new Date(),
  }));
}
