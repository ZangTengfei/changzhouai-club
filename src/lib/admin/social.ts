import { requireAdminPermission } from "@/lib/supabase/guards";
import {
  defaultWechatMaterialSettings,
  type WechatMaterialSettings,
  type WechatSocialMaterial,
  type WechatSocialMaterialInput,
} from "@/lib/social-material";

export type AdminWechatQrCodeRow = {
  id: string;
  title: string;
  image_url: string;
  note: string | null;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
};

export type AdminSocialData = {
  materials: WechatSocialMaterial[];
  qrCodes: AdminWechatQrCodeRow[];
  currentQrCode: AdminWechatQrCodeRow | null;
  queryErrors: string[];
};

type SocialMaterialRow = {
  id: string;
  platform: "wechat";
  title: string;
  content_markdown: string;
  settings: unknown;
  created_at: string;
  updated_at: string;
};

const WECHAT_TEMPLATE_IDS = new Set(["community", "official", "opportunity"]);

export function normalizeWechatMaterialSettings(value: unknown): WechatMaterialSettings {
  const settings = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const templateId = String(settings.templateId ?? "");
  const footerTemplateId = String(settings.footerTemplateId ?? templateId);

  return {
    templateId: WECHAT_TEMPLATE_IDS.has(templateId)
      ? templateId as WechatMaterialSettings["templateId"]
      : defaultWechatMaterialSettings.templateId,
    footerTemplateId: WECHAT_TEMPLATE_IDS.has(footerTemplateId)
      ? footerTemplateId as WechatMaterialSettings["footerTemplateId"]
      : defaultWechatMaterialSettings.footerTemplateId,
    videoTitle: String(settings.videoTitle ?? defaultWechatMaterialSettings.videoTitle),
    videoDescription: String(
      settings.videoDescription ?? defaultWechatMaterialSettings.videoDescription,
    ),
    videoActionLabel: String(
      settings.videoActionLabel ?? defaultWechatMaterialSettings.videoActionLabel,
    ),
    videoUrl: String(settings.videoUrl ?? ""),
    relatedLinksText: String(
      settings.relatedLinksText ?? defaultWechatMaterialSettings.relatedLinksText,
    ),
  };
}

export function normalizeWechatSocialMaterialInput(
  value: unknown,
): WechatSocialMaterialInput | null {
  if (!value || typeof value !== "object") return null;

  const payload = value as Record<string, unknown>;
  const title = String(payload.title ?? "").trim();

  if (!title) return null;

  return {
    title,
    contentMarkdown: String(payload.contentMarkdown ?? ""),
    settings: normalizeWechatMaterialSettings(payload.settings),
  };
}

function toSocialMaterial(row: SocialMaterialRow): WechatSocialMaterial {
  return {
    id: row.id,
    platform: row.platform,
    title: row.title,
    contentMarkdown: row.content_markdown,
    settings: normalizeWechatMaterialSettings(row.settings),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadAdminSocialData(): Promise<AdminSocialData> {
  const { supabase } = await requireAdminPermission("social.write");
  const now = new Date().toISOString();
  const [qrCodeResult, materialResult] = await Promise.all([
    supabase
      .from("community_wechat_qr_codes")
      .select("id, title, image_url, note, starts_at, expires_at, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("social_materials")
      .select("id, platform, title, content_markdown, settings, created_at, updated_at")
      .eq("platform", "wechat")
      .order("updated_at", { ascending: false }),
  ]);

  const qrCodes = (qrCodeResult.data ?? []) as AdminWechatQrCodeRow[];
  const materials = ((materialResult.data ?? []) as SocialMaterialRow[]).map(toSocialMaterial);
  const currentQrCode =
    qrCodes.find(
      (item) => item.is_active && item.starts_at <= now && item.expires_at > now,
    ) ?? null;

  return {
    materials,
    qrCodes,
    currentQrCode,
    queryErrors: [qrCodeResult.error?.message, materialResult.error?.message].filter(
      Boolean,
    ) as string[],
  };
}

export async function loadAdminSocialMaterial(materialId: string) {
  const { supabase } = await requireAdminPermission("social.write");
  const { data, error } = await supabase
    .from("social_materials")
    .select("id, platform, title, content_markdown, settings, created_at, updated_at")
    .eq("id", materialId)
    .eq("platform", "wechat")
    .maybeSingle();

  return {
    material: data ? toSocialMaterial(data as SocialMaterialRow) : null,
    error: error?.message ?? null,
  };
}
