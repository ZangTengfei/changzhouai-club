"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, Smile } from "lucide-react";

import { DoodleSparkles } from "@/components/home-visual-assets";
import { getEventImageUrl } from "@/lib/public-image-url";
import { cssModuleCx } from "@/lib/utils";

import styles from "@/app/(site)/home-page.module.css";

type HeroNoteIcon = "arrow" | "heart" | "smile";

type HeroNote = {
  className: string;
  lines: readonly string[];
  icon?: HeroNoteIcon;
};

type HeroPhotoCarouselImage = {
  src: string;
  alt: string;
  href: string;
};

type HeroPhotoCarouselProps = {
  images: HeroPhotoCarouselImage[];
  fallbackAlt: string;
  notes: readonly HeroNote[];
};

const AUTO_ADVANCE_DELAY = 4200;
const MAX_CAROUSEL_IMAGES = 3;
const heroNoteIcons = {
  arrow: ArrowUpRight,
  heart: Heart,
  smile: Smile,
} satisfies Record<HeroNoteIcon, typeof Heart>;

const cx = cssModuleCx.bind(null, styles);

function HeroNoteMark({ icon }: { icon: HeroNoteIcon }) {
  const NoteIcon = heroNoteIcons[icon];

  return (
    <span
      className={cx("home-sticky-note-mark", `home-sticky-note-mark-${icon}`)}
      aria-hidden="true"
    >
      <NoteIcon strokeWidth={2.25} />
    </span>
  );
}

export function HeroPhotoCarousel({
  images,
  fallbackAlt,
  notes,
}: HeroPhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleImages = images.slice(0, MAX_CAROUSEL_IMAGES);

  useEffect(() => {
    if (visibleImages.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (currentIndex) => (currentIndex + 1) % visibleImages.length,
      );
    }, AUTO_ADVANCE_DELAY);

    return () => window.clearInterval(timer);
  }, [visibleImages.length]);

  useEffect(() => {
    if (activeIndex < visibleImages.length) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, visibleImages.length]);

  const activeImage = visibleImages[activeIndex] ?? null;
  const activeImageSrc = activeImage
    ? getEventImageUrl(activeImage.src, "hero-main") ?? activeImage.src
    : null;

  return (
    <div className={cx("home-hero-visual")} aria-label="社区活动现场">
      <div className={cx("home-photo-frame")}>
        {activeImage && activeImageSrc ? (
          <Link
            href={activeImage.href}
            className={cx("home-photo-main-link")}
            aria-label={`查看${activeImage.alt || fallbackAlt}详情`}
          >
            <Image
              key={activeImageSrc}
              src={activeImageSrc}
              alt={activeImage.alt || fallbackAlt}
              width={760}
              height={520}
              priority
              unoptimized
              sizes="(max-width: 1024px) calc(100vw - 48px), 560px"
              className={cx("home-photo-main-image")}
            />
          </Link>
        ) : (
          <div className={cx("home-photo-fallback")}>
            <strong>常州 AI Club</strong>
            <span>连接 · 分享 · 共创</span>
          </div>
        )}
      </div>

      {visibleImages.length > 0 ? (
        <div className={cx("home-photo-carousel")} aria-label="活动照片切换">
          <div className={cx("home-photo-carousel-track")} role="tablist" aria-label="活动照片">
            {visibleImages.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`查看${image.alt}`}
                className={cx(
                  "home-photo-carousel-item",
                  index === activeIndex && "is-active",
                )}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  src={getEventImageUrl(image.src, "hero-thumb") ?? image.src}
                  alt=""
                  width={220}
                  height={132}
                  unoptimized
                  sizes="160px"
                  className={cx("home-photo-thumb")}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {notes.map((note) => (
        <p key={note.className} className={cx(note.className)}>
          {note.lines.map((line) => (
            <span key={line} className={cx("home-sticky-note-line")}>
              {line}
            </span>
          ))}
          {note.icon ? <HeroNoteMark icon={note.icon} /> : null}
        </p>
      ))}
      <DoodleSparkles className={cx("home-doodle home-doodle-hero-sparkles")} />
    </div>
  );
}
