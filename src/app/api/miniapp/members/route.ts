import { loadOptionalMiniappSession, miniappJson } from "@/lib/miniapp-api";
import {
  getMiniappProfileCompletion,
  isMiniappDisplayNameReady,
} from "@/lib/miniapp-profile";
import { getAvatarImageUrl } from "@/lib/public-image-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MEMBER_PAGE_SIZE = 20;
const GUEST_MEMBER_LIMIT = 6;
const ACTIVE_MEMBER_STATUSES = new Set(["active", "organizer", "admin"]);
const MEMBER_INTENTS = new Set(["share", "projects", "seeking"]);

type MemberRow = {
  id: string;
  status: string;
  willing_to_share: boolean;
  willing_to_join_projects: boolean;
  is_co_builder: boolean;
  is_featured_on_home: boolean;
  joined_at: string;
};

type ProfileRow = {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role_label: string | null;
  organization: string | null;
  bio: string | null;
  industry_tags: string[] | null;
  skills: string[] | null;
  capability_summary: string | null;
  seeking_summary: string | null;
};

type MemberBadgeRow = {
  user_id: string;
  label: string;
  awarded_at: string;
};

type MemberPoolItem = {
  id: string;
  shareHandle: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  roleLabel: string;
  organization: string;
  bio: string;
  industryTags: string[];
  skills: string[];
  capabilitySummary: string;
  seekingSummary: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  identityLabel: string;
  communityTags: string[];
  isCoBuilder: boolean;
  isFeatured: boolean;
  joinedAt: string;
};

function getIdentityLabel(status: string, isCoBuilder: boolean) {
  if (status === "admin" || status === "organizer") return "社区发起人";
  if (isCoBuilder) return "共建伙伴";
  return "社区成员";
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function readSearchParam(searchParams: URLSearchParams, key: string, maxLength: number) {
  return searchParams.get(key)?.trim().slice(0, maxLength) ?? "";
}

function readPage(searchParams: URLSearchParams) {
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function hasValue(values: string[], target: string) {
  return values.some((value) => value === target);
}

function matchesQuery(member: MemberPoolItem, query: string) {
  if (!query) return true;
  return [
    member.displayName,
    member.city,
    member.roleLabel,
    member.organization,
    member.bio,
    member.capabilitySummary,
    member.seekingSummary,
    ...member.industryTags,
    ...member.skills,
    ...member.communityTags,
  ].some((value) => normalizeSearchText(value).includes(query));
}

function compareMembers(a: MemberPoolItem, b: MemberPoolItem) {
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;

  const identityWeight = (member: MemberPoolItem) => {
    if (member.identityLabel === "社区发起人") return 0;
    if (member.isCoBuilder) return 1;
    return 2;
  };
  const identityDiff = identityWeight(a) - identityWeight(b);
  if (identityDiff !== 0) return identityDiff;

  const joinedAtDiff = new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
  if (joinedAtDiff !== 0) return joinedAtDiff;
  return a.displayName.localeCompare(b.displayName, "zh-CN");
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "zh-CN"),
  );
}

function toMemberPoolResponse(member: MemberPoolItem) {
  return {
    id: member.id,
    shareHandle: member.shareHandle,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
    city: member.city,
    roleLabel: member.roleLabel,
    organization: member.organization,
    skills: member.skills.slice(0, 3),
    capabilitySummary: member.capabilitySummary,
    seekingSummary: member.seekingSummary,
    willingToShare: member.willingToShare,
    willingToJoinProjects: member.willingToJoinProjects,
    identityLabel: member.identityLabel,
    communityTags: member.communityTags.slice(0, 2),
  };
}

