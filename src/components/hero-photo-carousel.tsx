"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CirclePlay, Heart, Smile } from "lucide-react";

import { DoodleSparkles } from "@/components/home-visual-assets";
import { cssModuleCx } from "@/lib/utils";

import styles from "@/app/(site)/home-page.module.css";

type HeroNoteIcon = "arrow" | "heart" | "smile";

type HeroNote = {
  className: string;
  lines: readonly string[];
  icon?: HeroNoteIcon;
};

type HeroPhotoCarouselImage = {
  mainSrc: string;
  thumbSrc: string;
  alt: string;
  href: string;
  videoUrl?: string | null;
  videoTitle?: string | null;
  videoPosterSrc?: string | null;
};

type HeroPhotoCarouselProps = {
  images: HeroPhotoCarouselImage[];
  fallbackAlt: string;
  notes: readonly HeroNote[];
};

const AUTO_ADVANCE_DELAY = 4200;
const MAX_CAROUSEL_IMAGES = 3;
const NOTE_RETREAT_DELAY = 1800;
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
  const [retreatingNote, setRetreatingNote] = useState<string | null>(null);
  const retreatTimerRef = useRef<number | null>(null);
  const visibleImages = images.slice(0, MAX_CAROUSEL_IMAGES);
  const activeItemHasVideo = Boolean(visibleImages[activeIndex]?.videoUrl);

  useEffect(() => () => {
    if (retreatTimerRef.current) {
      window.clearTimeout(retreatTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (visibleImages.length <= 1 || activeItemHasVideo) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (currentIndex) => (currentIndex + 1) % visibleImages.length,
      );
    }, AUTO_ADVANCE_DELAY);

    return () => window.clearInterval(timer);
  }, [activeItemHasVideo, visibleImages.length]);

  useEffect(() => {
    if (activeIndex < visibleImages.length) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, visibleImages.length]);

  function handleNotePointerEnter(noteClassName: string) {
    if (retreatTimerRef.current) {
      window.clearTimeout(retreatTimerRef.current);
    }

    setRetreatingNote(noteClassName);
    retreatTimerRef.current = window.setTimeout(() => {
      setRetreatingNote(null);
      retreatTimerRef.current = null;
    }, NOTE_RETREAT_DELAY);
  }

  const activeImage = visibleImages[activeIndex] ?? null;
  const activeImageSrc = activeImage?.mainSrc ?? null;
  const activeVideoUrl = activeImage?.videoUrl ?? null;
  const activeLabel = activeImage?.alt || fallbackAlt;

  return (
    <div className={cx("home-hero-visual")} aria-label="社区活动现场">
      <div className={cx("home-photo-frame")}>
        {activeImage && activeImageSrc && activeVideoUrl ? (
          <div className={cx("home-photo-main-video-wrap")}>
            <video
              key={activeVideoUrl}
              className={cx("home-photo-main-video")}
              controls
              playsInline
              preload="metadata"
              poster={activeImage.videoPosterSrc ?? activeImageSrc}
              aria-label={activeImage.videoTitle ?? activeLabel}
            >
              <source src={activeVideoUrl} type="video/mp4" />
              <a href={activeVideoUrl}>打开活动视频</a>
            </video>
            <Link
              href={activeImage.href}
              className={cx("home-photo-main-detail-link")}
              aria-label={`查看${activeLabel}详情`}
            >
              <ArrowUpRight aria-hidden="true" strokeWidth={2.1} />
              <span className="sr-only">查看活动详情</span>
            </Link>
          </div>
        ) : activeImage && activeImageSrc ? (
          <Link
            href={activeImage.href}
            className={cx("home-photo-main-link")}
            aria-label={`查看${activeLabel}详情`}
          >
            <Image
              key={activeImageSrc}
              src={activeImageSrc}
              alt={activeLabel}
              width={760}
              height={520}
              priority
              fetchPriority="high"
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
                key={`${image.mainSrc}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`${image.videoUrl ? "播放" : "查看"}${image.alt}`}
                className={cx(
                  "home-photo-carousel-item",
                  index === activeIndex && "is-active",
                )}
                onClick={() => setActiveIndex(index)}
              >
                <span className={cx("home-photo-thumb-wrap")}>
                  <Image
                    src={image.thumbSrc}
                    alt=""
                    width={220}
                    height={132}
                    unoptimized
                    sizes="160px"
                    className={cx("home-photo-thumb")}
                  />
                  {image.videoUrl ? (
                    <span className={cx("home-photo-thumb-video-badge")} aria-hidden="true">
                      <CirclePlay strokeWidth={2.1} />
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {notes.map((note) => (
        <p
          key={note.className}
          className={cx(
            note.className,
            retreatingNote === note.className && "is-retreating",
          )}
          onMouseEnter={() => handleNotePointerEnter(note.className)}
          onPointerEnter={() => handleNotePointerEnter(note.className)}
        >
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
