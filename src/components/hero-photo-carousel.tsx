"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CirclePlay, Heart, Pause, Play, Smile } from "lucide-react";

import { DoodleSparkles } from "@/components/home-visual-assets";
import { RevealNextImage } from "@/components/reveal-image";
import { cn } from "@/lib/utils";

type HeroNoteIcon = "arrow" | "heart" | "smile";

type HeroNote = {
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

function HeroNoteMark({ icon }: { icon: HeroNoteIcon }) {
  const NoteIcon = heroNoteIcons[icon];

  return (
    <span
      className="absolute right-[15px] bottom-3 block leading-none text-[#0d956c] [&_svg]:block [&_svg]:size-[22px] max-sm:right-3 max-sm:bottom-2.5 max-sm:[&_svg]:size-[18px]"
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
  const [isPaused, setIsPaused] = useState(false);
  const [retreatingNote, setRetreatingNote] = useState<number | null>(null);
  const retreatTimerRef = useRef<number | null>(null);
  const visibleImages = images.slice(0, MAX_CAROUSEL_IMAGES);
  const activeItemHasVideo = Boolean(visibleImages[activeIndex]?.videoUrl);

  useEffect(() => () => {
    if (retreatTimerRef.current) {
      window.clearTimeout(retreatTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (visibleImages.length <= 1 || activeItemHasVideo || isPaused) {
      return undefined;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (currentIndex) => (currentIndex + 1) % visibleImages.length,
      );
    }, AUTO_ADVANCE_DELAY);

    return () => window.clearInterval(timer);
  }, [activeItemHasVideo, isPaused, visibleImages.length]);

  useEffect(() => {
    if (activeIndex < visibleImages.length) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, visibleImages.length]);

  function handleNotePointerEnter(noteIndex: number) {
    if (retreatTimerRef.current) {
      window.clearTimeout(retreatTimerRef.current);
    }

    setRetreatingNote(noteIndex);
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
    <div className="relative min-h-[520px] py-[26px] pr-0 pb-2.5 pl-[34px] max-lg:min-h-[500px] max-lg:pt-7 max-lg:pr-0 max-lg:pb-3 max-lg:pl-5 max-sm:min-h-0 max-sm:px-0 max-sm:pt-[38px] max-sm:pb-[74px]" aria-label="社区活动现场">
      <div className="relative mt-12 ml-auto w-[94%] origin-[56%_38%] translate-x-2.5 -translate-y-[5px] -rotate-[1.4deg] overflow-hidden rounded-[var(--radius-sm)] bg-[#e8efe7] shadow-[0_24px_56px_rgba(var(--ink-rgb),0.16),0_0_0_1px_rgba(255,255,255,0.8)] max-sm:mt-0 max-sm:w-full max-sm:translate-x-0! max-sm:translate-y-0! max-sm:rotate-0!">
        {activeImage && activeImageSrc && activeVideoUrl ? (
          <div className="relative block bg-[#17201d] text-inherit">
            <video
              key={activeVideoUrl}
              className="block h-[378px] w-full bg-[#17201d] object-cover max-sm:h-60"
              controls
              playsInline
              preload="none"
              poster={activeImage.videoPosterSrc ?? activeImageSrc}
              aria-label={activeImage.videoTitle ?? activeLabel}
            >
              <source src={activeVideoUrl} type="video/mp4" />
              <a href={activeVideoUrl}>打开活动视频</a>
            </video>
            <Link
              href={activeImage.href}
              prefetch={false}
              className="absolute top-3 right-3 z-[2] grid size-[38px] place-items-center rounded-[var(--radius-pill)] bg-white/86 text-[var(--accent-strong)] shadow-[var(--shadow-lg)] transition-[background,transform] duration-180 hover:-translate-y-px hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(var(--accent-rgb),0.72)] [&_svg]:size-[18px]"
              aria-label={`查看${activeLabel}详情`}
            >
              <ArrowUpRight aria-hidden="true" strokeWidth={2.1} />
              <span className="sr-only">查看活动详情</span>
            </Link>
          </div>
        ) : activeImage && activeImageSrc ? (
          <Link
            href={activeImage.href}
            prefetch={false}
            className="group block text-inherit focus-visible:outline-3 focus-visible:-outline-offset-[6px] focus-visible:outline-[rgba(var(--accent-rgb),0.72)]"
            aria-label={`查看${activeLabel}详情`}
          >
            <RevealNextImage
              key={activeImageSrc}
              src={activeImageSrc}
              alt={activeLabel}
              width={760}
              height={520}
              priority
              fetchPriority="high"
              unoptimized
              sizes="(max-width: 1024px) calc(100vw - 48px), 560px"
              className="block h-[378px] w-full object-cover transition-transform duration-220 group-hover:scale-[1.015] group-focus-visible:scale-[1.015] max-sm:h-60 max-sm:group-hover:scale-100! max-sm:group-focus-visible:scale-100!"
            />
          </Link>
        ) : (
          <div className="grid h-[378px] place-items-center gap-2.5 bg-[#e9f9f0] text-center text-[var(--accent-strong)] max-sm:h-60">
            <strong className="text-[clamp(2rem,5vw,3.2rem)]">常州 AI Club</strong>
            <span>连接 · 分享 · 共创</span>
          </div>
        )}
      </div>

      {visibleImages.length > 1 && !activeItemHasVideo ? (
        <button
          type="button"
          className="absolute top-[84px] right-3 z-[5] grid size-11 place-items-center rounded-[var(--radius-pill)] border border-white/70 bg-white/90 text-[var(--accent-strong)] shadow-[var(--shadow-md)] transition-[transform,background-color] duration-180 hover:-translate-y-px hover:bg-white focus-visible:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(var(--accent-rgb),0.72)] max-sm:top-[50px] max-sm:right-2.5"
          aria-label={isPaused ? "继续自动播放活动照片" : "暂停自动播放活动照片"}
          aria-pressed={isPaused}
          onClick={() => setIsPaused((current) => !current)}
        >
          {isPaused ? <Play aria-hidden="true" className="size-[18px]" /> : <Pause aria-hidden="true" className="size-[18px]" />}
        </button>
      ) : null}

      {visibleImages.length > 0 ? (
        <div className="mt-2 ml-[-16px] grid w-[76%] max-sm:mt-3 max-sm:ml-0 max-sm:w-[88%]" aria-label="活动照片切换">
          <div className="grid grid-cols-3 gap-2.5 overflow-visible p-0" role="tablist" aria-label="活动照片">
            {visibleImages.map((image, index) => (
              <button
                key={`${image.mainSrc}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`${image.videoUrl ? "播放" : "查看"}${image.alt}`}
                className={cn(
                  "group min-w-0 appearance-none overflow-visible rounded-[var(--radius-sm)] border-0 bg-transparent p-0 text-left transition-[transform,opacity] duration-220 focus-visible:outline-none",
                  index === activeIndex && "-translate-y-[3px] ring-2 ring-[var(--accent)] ring-offset-2",
                )}
                onClick={() => setActiveIndex(index)}
              >
                <span className="relative block">
                  <RevealNextImage
                    src={image.thumbSrc}
                    alt=""
                    width={220}
                    height={132}
                    unoptimized
                    sizes="160px"
                    className={cn(
                      "block h-[70px] w-full rounded-[var(--radius-sm)] border-0 object-cover opacity-72 transition-[opacity,transform] duration-220 group-hover:opacity-96 group-focus-visible:opacity-96 group-focus-visible:outline-3 group-focus-visible:outline-offset-3 group-focus-visible:outline-[rgba(var(--accent-rgb),0.2)] max-sm:h-[58px]",
                      index === activeIndex && "scale-[1.02] opacity-100",
                    )}
                  />
                  {image.videoUrl ? (
                    <span className="absolute right-2 bottom-2 grid size-[26px] place-items-center rounded-[var(--radius-pill)] bg-white/88 text-[var(--accent-strong)] shadow-[var(--shadow-lg)] [&_svg]:size-4" aria-hidden="true">
                      <CirclePlay strokeWidth={2.1} />
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {notes.map((note, noteIndex) => (
        <p
          key={note.lines.join("-")}
          className={cn(
            "absolute top-4 left-2 z-[3] m-0 max-w-[168px] -rotate-11 rounded-[var(--radius-sm)] bg-[#fff2e5] px-[18px] pt-[17px] pb-[38px] text-[0.93rem] leading-[1.58] font-extrabold text-[#26322f] shadow-[var(--shadow-lg)] transition-[transform,box-shadow,opacity] duration-420 motion-reduce:transition-none hover:-translate-x-14 hover:-translate-y-6 hover:-rotate-16 max-sm:top-0 max-sm:left-0 max-sm:max-w-[132px] max-sm:px-3 max-sm:pt-3 max-sm:pb-8 max-sm:text-[0.78rem]",
            retreatingNote === noteIndex && "z-[6] -translate-x-14 -translate-y-6 -rotate-16 opacity-96",
          )}
          onMouseEnter={() => handleNotePointerEnter(noteIndex)}
          onPointerEnter={() => handleNotePointerEnter(noteIndex)}
        >
          {note.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
          {note.icon ? <HeroNoteMark icon={note.icon} /> : null}
        </p>
      ))}
      <DoodleSparkles className="pointer-events-none absolute top-[70px] right-[150px] z-4 h-auto w-[84px] text-[#f4c75d] max-sm:top-[86px] max-sm:right-[72px] max-sm:w-[54px]" />
    </div>
  );
}
