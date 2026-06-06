"use client";

import { ChevronLeft, ChevronRight, Maximize2, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import styles from "./opc-community-funding-page.module.css";

function getSlides() {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-deck-slide]"));
}

function getDeckRoot() {
  return document.querySelector<HTMLElement>("[data-deck-root]");
}

function getActiveSlideIndex(slides: HTMLElement[]) {
  const activeIndex = slides.findIndex((slide) => slide.dataset.activeSlide === "true");

  return activeIndex >= 0 ? activeIndex : 0;
}

export function DeckControls() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);

  const activateSlide = useCallback((index: number, slides = getSlides()) => {
    if (slides.length === 0) {
      setSlideCount(0);
      setCurrentIndex(0);
      return;
    }

    const nextIndex = Math.min(Math.max(index, 0), slides.length - 1);

    slides.forEach((slide, slideIndex) => {
      slide.dataset.activeSlide = slideIndex === nextIndex ? "true" : "false";
    });

    getDeckRoot()?.setAttribute("data-current-slide", String(nextIndex + 1));
    setSlideCount(slides.length);
    setCurrentIndex(nextIndex);
  }, []);

  const goToSlide = useCallback((index: number) => {
    activateSlide(index);
  }, [activateSlide]);

  const goBy = useCallback((delta: number) => {
    const slides = getSlides();

    if (slides.length === 0) {
      return;
    }

    activateSlide(getActiveSlideIndex(slides) + delta, slides);
  }, [activateSlide]);

  const refreshSlideState = useCallback(() => {
    const slides = getSlides();
    activateSlide(getActiveSlideIndex(slides), slides);
  }, [activateSlide]);

  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.body.classList.add("opc-deck-active");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    refreshSlideState();
    requestAnimationFrame(refreshSlideState);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goBy(1);
      }

      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goBy(-1);
      }

      if (event.key === "Home") {
        event.preventDefault();
        goToSlide(0);
      }

      if (event.key === "End") {
        event.preventDefault();
        goToSlide(getSlides().length - 1);
      }
    };

    const observer = new MutationObserver(() => {
      refreshSlideState();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("opc-deck-active");
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, [goBy, goToSlide, refreshSlideState]);

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await (getDeckRoot() ?? document.documentElement).requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  };

  return (
    <div className={styles.deckControls} aria-label="演示控制">
      <button
        type="button"
        aria-label="上一页"
        onClick={() => goToSlide(currentIndex - 1)}
        disabled={currentIndex <= 0}
      >
        <ChevronLeft aria-hidden="true" strokeWidth={2} />
      </button>
      <span aria-live="polite">
        {String(currentIndex + 1).padStart(2, "0")}/{String(slideCount).padStart(2, "0")}
      </span>
      <button
        type="button"
        aria-label="下一页"
        onClick={() => goToSlide(currentIndex + 1)}
        disabled={currentIndex >= slideCount - 1}
      >
        <ChevronRight aria-hidden="true" strokeWidth={2} />
      </button>
      <button type="button" aria-label="全屏" onClick={handleFullscreen}>
        <Maximize2 aria-hidden="true" strokeWidth={2} />
      </button>
      <button type="button" aria-label="打印" onClick={() => window.print()}>
        <Printer aria-hidden="true" strokeWidth={2} />
      </button>
    </div>
  );
}
