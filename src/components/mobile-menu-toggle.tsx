"use client";

import { useId } from "react";

type MobileMenuToggleProps = {
  controlsId: string;
  open: boolean;
  pending?: boolean;
  onToggle: () => void;
};

export function MobileMenuToggle({
  controlsId,
  open,
  pending = false,
  onToggle,
}: MobileMenuToggleProps) {
  const buttonId = useId();

  return (
    <button
      id={buttonId}
      type="button"
      className="hidden size-11.5 cursor-pointer flex-col items-center justify-center rounded-full border border-primary-border bg-muted/80 p-0 text-ink shadow-md transition-[transform,border-color,background-color] hover:-translate-y-px hover:border-primary/30 hover:bg-primary-soft focus-visible:-translate-y-px focus-visible:border-primary/30 focus-visible:bg-primary-soft data-[open=true]:-translate-y-px data-[open=true]:border-primary/30 data-[open=true]:bg-primary-soft data-[pending=true]:-translate-y-px data-[pending=true]:border-primary/30 data-[pending=true]:bg-primary-soft data-[pending=true]:text-[#087a52] max-[820px]:inline-flex [&>span]:block [&>span]:h-0.5 [&>span]:w-4.5 [&>span]:rounded-full [&>span]:bg-current [&>span]:transition-[transform,opacity] [&>span+span]:mt-1 data-[open=true]:[&>span:nth-child(1)]:translate-y-1.5 data-[open=true]:[&>span:nth-child(1)]:rotate-45 data-[open=true]:[&>span:nth-child(2)]:opacity-0 data-[open=true]:[&>span:nth-child(3)]:-translate-y-1.5 data-[open=true]:[&>span:nth-child(3)]:-rotate-45"
      aria-controls={controlsId}
      aria-expanded={open}
      aria-label={open ? "收起主导航" : "展开主导航"}
      data-open={open ? "true" : "false"}
      data-pending={pending ? "true" : "false"}
      data-site-menu-toggle
      onClick={onToggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}
