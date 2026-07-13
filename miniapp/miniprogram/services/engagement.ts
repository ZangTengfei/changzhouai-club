import { apiRequest } from "./api";

export type EventAttendance = {
  id: string;
  status: "attended" | "late" | "speaker";
  checked_in_at: string | null;
};

export type EventFeedback = {
  id: string;
  rating: number;
  comment: string | null;
  submitted_at: string;
  updated_at: string;
};

type EngagementResponse = {
  attendance: EventAttendance | null;
  feedback: EventFeedback | null;
};

function scanQrCode() {
  return new Promise<string>((resolve, reject) => {
    wx.scanCode({
      scanType: ["qrCode"],
      success(result) {
        const match = result.result.match(/[?&]token=([^&]+)/);
        if (!match?.[1]) {
          reject(new Error("invalid_checkin_qr"));
          return;
        }
        resolve(decodeURIComponent(match[1]));
      },
      fail() {
        reject(new Error("scan_cancelled"));
      },
    });
  });
}

export async function checkInWithQrCode(slug: string) {
  const token = await scanQrCode();
  return apiRequest<{
    attendance: EventAttendance;
    alreadyCheckedIn: boolean;
  }>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/checkin`,
    method: "POST",
    authenticated: true,
    data: { token },
  });
}

export function loadEventEngagement(slug: string) {
  return apiRequest<EngagementResponse>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/feedback`,
    authenticated: true,
  });
}

export async function saveEventFeedback(
  slug: string,
  rating: number,
  comment: string,
) {
  const response = await apiRequest<{ feedback: EventFeedback }>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/feedback`,
    method: "PUT",
    authenticated: true,
    data: { rating, comment },
  });
  return response.feedback;
}
