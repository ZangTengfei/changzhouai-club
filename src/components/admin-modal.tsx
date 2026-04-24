"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

export function AdminModal({
  title,
  triggerLabel,
  children,
}: {
  title: string;
  triggerLabel: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button type="button" onClick={() => dialogRef.current?.showModal()}>
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        className="w-[min(720px,calc(100vw-32px))] rounded-[var(--radius)] border border-border/70 bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/35"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <form method="dialog">
            <Button type="submit" variant="outline" size="sm">
              关闭
            </Button>
          </form>
        </div>
        <div className="max-h-[min(78vh,760px)] overflow-y-auto p-4">{children}</div>
      </dialog>
    </>
  );
}
