import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { NextResponse } from "next/server";

import { getStaffContextResult } from "@/lib/supabase/guards";

export const runtime = "nodejs";
export const maxDuration = 90;

const execFileAsync = promisify(execFile);

const SOURCE_TYPES = new Set(["all", "official", "media", "research", "media-cn"]);

type RadarRunPayload = {
  sinceHours?: unknown;
  limit?: unknown;
  minScore?: unknown;
  sourceType?: unknown;
  includeAll?: unknown;
};

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function normalizeSourceType(value: unknown) {
  const sourceType = String(value ?? "all").trim();
  return SOURCE_TYPES.has(sourceType) ? sourceType : "all";
}

export async function POST(request: Request) {
  const context = await getStaffContextResult();

  if (!context.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!context.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => ({}))) as RadarRunPayload;
  const sinceHours = clampInteger(payload.sinceHours, 72, 1, 720);
  const limit = clampInteger(payload.limit, 8, 1, 30);
  const minScore = clampInteger(payload.minScore, 45, 0, 100);
  const sourceType = normalizeSourceType(payload.sourceType);
  const includeAll = payload.includeAll === true;
  const startedAt = new Date();
  const scriptPath = path.join(process.cwd(), "scripts", "ai-news-radar.mjs");
  const args = [
    scriptPath,
    "--format",
    "json",
    "--since-hours",
    String(sinceHours),
    "--limit",
    String(limit),
    "--min-score",
    String(minScore),
  ];

  if (sourceType !== "all") {
    args.push("--type", sourceType);
  }

  if (includeAll) {
    args.push("--include-all");
  }

  const command = `node ${args.map((part) => (part.includes(" ") ? JSON.stringify(part) : part)).join(" ")}`;

  try {
    const { stdout, stderr } = await execFileAsync("node", args, {
      cwd: process.cwd(),
      maxBuffer: 8 * 1024 * 1024,
      timeout: 90_000,
    });
    const finishedAt = new Date();
    const report = JSON.parse(stdout) as unknown;

    return NextResponse.json({
      command,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      finishedAt: finishedAt.toISOString(),
      report,
      startedAt: startedAt.toISOString(),
      stderr: stderr.trim(),
    });
  } catch (error) {
    const finishedAt = new Date();
    const message = error instanceof Error ? error.message : "radar_run_failed";

    return NextResponse.json(
      {
        command,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        error: message,
        finishedAt: finishedAt.toISOString(),
        startedAt: startedAt.toISOString(),
      },
      { status: 500 },
    );
  }
}
