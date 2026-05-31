import { redactSensitiveValue } from "@/lib/admin/permissions";
import { canAdmin, requireAdminPermission } from "@/lib/supabase/guards";
import {
  type CommunityUpdateStatus,
  type CommunityUpdateType,
} from "@/lib/community-updates";

export type AdminCommunityUpdateRow = {
  id: string;
  author_id: string;
  update_type: CommunityUpdateType;
  title: string | null;
  content: string;
  tags: string[];
  related_type: string | null;
  related_url: string | null;
  status: CommunityUpdateStatus;
  moderation_note: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  sort_order: number;
  is_featured: boolean;
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminCommunityUpdateImageRow = {
  id: string;
  update_id: string;
  image_url: string;
  alt: string | null;
  sort_order: number;
};

type AdminProfileOptionRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export type AdminCommunityUpdateAuthorOption = {
  id: string;
  displayName: string;
  email: string | null;
};

export type AdminCommunityUpdate = AdminCommunityUpdateRow & {
  authorDisplayName: string;
  authorEmail: string | null;
  authorAvatarUrl: string | null;
  images: AdminCommunityUpdateImageRow[];
};

export type AdminCommunityUpdatesData = {
  updates: AdminCommunityUpdate[];
  authorOptions: AdminCommunityUpdateAuthorOption[];
  queryErrors: string[];
};

function getDisplayName(profile?: AdminProfileOptionRow, canUseEmail = true) {
  return profile?.display_name?.trim() || (canUseEmail ? profile?.email : null) || "未填写显示名";
}

export async function loadAdminCommunityUpdatesData(): Promise<AdminCommunityUpdatesData> {
  const adminContext = await requireAdminPermission("updates.read");
  const { supabase } = adminContext;
  const canReadMemberContact = canAdmin(adminContext, "members.read_contact");

  const [
    { data: updatesData, error: updatesError },
    { data: imagesData, error: imagesError },
    { data: profilesData, error: profilesError },
    { data: membersData, error: membersError },
  ] = await Promise.all([
    supabase
      .from("community_updates")
      .select(
        "id, author_id, update_type, title, content, tags, related_type, related_url, status, moderation_note, like_count, comment_count, view_count, sort_order, is_featured, is_pinned, published_at, created_at, updated_at",
      )
      .order("is_pinned", { ascending: false })
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false }),
    supabase
      .from("community_update_images")
      .select("id, update_id, image_url, alt, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, display_name, email, avatar_url"),
    supabase
      .from("members")
      .select("id, status")
      .in("status", ["active", "organizer", "admin"]),
  ]);

  const profiles = (profilesData ?? []) as AdminProfileOptionRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const memberIds = new Set(((membersData ?? []) as Array<{ id: string }>).map((member) => member.id));
  const authorOptions = profiles
    .filter((profile) => memberIds.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      displayName: getDisplayName(profile, canReadMemberContact),
      email: canReadMemberContact ? profile.email : redactSensitiveValue(profile.email),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "zh-CN"));
  const imagesByUpdateId = new Map<string, AdminCommunityUpdateImageRow[]>();

  ((imagesData ?? []) as AdminCommunityUpdateImageRow[]).forEach((image) => {
    const images = imagesByUpdateId.get(image.update_id) ?? [];
    images.push(image);
    imagesByUpdateId.set(image.update_id, images);
  });

  return {
    updates: ((updatesData ?? []) as AdminCommunityUpdateRow[]).map((update) => {
      const profile = profileById.get(update.author_id);

      return {
        ...update,
        tags: update.tags ?? [],
        authorDisplayName: getDisplayName(profile, canReadMemberContact),
        authorEmail: canReadMemberContact
          ? profile?.email ?? null
          : redactSensitiveValue(profile?.email),
        authorAvatarUrl: profile?.avatar_url ?? null,
        images: imagesByUpdateId.get(update.id) ?? [],
      };
    }),
    authorOptions,
    queryErrors: [
      updatesError?.message,
      imagesError?.message,
      profilesError?.message,
      membersError?.message,
    ].filter(Boolean) as string[],
  };
}
