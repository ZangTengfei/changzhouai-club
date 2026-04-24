"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AdminModal({
  title,
  triggerLabel,
  children,
}: {
  title: string;
  triggerLabel: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(86vh,820px)] max-w-2xl overflow-y-auto border-border/70 bg-card p-0 text-card-foreground">
        <DialogHeader className="border-b border-border/70 px-4 py-4">
          <DialogTitle className="text-base text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
