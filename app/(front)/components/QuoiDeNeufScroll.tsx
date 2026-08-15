"use client";

import { useRef } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

type Product = {
  id: string;
  title: string;
  price: number;
  compare_price?: number | null;
  stock: number;
  image_url: string | null;
  loyalty_points?: number;
};

type Props = {
  products: Product[];
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function QuoiDeNeufScroll({
  products,
  title = "Quoi de neuf",
  ctaLabel = "Voir tout",
  ctaHref = "/boutique?nouveautes=1",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -500 : 500, behavior: "smooth" });
  }

  return (
    <section className="section" style={{ paddingTop: "var(--s5)" }}>
      <div className="container">
        {/* En-tête */}
        <div className="section-head" style={{ marginBottom: 20 }}>
          <div>
            <span className="section-tag">Nouveau</span>
            <h2>{title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Flèches de navigation */}
            {products.length > 3 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => scroll("left")}
                  aria-label="Précédent"
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "1.5px solid var(--border, #e2e8f0)",
                    background: "var(--card-bg, #fff)",
                    cursor: "pointer", display: "grid", placeItems: "center",
                    color: "var(--fg, #334155)", transition: "background 0.18s, border-color 0.18s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--indigo, #6366f1)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--indigo, #6366f1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--card-bg, #fff)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--fg, #334155)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border, #e2e8f0)"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => scroll("right")}
                  aria-label="Suivant"
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "1.5px solid var(--border, #e2e8f0)",
                    background: "var(--card-bg, #fff)",
                    cursor: "pointer", display: "grid", placeItems: "center",
                    color: "var(--fg, #334155)", transition: "background 0.18s, border-color 0.18s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--indigo, #6366f1)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--indigo, #6366f1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--card-bg, #fff)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--fg, #334155)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border, #e2e8f0)"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
            <Link href={ctaHref} className="view-all">
              {ctaLabel}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Scroll horizontal */}
        {products.length > 0 ? (
          <div
            ref={scrollRef}
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 12,
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                style={{ flex: "0 0 230px", minWidth: 0, scrollSnapAlign: "start" }}
              >
                <ProductCard
                  id={p.id}
                  title={p.title}
                  price={p.price}
                  compare_price={p.compare_price}
                  stock={p.stock}
                  image_url={p.image_url}
                  loyalty_points={p.loyalty_points}
                  badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "var(--fg-mute)" }}>
            Aucun produit pour le moment.{" "}
            <Link href="/admin/produits" style={{ color: "var(--indigo)" }}>
              Ajoutez-en depuis l&apos;admin
            </Link>
          </p>
        )}
      </div>

      <style>{`
        /* Masquer la scrollbar sur webkit */
        [data-qdn-scroll]::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
