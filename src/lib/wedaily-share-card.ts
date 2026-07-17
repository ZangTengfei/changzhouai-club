export const DAILY_SHARE_CARD_WIDTH = 1080;
export const DAILY_SHARE_CARD_HEIGHT = 1440;

export const DAILY_SHARE_CARD_CSS = `
* { box-sizing: border-box; }
.daily-share-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 1080px;
  height: 1440px;
  overflow: hidden;
  padding: 58px 68px 54px;
  color: #19312a;
  background: #f4efe5;
  font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
}
.daily-share-card--topic { background: #fffdf8; }
.daily-share-card--end { justify-content: space-between; background: #173d33; color: #fffdf8; }
.daily-share-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(25, 49, 42, 0.16);
  font-size: 25px;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.daily-share-card--end .daily-share-card__meta { border-color: rgba(255, 253, 248, 0.28); }
.daily-share-card__brand { color: #0f7a6a; }
.daily-share-card--end .daily-share-card__brand { color: #f4ca63; }
.daily-share-card__cover-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  padding: 78px 0 38px;
}
.daily-share-card__eyebrow {
  width: fit-content;
  margin: 0 0 38px;
  padding: 12px 20px;
  border-radius: 999px;
  color: #fffdf8;
  background: #dd7038;
  font-size: 27px;
  font-weight: 850;
  letter-spacing: 0.08em;
  line-height: 1.2;
}
.daily-share-card h2 {
  max-width: 920px;
  margin: 0;
  color: inherit;
  font-size: 108px;
  font-weight: 950;
  letter-spacing: -0.045em;
  line-height: 1.1;
}
.daily-share-card__cover-summary {
  max-width: 920px;
  margin: 42px 0 0;
  color: rgba(25, 49, 42, 0.72);
  font-size: 46px;
  font-weight: 560;
  line-height: 1.6;
}
.daily-share-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: auto;
  padding-top: 42px;
}
.daily-share-card__stat {
  display: flex;
  flex-direction: column;
  min-height: 260px;
  justify-content: center;
  padding: 26px;
  border: 2px solid rgba(15, 122, 106, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
}
.daily-share-card__stat strong { color: #0f7a6a; font-size: 70px; line-height: 1; }
.daily-share-card__stat span { margin-top: 16px; color: rgba(25, 49, 42, 0.62); font-size: 28px; font-weight: 720; }
.daily-share-card__topic-main {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  padding: 64px 0 36px;
}
.daily-share-card__topic-number {
  position: absolute;
  top: 57px;
  right: 0;
  color: rgba(15, 122, 106, 0.16);
  font-size: 92px;
  font-weight: 950;
  letter-spacing: -0.06em;
  line-height: 1;
  pointer-events: none;
}
.daily-share-card--topic h2 {
  max-width: 940px;
  font-size: 112px;
  line-height: 1.07;
}
.daily-share-card__topic-summary {
  display: flex;
  align-items: center;
  min-height: 400px;
  margin: auto 0 0;
  padding: 44px 44px 44px 38px;
  border-left: 8px solid #f1bd55;
  border-radius: 0 30px 30px 0;
  color: rgba(25, 49, 42, 0.82);
  background: #f7ecd8;
  font-size: 50px;
  font-weight: 590;
  line-height: 1.52;
}
.daily-share-card[data-copy-density="compact"] h2 { font-size: 90px; }
.daily-share-card[data-copy-density="compact"] .daily-share-card__cover-summary { font-size: 38px; }
.daily-share-card[data-copy-density="compact"] .daily-share-card__stat { min-height: 200px; }
.daily-share-card--topic[data-copy-density="compact"] h2 { font-size: 94px; }
.daily-share-card--topic[data-copy-density="compact"] .daily-share-card__topic-summary { min-height: 340px; font-size: 42px; }
.daily-share-card[data-copy-density="dense"] h2 { font-size: 80px; }
.daily-share-card[data-copy-density="dense"] .daily-share-card__cover-summary { font-size: 32px; }
.daily-share-card[data-copy-density="dense"] .daily-share-card__stat { min-height: 172px; }
.daily-share-card--topic[data-copy-density="dense"] h2 { font-size: 82px; }
.daily-share-card--topic[data-copy-density="dense"] .daily-share-card__topic-summary { min-height: 0; font-size: 36px; }
.daily-share-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding-top: 24px;
  border-top: 2px solid rgba(25, 49, 42, 0.16);
  color: rgba(25, 49, 42, 0.58);
  font-size: 23px;
  font-weight: 720;
}
.daily-share-card--end .daily-share-card__footer { border-color: rgba(255, 253, 248, 0.28); color: rgba(255, 253, 248, 0.68); }
.daily-share-card__end-main {
  display: grid;
  justify-items: center;
  gap: 32px;
  margin: auto 0;
  text-align: center;
}
.daily-share-card--end .daily-share-card__eyebrow { color: #173d33; background: #f4ca63; }
.daily-share-card__end-main h2 { max-width: 820px; font-size: 86px; }
.daily-share-card__end-main p { max-width: 820px; margin: 0; color: rgba(255, 253, 248, 0.76); font-size: 36px; line-height: 1.58; }
.daily-share-card__qr {
  display: grid;
  place-items: center;
  width: 326px;
  height: 326px;
  padding: 30px;
  border-radius: 30px;
  background: #ffffff;
}
.daily-share-card__qr img { display: block; width: 266px; height: 266px; }
`;

