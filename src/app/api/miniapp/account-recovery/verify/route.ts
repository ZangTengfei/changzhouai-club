import {
  assertAccountRecoveryIntentSource,
  bindRecoveryIntentTarget,
} from "@/lib/account-recovery";
import { loadMiniappSession } from "@/lib/miniapp-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: "recovery_unavailable" }, { status: 503 });
  }

  const session = await loadMiniappSession(admin, request);
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { code?: unknown; email?: unknown; recoveryToken?: unknown }
    | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const recoveryToken =
    typeof body?.recoveryToken === "string" ? body.recoveryToken.trim() : "";

  if (!/^\d{6}$/.test(code) || !email || !recoveryToken) {
    return Response.json(
      { error: "invalid_verification_code" },
      { status: 400 },
    );
  }

  try {
    await assertAccountRecoveryIntentSource(
      admin,
      recoveryToken,
      session.user_id,
    );
  } catch {
    return Response.json({ error: "recovery_invalid" }, { status: 409 });
  }

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.user) {
    return Response.json(
      { error: "invalid_verification_code" },
      { status: 400 },
    );
  }

  const targetUser = data.user;
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

  try {
    const preview = await bindRecoveryIntentTarget(
      admin,
      recoveryToken,
      targetUser,
      { expectedSourceUserId: session.user_id },
    );
    return Response.json({
      preview: {
        targetEmail: preview.targetEmail,
        currentAccount: {
          avatarUrl: preview.sourceProfile.avatar_url,
          displayName: preview.sourceProfile.display_name,
          registrationCount: preview.sourceCounts.registrations,
          wechat: preview.sourceProfile.wechat,
          workCount: preview.sourceCounts.works,
        },
        oldAccount: {
          avatarUrl: preview.targetProfile.avatar_url,
          displayName: preview.targetProfile.display_name,
          registrationCount: preview.targetCounts.registrations,
          wechat: preview.targetProfile.wechat,
          workCount: preview.targetCounts.works,
        },
      },
    });
  } catch {
    return Response.json({ error: "recovery_not_available" }, { status: 409 });
  }
}
