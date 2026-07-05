"use client";

import { useEffect, useState } from "react";

export type BannerMediaItem = {
  id: string;
  media_type: "image" | "video";
  url: string;
  poster_url: string | null;
};

// Rotating background media (images and/or videos) for the home banners.
// Renders nothing when the list is empty; shows dots when there are 2+.
export default function BannerMedia({
  items,
  interval = 8000,
}: {
  items: BannerMediaItem[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [count, interval]);

  if (count === 0) return null;

  return (
    <>
      <div className="banner-media" aria-hidden="true">
        {items.map((m, i) => (
          <div key={m.id} className={`banner-media__item${i === index % count ? " is-active" : ""}`}>
            {m.media_type === "video" ? (
              <video autoPlay muted loop playsInline poster={m.poster_url ?? undefined}>
                <source src={m.url} />
              </video>
            ) : (
              <img src={m.url} alt="" loading={i === 0 ? "eager" : "lazy"} />
            )}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="banner-media__dots">
          {items.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={i === index % count ? "is-active" : ""}
              aria-label={`Média ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </>
  );
}
