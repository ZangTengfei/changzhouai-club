const $ = (selector) => document.querySelector(selector);

const sourceInput = $("#sourceInput");
const detectButton = $("#detectButton");
const wallButton = $("#wallButton");
const presetBackgroundButton = $("#presetBackgroundButton");
const backgroundInput = $("#backgroundInput");
const composeButton = $("#composeButton");
const downloadPosterButton = $("#downloadPosterButton");
const downloadWallButton = $("#downloadWallButton");
const downloadSheetButton = $("#downloadSheetButton");
const posterCanvas = $("#posterCanvas");
const wallCanvas = $("#wallCanvas");
const avatarGrid = $("#avatarGrid");
const avatarTemplate = $("#avatarTemplate");
const previewStage = $(".preview-stage");

const presets = {
  children: {
    accent: "#16a085",
    accentDark: "#0f7461",
    shapeText: "61",
    shapeFontSize: 900,
    wallWidth: 1260,
    wallHeight: 900,
    tileSize: 42,
    tileGap: 4,
    wallY: 660,
    title: "六一儿童节",
    subtitle: "童心创造价值 AI 点亮未来",
    brand: "常州 AI Club",
    footer: "changzhouai.club",
  },
  mayday: {
    accent: "#14936f",
    accentDark: "#0d6b55",
    shapeText: "51",
    shapeFontSize: 1120,
    wallWidth: 1500,
    wallHeight: 1210,
    tileSize: 45,
    tileGap: 3,
    wallY: 575,
    title: "五一劳动节",
    subtitle: "劳动创造价值 AI 点亮未来",
    brand: "常州 AI Club",
    footer: "changzhouai.club",
  },
  custom: {
    accent: "#2368d8",
    accentDark: "#174a9b",
    shapeText: "AI",
    shapeFontSize: 840,
    wallWidth: 1260,
    wallHeight: 900,
    tileSize: 42,
    tileGap: 4,
    wallY: 680,
    title: "头像墙海报",
    subtitle: "连接每一个真实的人",
    brand: "Community",
    footer: "",
  },
};

const state = {
  preset: "children",
  sources: [],
  avatars: [],
  wallReady: false,
  backgroundImage: null,
  backgroundCanvas: null,
  backgroundReady: false,
};

function setStatus(id, message) {
  $(id).textContent = message;
}

function numericValue(id, fallback) {
  const value = Number($(id).value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function setRootColor(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function applyPreset(name) {
  const preset = presets[name] || presets.children;
  state.preset = name;
  setRootColor("--accent", preset.accent);
  setRootColor("--accent-dark", preset.accentDark);
  $("#shapeText").value = preset.shapeText;
  $("#shapeFontSize").value = preset.shapeFontSize;
  $("#wallWidth").value = preset.wallWidth;
  $("#wallHeight").value = preset.wallHeight;
  $("#tileSize").value = preset.tileSize;
  $("#tileGap").value = preset.tileGap;
  $("#wallY").value = preset.wallY;
  $("#posterTitle").value = preset.title;
  $("#posterSubtitle").value = preset.subtitle;
  $("#brandText").value = preset.brand;
  $("#footerText").value = preset.footer;
  document.querySelectorAll(".preset-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === name);
  });
  state.wallReady = false;
  generatePresetBackground();
  if (state.avatars.length) generateWall();
  composePoster();
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ file, image });
    image.onerror = () => reject(new Error(`无法读取图片：${file.name}`));
    image.src = URL.createObjectURL(file);
  });
}

