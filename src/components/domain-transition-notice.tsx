"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { cssModuleCx } from "@/lib/utils";

import styles from "./domain-transition-notice.module.css";

const cx = cssModuleCx.bind(null, styles);
const DISMISSED_KEY = "czai-domain-transition-notice-dismissed-v1";

export function DomainTransitionNotice() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(DISMISSED_KEY) !== "true");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismissNotice() {
    setVisible(false);

    try {
      window.localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Ignore storage failures; the close button should still work for this visit.
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div className={cx("notice")} role="status">
      <div className={cx("notice-inner")}>
        <p>
          <strong>域名备案中：</strong>
          原域名 <span>changzhouai.club</span> 正在办理 ICP 备案，备案期间暂时无法访问。
          请先使用当前过渡域名 <span>club.occcc.cc</span>。
        </p>
        <button
          type="button"
          className={cx("notice-close")}
          onClick={dismissNotice}
          aria-label="关闭域名备案提示"
          title="关闭提示"
        >
          <X aria-hidden="true" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
