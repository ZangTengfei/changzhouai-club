import type { Metadata } from "next";

export const SITE_NAME = "常州 AI Club";
export const SITE_URL = "https://changzhouai.club";
export const DEFAULT_SITE_DESCRIPTION =
  "连接常州的 OPC、开发者、产品人、创业者、高校同学与企业伙伴，持续组织线下交流、主题分享与合作对接。";
export const DEFAULT_SOCIAL_DESCRIPTION =
  "一个立足常州本地的 AI 开发者社区，关注线下交流、成员连接与企业合作。";

const DEFAULT_SOCIAL_IMAGE_PATH = "/opengraph-image";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  noFollow?: boolean;
};

type SearchIndexableMember = {
  publicSlug: string | null;
  bio: string | null;
  skills: string[];
  roleLabel: string | null;
  organization: string | null;
};

export function absoluteSiteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}

export function cleanSeoText(value: string, maxLength = 155) {
  const cleaned = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)、]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

export function createPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  noIndex = false,
  noFollow = false,
}: PageMetadataInput): Metadata {
  const canonical = absoluteSiteUrl(path);
  const normalizedDescription = cleanSeoText(description);
  const socialImage = absoluteSiteUrl(image || DEFAULT_SOCIAL_IMAGE_PATH);
  const openGraphImages = image
    ? [
        {
          url: socialImage,
          alt: imageAlt || title,
        },
      ]
    : [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: imageAlt || title,
        },
      ];

  return {
    title,
    description: normalizedDescription,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? {
          index: false,
          follow: !noFollow,
          googleBot: {
            index: false,
            follow: !noFollow,
          },
        }
      : undefined,
    openGraph: {
      title,
      description: normalizedDescription,
      url: canonical,
      siteName: SITE_NAME,
      locale: "zh_CN",
      type,
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: normalizedDescription,
      images: [socialImage],
    },
  };
}

export function createNoIndexMetadata(
  title: string,
  description: string,
  path: string,
  noFollow = false,
) {
  return createPageMetadata({
    title,
    description,
    path,
    noIndex: true,
    noFollow,
  });
}

export function isSearchIndexablePublicMember(member: SearchIndexableMember) {
  if (!member.publicSlug) {
    return false;
  }

  const bioLength = cleanSeoText(member.bio ?? "", 500).length;
  const hasRoleAndOrganization = Boolean(member.roleLabel && member.organization);

  return bioLength >= 30 || member.skills.length >= 2 || hasRoleAndOrganization;
}
