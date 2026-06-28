import QRCode from "qrcode";

import type { AdminWeDailyReportExportTemplate } from "@/lib/admin/wedaily-admin";

const PUBLIC_SITE_ORIGIN = "https://changzhouai.club";
const REPORT_QR_CODE_SIZE = 176;

export async function appendWeDailyReportQrCode(
  template: AdminWeDailyReportExportTemplate,
  { date }: { date: string },
) {
  if (template.html.includes("club-report-qr")) {
    return template;
  }

  const reportUrl = buildReportPublicUrl(date);
  const qrCodeSvg = await QRCode.toString(reportUrl, {
    color: {
      dark: "#1f2524",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
    margin: 1,
    type: "svg",
    width: REPORT_QR_CODE_SIZE,
  });
  const qrCodeHtml = `
<section class="club-report-qr">
  <div class="club-report-qr__text">
    <span>READ ONLINE</span>
    <strong>扫码查看日报原文</strong>
    <p>${escapeHtml(reportUrl)}</p>
  </div>
  <div class="club-report-qr__code" aria-hidden="true">${qrCodeSvg}</div>
</section>`;

  return {
    ...template,
    css: `${template.css}\n${REPORT_QR_CODE_CSS}`,
    html: insertBeforeDailySheetEnd(template.html, qrCodeHtml),
  };
}

function buildReportPublicUrl(date: string) {
  const params = new URLSearchParams({ view: "local" });

  if (date) {
    params.set("date", date);
  }

  return `${PUBLIC_SITE_ORIGIN}/news?${params.toString()}`;
}

function insertBeforeDailySheetEnd(html: string, content: string) {
  const articleEndIndex = html.lastIndexOf("</article>");

  if (articleEndIndex >= 0) {
    return `${html.slice(0, articleEndIndex)}${content}${html.slice(articleEndIndex)}`;
  }

  return `${html}${content}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const REPORT_QR_CODE_CSS = `
.club-report-qr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  margin-top: 30px;
  padding: 22px;
  border: 1px solid rgba(146, 101, 58, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  color: #1f2524;
  box-shadow: 0 12px 28px rgba(79, 48, 20, 0.06);
}

.club-report-qr__text {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.club-report-qr__text span {
  color: #bc6d2a;
  font-size: 17px;
  font-weight: 950;
  letter-spacing: 0;
}

.club-report-qr__text strong {
  color: #1f2524;
  font-size: 28px;
  font-weight: 950;
  line-height: 1.2;
}

.club-report-qr__text p {
  margin: 0;
  color: rgba(72, 57, 41, 0.68);
  font-size: 17px;
  font-weight: 760;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.club-report-qr__code {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 196px;
  height: 196px;
  padding: 10px;
  border: 1px solid rgba(15, 122, 106, 0.14);
  border-radius: 16px;
  background: #ffffff;
}

.club-report-qr__code svg {
  display: block;
  width: 176px;
  height: 176px;
}
`;
