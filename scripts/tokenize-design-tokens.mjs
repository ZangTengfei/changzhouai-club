#!/usr/bin/env node
// 设计令牌批量替换(DS-03 圆角 / DS-04 阴影 / DS-07 断点)
// 仅处理前台 site 范围(src/app/(site)、src/components、src/app/globals.css),
// 排除 admin/docs(它们有独立 --admin-* / --docs-* 子主题)。
// 用法: node scripts/tokenize-design-tokens.mjs [radius|breakpoints|shadow|all]
// 幂等:已令牌化的声明不会被再次匹配。

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const mode = process.argv[2] || "all";

function listFiles() {
  const all = execSync("git ls-files src/", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  return all.filter(
    (f) =>
      f.endsWith(".css") &&
      (f.startsWith("src/app/(site)/") ||
        f.startsWith("src/components/") ||
        f === "src/app/globals.css"),
  );
}

// 圆角:≤14→sm(12), 15-20→md(18), ≥22→lg(28), 999→pill
function radiusToken(n) {
  if (n >= 999) return "--radius-pill";
  if (n <= 14) return "--radius-sm";
  if (n <= 20) return "--radius-md";
  return "--radius-lg";
}

function tokenizeRadius(content) {
  let count = 0;
  // 仅匹配单值 `border-radius: Npx;` 或 `Npx !`(important);多值/0/50%/inherit/var 自动跳过
  const result = content.replace(
    /border-radius:\s*(\d+)px\s*(;|!)/g,
    (match, num, end) => {
      const n = parseInt(num, 10);
      if (n === 0) return match;
      count++;
      return `border-radius: var(${radiusToken(n)})${end === "!" ? " !" : ";"}`;
    },
  );
  return { result, count };
}

// 断点:零散值归并到 640/820/1024(保留 360/640/820/1024)
const BP_MAP = {
  520: 640,
  680: 820, 720: 820, 740: 820, 760: 820, 767: 820, 768: 820, 780: 820, 800: 820,
  860: 1024, 900: 1024, 940: 1024, 980: 1024, 1023: 1024, 1040: 1024,
};

function tokenizeBreakpoints(content) {
  let count = 0;
  const result = content.replace(
    /@media\s*\(\s*max-width:\s*(\d+)px\s*\)/g,
    (match, n) => {
      const num = parseInt(n, 10);
      const target = BP_MAP[num];
      if (!target) return match;
      count++;
      return `@media (max-width: ${target}px)`;
    },
  );
  return { result, count };
}

// 阴影:标准单层投影 0 Ypx Zpx rgba(ink|shadow-soft|纯黑, α) 按透明度归 3 档
function shadowToken(alpha) {
  const a = parseFloat(alpha);
  if (a <= 0.05) return "--shadow-sm";
  if (a <= 0.1) return "--shadow-md";
  return "--shadow-lg";
}

function tokenizeShadow(content) {
  let count = 0;
  const re =
    /box-shadow:\s*0\s+(\d+)px\s+(\d+)px\s+rgba\(\s*(var\(--(?:ink|shadow-soft)-rgb\)|[\d,\s]+?)\s*,\s*(0?\.\d+)\s*\)\s*;/g;
  const result = content.replace(re, (match) => {
    const alpha = match.match(/,\s*(0?\.\d+)\s*\)\s*;/)[1];
    count++;
    return `box-shadow: var(${shadowToken(alpha)});`;
  });
  return { result, count };
}

const files = listFiles();
const total = { radius: 0, breakpoints: 0, shadow: 0 };

for (const file of files) {
  const path = `${ROOT}/${file}`;
  let content = readFileSync(path, "utf8");
  let changed = false;

  if (mode === "radius" || mode === "all") {
    const r = tokenizeRadius(content);
    content = r.result;
    total.radius += r.count;
    if (r.count) changed = true;
  }
  if (mode === "breakpoints" || mode === "all") {
    const r = tokenizeBreakpoints(content);
    content = r.result;
    total.breakpoints += r.count;
    if (r.count) changed = true;
  }
  if (mode === "shadow" || mode === "all") {
    const r = tokenizeShadow(content);
    content = r.result;
    total.shadow += r.count;
    if (r.count) changed = true;
  }

  if (changed) writeFileSync(path, content);
}

console.log(`[${mode}] 替换统计:`, total);
console.log(`扫描 ${files.length} 个 CSS 文件`);
