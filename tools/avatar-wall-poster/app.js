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

function clearLegacyExpectedCountDefault() {
  const expectedCountInput = $("#expectedCount");
  if (expectedCountInput?.value === "204" && expectedCountInput.placeholder === "自动识别") {
    expectedCountInput.value = "";
  }
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

function nearestValue(values, target, tolerance) {
  let best = null;
  let bestDistance = Infinity;
  values.forEach((value) => {
    const distance = Math.abs(value - target);
    if (distance <= tolerance && distance < bestDistance) {
      best = value;
      bestDistance = distance;
    }
  });
  return best;
}

function estimateGridStep(rowStarts, avatarSize) {
  const gaps = [];
  for (let index = 1; index < rowStarts.length; index += 1) {
    const gap = rowStarts[index] - rowStarts[index - 1];
    if (gap > avatarSize * 1.15 && gap < avatarSize * 3.1) gaps.push(gap);
  }
  return Math.round(median(gaps) || avatarSize * 1.7);
}

function scoreGridStart(start, rowStarts, rowStep, requiredRows, tolerance) {
  let matchedRows = 0;
  let closeness = 0;
  for (let row = 0; row < requiredRows; row += 1) {
    const target = start + row * rowStep;
    const nearest = nearestValue(rowStarts, target, tolerance);
    if (nearest !== null) {
      matchedRows += 1;
      closeness += 1 - Math.abs(nearest - target) / tolerance;
    }
  }
  return matchedRows * 10 + closeness;
}

function buildExpectedRowStarts(rowStarts, avatarSize, expectedCount, columns, imageHeight) {
  if (!expectedCount) return rowStarts;
  const requiredRows = Math.ceil(expectedCount / columns);
  if (!rowStarts.length) return rowStarts;

  const rowStep = estimateGridStep(rowStarts, avatarSize);
  const tolerance = Math.max(avatarSize * 0.45, rowStep * 0.22);
  let bestStart = rowStarts[0];
  let bestScore = -Infinity;
  rowStarts.forEach((start) => {
    const score = scoreGridStart(start, rowStarts, rowStep, requiredRows, tolerance);
    if (score > bestScore) {
      bestStart = start;
      bestScore = score;
    }
  });

  const maxStart = Math.max(0, imageHeight - avatarSize);
  const starts = [];
  for (let row = 0; row < requiredRows; row += 1) {
    const predicted = Math.min(bestStart + row * rowStep, maxStart);
    const nearest = nearestValue(rowStarts, predicted, tolerance);
    starts.push(Math.round(nearest ?? predicted));
  }
  return starts.filter((start, index) => index === 0 || start > starts[index - 1]);
}

function inferRegularRowStarts(rowStarts, avatarSize, imageHeight) {
  if (rowStarts.length <= 2) return rowStarts;
  const rowStep = estimateGridStep(rowStarts, avatarSize);
  const tolerance = Math.max(avatarSize * 0.45, rowStep * 0.22);
  let bestRows = [];
  let bestScore = -Infinity;

  rowStarts.forEach((start) => {
    const rows = [];
    let closeness = 0;
    for (let target = start; target <= imageHeight - avatarSize; target += rowStep) {
      const nearest = nearestValue(rowStarts, target, tolerance);
      if (nearest === null) break;
      if (rows.length && nearest <= rows[rows.length - 1]) break;
      rows.push(nearest);
      closeness += 1 - Math.abs(nearest - target) / tolerance;
    }
    const score = rows.length * 10 + closeness;
    if (score > bestScore) {
      bestRows = rows;
      bestScore = score;
    }
  });

  return bestRows.length ? bestRows : rowStarts;
}

function detectColumnRangesFromRows(imageData, width, height, rowStarts, avatarSize, columns) {
  const colDensity = new Float32Array(width);
  let sampleHeight = 0;
  const rowSampleHeight = Math.max(24, Math.round(avatarSize * 0.78));

  rowStarts.forEach((rowStart) => {
    const yStart = Math.max(0, Math.round(rowStart));
    const yEnd = Math.min(height, yStart + rowSampleHeight);
    sampleHeight += Math.max(0, yEnd - yStart);
    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const hit = imageData[offset] < 245 || imageData[offset + 1] < 245 || imageData[offset + 2] < 245;
        if (hit) colDensity[x] += 1;
      }
    }
  });

  if (!sampleHeight) return [];
  for (let x = 0; x < width; x += 1) colDensity[x] /= sampleHeight;

  const minWidth = Math.max(24, Math.round(width * 0.04));
  for (const threshold of [0.12, 0.08, 0.04, 0.02]) {
    const ranges = findRanges(colDensity, threshold, minWidth);
    if (ranges.length >= columns) return ranges.slice(0, columns);
  }
  return [];
}

