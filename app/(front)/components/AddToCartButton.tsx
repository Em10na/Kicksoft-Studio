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

  // Start / end centers
  const sx = sr.left + sr.width / 2;
  const sy = sr.top  + sr.height / 2;
  const ex = tr.left + tr.width / 2;
  const ey = tr.top  + tr.height / 2;

  // Arc apex: midpoint horizontally, 160px above the highest of the two points
  const mx = (sx + ex) / 2;
  const my = Math.min(sy, ey) - 160;

  // The dot starts positioned at 0,0 and moves via transform
  const fly = document.createElement("div");
  fly.className = "cart-fly";
  document.body.appendChild(fly);

  // Web Animations API — three keyframes define the parabolic arc
  const anim = fly.animate(
    [
      { transform: `translate(${sx - 8}px, ${sy - 8}px) scale(1)`,   opacity: "1"   },
      { transform: `translate(${mx - 8}px, ${my - 8}px) scale(0.85)`, opacity: "1", offset: 0.42 },
      { transform: `translate(${ex - 8}px, ${ey - 8}px) scale(0.25)`, opacity: "0"  },
    ],
    { duration: 1400, easing: "cubic-bezier(0.33, 0, 0.66, 1)", fill: "forwards" }
  );

  anim.onfinish = () => {
    fly.remove();
    cartIcon.classList.add("cart-bounce");
    setTimeout(() => cartIcon.classList.remove("cart-bounce"), 750);
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
