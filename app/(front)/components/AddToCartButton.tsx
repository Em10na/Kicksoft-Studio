"use client";

import { useRef, useState } from "react";
import { useCart } from "@/lib/cart";

type Props = {
  product: { id: string; title: string; price: number; image_url: string | null; stock: number };
  showQty?: boolean;
};

function flyToCart(source: HTMLElement | null) {
  if (typeof window === "undefined" || !source) return;

  const cartIcon = [
    document.querySelector<HTMLElement>(".icon-btn--cart"),
    document.querySelector<HTMLElement>(".bottom-bar__item--cart"),
  ].find((el) => {
    if (!el) return false;
    const s = window.getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden";
  });
  if (!cartIcon) return;

  const sr = source.getBoundingClientRect();
  const tr = cartIcon.getBoundingClientRect();

  const sx = sr.left + sr.width  / 2;
  const sy = sr.top  + sr.height / 2;
  const ex = tr.left + tr.width  / 2;
  const ey = tr.top  + tr.height / 2;

  // Subtle arc — peaks 90px above the midpoint
  const mx = (sx + ex) / 2;
  const my = Math.min(sy, ey) - 90;

  const orb = document.createElement("div");
  orb.className = "cart-orb";
  document.body.appendChild(orb);

  orb.animate(
    [
      { transform: `translate(${sx - 6}px, ${sy - 6}px) scale(1)`,    opacity: "1"   },
      { transform: `translate(${mx - 6}px, ${my - 6}px) scale(0.9)`,  opacity: "0.9", offset: 0.44 },
      { transform: `translate(${ex - 6}px, ${ey - 6}px) scale(0.35)`, opacity: "0"   },
    ],
    { duration: 620, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
  ).onfinish = () => {
    orb.remove();
    cartIcon.classList.add("cart-bounce");
    setTimeout(() => cartIcon.classList.remove("cart-bounce"), 550);
  };
}

export default function AddToCartButton({ product, showQty = false }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    flyToCart(btnRef.current);
    setTimeout(() => setAdded(false), 1500);
  }

  if (product.stock <= 0) {
    return <button className="btn btn--ghost" disabled style={{ flex: 1, opacity: 0.5 }}>Rupture de stock</button>;
  }

  return (
    <>
      {showQty && (
        <div className="qty">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuer">&#x2212;</button>
          <input type="text" value={qty} readOnly inputMode="numeric" aria-label="Quantite" />
          <button type="button" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Augmenter">+</button>
        </div>
      )}
      <button
        ref={btnRef}
        className="btn btn--indigo"
        style={{ flex: 1, minWidth: "160px" }}
        onClick={handleAdd}
      >
        {added ? "Ajoute !" : "Ajouter au panier"} &rarr;
      </button>
    </>
  );
}
