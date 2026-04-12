import type { ReactNode } from "react";

import { getPageMap } from "nextra/page-map";
import { Layout } from "nextra-theme-docs";

import { DocsFooter } from "@/components/docs-footer";
import { DocsNavbar } from "@/components/docs-navbar";

import "nextra-theme-docs/style.css";

export default async function DocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pageMap = await getPageMap("/docs");

  return (
    <div className="docs-layout-shell">
      <Layout
        pageMap={pageMap}
        navbar={<DocsNavbar />}
        footer={<DocsFooter />}
        docsRepositoryBase="https://github.com/ZangTengfei/changzhouai-club/blob/main/content"
        editLink="在 GitHub 上编辑此页"
        feedback={{
          content: "有想补充的内容？欢迎直接提 PR。",
          labels: "docs,feedback",
        }}
        sidebar={{
          defaultOpen: true,
          defaultMenuCollapseLevel: 2,
          toggleButton: true,
        }}
        toc={{
          title: "本页目录",
          backToTop: "回到顶部",
        }}
        darkMode={false}
      >
        {children}
      </Layout>
    </div>
  );
}
