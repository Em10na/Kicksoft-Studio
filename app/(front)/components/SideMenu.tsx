"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/cart";

// Menu latéral du site — carte blanche flottante (style app moderne) :
// recherche, sections avec badges, bloc utilisateur avec menu en bas.

type NavItem = { href: string; icon: React.ReactNode; label: string; badge?: number; exact?: boolean };

function Icon({ d, extra }: { d: string; extra?: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {extra}
    </svg>
  );
}

export default function SideMenu() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [recherche, setRecherche] = useState("");
  const pathname = usePathname();
  const { count: cartCount } = useCart();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", u.id).single();
      setUser({ name: data?.full_name ?? "Mon compte", email: u.email ?? "" });
    });
  }, []);

  // Fermeture avec Échap + blocage du scroll quand ouvert
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  // Fermer à chaque navigation
  useEffect(() => { setOpen(false); setUserMenuOpen(false); }, [pathname]);

  const GROUPS: { section: string; items: NavItem[] }[] = [
    {
      section: "Navigation",
      items: [
        { href: "/", label: "Accueil", exact: true, icon: <Icon d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /> },
        { href: "/boutique", label: "Boutique", icon: <Icon d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" extra={<><path d="M4 7h16" /><path d="M16 11a4 4 0 0 1-8 0" /></>} /> },
        { href: "/boutique?tri=recent", label: "Nouveautés", icon: <Icon d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 13.8 2 9.2h7.6z" /> },
        { href: "/comparer", label: "Comparer", icon: <Icon d="M9 3v18M15 3v18M3 9h18M3 15h18" /> },
      ],
    },
    {
      section: "Mon espace",
      items: [
        { href: "/panier", label: "Panier", badge: cartCount, icon: <Icon d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" extra={<path d="M4 7h16" />} /> },
        { href: "/compte/favoris", label: "Mes favoris", icon: <Icon d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /> },
        { href: "/compte/commandes", label: "Mes commandes", icon: <Icon d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" extra={<rect x="8" y="2" width="8" height="4" rx="1" />} /> },
        { href: "/compte/fidelite", label: "Fidélité", icon: <Icon d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 13.8 2 9.2h7.6z" /> },
      ],
    },
    {
      section: "Aide",
      items: [
        { href: "/faq", label: "FAQ", icon: <Icon d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" extra={<><circle cx="12" cy="12" r="10" /><path d="M12 17h.01" /></>} /> },
        { href: "/support", label: "Support", icon: <Icon d="M18 8a6 6 0 0 0-12 0v7h12z" extra={<path d="M3 15a2 2 0 0 0 2 2h1v-4H5a2 2 0 0 0-2 2zm18 0a2 2 0 0 1-2 2h-1v-4h1a2 2 0 0 1 2 2z" />} /> },
        { href: "/contact", label: "Contact", icon: <Icon d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" extra={<path d="M22 6l-10 7L2 6" />} /> },
        { href: "/a-propos", label: "À propos", icon: <Icon d="M12 16v-4M12 8h.01" extra={<circle cx="12" cy="12" r="10" />} /> },
      ],
    },
  ];

  const q = recherche.trim().toLowerCase();
  const groupes = q
    ? GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) })).filter((g) => g.items.length > 0)
    : GROUPS;

  function isActive(href: string, exact?: boolean) {
    const base = href.split("?")[0];
    if (exact) return pathname === base;
    return pathname.startsWith(base) && base !== "/";
  }

  const initials = (user?.name ?? "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // Icônes du rail mobile (navigation rapide, colonne flottante)
  const RAIL: { href: string; label: string; icon: React.ReactNode; badge?: number; exact?: boolean }[] = [
    { href: "/", label: "Accueil", exact: true, icon: <Icon d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /> },
    { href: "/boutique", label: "Boutique", icon: <Icon d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" extra={<><path d="M4 7h16" /><path d="M16 11a4 4 0 0 1-8 0" /></>} /> },
    { href: "/panier", label: "Panier", badge: cartCount, icon: <Icon d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" extra={<path d="M4 7h16" />} /> },
    { href: "/compte/favoris", label: "Favoris", icon: <Icon d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /> },
    { href: "/compte", label: "Compte", icon: <Icon d="M4 21c0-4 4-7 8-7s8 3 8 7" extra={<circle cx="12" cy="8" r="4" />} /> },
  ];

  return (
    <>
      <button className="icon-btn" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Rail d'icônes — mobile uniquement */}
      <div className="smenu-rail" aria-label="Navigation rapide">
        <button className="smenu-rail__item" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="smenu-rail__sep" />
        {RAIL.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className={`smenu-rail__item${isActive(r.href, r.exact) ? " is-active" : ""}`}
            aria-label={r.label}
            title={r.label}
          >
            {r.icon}
            {(r.badge ?? 0) > 0 && <span className="smenu-rail__badge">{r.badge! > 9 ? "9+" : r.badge}</span>}
          </Link>
        ))}
      </div>

      {open && <div className="smenu-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`smenu${open ? " is-open" : ""}`} aria-hidden={!open}>
        {/* En-tête */}
        <div className="smenu__head">
          <Link href="/" className="smenu__brand">
            <img src="/assets/images/logos/logo-store.png" alt="" className="smenu__brand-logo" />
            <span className="smenu__brand-text">
              DJI Store TN
              <small>Boutique en ligne</small>
            </span>
          </Link>
          <button className="smenu__close" aria-label="Fermer le menu" onClick={() => setOpen(false)}>✕</button>
        </div>

        {/* Recherche */}
        <form className="smenu__search" action="/boutique">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input name="q" placeholder="Rechercher un produit..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </form>

        {/* Navigation */}
        <nav className="smenu__nav">
          {groupes.map((g) => (
            <div key={g.section} className="smenu__section">
              <div className="smenu__section-label">{g.section}</div>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className={`smenu__item${isActive(it.href, it.exact) ? " is-active" : ""}`}>
                  {it.icon}
                  <span>{it.label}</span>
                  {(it.badge ?? 0) > 0 && <span className="smenu__badge">{it.badge}</span>}
                </Link>
              ))}
            </div>
          ))}
          {groupes.length === 0 && <p className="smenu__empty">Aucun résultat — <Link href={`/boutique?q=${encodeURIComponent(recherche)}`}>chercher « {recherche} » dans la boutique</Link></p>}
        </nav>

        {/* Pied : utilisateur */}
        <div className="smenu__foot">
          {userMenuOpen && user && (
            <div className="smenu__user-menu">
              <Link href="/compte" className="smenu__user-menu-item">
                <Icon d="M4 21c0-4 4-7 8-7s8 3 8 7" extra={<circle cx="12" cy="8" r="4" />} /> Mon compte
              </Link>
              <Link href="/compte/commandes" className="smenu__user-menu-item">
                <Icon d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" extra={<rect x="8" y="2" width="8" height="4" rx="1" />} /> Mes commandes
              </Link>
              <Link href="/api/auth/signout" className="smenu__user-menu-item smenu__user-menu-item--danger">
                <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /> Déconnexion
              </Link>
            </div>
          )}
          {user ? (
            <button className="smenu__user" onClick={() => setUserMenuOpen((o) => !o)} aria-expanded={userMenuOpen}>
              <span className="smenu__avatar">{initials}</span>
              <span className="smenu__user-info">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: userMenuOpen ? "rotate(180deg)" : undefined, transition: "transform .2s" }}>
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
          ) : (
            <Link href="/auth/connexion" className="smenu__user smenu__user--guest">
              <span className="smenu__avatar smenu__avatar--guest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              </span>
              <span className="smenu__user-info">
                <strong>Se connecter</strong>
                <small>Compte, commandes, fidélité</small>
              </span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