function canvasFromImage(image, width = image.naturalWidth, height = image.naturalHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function findRanges(values, threshold, minWidth) {
  const ranges = [];
  let start = -1;
  for (let index = 0; index < values.length; index += 1) {
    const active = values[index] > threshold;
    if (active && start < 0) start = index;
    if (start >= 0 && (!active || index === values.length - 1)) {
      const end = active && index === values.length - 1 ? index : index - 1;
      if (end - start + 1 >= minWidth) ranges.push([start, end]);
      start = -1;
    }
  }
  return ranges;
}

function buildExpectedRowStarts(rowStarts, avatarSize, expectedCount, columns, imageHeight) {
  if (!expectedCount) return rowStarts;
  const requiredRows = Math.ceil(expectedCount / columns);
  const starts = [...rowStarts].slice(0, requiredRows);
  if (starts.length >= requiredRows) return starts;

  const gaps = [];
  for (let index = 1; index < rowStarts.length; index += 1) {
    const gap = rowStarts[index] - rowStarts[index - 1];
    if (gap > avatarSize * 0.8) gaps.push(gap);
  }
  const rowStep = Math.round(median(gaps) || avatarSize * 1.7);
  while (starts.length < requiredRows && starts.length > 0) {
    const nextStart = starts[starts.length - 1] + rowStep;
    if (nextStart + avatarSize > imageHeight) break;
    starts.push(nextStart);
  }
  return starts;
}

function looksLikeAvatar(canvas) {
  const sample = document.createElement("canvas");
  sample.width = 20;
  sample.height = 20;
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, 20, 20);
  const data = ctx.getImageData(0, 0, 20, 20).data;
  let nonWhite = 0;
  let variance = 0;
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const avg = (r + g + b) / 3;
    if (r < 244 || g < 244 || b < 244) nonWhite += 1;
    variance += Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
  }
  return nonWhite > 80 && variance > 900;
}

function detectAvatarCrops(source, options) {
  const sourceCanvas = canvasFromImage(source.image);
  const { width, height } = sourceCanvas;
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, width, height).data;
  const topSkip = Math.min(options.topSkip, height - 1);
  const bottomSkip = Math.min(options.bottomSkip, height - topSkip - 1);
  const yEnd = height - bottomSkip;
  const colDensity = new Float32Array(width);
  const rowDensity = new Float32Array(height);

  for (let y = topSkip; y < yEnd; y += 1) {
    let rowHits = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const hit = imageData[offset] < 245 || imageData[offset + 1] < 245 || imageData[offset + 2] < 245;
      if (hit) {
        rowHits += 1;
        colDensity[x] += 1;
      }
    }
    rowDensity[y] = rowHits / width;
  }

  const scanHeight = Math.max(1, yEnd - topSkip);
  for (let x = 0; x < width; x += 1) colDensity[x] /= scanHeight;

  const xRanges = findRanges(colDensity, 0.015, Math.max(24, Math.round(width * 0.04))).slice(0, options.columns);
  const yRanges = findRanges(rowDensity, 0.05, Math.max(24, Math.round(width * 0.08)));

  if (xRanges.length < options.columns || yRanges.length === 0) {
    throw new Error(`识别失败：检测到 ${xRanges.length} 列、${yRanges.length} 行，请调整跳过值`);
  }

  const xStarts = xRanges.map(([start]) => start);
  const detectedRowStarts = yRanges.map(([start]) => start);
  const avatarSize = Math.round(
    Math.min(
      median(xRanges.map(([start, end]) => end - start + 1)),
      median(yRanges.map(([start, end]) => end - start + 1)),
    ),
  );
  const expectedCount = options.expectedCount;
  const rowStarts = buildExpectedRowStarts(detectedRowStarts, avatarSize, expectedCount, options.columns, height);
  const fullRows = expectedCount ? Math.floor(expectedCount / options.columns) : rowStarts.length;
  const remainder = expectedCount ? expectedCount % options.columns : 0;
  const avatars = [];

  for (let row = 0; row < rowStarts.length; row += 1) {
    const columnsInRow = expectedCount
      ? row < fullRows
        ? options.columns
        : row === fullRows
          ? remainder
          : 0
      : options.columns;

    for (let col = 0; col < columnsInRow; col += 1) {
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = avatarSize;
      cropCanvas.height = avatarSize;
      const cropCtx = cropCanvas.getContext("2d");
      cropCtx.drawImage(sourceCanvas, xStarts[col], rowStarts[row], avatarSize, avatarSize, 0, 0, avatarSize, avatarSize);
      if (!expectedCount && !looksLikeAvatar(cropCanvas)) continue;
      avatars.push({
        canvas: cropCanvas,
        sourceName: source.file.name,
        x: xStarts[col],
        y: rowStarts[row],
        size: avatarSize,
      });
    }
  }

  return {
    avatars,
    meta: {
      xRanges,
      yRanges,
      avatarSize,
      detectedRows: detectedRowStarts.length,
      usedRows: rowStarts.length,
    },
  };
}

