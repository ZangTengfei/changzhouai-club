"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Heart, Smile } from "lucide-react";

import { DoodleSparkles } from "@/components/home-visual-assets";
import { getEventImageUrl } from "@/lib/public-image-url";

import styles from "@/app/(site)/home-page.module.css";

type HeroNoteIcon = "arrow" | "heart" | "smile";

type HeroNote = {
  className: string;
  lines: readonly string[];
  icon?: HeroNoteIcon;
};

type HeroPhotoCarouselProps = {
  images: string[];
  alt: string;
  notes: readonly HeroNote[];
};

const AUTO_ADVANCE_DELAY = 4200;
const heroNoteIcons = {
  arrow: ArrowUpRight,
  heart: Heart,
  smile: Smile,
} satisfies Record<HeroNoteIcon, typeof Heart>;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes
    .flatMap((className) =>
      typeof className === "string" ? className.split(/\s+/) : [],
    )
    .filter(Boolean)
    .map((className) => styles[className as keyof typeof styles] ?? className)
    .join(" ");
}

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
  alt,
  notes,
}: HeroPhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, AUTO_ADVANCE_DELAY);

    return () => window.clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    if (activeIndex < images.length) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, images.length]);

  const activeImage = images[activeIndex] ?? null;
  const visibleImages = images.slice(0, 3);
  const activeImageSrc = getEventImageUrl(activeImage, "hero-main") ?? activeImage;

  return (
    <div className={cx("home-hero-visual")} aria-label="社区活动现场">
      <div className={cx("home-photo-frame")}>
        {activeImage && activeImageSrc ? (
          <Image
            key={activeImageSrc}
            src={activeImageSrc}
            alt={alt}
            width={760}
            height={520}
            priority
            unoptimized
            sizes="(max-width: 1024px) calc(100vw - 48px), 560px"
            className={cx("home-photo-main-image")}
          />
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
            {visibleImages.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`查看第 ${index + 1} 张活动照片`}
                className={cx(
                  "home-photo-carousel-item",
                  index === activeIndex && "is-active",
                )}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  src={getEventImageUrl(imageUrl, "hero-thumb") ?? imageUrl}
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
