import {
  loadBoundAccountRecoveryPreview,
  loadCompletedAccountRecoveryTarget,
} from "@/lib/account-recovery";
import {
  loadMiniappAccountSnapshot,
  loadMiniappSession,
} from "@/lib/miniapp-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getChoice(value: unknown) {
  return value === "source" ? "source" : "target";
}

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
    | {
        choices?: Record<string, unknown>;
        recoveryToken?: unknown;
      }
    | null;
  const recoveryToken =
    typeof body?.recoveryToken === "string" ? body.recoveryToken.trim() : "";
  if (!recoveryToken) {
    return Response.json({ error: "recovery_invalid" }, { status: 400 });
  }

  try {
    const preview = await loadBoundAccountRecoveryPreview(
      admin,
      recoveryToken,
      session.user_id,
    );
    const { data: targetUserId, error } = await admin.rpc(
      "merge_recovered_wechat_account",
      {
        recovery_intent_id: preview.intentId,
        merge_choices: {
          avatar_url: getChoice(body?.choices?.avatarUrl),
          display_name: getChoice(body?.choices?.displayName),
          wechat: getChoice(body?.choices?.wechat),
        },
      },
    );

    if (error || typeof targetUserId !== "string") {
      throw error ?? new Error("account_merge_failed");
    }

    const user = await loadMiniappAccountSnapshot(admin, targetUserId);
    return Response.json({ merged: true, user });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "recovery_intent_consumed"
    ) {
      const currentSession = await loadMiniappSession(admin, request);
      const completedTargetUserId = currentSession
        ? await loadCompletedAccountRecoveryTarget(
            admin,
            recoveryToken,
            currentSession.user_id,
          )
        : null;
      if (completedTargetUserId) {
        const user = await loadMiniappAccountSnapshot(
          admin,
          completedTargetUserId,
        );
        return Response.json({ merged: true, user });
      }
    }

    console.error("Failed to merge mini-program recovered account.", {
      userId: session.user_id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return Response.json({ error: "account_merge_failed" }, { status: 409 });
  }
}
