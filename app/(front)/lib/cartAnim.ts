"use client";

// Finds the visible cart icon — desktop header OR mobile bottom bar
function findCart(): HTMLElement | null {
  return (
    [
      document.querySelector<HTMLElement>(".icon-btn--cart"),
      document.querySelector<HTMLElement>(".bottom-bar__item--cart"),
    ].find((el) => {
      if (!el) return false;
      const s = window.getComputedStyle(el);
      return s.display !== "none" && s.visibility !== "hidden";
    }) ?? null
  );
}

// 8 sparkle dots burst outward from (cx, cy)
function burst(cx: number, cy: number) {
  const COLORS = ["#818cf8", "#a78bfa", "#c4b5fd", "#60a5fa", "#e0e7ff", "#fff", "#6366f1", "#a5b4fc"];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
    const r = 28 + Math.random() * 22;
    const size = 3 + Math.random() * 5;
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed",
      left: `${cx - size / 2}px`,
      top: `${cy - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: COLORS[i],
      pointerEvents: "none",
      zIndex: "9999",
    });
    document.body.appendChild(el);
    el.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: "1" },
        { transform: `translate(${Math.cos(angle) * r}px,${Math.sin(angle) * r}px) scale(0)`, opacity: "0" },
      ],
      { duration: 360 + Math.random() * 160, easing: "ease-out" }
    ).onfinish = () => el.remove();
  }
}

// Expanding ring at cart icon position on arrival
function ring(cx: number, cy: number) {
  const SIZE = 30;
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    left: `${cx - SIZE / 2}px`,
    top: `${cy - SIZE / 2}px`,
    width: `${SIZE}px`,
    height: `${SIZE}px`,
    borderRadius: "50%",
    border: "2.5px solid rgba(99,102,241,0.8)",
    pointerEvents: "none",
    zIndex: "9998",
  });
  document.body.appendChild(el);
  el.animate(
    [
      { transform: "scale(0.3)", opacity: "1" },
      { transform: "scale(3)",   opacity: "0" },
    ],
    { duration: 540, easing: "ease-out" }
  ).onfinish = () => el.remove();
}

// Shimmer sweep across the source button
function shimmer(btn: HTMLElement) {
  const r = btn.getBoundingClientRect();
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    borderRadius: getComputedStyle(btn).borderRadius || "10px",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "9999",
  });
  const shine = document.createElement("div");
  Object.assign(shine.style, {
    position: "absolute",
    inset: "0",
    background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.38) 50%, transparent 70%)",
    transform: "translateX(-100%)",
  });
  el.appendChild(shine);
  document.body.appendChild(el);
  shine.animate(
    [{ transform: "translateX(-100%)" }, { transform: "translateX(200%)" }],
    { duration: 560, easing: "ease-in-out" }
  ).onfinish = () => el.remove();
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Call this from any "Add to cart" handler. sourceEl = the button element.
export function launchCartAnim(sourceEl: HTMLElement) {
  if (typeof window === "undefined") return;
  const cart = findCart();
  if (!cart) return;

  const sr = sourceEl.getBoundingClientRect();
  const tr = cart.getBoundingClientRect();
  const sx = sr.left + sr.width  / 2;
  const sy = sr.top  + sr.height / 2;
  const ex = tr.left + tr.width  / 2;
  const ey = tr.top  + tr.height / 2;

  // Arc control point — peaks above the midpoint
  const arcH = Math.min(Math.abs(ey - sy) * 0.55, 115);
  const mx   = (sx + ex) / 2;
  const my   = Math.min(sy, ey) - arcH;

  // Shimmer on the button + sparkle burst at origin
  shimmer(sourceEl);
  burst(sx, sy);

  // Main orb + 3 trailing ghost orbs (comet tail)
  const CONFIG = [
    { size: 18, alpha: 1.00, dur: 680, delay: 0   },
    { size: 12, alpha: 0.55, dur: 600, delay: 72  },
    { size:  8, alpha: 0.33, dur: 530, delay: 138 },
    { size:  5, alpha: 0.18, dur: 460, delay: 196 },
  ];

  CONFIG.forEach(({ size, alpha, dur, delay }, i) => {
    const isMain = i === 0;
    setTimeout(() => {
      const orb = document.createElement("div");
      orb.className = "cart-orb";
      if (!isMain) {
        orb.style.width  = `${size}px`;
        orb.style.height = `${size}px`;
        orb.style.background = `radial-gradient(circle at 35% 30%, #c7d2fe, #6366f1 70%)`;
        orb.style.boxShadow = `0 0 ${size + 4}px ${Math.ceil(size / 2)}px rgba(99,102,241,${(alpha * 0.6).toFixed(2)})`;
      }
      document.body.appendChild(orb);

      const h = size / 2;
      const anim = orb.animate(
        [
          { transform: `translate(${sx - h}px,${sy - h}px) scale(1)`,    opacity: String(alpha) },
          { transform: `translate(${mx - h}px,${my - h}px) scale(${isMain ? 0.82 : 0.60})`, opacity: String(alpha * 0.75), offset: 0.44 },
          { transform: `translate(${ex - h}px,${ey - h}px) scale(0.1)`,  opacity: "0" },
        ],
        { duration: dur, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)" }
      );
      anim.onfinish = () => {
        orb.remove();
        if (isMain) {
          ring(ex, ey);
          cart.classList.add("cart-bounce", "cart-glow");
          setTimeout(() => cart.classList.remove("cart-bounce", "cart-glow"), 720);
        }
      };
    }, delay);
  });
}