function renderAvatarGrid() {
  avatarGrid.textContent = "";
  state.avatars.forEach((avatar, index) => {
    const item = avatarTemplate.content.firstElementChild.cloneNode(true);
    const img = item.querySelector("img");
    img.src = avatar.canvas.toDataURL("image/png");
    img.alt = `头像 ${index + 1}`;
    item.querySelector("figcaption").textContent = String(index + 1).padStart(3, "0");
    avatarGrid.appendChild(item);
  });
  updateSummary();
}

function updateSummary() {
  $("#summaryTitle").textContent = state.wallReady ? "头像墙已生成" : state.avatars.length ? "头像已分割" : "准备生成";
  $("#summaryMeta").textContent = `${state.avatars.length} 个头像`;
}

function fontStack(fontSize) {
  return `900 ${fontSize}px "Arial Rounded MT Bold", "Arial Black", "PingFang SC", sans-serif`;
}

function getTextMetrics(ctx, text, fontSize) {
  ctx.font = fontStack(fontSize);
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.76;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.22;
  return { width: metrics.width, height: ascent + descent, ascent, descent };
}

function drawShapeMask(width, height, text, fontSize) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const metrics = getTextMetrics(ctx, text, fontSize);
  const x = (width - metrics.width) / 2;
  const y = (height - metrics.height) / 2 + metrics.ascent;
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x, y);
  return canvas;
}

function coverageAt(maskData, maskWidth, x, y, size) {
  let hits = 0;
  const total = size * size;
  for (let yy = y; yy < y + size; yy += 1) {
    const row = yy * maskWidth;
    for (let xx = x; xx < x + size; xx += 1) {
      if (maskData[(row + xx) * 4 + 3] > 0) hits += 1;
    }
  }
  return hits / total;
}

function collectPositions(maskCanvas, tileSize, tileGap, threshold) {
  const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
  const positions = [];
  const step = tileSize + tileGap;
  for (let y = 0; y <= maskCanvas.height - tileSize; y += step) {
    for (let x = 0; x <= maskCanvas.width - tileSize; x += step) {
      const coverage = coverageAt(data, maskCanvas.width, x, y, tileSize);
      if (coverage > threshold) positions.push({ x, y, coverage });
    }
  }
  return positions;
}

