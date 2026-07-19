"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

import styles from "./reveal-image.module.css";

type RevealImageProps = Omit<
  ComponentPropsWithoutRef<"img">,
  "onLoad" | "onError"
>;

export function RevealImage({
  src,
  className,
  loading = "lazy",
  decoding = "async",
  ...props
}: RevealImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const source = typeof src === "string" ? src : null;
  const isLoaded = source !== null && loadedSrc === source;
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete && image.naturalWidth > 0 && source) {
        setLoadedSrc(source);
      }
    },
    [source],
  );

  return (
    <img
      {...props}
      ref={imageRef}
      src={src}
      className={cn(styles.image, isLoaded ? styles.loaded : null, className)}
      loading={loading}
      decoding={decoding}
      onLoad={() => source && setLoadedSrc(source)}
      onError={() => setLoadedSrc(null)}
    />
  );
}

export function RevealNextImage({ className, onLoad, ...props }: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Image
      {...props}
      className={cn(styles.image, isLoaded ? styles.loaded : null, className)}
      onLoad={(event) => {
        setIsLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}

export function RevealHtmlImages({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const images = containerRef.current?.querySelectorAll("img") ?? [];

    images.forEach((image) => {
      image.loading = "lazy";
      image.decoding = "async";

      const reveal = () => {
        if (image.naturalWidth > 0) {
          image.dataset.loaded = "true";
        }
      };

      if (image.complete) {
        reveal();
        return;
      }

      image.addEventListener("load", reveal, { once: true });
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
