import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  contentDirBasePath: "/docs",
  defaultShowCopyCode: true,
  search: {
    codeblocks: false,
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
    ],
  },
};

export default withNextra(nextConfig);
