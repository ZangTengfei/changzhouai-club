import { notFound } from "next/navigation";

import { getStaffContextResult, requireStaffContext } from "@/lib/supabase/guards";

export type AdminSponsorTier = "core" | "partner" | "supporter";

export type AdminSponsorImageRow = {
  id: string;
  sponsor_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export type AdminSponsorRow = {
  id: string;
  slug: string;
  name: string;
  tier: AdminSponsorTier;
  sponsor_label: string | null;
  logo_url: string | null;
  summary: string | null;
  description: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminSponsor = AdminSponsorRow & {
  images: AdminSponsorImageRow[];
};

export type AdminSponsorsDebugSnapshot = {
  userId: string;
  memberStatus: string;
  isStaff: boolean;
  sponsorsCount: number;
  imagesCount: number;
  queryErrors: string[];
};

export type AdminSponsorsData = {
  sponsors: AdminSponsor[];
  queryErrors: string[];
  debugSnapshot: AdminSponsorsDebugSnapshot;
};

type StaffContext = Awaited<ReturnType<typeof getStaffContextResult>>;

function sortImages(images: AdminSponsorImageRow[]) {
  return images.slice().sort((a, b) => a.sort_order - b.sort_order);
}

export async function loadAdminSponsorsData(
  context?: StaffContext,
): Promise<AdminSponsorsData> {
  const { supabase, user, member, isStaff } = context ?? (await requireStaffContext());

  if (!user) {
    throw new Error("Admin sponsors data requires an authenticated staff user.");
  }

  const [
    { data: sponsorsData, error: sponsorsError },
    { data: imagesData, error: imagesError },
  ] = await Promise.all([
    supabase
      .from("sponsors")
      .select(
        "id, slug, name, tier, sponsor_label, logo_url, summary, description, website_url, display_order, is_active, created_at, updated_at",
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("sponsor_images")
      .select("id, sponsor_id, image_url, caption, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  const sponsors = (sponsorsData ?? []) as AdminSponsorRow[];
  const images = (imagesData ?? []) as AdminSponsorImageRow[];
  const queryErrors = [sponsorsError?.message, imagesError?.message].filter(Boolean) as string[];
  const imagesBySponsorId = new Map<string, AdminSponsorImageRow[]>();

  images.forEach((image) => {
    const sponsorImages = imagesBySponsorId.get(image.sponsor_id) ?? [];
    sponsorImages.push(image);
    imagesBySponsorId.set(image.sponsor_id, sponsorImages);
  });

  return {
    sponsors: sponsors.map((sponsor) => ({
      ...sponsor,
      images: sortImages(imagesBySponsorId.get(sponsor.id) ?? []),
    })),
    queryErrors,
    debugSnapshot: {
      userId: user.id,
      memberStatus: member?.status ?? "pending",
      isStaff,
      sponsorsCount: sponsors.length,
      imagesCount: images.length,
      queryErrors,
    },
  };
}

export async function loadAdminSponsorOrThrow(sponsorId: string) {
  const { sponsors, queryErrors, debugSnapshot } = await loadAdminSponsorsData();
  const sponsor = sponsors.find((item) => item.id === sponsorId);

  if (!sponsor) {
    notFound();
  }

  return {
    sponsor,
    queryErrors,
    debugSnapshot,
  };
}
