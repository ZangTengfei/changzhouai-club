import { gzipSync } from "node:zlib";
import { existsSync, readFileSync, statSync } from "node:fs";

const route = "/admin/reports/[reportId]/share";
const pagePath = "src/app/(admin-tools)/admin/reports/[reportId]/share/page.tsx";
const clientPath =
  "src/app/(admin-tools)/admin/reports/[reportId]/share/admin-wedaily-share-cards-client.tsx";
const statsPath = ".next/diagnostics/route-bundle-stats.json";
const limits = {
  firstLoadBytes: 900_000,
  gzipBytes: 350_000,
  largestChunkBytes: 300_000,
};

for (const filePath of [pagePath, clientPath, statsPath]) {
  if (!existsSync(filePath)) {
    throw new Error(`missing_required_file:${filePath}`);
  }
}

const pageSource = readFileSync(pagePath, "utf8");
const clientSource = readFileSync(clientPath, "utf8");
const routeStats = JSON.parse(readFileSync(statsPath, "utf8")).find(
  (item) => item.route === route,
);

if (!routeStats) {
  throw new Error(`missing_route_stats:${route}`);
}

if (pageSource.includes("listAdminWeDailyReports") || pageSource.includes("limit: 200")) {
  throw new Error("share_page_must_query_one_report");
}

if (!pageSource.includes("prefetch={false}")) {
  throw new Error("share_page_return_link_must_disable_prefetch");
}

if (/components\/admin-(?:antd|ui)|from ["']antd["']/.test(clientSource)) {
  throw new Error("share_page_must_not_bundle_admin_shell_ui");
}

const previewStyleCount = (
  clientSource.match(/<style dangerouslySetInnerHTML=\{\{ __html: DAILY_SHARE_CARD_CSS \}\} \/>/g) ?? []
).length;

if (previewStyleCount !== 1) {
  throw new Error(`unexpected_preview_style_count:${previewStyleCount}`);
}

const chunks = routeStats.firstLoadChunkPaths.map((chunkPath) => ({
  bytes: statSync(chunkPath).size,
  gzipBytes: gzipSync(readFileSync(chunkPath)).length,
  path: chunkPath,
}));
const largestChunk = chunks.reduce((largest, chunk) =>
  chunk.bytes > largest.bytes ? chunk : largest,
);
const gzipBytes = chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);

if (routeStats.firstLoadUncompressedJsBytes > limits.firstLoadBytes) {
  throw new Error(`first_load_budget_exceeded:${routeStats.firstLoadUncompressedJsBytes}`);
}

if (largestChunk.bytes > limits.largestChunkBytes) {
  throw new Error(`largest_chunk_budget_exceeded:${largestChunk.bytes}:${largestChunk.path}`);
}

if (gzipBytes > limits.gzipBytes) {
  throw new Error(`gzip_budget_exceeded:${gzipBytes}`);
}

console.log(
  [
    `日报分享页性能校验通过：`,
    `first-load ${routeStats.firstLoadUncompressedJsBytes} B`,
    `gzip ${gzipBytes} B`,
    `largest ${largestChunk.bytes} B`,
    `${chunks.length} chunks`,
  ].join(" "),
);
