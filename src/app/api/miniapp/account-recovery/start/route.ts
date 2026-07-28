import { NextResponse } from "next/server";

import {
  createRecoveryToken,
  getRecoveryExpiry,
  isMiniappAccountRecoveryAvailable,
  normalizeRecoveryEmail,
  sha256Hex,
} from "@/lib/account-recovery";
import { loadMiniappSession } from "@/lib/miniapp-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

const GENERIC_RESPONSE = {
  message: "如果这个邮箱属于已有账号，你会收到一封验证邮件。",
};

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  const session = await loadMiniappSession(admin, request);
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let recoveryAvailable = false;
  try {
    recoveryAvailable = await isMiniappAccountRecoveryAvailable(
      admin,
      session.user_id,
    );
  } catch {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  if (!recoveryAvailable) {
    return Response.json(
      { error: "recovery_not_available" },
      { status: 409 },
    );
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
    .eq("source_user_id", session.user_id)
    .gte("created_at", oneHourAgo);

  if (countError) {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  if ((count ?? 0) >= 5) {
    return Response.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const recoveryToken = createRecoveryToken();
  const expiresAt = getRecoveryExpiry();
  const { error: intentError } = await admin
    .from("account_recovery_intents")
    .insert({
      token_hash: sha256Hex(recoveryToken),
      source_user_id: session.user_id,
      target_email_hash: sha256Hex(email),
      expires_at: expiresAt,
    });

  if (intentError) {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  const supabase = createSupabasePublicClient();
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (otpError) {
    console.error("Failed to send mini-program account recovery email.", {
      userId: session.user_id,
      code: otpError.code,
    });
  }

  return NextResponse.json({
    ...GENERIC_RESPONSE,
    recoveryToken,
    expiresAt,
  });
}
