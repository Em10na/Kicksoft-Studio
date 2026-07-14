"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type BannerMediaItem = {
  id: string;
  media_type: "image" | "video";
  url: string;
  poster_url: string | null;
};

// Rotating background media (images and/or videos) for the home banners.
// Renders nothing when the list is empty; shows arrows + dots when there are 2+.
// Videos play only while the banner is in the viewport (IntersectionObserver).
export default function BannerMedia({
  items,
  interval = 5000,
}: {
  items: BannerMediaItem[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const count = items.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % count), interval);
  }, [count, interval]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  // Pause/resume active video when banner enters/leaves the viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const video = videoRefs.current.get(items[index]?.id);
        if (!video) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [index, items]);

  // When active slide changes: play new video, pause old ones
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      if (id === items[index]?.id) video.play().catch(() => {});
      else video.pause();
    });
  }, [index, items]);

  const goTo = useCallback((i: number) => {
    setIndex((i + count) % count);
    resetTimer();
  }, [count, resetTimer]);

  if (count === 0) return null;

  return (
    <>
      <div ref={containerRef} className="banner-media" aria-hidden="true">
        {items.map((m, i) => (
          <div key={m.id} className={`banner-media__item${i === index ? " is-active" : ""}`}>
            {m.media_type === "video" ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(m.id, el);
                  else videoRefs.current.delete(m.id);
                }}
                muted
                loop
                playsInline
                poster={m.poster_url ?? undefined}
                preload={i === 0 ? "auto" : "metadata"}
              >
                <source src={m.url} />
              </video>
            ) : (
              <img src={m.url} alt="" loading={i === 0 ? "eager" : "lazy"} />
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          {/* Flèche gauche */}
          <button
            type="button"
            className="banner-media__arrow banner-media__arrow--prev"
            aria-label="Média précédent"
            onClick={() => goTo(index - 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Flèche droite */}
          <button
            type="button"
            className="banner-media__arrow banner-media__arrow--next"
            aria-label="Média suivant"
            onClick={() => goTo(index + 1)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Points de navigation */}
          <div className="banner-media__dots">
            {items.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={i === index ? "is-active" : ""}
                aria-label={`Média ${i + 1}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
