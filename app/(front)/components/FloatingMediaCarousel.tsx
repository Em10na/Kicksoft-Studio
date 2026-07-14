"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BannerMediaItem } from "./BannerMedia";

// Wide → medium → narrow → medium → cycle
const SIZES = ["wide", "medium", "narrow", "medium"] as const;
type Size = (typeof SIZES)[number];

type Props = {
  items: BannerMediaItem[];
  interval?: number;
  badge?: string;
  title?: string;
  tagline?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function FloatingMediaCarousel({
  items,
  interval = 5000,
  badge,
  title,
  tagline,
  ctaLabel,
  ctaHref,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const count = items.length;

  // Scroll the track to a given card index
  const scrollToIdx = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".fmc__card"));
    const card = cards[idx];
    if (!card) return;
    // Align card's left edge with the track's start padding (24px)
    track.scrollTo({ left: card.offsetLeft - 24, behavior: "smooth" });
  }, []);

  // Auto-advance timer — resets whenever interval or count changes
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count <= 1) return;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setActiveIdx((prev) => {
        const next = (prev + 1) % count;
        scrollToIdx(next);
        return next;
      });
    }, interval);
  }, [count, interval, scrollToIdx]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  // Keep activeIdx in sync when the user scrolls manually
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const sl = track.scrollLeft;
      const cards = Array.from(track.querySelectorAll<HTMLElement>(".fmc__card"));
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft - 24 - sl);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActiveIdx(best);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  if (count === 0) return null;

  const goTo = (idx: number) => {
    scrollToIdx(idx);
    setActiveIdx(idx);
    resetTimer();
  };

  return (
    <div className="fmc">
      {/* Section header */}
      {(badge || title || tagline) && (
        <div className="fmc__head">
          {badge && <span className="section-tag">{badge}</span>}
          {title && <h2 className="fmc__title">{title}</h2>}
          {tagline && <p className="fmc__tagline">{tagline}</p>}
        </div>
      )}

      {/* Scrollable card strip + arrows */}
      <div className="fmc__wrap">
        {count > 1 && (
          <button
            type="button"
            className="fmc__arrow fmc__arrow--prev"
            aria-label="Précédent"
            onClick={() => goTo((activeIdx - 1 + count) % count)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <div
          ref={trackRef}
          className="fmc__track"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onTouchStart={() => { pausedRef.current = true; }}
          onTouchEnd={() => { setTimeout(() => { pausedRef.current = false; }, 2500); }}
        >
          {items.map((item, idx) => (
            <FmcCard
              key={item.id}
              item={item}
              size={SIZES[idx % SIZES.length]}
              idx={idx}
            />
          ))}
        </div>

        {count > 1 && (
          <button
            type="button"
            className="fmc__arrow fmc__arrow--next"
            aria-label="Suivant"
            onClick={() => goTo((activeIdx + 1) % count)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Dots + optional CTA */}
      {(count > 1 || (ctaLabel && ctaHref)) && (
        <div className="fmc__footer">
          {count > 1 && (
            <div className="fmc__dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === activeIdx ? "is-active" : ""}
                  aria-label={`Média ${i + 1}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          )}
          {ctaLabel && ctaHref && (
            <Link href={ctaHref} className="fmc__cta-btn">
              {ctaLabel}
              <svg width="12" height="9" viewBox="0 0 14 10" fill="none">
                <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Individual card ───────────────────────────────────────────────────────────

function FmcCard({
  item,
  size,
  idx,
}: {
  item: BannerMediaItem;
  size: Size;
  idx: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // CSS entrance animation triggered by IntersectionObserver
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("fmc__card--in");
          obs.unobserve(el);
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -24px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Video plays only when ≥35 % of the card is visible in the viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 }
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, [item.media_type]);

  return (
    <div
      ref={cardRef}
      className={`fmc__card fmc__card--${size}`}
      style={{ "--fmc-delay": `${idx * 80}ms` } as React.CSSProperties}
    >
      {item.media_type === "video" ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          poster={item.poster_url ?? undefined}
          preload="metadata"
        >
          <source src={item.url} />
        </video>
      ) : (
        <img src={item.url} alt="" loading={idx === 0 ? "eager" : "lazy"} />
      )}
      {/* Bottom vignette — purely decorative */}
      <div className="fmc__card-shade" aria-hidden="true" />
    </div>
  );
}
