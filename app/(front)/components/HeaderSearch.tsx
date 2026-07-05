"use client";

import { useEffect, useRef, useState } from "react";
import VisualSearch from "./VisualSearch";

// Compact header search: a magnifier icon that opens a dropdown panel
// with the full search form (text + visual search).
export default function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={`header-search${open ? " is-open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Rechercher"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>

      <div className="header-search__panel">
        <form className="search" role="search" action="/boutique">
          <input
            ref={inputRef}
            type="text"
            name="q"
            placeholder="Rechercher des produits, marques..."
            aria-label="Rechercher"
          />
          <VisualSearch />
          <button type="submit" aria-label="Rechercher">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