function chooseTileLayout(maskCanvas, count) {
  const requestedTile = numericValue("#tileSize", 42);
  const requestedGap = numericValue("#tileGap", 4);
  if (!$("#autoFitTiles").checked) {
    return {
      tileSize: requestedTile,
      tileGap: requestedGap,
      positions: collectPositions(maskCanvas, requestedTile, requestedGap, 0.35),
    };
  }

  let best = null;
  for (let tileSize = 108; tileSize >= 22; tileSize -= 1) {
    for (let tileGap = 2; tileGap <= 10; tileGap += 1) {
      const positions = collectPositions(maskCanvas, tileSize, tileGap, 0.35);
      if (positions.length >= count) {
        best = { tileSize, tileGap, positions };
        break;
      }
    }
    if (best) break;
  }
  return best || {
    tileSize: requestedTile,
    tileGap: requestedGap,
    positions: collectPositions(maskCanvas, requestedTile, requestedGap, 0.24),
  };
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawRoundedAvatar(ctx, avatarCanvas, x, y, size) {
  const radius = Math.max(5, Math.round(size * 0.18));
  ctx.save();
  ctx.fillStyle = "#fff";
  roundedRect(ctx, x - 2, y - 2, size + 4, size + 4, radius + 2);
  ctx.fill();
  roundedRect(ctx, x, y, size, size, radius);
  ctx.clip();
  ctx.drawImage(avatarCanvas, x, y, size, size);
  ctx.restore();
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  roundedRect(ctx, x - 2, y - 2, size + 4, size + 4, radius + 2);
  ctx.stroke();
  ctx.restore();
}

function drawWallBacking(ctx, text, width, height, fontSize, preset) {
  const metrics = getTextMetrics(ctx, text, fontSize);
  const x = (width - metrics.width) / 2;
  const y = (height - metrics.height) / 2 + metrics.ascent;
  const fill = ctx.createLinearGradient(0, 0, width, height);
  fill.addColorStop(0, preset === "mayday" ? "#dff29f" : "#fff2a6");
  fill.addColorStop(0.48, preset === "mayday" ? "#86d05d" : "#7cd8c3");
  fill.addColorStop(1, preset === "mayday" ? "#1d9b68" : "#48a9f8");

  ctx.save();
  ctx.font = fontStack(fontSize);
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(18, 70, 52, 0.28)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 24;
  ctx.lineWidth = Math.max(22, Math.round(fontSize * 0.045));
  ctx.strokeStyle = preset === "mayday" ? "rgba(50, 150, 76, 0.94)" : "rgba(12, 132, 121, 0.9)";
  ctx.strokeText(text, x, y);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.lineWidth = Math.max(10, Math.round(fontSize * 0.022));
  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.strokeText(text, x, y);
  ctx.restore();

  return { x, y };
}

function generateWall() {
  if (!state.avatars.length) {
    setStatus("#wallStatus", "请先分割头像");
    return;
  }

  const text = $("#shapeText").value.trim() || "61";
  const width = numericValue("#wallWidth", 1260);
  const height = numericValue("#wallHeight", 900);
  const fontSize = numericValue("#shapeFontSize", 900);
  wallCanvas.width = width;
  wallCanvas.height = height;
  const ctx = wallCanvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const maskCanvas = drawShapeMask(width, height, text, fontSize);
  const layout = chooseTileLayout(maskCanvas, state.avatars.length);
  if (!layout || layout.positions.length < state.avatars.length) {
    setStatus("#wallStatus", `图形空间不足：只有 ${layout?.positions.length || 0} 个槽位`);
    return;
  }

  const positions = [...layout.positions]
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, state.avatars.length)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const textPosition = drawWallBacking(ctx, text, width, height, fontSize, state.preset);
  positions.forEach((position, index) => {
    drawRoundedAvatar(ctx, state.avatars[index].canvas, position.x, position.y, layout.tileSize);
  });

  if ($("#drawTopOutline").checked) {
    ctx.save();
    ctx.font = fontStack(fontSize);
    ctx.lineJoin = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(15, 112, 98, 0.72)";
    ctx.strokeText(text, textPosition.x, textPosition.y);
    ctx.restore();
  }

  state.wallReady = true;
  $("#tileSize").value = layout.tileSize;
  $("#tileGap").value = layout.tileGap;
  setStatus("#wallStatus", `已生成：${state.avatars.length} 个头像，头像 ${layout.tileSize}px，间距 ${layout.tileGap}px`);
  updateSummary();
  previewStage.dataset.activeView = "wall";
  setActiveTab("wall");
}

function drawCover(ctx, source, width, height) {
  const ratio = Math.max(width / source.width, height / source.height);
  const drawWidth = source.width * ratio;
  const drawHeight = source.height * ratio;
  ctx.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawBlob(ctx, x, y, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function createPresetBackgroundCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const isMayday = state.preset === "mayday";
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, isMayday ? "#79c8ff" : "#7fd5ff");
  sky.addColorStop(0.46, isMayday ? "#def5ff" : "#f5fbff");
  sky.addColorStop(0.74, isMayday ? "#eef8ed" : "#f8f1cd");
  sky.addColorStop(1, isMayday ? "#4b9a4a" : "#49b57d");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const sun = ctx.createRadialGradient(width * 0.82, height * 0.08, 20, width * 0.82, height * 0.08, width * 0.42);
  sun.addColorStop(0, "rgba(255,255,255,0.98)");
  sun.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  drawSkyDecor(ctx, width, height, isMayday);
  drawForeground(ctx, width, height, isMayday);
  return canvas;
}

