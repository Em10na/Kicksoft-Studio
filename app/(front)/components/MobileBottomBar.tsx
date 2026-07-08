"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartCount from "./CartCount";

export default function MobileBottomBar() {
  const pathname = usePathname();

  function actif(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    const base = href.split("?")[0];
    return pathname.startsWith(base) && base !== "/";
  }

  return (
    <nav className="bottom-bar" aria-label="Navigation rapide">
      {/* Accueil */}
      <Link href="/" className={`bottom-bar__item${pathname === "/" ? " is-active" : ""}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
        </svg>
        <span>Accueil</span>
      </Link>

      {/* Catégories */}
      <Link href="/boutique" className={`bottom-bar__item${actif("/boutique") ? " is-active" : ""}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span>Catégories</span>
      </Link>

      {/* Soldes */}
      <Link href="/boutique?soldes=true" className={`bottom-bar__item bottom-bar__item--soldes`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <span>Soldes</span>
      </Link>

      {/* Compte */}
      <Link href="/compte" className={`bottom-bar__item${actif("/compte") ? " is-active" : ""}`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
        <span>Compte</span>
      </Link>

      {/* Panier */}
      <Link href="/panier" className={`bottom-bar__item bottom-bar__item--cart${actif("/panier") ? " is-active" : ""}`}>
        <span style={{ position: "relative", display: "inline-flex" }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" />
            <path d="M4 7h16" />
            <path d="M16 11a4 4 0 0 1-8 0" />
          </svg>
          <CartCount />
        </span>
        <span>Panier</span>
      </Link>
    </nav>
  );
}
