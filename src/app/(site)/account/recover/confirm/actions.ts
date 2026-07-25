"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { bindRecoveryIntentTarget } from "@/lib/account-recovery";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function getChoice(formData: FormData, name: string) {
  return String(formData.get(name) ?? "target") === "source"
    ? "source"
    : "target";
}

export async function confirmWechatAccountRecovery(formData: FormData) {
  const recoveryToken = String(formData.get("recovery_token") ?? "").trim();
  if (!recoveryToken) {
    redirect("/account?error=account_recovery_invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();

  if (!user) {
    redirect("/login");
  }

  if (!admin) {
    redirect("/account?error=account_recovery_failed");
  }

  try {
    const preview = await bindRecoveryIntentTarget(admin, recoveryToken, user);
    const { error } = await admin.rpc("merge_recovered_wechat_account", {
      recovery_intent_id: preview.intentId,
      merge_choices: {
        display_name: getChoice(formData, "display_name_choice"),
        avatar_url: getChoice(formData, "avatar_url_choice"),
        wechat: getChoice(formData, "wechat_choice"),
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Failed to merge recovered WeChat account.", {
      userId: user.id,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    redirect("/account?error=account_recovery_failed");
  }

  revalidatePath("/account");
  revalidatePath("/members");
  revalidatePath("/events");
  revalidatePath("/updates");
  redirect("/account?updated=account_merged");
}
