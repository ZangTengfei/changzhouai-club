import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { generateStaticParamsFor, importPage } from "nextra/pages";

import { useMDXComponents } from "@/mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

type DocsPageProps = {
  params: Promise<{
    mdxPath?: string[];
  }>;
};

async function loadDocPage(mdxPath?: string[]) {
  try {
    return await importPage(mdxPath);
  } catch {
    notFound();
  }
}

export async function generateMetadata(
  props: DocsPageProps,
): Promise<Metadata> {
  const { mdxPath } = await props.params;
  const { metadata } = await loadDocPage(mdxPath);

  return {
    title: metadata.title,
    description:
      metadata.description ?? "常州 AI 社区的文档与共建内容沉淀。",
  };
}

const Wrapper = useMDXComponents().wrapper;

export default async function DocsPage(props: DocsPageProps) {
  const params = await props.params;
  const { default: MDXContent, toc, metadata, sourceCode } = await loadDocPage(
    params.mdxPath,
  );

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
