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
  padding: 76px 78px 68px;
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
  padding-bottom: 30px;
  border-bottom: 2px solid rgba(25, 49, 42, 0.16);
  font-size: 24px;
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
  justify-content: center;
  padding: 48px 0 34px;
}
.daily-share-card__eyebrow {
  margin: 0 0 26px;
  color: #bc6d2a;
  font-size: 25px;
  font-weight: 850;
  letter-spacing: 0.12em;
}
.daily-share-card h2 {
  max-width: 900px;
  margin: 0;
  color: inherit;
  font-size: 82px;
  font-weight: 950;
  letter-spacing: -0.045em;
  line-height: 1.12;
}
.daily-share-card__cover-summary {
  max-width: 880px;
  margin: 38px 0 0;
  color: rgba(25, 49, 42, 0.72);
  font-size: 31px;
  font-weight: 560;
  line-height: 1.72;
}
.daily-share-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 36px;
}
.daily-share-card__stat {
  display: flex;
  flex-direction: column;
  min-height: 166px;
  justify-content: center;
  padding: 24px;
  border: 2px solid rgba(15, 122, 106, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
}
.daily-share-card__stat strong { color: #0f7a6a; font-size: 54px; line-height: 1; }
.daily-share-card__stat span { margin-top: 13px; color: rgba(25, 49, 42, 0.62); font-size: 23px; font-weight: 720; }
.daily-share-card__topic-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding: 50px 0 40px;
}
.daily-share-card__topic-number {
  margin: 0 0 36px;
  color: #0f7a6a;
  font-size: 118px;
  font-weight: 950;
  letter-spacing: -0.06em;
  line-height: 0.9;
}
.daily-share-card__topic-summary {
  margin: 46px 0 0;
  padding-top: 38px;
  border-top: 2px solid rgba(25, 49, 42, 0.14);
  color: rgba(25, 49, 42, 0.78);
  font-size: 36px;
  font-weight: 560;
  line-height: 1.72;
}
.daily-share-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding-top: 28px;
  border-top: 2px solid rgba(25, 49, 42, 0.16);
  color: rgba(25, 49, 42, 0.58);
  font-size: 22px;
  font-weight: 720;
}
.daily-share-card--end .daily-share-card__footer { border-color: rgba(255, 253, 248, 0.28); color: rgba(255, 253, 248, 0.68); }
.daily-share-card__end-main {
  display: grid;
  justify-items: center;
  gap: 34px;
  margin: auto 0;
  text-align: center;
}
.daily-share-card__end-main h2 { max-width: 760px; font-size: 74px; }
.daily-share-card__end-main p { max-width: 760px; margin: 0; color: rgba(255, 253, 248, 0.72); font-size: 30px; line-height: 1.65; }
.daily-share-card__qr {
  display: grid;
  place-items: center;
  width: 310px;
  height: 310px;
  padding: 22px;
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
