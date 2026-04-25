"use client";

import { useEffect, useId, useState } from "react";

import { usePathname } from "next/navigation";

import styles from "./mobile-menu-toggle.module.css";

type MobileMenuToggleProps = {
  controlsId: string;
};

export function MobileMenuToggle({ controlsId }: MobileMenuToggleProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
      onClick={() => setOpen((current) => !current)}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
