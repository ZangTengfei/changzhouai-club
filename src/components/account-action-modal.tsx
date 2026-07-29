"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AccountActionModalProps = {
  title: string;
  description?: string;
  trigger: ReactNode;
  defaultOpen?: boolean;
  contentClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function AccountActionModal({
  title,
  description,
  trigger,
  defaultOpen,
  contentClassName,
  bodyClassName,
  children,
}: AccountActionModalProps) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[min(88vh,820px)] max-w-[min(920px,calc(100vw-32px))] overflow-y-auto p-0 sm:rounded-[24px]",
          "border border-[rgba(208,214,207,0.76)] bg-[radial-gradient(circle_at_94%_8%,rgba(255,199,81,0.12),transparent_22%),linear-gradient(180deg,rgba(248,247,241,0.98),rgba(240,239,232,0.98))] text-heading shadow-lg",
          contentClassName,
        )}
      >
        <DialogHeader className="gap-2 border-b border-site-border-subtle px-6 pt-5.5 pb-4.5 text-left max-sm:px-4.5">
          <DialogTitle className="text-[1.28rem] font-black leading-[1.16] text-heading">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="max-w-192 text-[0.94rem] font-semibold leading-[1.62] text-copy-subtle">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className={cn("px-6 pt-5.5 pb-6 max-sm:px-4.5", bodyClassName)}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
