import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  contentDirBasePath: "/docs",
  defaultShowCopyCode: true,
  search: {
    codeblocks: false,
  },
});

const nextConfig: NextConfig = {};

export default withNextra(nextConfig);
