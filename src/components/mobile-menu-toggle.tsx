"use client";

import { useId } from "react";

import styles from "./mobile-menu-toggle.module.css";

type MobileMenuToggleProps = {
  controlsId: string;
  open: boolean;
  onToggle: () => void;
};

export function MobileMenuToggle({ controlsId, open, onToggle }: MobileMenuToggleProps) {
  const buttonId = useId();

  return (
    <button
      id={buttonId}
      type="button"
      className={styles["mobile-menu-toggle"]}
      aria-controls={controlsId}
      aria-expanded={open}
      aria-label={open ? "收起主导航" : "展开主导航"}
      data-open={open ? "true" : "false"}
      data-site-menu-toggle
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
