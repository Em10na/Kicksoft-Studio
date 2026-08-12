"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { launchCartAnim } from "@/app/(front)/lib/cartAnim";

type Product = {
  id: string;
  title: string;
  price: number;
  compare_price?: number | null;
  image_url: string | null;
  stock: number;
};

export default function QuickAddDrawer() {
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onQuickAdd(e: Event) {
      const p = (e as CustomEvent<Product>).detail;
      setProduct(p);
      setQty(1);
      setAdded(false);
      document.body.style.overflow = "hidden";
    }
    window.addEventListener("quickadd", onQuickAdd);
    return () => window.removeEventListener("quickadd", onQuickAdd);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    if (product) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product]);

  function close() {
    setProduct(null);
    document.body.style.overflow = "";
  }

  function handleAdd() {
    if (!product || product.stock <= 0) return;
    addItem(product, qty);
    setAdded(true);
    const btn = drawerRef.current?.querySelector<HTMLElement>(".qa-add-btn");
    if (btn) launchCartAnim(btn);
    setTimeout(close, 1100);
  }

  if (!product) return null;

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  const img = product.image_url
    || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop";

  return (
    <>
      <div className="qa-overlay" onClick={close} aria-hidden="true" />

      <div
        ref={drawerRef}
        className="qa-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Aperçu : ${product.title}`}
      >
        {/* Barre de glissement (mobile) */}
        <div className="qa-handle" aria-hidden="true" />

        {/* Layout 2 colonnes desktop / empilé mobile */}
        <div className="qa-inner">

          {/* ── Colonne image ── */}
          <div className="qa-img">
            <img src={img} alt={product.title} />
            {discount && (
              <span className="qa-img-badge">-{discount}%</span>
            )}
          </div>

          {/* ── Colonne info ── */}
          <div className="qa-panel">

            {/* Bouton fermer */}
            <button className="qa-close" onClick={close} aria-label="Fermer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable */}
            <div className="qa-scroll">
              <div className="qa-body">

                {/* Titre */}
                <p className="qa-title">{product.title}</p>

                {/* Prix */}
                <div className="qa-pricing">
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="qa-compare">{product.compare_price.toFixed(2)} DT</span>
                  )}
                  <span className="qa-price">{product.price.toFixed(2)} DT</span>
                </div>

                {/* Séparateur */}
                <div className="qa-divider" />

                {/* Stock */}
                <p className={`qa-stock ${product.stock <= 0 ? "qa-stock--out" : ""}`}>
                  <span className="qa-stock-dot" />
                  {product.stock > 0
                    ? `En stock — ${product.stock} article${product.stock > 1 ? "s" : ""}`
                    : "Rupture de stock"}
                </p>

                {/* Quantité */}
                {product.stock > 0 && (
                  <div className="qa-qty-block">
                    <p className="qa-qty-label">Quantité</p>
                    <div className="qa-qty">
                      <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        aria-label="Diminuer"
                        disabled={qty <= 1}
                      >
                        <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                          <path d="M1 1h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <span className="qa-qty-val">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(Math.min(product.stock, qty + 1))}
                        aria-label="Augmenter"
                        disabled={qty >= product.stock}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pied : CTA + lien fiche */}
            <div className="qa-footer">
              <button
                className={`qa-add-btn ${added ? "qa-add-btn--done" : ""}`}
                onClick={handleAdd}
                disabled={product.stock <= 0 || added}
              >
                {added ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Ajouté !
                  </>
                ) : product.stock <= 0 ? (
                  "Rupture de stock"
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Ajouter au panier
                  </>
                )}
              </button>

              <Link href={`/produit/${product.id}`} className="qa-view-link" onClick={close}>
                Voir la fiche complète
                <svg width="12" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
