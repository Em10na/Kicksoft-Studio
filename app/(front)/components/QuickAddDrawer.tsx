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
    flyOrb();
    setTimeout(close, 1100);
  }

  function flyOrb() {
    const btn = drawerRef.current?.querySelector(".qa-add-btn") as HTMLElement | null;
    const cart = (
      document.querySelector(".bottom-bar__item--cart") ||
      document.querySelector('[href="/panier"].icon-btn')
    ) as HTMLElement | null;
    if (!btn || !cart) return;

    const from = btn.getBoundingClientRect();
    const to   = cart.getBoundingClientRect();
    const orb  = document.createElement("div");

    Object.assign(orb.style, {
      position: "fixed",
      width: "15px", height: "15px",
      borderRadius: "50%",
      background: "#4f46e5",
      boxShadow: "0 0 10px rgba(79,70,229,0.7)",
      zIndex: "9999",
      pointerEvents: "none",
      left: `${from.left + from.width / 2 - 7.5}px`,
      top:  `${from.top  + from.height / 2 - 7.5}px`,
    });
    document.body.appendChild(orb);

    const dx  = to.left + to.width  / 2 - (from.left + from.width  / 2);
    const dy  = to.top  + to.height / 2 - (from.top  + from.height / 2);
    const arc = Math.min(Math.abs(dy) * 0.5, 90);

    orb.animate([
      { transform: "translate(0,0) scale(1)", opacity: "1" },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - arc}px) scale(0.65)`, opacity: "0.85", offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(0.15)`, opacity: "0" },
    ], { duration: 620, easing: "cubic-bezier(.4,0,.2,1)" }).onfinish = () => orb.remove();
  }

  if (!product) return null;

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

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
        {/* Handle drag (mobile) */}
        <div className="qa-handle" aria-hidden="true" />

        {/* Image carrée + close + compteur */}
        <div className="qa-img">
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop"}
            alt={product.title}
          />
          <button className="qa-close" onClick={close} aria-label="Fermer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <span className="qa-counter">1 / 1</span>
        </div>

        {/* Info produit scrollable */}
        <div className="qa-scroll">
          <div className="qa-body">
            <p className="qa-title">{product.title}</p>

            {/* Prix */}
            <div className="qa-pricing">
              {product.compare_price && product.compare_price > product.price && (
                <div className="qa-pricing-top">
                  <span className="qa-compare">{product.compare_price.toFixed(2)} DT</span>
                  <span className="qa-badge">−{discount}%</span>
                </div>
              )}
              <span className="qa-price">{product.price.toFixed(2)} DT</span>
            </div>

            {/* Stock */}
            <p className={`qa-stock ${product.stock <= 0 ? "qa-stock--out" : ""}`}>
              <span className="qa-stock-dot" />
              {product.stock > 0
                ? `En stock — ${product.stock} article${product.stock > 1 ? "s" : ""}`
                : "Rupture de stock"}
            </p>

            {/* Quantité */}
            {product.stock > 0 && (
              <div className="qa-actions">
                <div className="qty qa-qty">
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuer">&#x2212;</button>
                  <input type="text" value={qty} readOnly inputMode="numeric" aria-label="Quantité" />
                  <button type="button" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Augmenter">+</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied fixe : bouton + lien fiche */}
        <div className="qa-footer">
          <button
            className={`btn ${added ? "btn--emerald" : "btn--indigo"} qa-add-btn`}
            onClick={handleAdd}
            disabled={product.stock <= 0 || added}
          >
            {added ? "✓ Ajouté au panier !" : product.stock <= 0 ? "Rupture de stock" : "Ajouter au panier"}
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
