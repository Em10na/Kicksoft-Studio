"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

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

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
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
    setTimeout(close, 1100);
  }

  if (!product) return null;

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div className="qa-overlay" onClick={close} aria-hidden="true" />

      {/* Drawer / bottom-sheet */}
      <div
        ref={drawerRef}
        className="qa-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Aperçu : ${product.title}`}
      >
        {/* Handle bar (mobile visual cue) */}
        <div className="qa-handle" aria-hidden="true" />

        {/* Close button */}
        <button className="qa-close" onClick={close} aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Product preview */}
        <div className="qa-product">
          <div className="qa-img">
            <img
              src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&auto=format&fit=crop"}
              alt={product.title}
            />
          </div>
          <div className="qa-meta">
            <p className="qa-title">{product.title}</p>
            <div className="qa-pricing">
              <span className="qa-price">{product.price.toFixed(2)} DT</span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className="qa-compare">{product.compare_price.toFixed(2)} DT</span>
                  <span className="qa-badge">−{discount}%</span>
                </>
              )}
            </div>
            <p className={`qa-stock ${product.stock <= 0 ? "qa-stock--out" : ""}`}>
              <span className="qa-stock-dot" />
              {product.stock > 0
                ? `En stock — ${product.stock} article${product.stock > 1 ? "s" : ""}`
                : "Rupture de stock"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="qa-actions">
          {product.stock > 0 && (
            <div className="qty qa-qty">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuer">&#x2212;</button>
              <input type="text" value={qty} readOnly inputMode="numeric" aria-label="Quantité" />
              <button type="button" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Augmenter">+</button>
            </div>
          )}

          <button
            className={`btn ${added ? "btn--emerald" : "btn--indigo"} qa-add-btn`}
            onClick={handleAdd}
            disabled={product.stock <= 0 || added}
          >
            {added
              ? "✓ Ajouté au panier !"
              : product.stock <= 0
                ? "Rupture de stock"
                : "Ajouter au panier"}
          </button>

          <Link href={`/produit/${product.id}`} className="qa-view-link" onClick={close}>
            Voir la fiche complète
            <svg width="12" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}