function drawSkyDecor(ctx, width, height, isMayday) {
  ctx.save();
  for (let index = 0; index < 18; index += 1) {
    const x = (Math.sin(index * 2.1) * 0.42 + 0.5) * width;
    const y = (0.04 + (index % 8) * 0.045) * height;
    drawBlob(ctx, x, y, 8 + (index % 4) * 4, isMayday ? "rgba(255,255,255,0.7)" : "rgba(255,205,74,0.5)");
  }
  ctx.fillStyle = isMayday ? "#f7c744" : "#ff7aa6";
  ctx.beginPath();
  ctx.moveTo(width * 0.08, height * 0.24);
  ctx.lineTo(width * 0.16, height * 0.2);
  ctx.lineTo(width * 0.13, height * 0.29);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = isMayday ? "#4fb469" : "#4ca3ff";
  ctx.beginPath();
  ctx.moveTo(width * 0.9, height * 0.2);
  ctx.lineTo(width * 0.98, height * 0.17);
  ctx.lineTo(width * 0.93, height * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawForeground(ctx, width, height, isMayday) {
  ctx.save();
  ctx.fillStyle = isMayday ? "rgba(107, 178, 84, 0.94)" : "rgba(63, 178, 126, 0.92)";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.76);
  ctx.bezierCurveTo(width * 0.24, height * 0.68, width * 0.7, height * 0.71, width, height * 0.77);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.34)";
  ctx.lineWidth = 3;
  for (let index = 0; index < 5; index += 1) {
    const y = height * (0.73 + index * 0.035);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(width * 0.25, y - 40, width * 0.75, y + 30, width, y - 20);
    ctx.stroke();
  }
  ctx.restore();
}

function generatePresetBackground() {
  const width = numericValue("#posterWidth", 1536);
  const height = numericValue("#posterHeight", 2304);
  state.backgroundCanvas = createPresetBackgroundCanvas(width, height);
  state.backgroundImage = null;
  state.backgroundReady = true;
  setStatus("#backgroundStatus", "已生成本地无字背景");
}

function drawPosterText(ctx, width, height) {
  const title = $("#posterTitle").value.trim();
  const subtitle = $("#posterSubtitle").value.trim();
  const brand = $("#brandText").value.trim();
  const footer = $("#footerText").value.trim();

  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = state.preset === "mayday" ? "#0a682e" : "#0d5f7d";
  ctx.font = `900 ${Math.round(width * 0.12)}px "STKaiti", "KaiTi", "PingFang SC", sans-serif`;
  ctx.fillText(title, width / 2, height * 0.2);
  ctx.font = `800 ${Math.round(width * 0.036)}px "PingFang SC", sans-serif`;
  ctx.fillText(subtitle, width / 2, height * 0.265);
  ctx.textAlign = "left";
  ctx.fillStyle = "#10286d";
  ctx.font = `900 ${Math.round(width * 0.034)}px Arial, "PingFang SC", sans-serif`;
  ctx.fillText(brand, width * 0.68, height * 0.065);
  ctx.font = `700 ${Math.round(width * 0.018)}px "PingFang SC", sans-serif`;
  ctx.fillText("探索 AI · 连接未来 · 共创价值", width * 0.68, height * 0.09);

  if (footer) {
    ctx.textAlign = "center";
    ctx.font = `900 ${Math.round(width * 0.052)}px "PingFang SC", sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(brand, width / 2, height * 0.936);
    const pillWidth = Math.max(width * 0.28, ctx.measureText(footer).width + width * 0.08);
    roundPill(ctx, width / 2 - pillWidth / 2, height * 0.955, pillWidth, height * 0.03, height * 0.015, "rgba(8, 111, 91, 0.9)");
    ctx.font = `700 ${Math.round(width * 0.026)}px Arial, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(footer, width / 2, height * 0.977);
  }
  ctx.restore();
}

function roundPill(ctx, x, y, width, height, radius, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
}

function composePoster() {
  if (!state.backgroundReady) generatePresetBackground();
  if (!state.wallReady && state.avatars.length) generateWall();
  const width = numericValue("#posterWidth", 1536);
  const height = numericValue("#posterHeight", 2304);
  posterCanvas.width = width;
  posterCanvas.height = height;
  const ctx = posterCanvas.getContext("2d");

  const background = state.backgroundImage || state.backgroundCanvas || createPresetBackgroundCanvas(width, height);
  drawCover(ctx, background, width, height);
  drawPosterText(ctx, width, height);

  if (state.wallReady) {
    const renderWidth = Math.min(width * 0.92, wallCanvas.width);
    const renderHeight = wallCanvas.height * (renderWidth / wallCanvas.width);
    const x = (width - renderWidth) / 2;
    const y = Number($("#wallY").value) || 0;
    ctx.drawImage(wallCanvas, x, y, renderWidth, renderHeight);
  }

  previewStage.dataset.activeView = "poster";
  setActiveTab("poster");
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  link.click();
}

