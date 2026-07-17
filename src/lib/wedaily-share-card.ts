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
  padding: 56px 72px 50px 76px;
  color: #061747;
  background: transparent;
  font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
}
.daily-share-card__background {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 1080px;
  height: 1440px;
  object-fit: cover;
}
.daily-share-card > :not(.daily-share-card__background) { position: relative; z-index: 1; }
.daily-share-card--end { justify-content: space-between; }
.daily-share-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 12px 22px;
  border-bottom: 3px solid #1f65ed;
  color: #0d55c7;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}
.daily-share-card__brand { color: #0b58d4; }
.daily-share-card__cover-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  padding: 70px 14px 34px;
}
.daily-share-card__eyebrow {
  width: fit-content;
  margin: 0 0 46px;
  padding: 14px 24px 13px;
  border: 2px solid rgba(255, 255, 255, 0.72);
  border-radius: 4px;
  color: #ffffff;
  background: #0b61ee;
  box-shadow: 0 0 0 2px rgba(11, 97, 238, 0.2);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.055em;
  line-height: 1.2;
}
.daily-share-card h2 {
  max-width: 930px;
  margin: 0;
  color: inherit;
  font-size: 110px;
  font-weight: 950;
  letter-spacing: -0.055em;
  line-height: 1.06;
}
.daily-share-card__cover-summary {
  max-width: 900px;
  margin: 46px 0 0;
  color: rgba(6, 23, 71, 0.76);
  font-size: 44px;
  font-weight: 610;
  line-height: 1.56;
}
.daily-share-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: auto;
  padding-top: 48px;
}
.daily-share-card__stat {
  display: flex;
  flex-direction: column;
  min-height: 230px;
  justify-content: center;
  padding: 28px;
  border: 2px solid rgba(41, 111, 232, 0.26);
  border-radius: 6px;
  background: rgba(243, 248, 255, 0.9);
}
.daily-share-card__stat strong { color: #084cc2; font-size: 70px; line-height: 1; }
.daily-share-card__stat span { margin-top: 16px; color: rgba(6, 23, 71, 0.62); font-size: 28px; font-weight: 760; }
.daily-share-card__topic-main {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  padding: 58px 14px 32px;
}
.daily-share-card__topic-number {
  position: absolute;
  top: 34px;
  right: 14px;
  color: rgba(53, 117, 223, 0.16);
  font-size: 158px;
  font-weight: 950;
  letter-spacing: -0.06em;
  line-height: 1;
  pointer-events: none;
}
.daily-share-card--topic h2 {
  max-width: 700px;
  font-size: 144px;
  line-height: 1.04;
}
.daily-share-card--topic .daily-share-card__eyebrow { margin-bottom: 34px; }
.daily-share-card__topic-summary {
  display: flex;
  align-items: center;
  min-height: 330px;
  margin: auto 0 0;
  padding: 44px 48px 44px 50px;
  border-left: 12px solid #1269ff;
  border-radius: 0;
  color: rgba(6, 23, 71, 0.9);
  background: rgba(229, 239, 255, 0.9);
  font-size: 45px;
  font-weight: 610;
  line-height: 1.55;
}
.daily-share-card[data-copy-density="compact"] h2 { font-size: 92px; }
.daily-share-card[data-copy-density="compact"] .daily-share-card__cover-summary { font-size: 37px; }
.daily-share-card[data-copy-density="compact"] .daily-share-card__stat { min-height: 190px; }
.daily-share-card--topic[data-copy-density="compact"] h2 { font-size: 98px; }
.daily-share-card--topic[data-copy-density="compact"] .daily-share-card__topic-summary { min-height: 300px; font-size: 40px; }
.daily-share-card[data-copy-density="dense"] h2 { font-size: 80px; }
.daily-share-card[data-copy-density="dense"] .daily-share-card__cover-summary { font-size: 31px; }
.daily-share-card[data-copy-density="dense"] .daily-share-card__stat { min-height: 168px; }
.daily-share-card--topic[data-copy-density="dense"] h2 { font-size: 84px; }
.daily-share-card--topic[data-copy-density="dense"] .daily-share-card__topic-summary { min-height: 0; font-size: 35px; }
.daily-share-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding: 24px 12px 0;
  border-top: 3px solid #1f65ed;
  color: #1653b8;
  font-size: 23px;
  font-weight: 780;
}
.daily-share-card__end-main {
  display: grid;
  justify-items: center;
  gap: 38px;
  margin: auto 0;
  padding: 0 20px;
  text-align: center;
}
.daily-share-card--end .daily-share-card__eyebrow { color: #ffffff; background: #0b61ee; }
.daily-share-card__end-main h2 { max-width: 850px; font-size: 94px; }
.daily-share-card__end-main p { max-width: 820px; margin: 0; color: rgba(6, 23, 71, 0.72); font-size: 38px; font-weight: 600; line-height: 1.56; }
.daily-share-card__qr {
  display: grid;
  place-items: center;
  width: 334px;
  height: 334px;
  padding: 32px;
  border: 4px solid #1f65ed;
  border-radius: 8px;
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
  const collectExportImages = (selector: string) => Array.from(
    card.querySelectorAll<HTMLImageElement>(selector),
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
  const backgroundImages = collectExportImages("[data-export-background]");
  const overlayImages = collectExportImages("[data-export-overlay]");

  clonedCard.querySelectorAll<HTMLElement>("[data-export-background], [data-export-overlay]").forEach((element) => {
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

  for (const background of backgroundImages) {
    const backgroundImage = await loadImage(
      background.src,
      "daily_share_card_background_load_failed",
    );
    context.drawImage(
      backgroundImage,
      background.x,
      background.y,
      background.width,
      background.height,
    );
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