function looksLikeAvatar(canvas) {
  const sample = document.createElement("canvas");
  sample.width = 32;
  sample.height = 32;
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, 32, 32);
  const data = ctx.getImageData(0, 0, 32, 32).data;
  let nonWhite = 0;
  let dark = 0;
  let color = 0;
  let border = 0;
  let center = 0;
  for (let index = 0; index < data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % 32;
    const y = Math.floor(pixel / 32);
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const active = r < 245 || g < 245 || b < 245;
    if (!active) continue;
    nonWhite += 1;
    if (r < 230 || g < 230 || b < 230) dark += 1;
    if (Math.max(r, g, b) - Math.min(r, g, b) > 18) color += 1;
    if (x < 4 || x >= 28 || y < 4 || y >= 28) border += 1;
    if (x >= 10 && x < 22 && y >= 10 && y < 22) center += 1;
  }

  const looksLikeActionButton = border > nonWhite * 0.55 && center < nonWhite * 0.4 && color < Math.max(8, nonWhite * 0.08);
  if (looksLikeActionButton) return false;
  return nonWhite > 70 || dark > 50 || color > 30 || center > 20;
}

function detectAvatarCrops(source, options) {
  const sourceCanvas = canvasFromImage(source.image);
  const { width, height } = sourceCanvas;
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, width, height).data;
  const rowDensity = new Float32Array(height);

  for (let y = 0; y < height; y += 1) {
    let rowHits = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const hit = imageData[offset] < 245 || imageData[offset + 1] < 245 || imageData[offset + 2] < 245;
      if (hit) rowHits += 1;
    }
    rowDensity[y] = rowHits / width;
  }

  const yRanges = findRanges(rowDensity, 0.05, Math.max(24, Math.round(width * 0.08)));

  if (yRanges.length === 0) {
    throw new Error("识别失败：没有检测到头像行，请检查截图是否包含完整头像网格");
  }

  const detectedRowStarts = yRanges.map(([start]) => start);
  const rowSize = Math.round(median(yRanges.map(([start, end]) => end - start + 1)));
  const expectedCount = options.expectedCount;
  const rowStarts = expectedCount
    ? buildExpectedRowStarts(detectedRowStarts, rowSize, expectedCount, options.columns, height)
    : inferRegularRowStarts(detectedRowStarts, rowSize, height);
  const xRanges = detectColumnRangesFromRows(imageData, width, height, rowStarts, rowSize, options.columns);

  if (xRanges.length < options.columns || rowStarts.length === 0) {
    throw new Error(`识别失败：检测到 ${xRanges.length} 列、${rowStarts.length} 行，请检查截图是否包含完整头像网格`);
  }

  const xStarts = xRanges.map(([start]) => start);
  const avatarSize = Math.round(Math.min(median(xRanges.map(([start, end]) => end - start + 1)), rowSize));
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
  setStatus("#backgroundStatus", "已使用默认底图，仅等待叠加头像墙");
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
    const countHint =
      options.expectedCount && state.avatars.length !== options.expectedCount
        ? `，还差 ${options.expectedCount - state.avatars.length} 个，请检查截图底部是否被裁切`
        : "";
    setStatus(
      "#detectStatus",
      `已分割 ${state.avatars.length} 个头像，单头像约 ${batches[0].meta.avatarSize}px，行数 ${rowMeta}${countHint}`,
    );
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
  $("#posterWidth").value = image.naturalWidth || image.width;
  $("#posterHeight").value = image.naturalHeight || image.height;
  setStatus("#backgroundStatus", `已上传海报底图：${file.name}`);
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

clearLegacyExpectedCountDefault();
applyPreset("children");
clearLegacyExpectedCountDefault();
updateSummary();
