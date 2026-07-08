"use client";

import { useRef, useState } from "react";
import { useCart } from "@/lib/cart";

type Props = {
  product: { id: string; title: string; price: number; image_url: string | null; stock: number };
  showQty?: boolean;
};

const PARTICLE_COLORS = ["#4f46e5", "#818cf8", "#6366f1", "#a5b4fc", "#7c3aed", "#c4b5fd"];

function flyToCart(source: HTMLElement | null, _imageUrl: string | null) {
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

  const ox = sr.left + sr.width  / 2;
  const oy = sr.top  + sr.height / 2;
  const ex = tr.left + tr.width  / 2;
  const ey = tr.top  + tr.height / 2;

  const COUNT = 8;
  let done = 0;

  for (let i = 0; i < COUNT; i++) {
    const size = 7 + Math.random() * 7;           // 7–14 px
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];

    // Each particle bursts outward slightly before arcing to the cart
    const burstAngle = (i / COUNT) * Math.PI * 2;
    const burstR     = 24 + Math.random() * 20;
    const bx = ox + Math.cos(burstAngle) * burstR - size / 2;
    const by = oy + Math.sin(burstAngle) * burstR - size / 2;

    // Arc apex: each particle takes a slightly different path
    const spread = (Math.random() - 0.5) * 120;
    const mx = (bx + ex) / 2 + spread;
    const my = Math.min(by, ey) - 100 - Math.random() * 80;

    const p = document.createElement("div");
    p.className = "cart-particle";
    p.style.cssText = `width:${size}px;height:${size}px;background:${color};border-radius:50%;`;
    document.body.appendChild(p);

    const delay = i * 40; // stagger 40ms per particle

    const anim = p.animate(
      [
        { transform: `translate(${ox - size/2}px, ${oy - size/2}px) scale(0)`, opacity: "0",   offset: 0     },
        { transform: `translate(${bx}px,          ${by}px)          scale(1)`, opacity: "1",   offset: 0.18  },
        { transform: `translate(${mx}px,          ${my}px)          scale(0.85)`, opacity: "0.85", offset: 0.55 },
        { transform: `translate(${ex - size/2}px, ${ey - size/2}px) scale(0.2)`, opacity: "0"                 },
      ],
      { duration: 900 + Math.random() * 200, delay, easing: "ease-in", fill: "forwards" }
    );

    anim.onfinish = () => {
      p.remove();
      done++;
      if (done === COUNT) {
        cartIcon.classList.add("cart-bounce");
        setTimeout(() => cartIcon.classList.remove("cart-bounce"), 750);
      }
    };
  }
}

export default function AddToCartButton({ product, showQty = false }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    flyToCart(btnRef.current, product.image_url);
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
