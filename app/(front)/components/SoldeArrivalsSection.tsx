"use client";

import Link from "next/link";
import { useRef } from "react";
import WishlistButton from "./WishlistButton";

type SoldeProduct = {
  id: string;
  title: string;
  price: number;
  compare_price: number;
  stock: number;
  image_url: string | null;
  product_media: { url: string; type: string; position: number }[] | null;
};

type SectionMedia = {
  id: string;
  url: string;
  media_type: "image" | "video";
};

type Props = {
  products: SoldeProduct[];
  media: SectionMedia[];
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const BANNER_COPY = [
  { label: "SOLDES EN COURS",    title: "Jusqu'à -50%",         sub: "Sur une sélection d'articles",          cta: "Profiter" },
  { label: "NOUVELLE COLLECTION", title: "Nouveaux Arrivages",   sub: "Découvrez les dernières tendances.",     cta: "Explorer" },
  { label: "LIVRAISON OFFERTE",  title: "Dès 200 DT d'achat",   sub: "Commandez en ligne, recevez chez vous.", cta: "Commander" },
];

const DEMO_BG = [
  "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=800&q=80&auto=format&fit=crop",
];

export default function SoldeArrivalsSection({
  products,
  media,
  title = "Articles en Solde",
  ctaLabel = "Voir tout",
  ctaHref = "/boutique?soldes=1",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const adminMedia = media.slice(0, 3);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    // Scroll par ~2 cartes (250px chacune + 16px gap)
    scrollRef.current.scrollBy({ left: dir === "left" ? -532 : 532, behavior: "smooth" });
  }

  return (
    <section className="na-section">
      <div className="container">

        {/* ── En-tête ─────────────────────────────────────── */}
        <div className="na-head">
          <div>
            <p className="na-head__eyebrow">SOLDES</p>
            <h2 className="na-head__title">{title}</h2>
          </div>
          <div className="na-head__right">
            <Link href={ctaHref} className="na-view-all">
              {ctaLabel}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            {products.length > 3 && (
              <div className="na-nav-arrows">
                <button
                  className="na-nav-btn"
                  onClick={() => scroll("left")}
                  aria-label="Précédent"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  className="na-nav-btn"
                  onClick={() => scroll("right")}
                  aria-label="Suivant"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Carrousel horizontal ─────────────────────────── */}
        {products.length > 0 ? (
          <div
            ref={scrollRef}
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 8,
              /* Masquer la scrollbar tout en gardant le scroll */
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <style>{`
              .na-scroll-track::-webkit-scrollbar { display: none; }
            `}</style>
            {products.map((p) => {
              const pct = p.compare_price > 0 ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
              const img = p.image_url
                ?? [...(p.product_media ?? [])].sort((a, b) => a.position - b.position)[0]?.url
                ?? "";
              return (
                <article
                  key={p.id}
                  className="na-card"
                  style={{
                    flex: "0 0 230px",
                    minWidth: 0,
                    scrollSnapAlign: "start",
                  }}
                >
                  <Link href={`/produit/${p.id}`} className="na-card__img-wrap">
                    {pct > 0 && <span className="na-card__badge">-{pct}%</span>}
                    {img && <img src={img} alt={p.title} loading="lazy" />}
                    <WishlistButton productId={p.id} className="na-card__wish" />
                  </Link>
                  <div className="na-card__info">
                    <Link href={`/produit/${p.id}`} className="na-card__name">{p.title}</Link>
                    <div className="na-card__price-row">
                      <span className="na-card__price-now">{p.price.toFixed(2)} DT</span>
                      {p.compare_price > p.price && (
                        <span className="na-card__price-was">{p.compare_price.toFixed(2)} DT</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="na-empty">
            Aucun article en solde pour le moment.{" "}
            <Link href="/admin/soldes">Gérer depuis l&apos;admin</Link>
          </p>
        )}

        {/* ── Dots indicateur (desktop) ───────────────────── */}
        {products.length > 3 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
            {Array.from({ length: Math.ceil(products.length / 3) }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({ left: i * 3 * (230 + 16), behavior: "smooth" });
                  }
                }}
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i === 0 ? "#f43f5e" : "rgba(255,255,255,0.3)",
                  border: "none", cursor: "pointer", padding: 0, transition: "background 0.2s",
                }}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* ── Bannières du bas ────────────────────────────── */}
        <div className="na-banners">
          {BANNER_COPY.map((copy, i) => {
            const m = adminMedia[i];
            const bgUrl = m?.url ?? DEMO_BG[i];
            const isVideo = m?.media_type === "video";
            return (
              <Link key={i} href={ctaHref} className="na-banner">
                {isVideo ? (
                  <video className="na-banner__bg" src={bgUrl} muted loop playsInline autoPlay />
                ) : (
                  <img className="na-banner__bg" src={bgUrl} alt={copy.title} loading="lazy" />
                )}
                <div className="na-banner__overlay" />
                <div className="na-banner__content">
                  <p className="na-banner__eyebrow">{copy.label}</p>
                  <p className="na-banner__title">{copy.title}</p>
                  <p className="na-banner__sub">{copy.sub}</p>
                  <span className="na-banner__cta">{copy.cta}</span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
