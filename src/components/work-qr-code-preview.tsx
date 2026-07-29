"use client";

import { QrCode } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
          className="absolute right-3 bottom-3 z-1 inline-flex size-9.5 cursor-pointer items-center justify-center rounded-full border border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(255,252,247,0.94)] text-primary-strong shadow-[0_10px_24px_rgba(21,34,31,0.18)] transition-[background,color,transform] duration-160 hover:-translate-y-px hover:bg-white hover:text-primary focus-visible:-translate-y-px focus-visible:bg-white focus-visible:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(var(--accent-rgb),0.3)] max-sm:right-2.5 max-sm:bottom-2.5 max-sm:size-10 [&_svg]:size-4.5"
          aria-label={`查看 ${title} 的小程序码或二维码`}
          title="查看小程序码或二维码"
        >
          <QrCode aria-hidden="true" strokeWidth={2} />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(92vh,920px)] max-w-[min(860px,calc(100vw-24px))] overflow-hidden border border-[rgba(208,214,207,0.72)] bg-white p-0 shadow-[var(--shadow-lg)] sm:rounded-[22px]"
      >
        <DialogTitle className="sr-only">{title} 小程序码或二维码</DialogTitle>
        <DialogDescription className="sr-only">
          放大显示案例的小程序码或二维码图片。
        </DialogDescription>
        <div className="grid min-h-[min(78vh,720px)] place-items-center bg-white p-[clamp(14px,3vw,28px)] max-sm:min-h-[calc(100dvh-72px)] max-sm:p-3">
          <img
            className="block h-auto max-h-[min(78vh,720px)] w-auto max-w-full rounded-xl object-contain max-sm:max-h-[calc(100dvh-96px)] max-sm:rounded-[10px]"
            src={imageUrl}
            alt={`${title} 小程序码或二维码`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
