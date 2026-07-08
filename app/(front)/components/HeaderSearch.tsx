"use client";

import { useState } from "react";
import VisualSearch from "./VisualSearch";

export default function HeaderSearch() {
  const [q, setQ] = useState("");

  return (
    <div className="header-search">
      <form className="search" role="search" action="/boutique" method="get">
        <input
          type="search"
          name="q"
          placeholder="Rechercher un produit..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
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
  );
}
