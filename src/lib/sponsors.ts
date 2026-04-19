import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import { createPublicServerClient } from "@/lib/supabase/public-server";

type SponsorImageRow = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

type SponsorRow = {
  id: string;
  slug: string;
  name: string;
  tier: SponsorTier;
  sponsor_label: string | null;
  logo_url: string | null;
  summary: string | null;
  description: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
  sponsor_images?: SponsorImageRow[] | null;
};

export type PublicSponsorImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

export type SponsorTier = "core" | "partner" | "supporter";

export type PublicSponsor = {
  id: string;
  slug: string;
  name: string;
  tier: SponsorTier;
  tierLabel: string;
  sponsorLabel: string;
  logoUrl: string | null;
  summary: string;
  descriptionParagraphs: string[];
  websiteUrl: string | null;
  displayOrder: number;
  images: PublicSponsorImage[];
};

const PUBLIC_SPONSORS_REVALIDATE_SECONDS = 60;

const sponsorTierLabels: Record<SponsorTier, string> = {
  core: "核心赞助者",
  partner: "共建伙伴",
  supporter: "支持伙伴",
};

const fallbackSponsors: PublicSponsor[] = [
  {
    id: "fallback-changzhou-telecom",
    slug: "changzhou-telecom",
    name: "常州电信",
    tier: "core",
    tierLabel: sponsorTierLabels.core,
    sponsorLabel: "首位赞助者",
    logoUrl: "/china-telecom-logo.svg",
    summary: "为社区交流与活动连接提供支持，和我们一起把更多本地实践者聚在一起。",
    descriptionParagraphs: [
      "常州电信支持常州人工智能国际社区持续组织线下交流、主题分享与本地 AI 实践者连接。",
    ],
    websiteUrl: null,
    displayOrder: 10,
    images: [],
  },
  {
    id: "fallback-caic-yuandian",
    slug: "caic-yuandian",
    name: "常州人工智能国际社区",
    tier: "partner",
    tierLabel: sponsorTierLabels.partner,
    sponsorLabel: "社区共建伙伴",
    logoUrl: "/caic-yuandian.png",
    summary: "以社区空间、资源连接与长期共建支持，陪伴常州 AI 生态持续成长。",
    descriptionParagraphs: [
      "常州人工智能国际社区围绕本地 AI 生态建设，支持活动组织、资源连接和实践者共创。",
    ],
    websiteUrl: null,
    displayOrder: 20,
    images: [],
  },
];

function parseParagraphs(value: string | null) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapSponsor(row: SponsorRow): PublicSponsor {
  const images = (row.sponsor_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({
      id: image.id,
      imageUrl: image.image_url,
      caption: image.caption,
    }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tier: row.tier,
    tierLabel: sponsorTierLabels[row.tier] ?? sponsorTierLabels.supporter,
    sponsorLabel: row.sponsor_label ?? "赞助者",
    logoUrl: row.logo_url,
    summary:
      row.summary ??
      row.description ??
      "感谢支持常州本地 AI 社区持续连接、组织活动与推动共建。",
    descriptionParagraphs: parseParagraphs(row.description),
    websiteUrl: row.website_url,
    displayOrder: row.display_order,
    images,
  };
}

export function getFallbackSponsors() {
  return fallbackSponsors;
}

export async function getPublicSponsors() {
  if (!hasSupabaseEnv()) {
    return fallbackSponsors;
  }

  const sponsors = await getCachedPublicSponsors();
  return sponsors ?? fallbackSponsors;
}

export async function getPublicSponsorBySlug(slug: string) {
  if (!hasSupabaseEnv()) {
    return fallbackSponsors.find((sponsor) => sponsor.slug === slug) ?? null;
  }

  const result = await getCachedPublicSponsorBySlug(slug);
  return result.status === "error"
    ? (fallbackSponsors.find((item) => item.slug === slug) ?? null)
    : result.sponsor;
}

const getCachedPublicSponsors = unstable_cache(
  async () => {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("sponsors")
      .select(
        "id, slug, name, tier, sponsor_label, logo_url, summary, description, website_url, display_order, is_active, sponsor_images(id, image_url, caption, sort_order)",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) {
      return null;
    }

    return (data as SponsorRow[]).map(mapSponsor);
  },
  ["public-sponsors"],
  { revalidate: PUBLIC_SPONSORS_REVALIDATE_SECONDS },
);

const getCachedPublicSponsorBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("sponsors")
      .select(
        "id, slug, name, tier, sponsor_label, logo_url, summary, description, website_url, display_order, is_active, sponsor_images(id, image_url, caption, sort_order)",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return {
        status: "error" as const,
        sponsor: null,
      };
    }

    if (!data) {
      return {
        status: "ok" as const,
        sponsor: null,
      };
    }

    return {
      status: "ok" as const,
      sponsor: mapSponsor(data as SponsorRow),
    };
  },
  ["public-sponsor-detail-by-slug"],
  { revalidate: PUBLIC_SPONSORS_REVALIDATE_SECONDS },
);
