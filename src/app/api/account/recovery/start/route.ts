import { NextResponse } from "next/server";

import {
  createRecoveryToken,
  getRecoveryExpiry,
  isWechatAuthUser,
  normalizeRecoveryEmail,
  sha256Hex,
} from "@/lib/account-recovery";
import { resolveCommunityUserId } from "@/lib/community-user";
import { getPublicSiteUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GENERIC_RESPONSE = {
  message: "如果这个邮箱属于已有账号，你会收到一封验证邮件。",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  const canonicalUserId = await resolveCommunityUserId(admin, user.id);
  if (!isWechatAuthUser(user) || canonicalUserId !== user.id) {
    return Response.json({ error: "recovery_not_available" }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown }
    | null;
  const email = normalizeRecoveryEmail(
    typeof body?.email === "string" ? body.email : "",
  );

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
  const { count, error: countError } = await admin
    .from("account_recovery_intents")
    .select("id", { count: "exact", head: true })
    .eq("source_user_id", user.id)
    .gte("created_at", oneHourAgo);

  if (countError) {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  if ((count ?? 0) >= 5) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const recoveryToken = createRecoveryToken();
  const { error: intentError } = await admin
    .from("account_recovery_intents")
    .insert({
      token_hash: sha256Hex(recoveryToken),
      source_user_id: user.id,
      target_email_hash: sha256Hex(email),
      expires_at: getRecoveryExpiry(),
    });

  if (intentError) {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const siteOrigin = getPublicSiteUrl() ?? requestUrl.origin;
  const confirmPath = `/account/recover/confirm?intent=${encodeURIComponent(recoveryToken)}`;
  const callbackUrl = new URL("/auth/callback", siteOrigin);
  callbackUrl.searchParams.set("next", confirmPath);

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (otpError) {
    console.error("Failed to send account recovery verification email.", {
      userId: user.id,
      code: otpError.code,
    });
  }

  return NextResponse.json({ ...GENERIC_RESPONSE, recoveryToken });
}
