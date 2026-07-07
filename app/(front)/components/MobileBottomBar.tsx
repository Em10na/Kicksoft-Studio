"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WHATSAPP_URL } from "@/lib/site-config";

// Barre de navigation fixée en bas de l'écran — mobile uniquement.
// Complète le header (menu / profil / panier) sans doublon :
// Accueil · Boutique · WhatsApp · Favoris

export default function MobileBottomBar() {
  const pathname = usePathname();

  const items = [
    {
      href: "/", label: "Accueil", exact: true,
      icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></svg>,
    },
    {
      href: "/boutique", label: "Boutique",
      icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" /><path d="M4 7h16" /><path d="M16 11a4 4 0 0 1-8 0" /></svg>,
    },
    {
      href: WHATSAPP_URL, label: "WhatsApp", external: true, whatsapp: true,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.51 14.93L2 22l5.2-1.49A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.88.9-3-.2-.31a8.2 8.2 0 1 1 6.88 3.76zm4.5-6.14c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.45-1.37-1.7-.14-.24-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.16 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.6.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.2-.57.2-1.06.14-1.17-.06-.1-.22-.16-.47-.28z" /></svg>,
    },
    {
      href: "/compte/favoris", label: "Favoris",
      icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    },
  ];

  function actif(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== "/";
  }

  return (
    <nav className="bottom-bar" aria-label="Navigation rapide">
      {items.map((it) =>
        it.external ? (
          <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer" className={`bottom-bar__item${it.whatsapp ? " bottom-bar__item--wa" : ""}`}>
            {it.icon}
            <span>{it.label}</span>
          </a>
        ) : (
          <Link key={it.label} href={it.href} className={`bottom-bar__item${actif(it.href, it.exact) ? " is-active" : ""}`}>
            {it.icon}
            <span>{it.label}</span>
          </Link>
        )
      )}
    </nav>
  );
}
