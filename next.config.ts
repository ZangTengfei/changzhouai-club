import type { NextConfig } from "next";
import nextra from "nextra";
import { randomUUID } from "node:crypto";

type RemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

const withNextra = nextra({
  contentDirBasePath: "/docs",
  defaultShowCopyCode: true,
  search: {
    codeblocks: false,
  },
});

const SUPABASE_STORAGE_PATHS = [
  "/storage/v1/object/public/**",
  "/storage/v1/render/image/public/**",
] as const;

const deploymentId =
  process.env.NEXT_DEPLOYMENT_ID?.trim() || randomUUID().replaceAll("-", "");

function getSupabaseImagePatterns() {
  const patterns: RemotePattern[] = SUPABASE_STORAGE_PATHS.map((pathname) => ({
    protocol: "https",
    hostname: "*.supabase.co",
    pathname,
  }));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    return patterns;
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    const protocol = parsedUrl.protocol.replace(":", "");

    if (protocol !== "http" && protocol !== "https") {
      return patterns;
    }

    for (const pathname of SUPABASE_STORAGE_PATHS) {
      patterns.push({
        protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        pathname,
      });
    }
  } catch {
    return patterns;
  }

  return patterns;
}

const nextConfig: NextConfig = {
  deploymentId,
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/ai-news",
        destination: "/news",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: getSupabaseImagePatterns(),
  },
};

export default withNextra(nextConfig);
