"use client";

import { useEffect } from "react";

type CommunityUpdateViewTrackerProps = {
  updateId: string;
};

export function CommunityUpdateViewTracker({
  updateId,
}: CommunityUpdateViewTrackerProps) {
  useEffect(() => {
    const sessionKey = `czai:update-view:${updateId}`;

    try {
      if (window.sessionStorage.getItem(sessionKey)) {
        return;
      }

      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Some browsers can block storage; keep view tracking best-effort.
    }

    const controller = new AbortController();

    void fetch(`/api/community-updates/${updateId}/view`, {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {
      // View tracking is best-effort and should never interrupt reading.
    });

    return () => controller.abort();
  }, [updateId]);

  return null;
}