export async function downloadDailyShareCardPng(
  card: HTMLElement,
  fileName: string,
) {
  if (document.fonts) {
    await document.fonts.ready;
  }

  const cardBounds = card.getBoundingClientRect();
  const clonedCard = card.cloneNode(true) as HTMLElement;
  const overlayImages = Array.from(
    card.querySelectorAll<HTMLImageElement>("[data-export-overlay]"),
  ).map((element) => {
    const bounds = element.getBoundingClientRect();
    const scaleX = DAILY_SHARE_CARD_WIDTH / cardBounds.width;
    const scaleY = DAILY_SHARE_CARD_HEIGHT / cardBounds.height;

    return {
      height: bounds.height * scaleY,
      src: element.currentSrc || element.src,
      width: bounds.width * scaleX,
      x: (bounds.left - cardBounds.left) * scaleX,
      y: (bounds.top - cardBounds.top) * scaleY,
    };
  });

  clonedCard.querySelectorAll<HTMLElement>("[data-export-overlay]").forEach((element) => {
    element.remove();
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${DAILY_SHARE_CARD_WIDTH}" height="${DAILY_SHARE_CARD_HEIGHT}" viewBox="0 0 ${DAILY_SHARE_CARD_WIDTH} ${DAILY_SHARE_CARD_HEIGHT}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml"><style>${DAILY_SHARE_CARD_CSS}</style>${clonedCard.outerHTML}</div>
    </foreignObject>
  </svg>`;
  const image = await loadImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    "daily_share_card_image_load_failed",
  );

  const canvas = document.createElement("canvas");
  canvas.width = DAILY_SHARE_CARD_WIDTH;
  canvas.height = DAILY_SHARE_CARD_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("daily_share_card_canvas_unavailable");
  }

  context.drawImage(image, 0, 0);

  for (const overlay of overlayImages) {
    const overlayImage = await loadImage(
      overlay.src,
      "daily_share_card_overlay_load_failed",
    );
    context.drawImage(
      overlayImage,
      overlay.x,
      overlay.y,
      overlay.width,
      overlay.height,
    );
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

  if (!blob) {
    throw new Error("daily_share_card_export_failed");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function loadImage(src: string, errorCode: string) {
  const image = new Image();
  image.decoding = "async";

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(errorCode));
    image.src = src;
  });
}