export async function GET(request: Request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return miniappJson({ error: "server_not_configured" }, 503);
  }

  const auth = await loadOptionalMiniappSession(request);
  const authenticated = Boolean(auth);
  const url = new URL(request.url);
  const query = normalizeSearchText(readSearchParam(url.searchParams, "query", 60));
  const city = readSearchParam(url.searchParams, "city", 40);
  const industry = readSearchParam(url.searchParams, "industry", 40);
  const skill = readSearchParam(url.searchParams, "skill", 100);
  const intent = readSearchParam(url.searchParams, "intent", 20);
  const requestedPage = authenticated ? readPage(url.searchParams) : 1;

  if (intent && !MEMBER_INTENTS.has(intent)) {
    return miniappJson({ error: "invalid_member_filter" }, 400);
  }

  const { data: memberData, error: memberError } = await supabase
    .from("members")
    .select(
      "id, status, willing_to_share, willing_to_join_projects, is_co_builder, is_featured_on_home, joined_at",
    )
    .eq("is_publicly_visible", true)
    .in("status", ["active", "organizer", "admin"]);

  if (memberError) {
    console.error("Failed to load mini-program member pool.", {
      code: memberError.code,
    });
    return miniappJson({ error: "member_pool_load_failed" }, 500);
  }

  const memberRows = (memberData ?? []) as MemberRow[];
  const memberIds = memberRows
    .filter((member) => ACTIVE_MEMBER_STATUSES.has(member.status))
    .map((member) => member.id);

  if (memberIds.length === 0) {
    return miniappJson({
      members: [],
      filters: { cities: [], industries: [], skills: [] },
      pagination: { page: 1, pageSize: authenticated ? MEMBER_PAGE_SIZE : GUEST_MEMBER_LIMIT, total: 0, hasMore: false },
      authenticated,
      guestPreview: !authenticated,
    });
  }

  const [profileResult, badgeResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, public_slug, display_name, avatar_url, city, role_label, organization, bio, industry_tags, skills, capability_summary, seeking_summary",
      )
      .in("id", memberIds),
    supabase
      .from("member_badge_awards")
      .select("user_id, label, awarded_at")
      .in("user_id", memberIds)
      .order("awarded_at", { ascending: false }),
  ]);
  const { data: profileData, error: profileError } = profileResult;
  const { data: badgeData, error: badgeError } = badgeResult;

  if (profileError || badgeError) {
    console.error("Failed to load mini-program member profiles.", {
      profileCode: profileError?.code,
      badgeCode: badgeError?.code,
    });
    return miniappJson({ error: "member_pool_load_failed" }, 500);
  }

  const membersById = new Map(memberRows.map((member) => [member.id, member]));
  const communityTagsByMemberId = new Map<string, string[]>();
  ((badgeData ?? []) as MemberBadgeRow[]).forEach((badge) => {
    const label = badge.label.trim();
    if (!label) return;
    const tags = communityTagsByMemberId.get(badge.user_id) ?? [];
    if (!tags.includes(label)) tags.push(label);
    communityTagsByMemberId.set(badge.user_id, tags);
  });
  const eligibleMembers = ((profileData ?? []) as ProfileRow[])
    .flatMap((profile): MemberPoolItem[] => {
      const member = membersById.get(profile.id);
      if (!member || !isMiniappDisplayNameReady(profile.display_name)) return [];

      const completion = getMiniappProfileCompletion({
        displayName: profile.display_name,
        city: profile.city,
        roleLabel: profile.role_label,
        industryTags: profile.industry_tags,
        skills: profile.skills,
        capabilitySummary: profile.capability_summary,
        seekingSummary: profile.seeking_summary,
      });
      if (!completion.completed) return [];

      const isCoBuilder = Boolean(member.is_co_builder);
      const identityLabel = getIdentityLabel(member.status, isCoBuilder);
      return [{
        id: profile.id,
        shareHandle: profile.public_slug?.trim() || profile.id,
        displayName: profile.display_name?.trim() || "社区成员",
        avatarUrl: getAvatarImageUrl(profile.avatar_url),
        city: profile.city?.trim() || "常州",
        roleLabel: profile.role_label?.trim() || "",
        organization: profile.organization?.trim() || "",
        bio: profile.bio?.trim() || "",
        industryTags: profile.industry_tags ?? [],
        skills: profile.skills ?? [],
        capabilitySummary: profile.capability_summary?.trim() || "",
        seekingSummary: profile.seeking_summary?.trim() || "",
        willingToShare: member.willing_to_share,
        willingToJoinProjects: member.willing_to_join_projects,
        identityLabel,
        communityTags: (communityTagsByMemberId.get(profile.id) ?? [])
          .filter((label) => label !== identityLabel)
          .slice(0, 2),
        isCoBuilder,
        isFeatured: Boolean(member.is_featured_on_home),
        joinedAt: member.joined_at,
      }];
    })
    .sort(compareMembers);

  const filters = {
    cities: uniqueSorted(eligibleMembers.map((member) => member.city)),
    industries: uniqueSorted(eligibleMembers.flatMap((member) => member.industryTags)),
    skills: uniqueSorted(eligibleMembers.flatMap((member) => member.skills)),
  };
  const filteredMembers = eligibleMembers.filter((member) => {
    if (!matchesQuery(member, query)) return false;
    if (city && member.city !== city) return false;
    if (industry && !hasValue(member.industryTags, industry)) return false;
    if (skill && !hasValue(member.skills, skill)) return false;
    if (intent === "share" && !member.willingToShare) return false;
    if (intent === "projects" && !member.willingToJoinProjects) return false;
    if (intent === "seeking" && !member.seekingSummary) return false;
    return true;
  });

  const pageSize = authenticated ? MEMBER_PAGE_SIZE : GUEST_MEMBER_LIMIT;
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;

  return miniappJson({
    members: filteredMembers
      .slice(start, start + pageSize)
      .map(toMemberPoolResponse),
    filters,
    pagination: {
      page,
      pageSize,
      total: filteredMembers.length,
      hasMore: start + pageSize < filteredMembers.length,
    },
    authenticated,
    guestPreview: !authenticated,
  });
}
