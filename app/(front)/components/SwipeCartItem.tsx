"use client";

import { useRef } from "react";

const SNAP = 82; // largeur du panneau supprimer

export default function SwipeCartItem({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentOffset = useRef(0);
  const isOpen = useRef(false);

  function applyOffset(px: number, animate = false) {
    if (!contentRef.current) return;
    contentRef.current.style.transition = animate ? "transform 0.22s cubic-bezier(.25,.8,.25,1)" : "none";
    contentRef.current.style.transform = `translateX(${px}px)`;
    currentOffset.current = px;
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    if (contentRef.current) contentRef.current.style.transition = "none";
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const base = isOpen.current ? -SNAP : 0;
    const next = Math.max(-SNAP, Math.min(0, base + dx));
    applyOffset(next);
  }

  function onTouchEnd() {
    if (currentOffset.current < -SNAP / 2) {
      applyOffset(-SNAP, true);
      isOpen.current = true;
    } else {
      applyOffset(0, true);
      isOpen.current = false;
    }
  }

  function handleDelete() {
    applyOffset(0, true);
    isOpen.current = false;
    onDelete();
  }

  return (
    <div className="swipe-wrapper">
      {/* Panneau rouge révélé par le glissement */}
      <button className="swipe-delete-btn" onClick={handleDelete} aria-label="Supprimer cet article">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19,6l-1,14a2 2 0 01-2 2H8a2 2 0 01-2-2L5,6" />
          <path d="M10,11v6M14,11v6M9,6V4h6v2" />
        </svg>
        Supprimer
      </button>

      {/* Contenu glissable */}
      <div
        ref={contentRef}
        className="swipe-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
