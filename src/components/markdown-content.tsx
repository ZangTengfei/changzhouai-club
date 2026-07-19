import type { ComponentPropsWithoutRef } from "react";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { RevealImage } from "@/components/reveal-image";
import { cn } from "@/lib/utils";

import styles from "./markdown-content.module.css";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

function isSafeMarkdownUrl(value?: string | null) {
  if (!value) {
    return false;
  }

  if (value.startsWith("#")) {
    return true;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function markdownUrlTransform(value: string) {
  return isSafeMarkdownUrl(value) ? value : "";
}

function MarkdownLink({
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  const safeHref = isSafeMarkdownUrl(href) ? href : undefined;
  const isExternal = safeHref?.startsWith("http://") || safeHref?.startsWith("https://");

  return (
    <a
      {...props}
      href={safeHref}
      rel={isExternal ? "nofollow noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}

function MarkdownImage({
  src,
  alt,
  ...props
}: ComponentPropsWithoutRef<"img">) {
  if (typeof src !== "string" || !isSafeMarkdownUrl(src)) {
    return null;
  }

  return <RevealImage {...props} src={src} alt={alt ?? ""} />;
}

const markdownComponents = {
  a: MarkdownLink,
  img: MarkdownImage,
} satisfies Components;

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn(styles.markdownContent, className)}>
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml
        urlTransform={markdownUrlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
