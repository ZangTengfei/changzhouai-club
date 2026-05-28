"use client";

import { useEffect } from "react";

type ProjectAnchorScrollProps = {
  targetId: string;
};

function scrollToTarget(targetId: string, behavior: ScrollBehavior) {
  const target = document.getElementById(targetId);

  if (!target) {
    return false;
  }

  target.scrollIntoView({
    behavior,
    block: "start",
  });
  return true;
}

export function ProjectAnchorScroll({ targetId }: ProjectAnchorScrollProps) {
  useEffect(() => {
    const targetHash = `#${targetId}`;
    const clickListenerOptions = { capture: true };
    let firstFrame = 0;
    let secondFrame = 0;
    let fallbackTimeout = 0;

    if (window.location.hash === targetHash) {
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          scrollToTarget(targetId, "auto");
        });
      });
      fallbackTimeout = window.setTimeout(() => {
        scrollToTarget(targetId, "auto");
      }, 450);
    }

    function handleSamePageAnchorClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const clickedElement = event.target instanceof Element ? event.target : null;
      const anchor = clickedElement?.closest<HTMLAnchorElement>("a[href]");

      if (!anchor || (anchor.target && anchor.target !== "_self")) {
        return;
      }

      const url = new URL(anchor.href);

      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        url.hash !== targetHash
      ) {
        return;
      }

      event.preventDefault();

      if (window.location.hash !== targetHash) {
        window.history.pushState(null, "", `${url.pathname}${url.search}${targetHash}`);
      }

      scrollToTarget(targetId, "smooth");
    }

    document.addEventListener("click", handleSamePageAnchorClick, clickListenerOptions);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallbackTimeout);
      document.removeEventListener("click", handleSamePageAnchorClick, clickListenerOptions);
    };
  }, [targetId]);

  return null;
}
