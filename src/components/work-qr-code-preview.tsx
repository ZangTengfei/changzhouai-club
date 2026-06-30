"use client";

import { QrCode } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import styles from "./member-work-card.module.css";

type WorkQrCodePreviewProps = {
  imageUrl: string;
  title: string;
};

export function WorkQrCodePreview({ imageUrl, title }: WorkQrCodePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={styles.workQrPreviewButton}
          aria-label={`查看 ${title} 的小程序码或二维码`}
          title="查看小程序码或二维码"
        >
          <QrCode aria-hidden="true" strokeWidth={2} />
        </button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[min(92vh,920px)] max-w-[min(860px,calc(100vw-24px))] overflow-hidden p-0 sm:rounded-[22px]",
          styles.workQrDialogContent,
        )}
      >
        <DialogTitle className="sr-only">{title} 小程序码或二维码</DialogTitle>
        <DialogDescription className="sr-only">
          放大显示案例的小程序码或二维码图片。
        </DialogDescription>
        <div className={styles.workQrDialogImageFrame}>
          <img src={imageUrl} alt={`${title} 小程序码或二维码`} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
