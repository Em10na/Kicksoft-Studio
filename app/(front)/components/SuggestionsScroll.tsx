"use client";

import { useRef, useState, useEffect } from "react";

/**
 * SuggestionsScroll
 * Wraps a list of product cards in a touch-friendly horizontal scroll track
 * with prev/next arrow buttons on desktop.
 */
export default function SuggestionsScroll({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  function syncArrows() {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // Initial check (after cards have rendered)
    const id = requestAnimationFrame(syncArrows);
    el.addEventListener("scroll", syncArrows, { passive: true });
    const ro = new ResizeObserver(syncArrows);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(id);
      el.removeEventListener("scroll", syncArrows);
      ro.disconnect();
    };
  }, []);

  function scroll(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    // Scroll by roughly 2.5 card widths (card is ~260px)
    el.scrollBy({ left: dir * 650, behavior: "smooth" });
  }

  return (
    <div className="sugg-scroll">
      {/* Prev arrow */}
      <button
        type="button"
        className={`sugg-scroll__arrow sugg-scroll__arrow--prev${canLeft ? "" : " is-hidden"}`}
        onClick={() => scroll(-1)}
        aria-label="Articles précédents"
        tabIndex={canLeft ? 0 : -1}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Scroll track */}
      <div ref={trackRef} className="series-products">
        {children}
      </div>

      {/* Next arrow */}
      <button
        type="button"
        className={`sugg-scroll__arrow sugg-scroll__arrow--next${canRight ? "" : " is-hidden"}`}
        onClick={() => scroll(1)}
        aria-label="Articles suivants"
        tabIndex={canRight ? 0 : -1}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
