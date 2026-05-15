#!/usr/bin/env node

import { spawn } from "node:child_process";
import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(root, args["out-dir"] || "output/ai-daily-social");
const dataPath = path.resolve(root, args.input || path.join(outDir, "latest.json"));
const logoPath = path.join(root, "files/logo素材/logo.png");
const data = JSON.parse(await fs.readFile(dataPath, "utf8"));

const dailyUrl = "https://changzhouai.club/news?view=daily";
const width = 1080;
const height = 1920;
const date = data.date || new Date().toISOString().slice(0, 10);
const [year, month, day] = date.split("-");
const logoData = await fs.readFile(logoPath);
const logoUri = `data:image/png;base64,${logoData.toString("base64")}`;
const categories = ["模型", "产品", "行业", "论文", "观点"];

const signals = (data.signals || data.website?.sections || []).slice(0, 5).map((signal, index) => ({
  index: String(index + 1).padStart(2, "0"),
  category: signal.category || "AI 资讯",
  shortCategory: categories[index] || "资讯",
  title: signal.title || signal.heading || `今日资讯 ${index + 1}`,
  summary: cleanText(signal.summary || ""),
  localAngle: cleanText(signal.localAngle || "适合在群里展开讨论，转成一个小实验。"),
  sourceName: cleanText(signal.sourceName || ""),
}));

function cleanText(value) {
  return String(value)
    .replace(/[\u{1f300}-\u{1faff}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function gfMultiply(left, right) {
  let result = 0;
  let value = left;
  let multiplier = right;

  while (multiplier > 0) {
    if ((multiplier & 1) !== 0) result ^= value;
    value <<= 1;
    if ((value & 0x100) !== 0) value ^= 0x11d;
    multiplier >>>= 1;
  }

  return result & 0xff;
}

function gfPow(value, power) {
  let result = 1;
  for (let index = 0; index < power; index += 1) result = gfMultiply(result, value);
  return result;
}

function reedSolomonGenerator(degree) {
  let generator = [1];

  for (let index = 0; index < degree; index += 1) {
    const factor = gfPow(2, index);
    const next = Array(generator.length + 1).fill(0);

    for (let item = 0; item < generator.length; item += 1) {
      next[item] ^= generator[item];
      next[item + 1] ^= gfMultiply(generator[item], factor);
    }

    generator = next;
  }

  return generator.slice(1);
}

function reedSolomonRemainder(codewords, degree) {
  const generator = reedSolomonGenerator(degree);
  const result = Array(degree).fill(0);

  for (const codeword of codewords) {
    const factor = codeword ^ result.shift();
    result.push(0);

    for (let index = 0; index < degree; index += 1) {
      result[index] ^= gfMultiply(generator[index], factor);
    }
  }

  return result;
}

function appendBits(target, value, length) {
  for (let bit = length - 1; bit >= 0; bit -= 1) target.push((value >>> bit) & 1);
}

function formatBits(errorCorrectionFormatBits, mask) {
  const dataBits = (errorCorrectionFormatBits << 3) | mask;
  let remainder = dataBits;

  for (let index = 0; index < 10; index += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  }

  return ((dataBits << 10) | remainder) ^ 0x5412;
}

function makeQrMatrix(text) {
  const version = 4;
  const size = version * 4 + 17;
  const dataCodewordCount = 80;
  const errorCorrectionCodewordCount = 20;
  const mask = 0;
  const bytes = [...new TextEncoder().encode(text)];
  const bits = [];

  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) appendBits(bits, byte, 8);

  const capacityBits = dataCodewordCount * 8;
  for (let index = 0; index < Math.min(4, capacityBits - bits.length); index += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    let codeword = 0;
    for (let bit = 0; bit < 8; bit += 1) codeword = (codeword << 1) | bits[index + bit];
    codewords.push(codeword);
  }

  for (let pad = 0xec; codewords.length < dataCodewordCount; pad ^= 0xfd) codewords.push(pad);

  const allCodewords = codewords.concat(reedSolomonRemainder(codewords, errorCorrectionCodewordCount));
  const dataBits = [];
  for (const codeword of allCodewords) appendBits(dataBits, codeword, 8);

  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunction(x, y, isBlack) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = isBlack;
    isFunction[y][x] = true;
  }

  function drawFinder(left, top) {
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        const xx = left + x;
        const yy = top + y;
        const isOuter = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (x === 0 || x === 6 || y === 0 || y === 6);
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        setFunction(xx, yy, isOuter || isCenter);
      }
    }
  }

  function drawAlignment(centerX, centerY) {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        setFunction(centerX + x, centerY + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  drawAlignment(26, 26);

  for (let index = 8; index < size - 8; index += 1) {
    setFunction(6, index, index % 2 === 0);
    setFunction(index, 6, index % 2 === 0);
  }

  const bits15 = formatBits(1, mask);
  const getBit = (value, index) => ((value >>> index) & 1) !== 0;

  for (let index = 0; index <= 5; index += 1) setFunction(8, index, getBit(bits15, index));
  setFunction(8, 7, getBit(bits15, 6));
  setFunction(8, 8, getBit(bits15, 7));
  setFunction(7, 8, getBit(bits15, 8));
  for (let index = 9; index < 15; index += 1) setFunction(14 - index, 8, getBit(bits15, index));
  for (let index = 0; index < 8; index += 1) setFunction(size - 1 - index, 8, getBit(bits15, index));
  for (let index = 8; index < 15; index += 1) setFunction(8, size - 15 + index, getBit(bits15, index));
  setFunction(8, size - 8, true);

  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;

    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;

      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (isFunction[y][x]) continue;

        let isBlack = bitIndex < dataBits.length ? dataBits[bitIndex] === 1 : false;
        bitIndex += 1;
        if ((x + y) % 2 === 0) isBlack = !isBlack;
        modules[y][x] = isBlack;
      }
    }

    upward = !upward;
  }

  return modules;
}

