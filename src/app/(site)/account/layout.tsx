import type { ReactNode } from "react";

import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata(
  "社区账号",
  "管理常州 AI Club 社区账号、公开资料、报名记录和安全设置。",
  "/account",
  true,
);

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
