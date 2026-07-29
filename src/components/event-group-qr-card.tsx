"use client";

import { useEffect, useState } from "react";

type GroupQr = {
  imageUrl: string;
  note: string | null;
  expiresAt: string | null;
};

export function EventGroupQrCard({
  eventSlug,
  enabled,
}: {
  eventSlug: string;
  enabled: boolean;
}) {
  const [groupQr, setGroupQr] = useState<GroupQr | null>(null);

  useEffect(() => {
    if (!enabled) {
      setGroupQr(null);
      return;
    }

    const controller = new AbortController();
    void fetch(`/api/events/${encodeURIComponent(eventSlug)}/group-qr`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { groupQr?: GroupQr };
        return payload.groupQr ?? null;
      })
      .then((result) => setGroupQr(result))
      .catch(() => undefined);

    return () => controller.abort();
  }, [enabled, eventSlug]);

  if (!groupQr) return null;

  return (
    <article className="card event-group-qr-card">
      <div>
        <span className="eyebrow">报名已确认</span>
        <h3>加入活动微信群</h3>
        <p>{groupQr.note ?? "请使用微信扫码加入本场活动群。"}</p>
      </div>
      <img
        src={groupQr.imageUrl}
        alt="活动微信群二维码"
        className="event-group-qr-image"
      />
    </article>
  );
}
