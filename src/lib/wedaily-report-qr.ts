import type { AdminWeDailyReportExportTemplate } from "@/lib/admin/wedaily-admin";

const COMMUNITY_WECHAT_QR_IMAGE_PATH = "/community-wechat-qr.png";

export async function appendWeDailyReportQrCode(
  template: AdminWeDailyReportExportTemplate,
) {
  if (template.html.includes("club-report-qr")) {
    return template;
  }

  const qrCodeDataUrl = await fetchImageAsDataUrl(COMMUNITY_WECHAT_QR_IMAGE_PATH);
  const qrCodeHtml = `
<section class="club-report-qr">
  <div class="club-report-qr__text">
    <span>JOIN THE CLUB</span>
    <strong>扫码添加社区微信</strong>
    <p>添加「常州 AI Club 小助手」为好友</p>
  </div>
  <div class="club-report-qr__code">
    <img src="${qrCodeDataUrl}" alt="常州 AI Club 小助手微信二维码" />
  </div>
</section>`;

  return {
    ...template,
    css: `${template.css}\n${REPORT_QR_CODE_CSS}`,
    html: insertBeforeDailySheetEnd(template.html, qrCodeHtml),
  };
}

function insertBeforeDailySheetEnd(html: string, content: string) {
  const articleEndIndex = html.lastIndexOf("</article>");

  if (articleEndIndex >= 0) {
    return `${html.slice(0, articleEndIndex)}${content}${html.slice(articleEndIndex)}`;
  }

  return `${html}${content}`;
}

async function fetchImageAsDataUrl(imagePath: string) {
  const response = await fetch(imagePath);

  if (!response.ok) {
    throw new Error("community_wechat_qr_load_failed");
  }

  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("community_wechat_qr_read_failed"));
    reader.readAsDataURL(blob);
  });
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

.club-report-qr__code img {
  display: block;
  width: 176px;
  height: 176px;
  object-fit: contain;
}
`;
