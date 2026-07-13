"use client";

import { QrCode, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AdminField,
  AdminNotice,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

type CheckinCode = {
  qrDataUrl: string;
  expiresAt: string;
};

export function AdminEventCheckinPanelClient({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [validHours, setValidHours] = useState("4");
  const [checkinCode, setCheckinCode] = useState<CheckinCode | null>(null);
  const [isPending, startTransition] = useTransition();

  function generateCheckinCode() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/checkin-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ validHours: Number(validHours) }),
        });
        const payload = (await response.json().catch(() => null)) as
          | (CheckinCode & { error?: string })
          | null;
        if (!response.ok || !payload?.qrDataUrl) {
          throw new Error(payload?.error ?? "checkin_code_failed");
        }
        setCheckinCode(payload);
        toast.success("签到码已生成，旧签到码已失效。");
      } catch {
        toast.error("签到码生成失败，请稍后重试。");
      }
    });
  }

  return (
    <AdminPanel>
      <AdminPanelHeader
        eyebrow="Event Check-in"
        title="现场签到"
        actions={
          <Button type="button" onClick={generateCheckinCode} disabled={isPending}>
            {checkinCode ? <RotateCcw aria-hidden="true" /> : <QrCode aria-hidden="true" />}
            {isPending ? "生成中..." : checkinCode ? "重新生成" : "生成签到码"}
          </Button>
        }
      />
      <AdminPanelBody className="grid gap-5 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-4">
          <AdminField label="有效时间">
            <NativeSelect value={validHours} onChange={(event) => setValidHours(event.target.value)}>
              <option value="2">2 小时</option>
              <option value="4">4 小时</option>
              <option value="8">8 小时</option>
              <option value="12">12 小时</option>
              <option value="24">24 小时</option>
            </NativeSelect>
          </AdminField>
          <AdminNotice>
            {checkinCode
              ? `有效至 ${new Date(checkinCode.expiresAt).toLocaleString("zh-CN")}`
              : "生成后可在现场投屏或打印。"}
          </AdminNotice>
        </div>

        <div className="flex min-h-64 items-center justify-center border border-border/70 bg-white p-4">
          {checkinCode ? (
            <img
              src={checkinCode.qrDataUrl}
              alt={`${eventTitle}签到二维码`}
              className="aspect-square w-full max-w-72"
            />
          ) : (
            <div className="grid justify-items-center gap-3 text-muted-foreground">
              <QrCode className="size-10" aria-hidden="true" />
              <span className="text-sm">签到码尚未生成</span>
            </div>
          )}
        </div>
      </AdminPanelBody>
    </AdminPanel>
  );
}
