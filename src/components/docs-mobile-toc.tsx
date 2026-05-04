import { ChevronDown, ListTree } from "lucide-react";

import { cssModuleCx } from "@/lib/utils";
import styles from "./docs-mobile-toc.module.css";

const cx = cssModuleCx.bind(null, styles);

type DocsMobileTocItem = {
  depth: number;
  id: string;
  value: string;
};

type DocsMobileTocProps = {
  items: DocsMobileTocItem[];
};

export function DocsMobileToc({ items }: DocsMobileTocProps) {
  const headings = items.filter(
    (item) => item.depth === 2 && item.id && item.value.trim(),
  );

  if (headings.length === 0) {
    return null;
  }

  return (
    <details className={cx("docs-mobile-toc")}>
      <summary className={cx("docs-mobile-toc-summary")}>
        <span className={cx("docs-mobile-toc-label")}>
          <ListTree className={cx("docs-mobile-toc-icon")} aria-hidden="true" />
          <span>本页目录</span>
        </span>
        <span className={cx("docs-mobile-toc-meta")}>
          <span className={cx("docs-mobile-toc-count")}>
            {headings.length} 个章节
          </span>
          <ChevronDown className={cx("docs-mobile-toc-chevron")} aria-hidden="true" />
        </span>
      </summary>
      <nav className={cx("docs-mobile-toc-nav")} aria-label="本页目录">
        <ol className={cx("docs-mobile-toc-list")}>
          {headings.map((heading) => (
            <li key={heading.id}>
              <a href={`#${heading.id}`}>{heading.value}</a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
