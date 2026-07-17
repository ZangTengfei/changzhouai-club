import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { loadMiniappDailyBrief } from "@/lib/miniapp-content";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const result = await loadMiniappDailyBrief();
  return miniappJson(result);
}
