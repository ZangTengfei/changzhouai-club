const CARD_WIDTH = 750;
const CARD_HEIGHT = 600;

type ShareCardProfile = Pick<
  MiniappSharedProfile,
  | "displayName"
  | "avatarUrl"
  | "city"
  | "roleLabel"
  | "organization"
  | "skills"
  | "capabilitySummary"
  | "seekingSummary"
>;

function roundedRect(
  context: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.arcTo(x + width, y, x + width, y + radius, radius);
  context.lineTo(x + width, y + height - radius);
  context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  context.lineTo(x + radius, y + height);
  context.arcTo(x, y + height, x, y + height - radius, radius);
  context.lineTo(x, y + radius);
  context.arcTo(x, y, x + radius, y, radius);
  context.closePath();
}

function fitText(
  context: WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
) {
  const text = value.replace(/\s+/g, " ").trim();
  if (context.measureText(text).width <= maxWidth) return text;

  let fitted = "";
  for (const character of text) {
    if (context.measureText(`${fitted}${character}…`).width > maxWidth) break;
    fitted += character;
  }
  return fitted ? `${fitted}…` : "";
}

function loadImage(canvas: WechatMiniprogram.Canvas, source: string) {
  return new Promise<WechatMiniprogram.Image>((resolve, reject) => {
    const image = canvas.createImage();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function exportCanvas(canvas: WechatMiniprogram.Canvas) {
  return new Promise<string>((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      destWidth: CARD_WIDTH,
      destHeight: CARD_HEIGHT,
      fileType: "png",
      success: ({ tempFilePath }) => resolve(tempFilePath),
      fail: reject,
    });
  });
}

export async function createProfileShareCard(
  canvas: WechatMiniprogram.Canvas,
  profile: ShareCardProfile,
) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");

  context.fillStyle = "#f4fbf7";
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.fillStyle = "#08794a";
  context.font = "700 24px sans-serif";
  context.fillText("CHANGZHOU AI CLUB · MEMBER", 48, 54);

  roundedRect(context, 36, 84, 678, 208, 30);
  context.fillStyle = "#e3f7eb";
  context.fill();

  const avatarX = 68;
  const avatarY = 124;
  const avatarSize = 126;
  let avatarDrawn = false;

  if (profile.avatarUrl) {
    try {
      const avatar = await loadImage(canvas, profile.avatarUrl);
      context.save();
      context.beginPath();
      context.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2,
      );
      context.clip();
      context.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      context.restore();
      avatarDrawn = true;
    } catch {
      avatarDrawn = false;
    }
  }

  if (!avatarDrawn) {
    context.beginPath();
    context.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2,
    );
    context.fillStyle = "#ffffff";
    context.fill();
    context.fillStyle = "#08794a";
    context.font = "700 48px sans-serif";
    context.textAlign = "center";
    context.fillText(
      profile.displayName.slice(0, 1) || "微",
      avatarX + avatarSize / 2,
      avatarY + 82,
    );
    context.textAlign = "left";
  }

  context.fillStyle = "#111715";
  context.font = "700 44px sans-serif";
  context.fillText(fitText(context, profile.displayName, 450), 224, 148);

  const headline = [profile.roleLabel, profile.organization]
    .filter(Boolean)
    .join(" · ");
  context.fillStyle = "#4f5d57";
  context.font = "500 27px sans-serif";
  context.fillText(fitText(context, headline || "常州 AI 社区成员", 440), 224, 196);

  context.fillStyle = "#08794a";
  context.font = "600 24px sans-serif";
  context.fillText(profile.city || "常州", 224, 238);

  context.fillStyle = "#5e6864";
  context.font = "600 22px sans-serif";
  context.fillText("擅长方向", 48, 342);

  context.font = "600 23px sans-serif";
  let tagX = 48;
  const tags = profile.skills.slice(0, 3);
  (tags.length ? tags : ["期待认识更多 AI 伙伴"]).forEach((tag) => {
    const label = fitText(context, tag, 176);
    const width = Math.min(context.measureText(label).width + 38, 214);
    roundedRect(context, tagX, 362, width, 52, 26);
    context.fillStyle = "#edf5ff";
    context.fill();
    context.fillStyle = "#2f65b5";
    context.fillText(label, tagX + 19, 396);
    tagX += width + 12;
  });

  context.font = "600 22px sans-serif";
  context.fillStyle = "#08794a";
  context.fillText("我能提供", 48, 468);
  context.fillStyle = "#27322e";
  context.font = "500 24px sans-serif";
  context.fillText(
    fitText(context, profile.capabilitySummary || "欢迎交流实践经验与社区协作", 552),
    150,
    468,
  );

  context.font = "600 22px sans-serif";
  context.fillStyle = "#7357e8";
  context.fillText("我想连接", 48, 520);
  context.fillStyle = "#27322e";
  context.font = "500 24px sans-serif";
  context.fillText(
    fitText(context, profile.seekingSummary || "认识有趣、务实的 AI 同行者", 552),
    150,
    520,
  );

  context.fillStyle = "#89938f";
  context.font = "500 20px sans-serif";
  context.fillText("点击卡片，查看我的公开成员资料", 48, 568);

  return exportCanvas(canvas);
}