function renderQrSvg(text) {
  const modules = makeQrMatrix(text);
  const quietZone = 4;
  const moduleSize = 4;
  const totalSize = (modules.length + quietZone * 2) * moduleSize;
  const rects = [`<rect width="${totalSize}" height="${totalSize}" rx="18" fill="#fffaf1"/>`];

  for (let row = 0; row < modules.length; row += 1) {
    for (let col = 0; col < modules.length; col += 1) {
      if (!modules[row][col]) continue;
      rects.push(`<rect x="${(col + quietZone) * moduleSize}" y="${(row + quietZone) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#11231e"/>`);
    }
  }

  return `<svg class="qr" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">${rects.join("")}</svg>`;
}

const cardsHtml = signals
  .map(
    (signal) => `
      <article class="news-card">
        <div class="rank">${signal.index}</div>
        <div class="card-body">
          <div class="meta-row">
            <span class="category">${escapeHtml(signal.category)}</span>
            <span class="source">${escapeHtml(signal.sourceName)}</span>
          </div>
          <h2>${escapeHtml(signal.title)}</h2>
          <p class="summary">${escapeHtml(signal.summary)}</p>
          <p class="angle"><strong>社区视角</strong>${escapeHtml(signal.localAngle)}</p>
        </div>
      </article>
    `,
  )
  .join("");

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>常州 AI club AI 资讯日报 ${date}</title>
    <style>
      :root {
        --ink: #12201b;
        --muted: #66746c;
        --paper: #f6f0e6;
        --card: #fffdf8;
        --green: #0f5f51;
        --green-2: #1e836f;
        --gold: #d8a84b;
        --line: #e4d8c6;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #d7d0c3;
        color: var(--ink);
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      .poster {
        position: relative;
        width: ${width}px;
        height: ${height}px;
        overflow: hidden;
        background:
          radial-gradient(circle at 90% 8%, rgba(216, 168, 75, 0.28), transparent 270px),
          radial-gradient(circle at 8% 74%, rgba(30, 131, 111, 0.12), transparent 330px),
          linear-gradient(180deg, #f9f4eb 0%, var(--paper) 58%, #f4eadb 100%);
        padding: 54px 64px 46px;
      }

      .hero {
        position: relative;
        height: 276px;
        border-radius: 36px;
        padding: 36px 42px;
        overflow: hidden;
        background:
          linear-gradient(124deg, #0f332d 0%, #166c5d 58%, #e2ad55 138%);
        box-shadow: 0 18px 42px rgba(31, 64, 55, 0.16);
      }

      .hero::before {
        position: absolute;
        right: -118px;
        top: -96px;
        width: 360px;
        height: 360px;
        content: "";
        border-radius: 999px;
        background: rgba(255, 228, 164, 0.2);
      }

      .hero::after {
        position: absolute;
        left: -80px;
        bottom: -110px;
        width: 780px;
        height: 230px;
        content: "";
        border-radius: 50%;
        background: rgba(246, 240, 230, 0.2);
        transform: rotate(5deg);
      }

      .brand-row,
      .title-row {
        position: relative;
        z-index: 1;
      }

      .brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .brand img {
        width: 72px;
        height: 72px;
        border-radius: 20px;
        background: #fffaf2;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .brand-name {
        color: #fffaf2;
        font-size: 31px;
        font-weight: 860;
        letter-spacing: -0.02em;
      }

      .brand-tagline {
        margin-top: 6px;
        color: rgba(244, 255, 249, 0.78);
        font-size: 17px;
        font-weight: 620;
      }

      .date {
        color: #fffaf2;
        text-align: right;
      }

      .date .day {
        font-size: 28px;
        font-weight: 860;
      }

      .date .year {
        margin-top: 5px;
        color: rgba(255, 239, 203, 0.78);
        font-size: 17px;
        font-weight: 750;
      }

      .title-row {
        display: flex;
        align-items: end;
        justify-content: space-between;
        margin-top: 34px;
      }

      h1 {
        margin: 0;
        color: #fffaf2;
        font-size: 54px;
        font-weight: 900;
        letter-spacing: -0.05em;
        line-height: 1;
      }

      .subtitle {
        margin-top: 16px;
        color: rgba(244, 255, 249, 0.86);
        font-size: 25px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .badge {
        min-width: 172px;
        border: 1px solid rgba(255, 250, 242, 0.22);
        border-radius: 999px;
        padding: 14px 22px;
        color: #fffaf2;
        background: rgba(255, 250, 242, 0.14);
        text-align: center;
        font-size: 20px;
        font-weight: 820;
      }

      .section-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 60px;
        margin: 26px 0 18px;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }

      .strip-title {
        font-size: 20px;
        font-weight: 860;
        color: #23342e;
      }

      .strip-cats {
        display: flex;
        gap: 10px;
      }

      .strip-cats span {
        width: 54px;
        height: 32px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        color: var(--green);
        background: rgba(30, 131, 111, 0.11);
        font-size: 16px;
        font-weight: 780;
      }

      .news-list {
        display: grid;
        gap: 13px;
      }

      .news-card {
        display: grid;
        grid-template-columns: 82px 1fr;
        min-height: 149px;
        border: 1px solid rgba(183, 166, 137, 0.34);
        border-radius: 27px;
        background: rgba(255, 253, 248, 0.88);
        box-shadow: 0 8px 22px rgba(71, 57, 32, 0.06);
        overflow: hidden;
      }

      .rank {
        display: grid;
        place-items: center;
        color: var(--green);
        background:
          linear-gradient(180deg, rgba(30, 131, 111, 0.13), rgba(30, 131, 111, 0.04));
        font-size: 30px;
        font-weight: 900;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.04em;
      }

      .card-body {
        min-width: 0;
        padding: 18px 24px 16px 22px;
      }

      .meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 9px;
      }

      .category {
        flex: none;
        border-radius: 999px;
        padding: 6px 14px;
        color: var(--green);
        background: rgba(30, 131, 111, 0.12);
        font-size: 17px;
        font-weight: 820;
        line-height: 1;
      }

      .source {
        min-width: 0;
        max-width: 250px;
        overflow: hidden;
        color: #958b7d;
        font-size: 15px;
        font-weight: 650;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      h2 {
        margin: 0 0 9px;
        color: var(--ink);
        font-size: 25px;
        font-weight: 900;
        letter-spacing: -0.035em;
        line-height: 1.16;
      }

      .summary {
        display: -webkit-box;
        margin: 0;
        overflow: hidden;
        color: #5a665f;
        font-size: 18px;
        font-weight: 500;
        letter-spacing: -0.01em;
        line-height: 1.42;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .angle {
        display: -webkit-box;
        margin: 8px 0 0;
        overflow: hidden;
        color: #617169;
        font-size: 16px;
        font-weight: 560;
        line-height: 1.3;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
      }

      .angle strong {
        margin-right: 9px;
        color: #96703d;
        font-weight: 880;
      }

      .footer {
        display: grid;
        grid-template-columns: 176px 1fr;
        align-items: center;
        gap: 24px;
        height: 202px;
        margin-top: 28px;
        border-radius: 31px;
        padding: 18px 30px 18px 22px;
        background:
          radial-gradient(circle at 96% 5%, rgba(216, 168, 75, 0.2), transparent 260px),
          #12201b;
        color: #fffaf2;
        box-shadow: 0 14px 32px rgba(18, 32, 27, 0.16);
      }

      .qr-wrap {
        display: grid;
        place-items: center;
        width: 164px;
        height: 164px;
        border-radius: 24px;
        background: #fffaf2;
      }

      .qr {
        width: 164px;
        height: 164px;
        display: block;
      }

      .footer-title {
        font-size: 28px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .footer-desc {
        margin-top: 10px;
        color: rgba(244, 255, 249, 0.76);
        font-size: 18px;
        font-weight: 600;
      }

      .footer-link {
        margin-top: 13px;
        color: #f1c76c;
        font-size: 20px;
        font-weight: 860;
      }

      .footer-note {
        margin-top: 11px;
        color: rgba(244, 255, 249, 0.52);
        font-size: 14px;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <main class="poster" aria-label="常州 AI club AI 资讯日报">
      <section class="hero">
        <div class="brand-row">
          <div class="brand">
            <img src="${logoUri}" alt="常州 AI club logo" />
            <div>
              <div class="brand-name">常州 AI club</div>
              <div class="brand-tagline">把 AI 新闻变成可实践的小实验</div>
            </div>
          </div>
          <div class="date">
            <div class="day">${Number(month)}月${Number(day)}日</div>
            <div class="year">${year}</div>
          </div>
        </div>
        <div class="title-row">
          <div>
            <h1>AI 资讯日报</h1>
            <div class="subtitle">5 条精选信号 · 分类速览 · 扫码阅读全文</div>
          </div>
          <div class="badge">Daily Brief</div>
        </div>
      </section>

      <section class="section-strip">
        <div class="strip-title">今日 5 条信息</div>
        <div class="strip-cats">
          ${signals.map((signal) => `<span>${escapeHtml(signal.shortCategory)}</span>`).join("")}
        </div>
      </section>

      <section class="news-list">
        ${cardsHtml}
      </section>

      <section class="footer">
        <div class="qr-wrap">${renderQrSvg(dailyUrl)}</div>
        <div>
          <div class="footer-title">扫码查看 AI 资讯日报</div>
          <div class="footer-desc">完整来源链接、摘要与后续社区讨论，统一沉淀到网站。</div>
          <div class="footer-link">${dailyUrl}</div>
          <div class="footer-note">来源：AI HOT 公开 API / Daily / Selected items · 发布前请回原文核对</div>
        </div>
      </section>
    </main>
  </body>
</html>
`;

await fs.mkdir(outDir, { recursive: true });

const htmlPath = path.join(outDir, `${date}-wechat-daily-html.html`);
const latestHtmlPath = path.join(outDir, "latest-wechat-daily.html");
const pngPath = path.join(outDir, `${date}-wechat-daily-html.png`);
const latestPngPath = path.join(outDir, "latest-wechat-daily.png");
const latestHtmlPngPath = path.join(outDir, "latest-wechat-daily-html.png");

await fs.writeFile(htmlPath, html, "utf8");
await fs.copyFile(htmlPath, latestHtmlPath);

if (args.screenshot !== "false" && args["no-screenshot"] !== true) {
  await captureHtmlScreenshot({ htmlPath, pngPath, width, height });
  await fs.copyFile(pngPath, latestPngPath);
  await fs.copyFile(pngPath, latestHtmlPngPath);
}

console.log(JSON.stringify({ htmlPath, latestHtmlPath, pngPath, latestPngPath, latestHtmlPngPath, dailyUrl, width, height }, null, 2));

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

async function captureHtmlScreenshot({ htmlPath, pngPath, width, height }) {
  const chromePath = await findChromeExecutable();
  const chromeArgs = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--run-all-compositor-stages-before-draw",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href,
  ];

  await new Promise((resolve, reject) => {
    const child = spawn(chromePath, chromeArgs, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Chrome screenshot failed with ${code}: ${stderr.trim()}`));
      }
    });
  });
}

async function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await fs.access(candidate, constants.X_OK);
      return candidate;
    } catch {}
  }

  throw new Error("未找到可用于截图的 Chrome/Chromium。请安装 Google Chrome，或设置 CHROME_PATH。");
}
