"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import WishlistButton from "./WishlistButton";

type SoldeProduct = {
  id: string;
  title: string;
  price: number;
  compare_price: number;
  stock: number;
  short_description?: string | null;
  image_url: string | null;
  product_media: { url: string; type: string; position: number }[] | null;
};

type SectionMedia = {
  id: string;
  url: string;
  media_type: "image" | "video";
  banner_label?: string | null;
  banner_title?: string | null;
  banner_sub?: string | null;
  banner_cta?: string | null;
  banner_cta_href?: string | null;
  banner_visible?: boolean | null;
};

type Props = {
  products: SoldeProduct[];
  media: SectionMedia[];
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

/* Defaults si l'admin n'a pas encore configuré les bannières */
const BANNER_DEFAULTS = [
  { label: "SOLDES EN COURS",     title: "Jusqu'à -50%",        sub: "Sur une sélection d'articles",           cta: "Profiter",  href: "/boutique?soldes=1" },
  { label: "NOUVELLE COLLECTION", title: "Nouveaux Arrivages",   sub: "Découvrez les dernières tendances.",      cta: "Explorer",  href: "/boutique" },
  { label: "LIVRAISON OFFERTE",   title: "Dès 200 DT d'achat",  sub: "Commandez en ligne, recevez chez vous.", cta: "Commander", href: "/boutique" },
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
  const [selected, setSelected] = useState<SoldeProduct | null>(null);

  /* ── Scroll arrows ── */
  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -532 : 532, behavior: "smooth" });
  }

  /* ── Bannières : médias visibles (banner_visible !== false) ── */
  // Si AUCUN item n'est explicitement visible, on affiche TOUS (robustesse :
  // évite d'afficher les images démo DEMO_BG quand l'admin a bien ajouté des
  // médias mais n'a pas encore configuré le toggle "Visible" pour chacun).
  const visibleBanners = media.filter((m) => m.banner_visible !== false);
  const banners = visibleBanners.length > 0 ? visibleBanners : media;

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
                <button className="na-nav-btn" onClick={() => scroll("left")} aria-label="Précédent">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button className="na-nav-btn" onClick={() => scroll("right")} aria-label="Suivant">
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
              display: "flex", gap: 16, overflowX: "auto",
              scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
              paddingBottom: 8, msOverflowStyle: "none", scrollbarWidth: "none",
            }}
          >
            {products.map((p) => {
              const pct = p.compare_price > 0 ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
              const img = p.image_url
                ?? [...(p.product_media ?? [])].sort((a, b) => a.position - b.position)[0]?.url
                ?? "";
              return (
                <article key={p.id} className="na-card" style={{ flex: "0 0 230px", minWidth: 0, scrollSnapAlign: "start", cursor: "pointer" }}>
                  {/* Zone image — ouvre le quick-view */}
                  <div
                    className="na-card__img-wrap"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(p)}
                  >
                    {pct > 0 && <span className="na-card__badge">-{pct}%</span>}
                    {img && <img src={img} alt={p.title} loading="lazy" />}
                    <WishlistButton productId={p.id} className="na-card__wish" />
                    {/* Loupe quick-view */}
                    <div style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0, background: "rgba(0,0,0,0.35)", transition: "opacity 0.2s",
                      borderRadius: "inherit",
                    }}
                      className="na-card__overlay"
                    >
                      <span style={{
                        background: "#fff", color: "#0f172a", fontWeight: 700, fontSize: 12,
                        padding: "7px 16px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        Aperçu
                      </span>
                    </div>
                  </div>
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

        {/* ── Dots indicateur ─────────────────────────────── */}
        {products.length > 3 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
            {Array.from({ length: Math.ceil(products.length / 3) }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollRef.current?.scrollTo({ left: i * 3 * (230 + 16), behavior: "smooth" })}
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

        {/* ── Bannières du bas (gérées par l'admin) ────────── */}
        <div className="na-banners">
          {(banners.length > 0 ? banners : DEMO_BG.map((url, i) => ({ url, media_type: "image" as const, id: String(i), banner_visible: true } as SectionMedia)) as SectionMedia[]).map((m, i) => {
            const def = BANNER_DEFAULTS[i] ?? BANNER_DEFAULTS[0];
            const label    = m.banner_label    || def.label;
            const banTitle = m.banner_title    || def.title;
            const sub      = m.banner_sub      || def.sub;
            const cta      = m.banner_cta      || def.cta;
            const href     = m.banner_cta_href || def.href;
            const isVideo  = m.media_type === "video";
            return (
              <Link key={m.id ?? i} href={href} className="na-banner">
                {isVideo
                  ? <video className="na-banner__bg" src={m.url} muted loop playsInline autoPlay />
                  : <img className="na-banner__bg" src={m.url} alt={banTitle} loading="lazy" />}
                <div className="na-banner__overlay" />
                <div className="na-banner__content">
                  <p className="na-banner__eyebrow">{label}</p>
                  <p className="na-banner__title">{banTitle}</p>
                  <p className="na-banner__sub">{sub}</p>
                  <span className="na-banner__cta">{cta}</span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>

      {/* ────────── Modal quick-view produit ────────── */}
      {selected && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111", borderRadius: 20, maxWidth: 640, width: "100%",
              display: "flex", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              maxHeight: "90vh",
            }}
          >
            {/* Image */}
            <div style={{ width: "45%", flexShrink: 0, background: "#1a1a1a", position: "relative" }}>
              {(() => {
                const img = selected.image_url
                  ?? [...(selected.product_media ?? [])].sort((a, b) => a.position - b.position)[0]?.url;
                return img
                  ? <img src={img} alt={selected.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#475569", fontSize: 40 }}>📦</div>;
              })()}
              {/* Badge remise */}
              {selected.compare_price > selected.price && (
                <span style={{
                  position: "absolute", top: 14, left: 14,
                  background: "#f43f5e", color: "#fff", fontWeight: 800, fontSize: 13,
                  padding: "4px 10px", borderRadius: 20,
                }}>
                  -{Math.round((1 - selected.price / selected.compare_price) * 100)}%
                </span>
              )}
            </div>

            {/* Infos */}
            <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
              {/* Fermer */}
              <button
                onClick={() => setSelected(null)}
                style={{
                  position: "absolute", /* will be in-flow */ alignSelf: "flex-end",
                  background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
                  width: 30, height: 30, cursor: "pointer", color: "#94a3b8",
                  display: "grid", placeItems: "center", fontSize: 14,
                  marginBottom: -8,
                }}
              >✕</button>

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#f43f5e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  EN SOLDE
                </p>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                  {selected.title}
                </h3>
              </div>

              {/* Prix */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#f43f5e" }}>
                  {selected.price.toFixed(2)} DT
                </span>
                {selected.compare_price > selected.price && (
                  <span style={{ fontSize: 15, color: "#64748b", textDecoration: "line-through" }}>
                    {selected.compare_price.toFixed(2)} DT
                  </span>
                )}
              </div>

              {/* Économie */}
              {selected.compare_price > selected.price && (
                <div style={{
                  padding: "8px 14px", background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.25)", borderRadius: 10,
                  fontSize: 13, color: "#fb7185", fontWeight: 600,
                }}>
                  Économisez {(selected.compare_price - selected.price).toFixed(2)} DT sur cet article
                </div>
              )}

              {/* Description */}
              {selected.short_description && (
                <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                  {selected.short_description}
                </p>
              )}

              {/* Stock */}
              {selected.stock <= 5 && selected.stock > 0 && (
                <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, margin: 0 }}>
                  ⚠️ Plus que {selected.stock} en stock !
                </p>
              )}
              {selected.stock === 0 && (
                <p style={{ fontSize: 12, color: "#f43f5e", fontWeight: 600, margin: 0 }}>
                  Rupture de stock
                </p>
              )}

              {/* CTA */}
              <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
                <Link
                  href={`/produit/${selected.id}`}
                  style={{
                    flex: 1, background: "#f43f5e", color: "#fff", fontWeight: 700,
                    padding: "12px 20px", borderRadius: 12, textAlign: "center",
                    textDecoration: "none", fontSize: 14, display: "block",
                    transition: "background 0.2s",
                  }}
                  onClick={() => setSelected(null)}
                >
                  Voir le produit →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS pour l'overlay hover sur les cartes */}
      <style>{`
        .na-card__img-wrap:hover .na-card__overlay { opacity: 1 !important; }
        .na-card__img-wrap { position: relative; }
      `}</style>
    </section>
  );
}