function downloadAvatarSheet() {
  if (!state.avatars.length) return;
  const thumb = 96;
  const labelHeight = 28;
  const columns = Math.min(12, Math.ceil(Math.sqrt(state.avatars.length)));
  const rows = Math.ceil(state.avatars.length / columns);
  const sheet = document.createElement("canvas");
  sheet.width = columns * thumb;
  sheet.height = rows * (thumb + labelHeight);
  const ctx = sheet.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  ctx.fillStyle = "#687a71";
  ctx.font = "700 16px Arial, sans-serif";
  state.avatars.forEach((avatar, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = col * thumb;
    const y = row * (thumb + labelHeight);
    ctx.drawImage(avatar.canvas, x + 8, y + 8, thumb - 16, thumb - 16);
    ctx.fillText(String(index + 1), x + 8, y + thumb + 15);
  });
  downloadCanvas(sheet, "avatar-contact-sheet.png");
}

function setActiveTab(view) {
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

sourceInput.addEventListener("change", async () => {
  const files = Array.from(sourceInput.files || []);
  state.sources = await Promise.all(files.map(loadImageFromFile));
  setStatus("#detectStatus", `已载入 ${state.sources.length} 张截图`);
});

detectButton.addEventListener("click", () => {
  try {
    if (!state.sources.length) {
      setStatus("#detectStatus", "请先上传头像截图");
      return;
    }
    const options = {
      columns: numericValue("#columnCount", 5),
      expectedCount: numericValue("#expectedCount", 0),
      topSkip: numericValue("#topSkip", 250),
      bottomSkip: numericValue("#bottomSkip", 450),
    };
    const batches = [];
    let remaining = options.expectedCount;
    for (const source of state.sources) {
      const batchOptions = {
        ...options,
        expectedCount: remaining || 0,
      };
      const batch = detectAvatarCrops(source, batchOptions);
      batches.push(batch);
      if (remaining) {
        remaining = Math.max(0, remaining - batch.avatars.length);
        if (remaining === 0) break;
      }
    }
    state.avatars = batches.flatMap((batch) => batch.avatars).slice(0, options.expectedCount || undefined);
    state.wallReady = false;
    renderAvatarGrid();
    const rowMeta = batches
      .map((batch) =>
        batch.meta.detectedRows === batch.meta.usedRows
          ? `${batch.meta.usedRows} 行`
          : `${batch.meta.detectedRows}/${batch.meta.usedRows} 行`,
      )
      .join(" + ");
    setStatus("#detectStatus", `已分割 ${state.avatars.length} 个头像，单头像约 ${batches[0].meta.avatarSize}px，行数 ${rowMeta}`);
    previewStage.dataset.activeView = "avatars";
    setActiveTab("avatars");
  } catch (error) {
    setStatus("#detectStatus", error.message);
  }
});

wallButton.addEventListener("click", generateWall);
presetBackgroundButton.addEventListener("click", () => {
  generatePresetBackground();
  composePoster();
});
composeButton.addEventListener("click", composePoster);
downloadPosterButton.addEventListener("click", () => downloadCanvas(posterCanvas, "avatar-wall-poster.png"));
downloadWallButton.addEventListener("click", () => downloadCanvas(wallCanvas, "avatar-wall-transparent.png"));
downloadSheetButton.addEventListener("click", downloadAvatarSheet);

backgroundInput.addEventListener("change", async () => {
  const [file] = backgroundInput.files || [];
  if (!file) return;
  const { image } = await loadImageFromFile(file);
  state.backgroundImage = image;
  state.backgroundCanvas = null;
  state.backgroundReady = true;
  setStatus("#backgroundStatus", `已上传背景：${file.name}`);
  composePoster();
});

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    previewStage.dataset.activeView = view;
    setActiveTab(view);
  });
});

document.querySelectorAll(".preset-button").forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

applyPreset("children");
updateSummary();
