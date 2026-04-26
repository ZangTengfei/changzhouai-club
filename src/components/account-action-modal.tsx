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

import styles from "./account-action-modal.module.css";

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
          styles.accountModalContent,
          contentClassName,
        )}
      >
        <DialogHeader className={styles.accountModalHeader}>
          <DialogTitle className={styles.accountModalTitle}>{title}</DialogTitle>
          {description ? (
            <DialogDescription className={styles.accountModalDescription}>
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className={cn(styles.accountModalBody, bodyClassName)}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
