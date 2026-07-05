"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MENU = [
  {
    label: "Tableau de bord",
    href: "/compte",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Mon profil",
    href: "/compte/profil",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Mes commandes",
    href: "/compte/commandes",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
      </svg>
    ),
  },
  {
    label: "Mes favoris",
    href: "/compte/favoris",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: "Fidélité",
    href: "/compte/fidelite",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    label: "Support",
    href: "/compte/support",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    label: "Paramètres",
    href: "/compte/parametres",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
  },
];

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [identite, setIdentite] = useState({ nom: "", email: "" });
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // Sans nom de profil : un nom lisible dérivé de l'email ("emna.omri@..." → "Emna Omri")
      const depuisEmail = (user.email ?? "")
        .split("@")[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      setIdentite({ nom: depuisEmail || "Mon compte", email: user.email ?? "" });
      supabase.from("profiles").select("*").eq("id", user.id).single()
        .then(({ data }) => {
          if (data?.full_name) setIdentite({ nom: data.full_name, email: user.email ?? "" });
          const av = (data as { avatar_url?: string | null } | null)?.avatar_url;
          if (av) setAvatar(av);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initiales = (identite.nom || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <section className="section">
      <div className="container">
        <div className="account-grid">
          {/* Sidebar */}
          <nav className="account-nav" aria-label="Mon compte">
            <div className="account-nav__user">
              <div className="account-nav__avatar">
                {avatar ? <img src={avatar} alt={identite.nom} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : initiales}
              </div>
              <div className="account-nav__id">
                <div className="account-nav__name">{identite.nom || "Mon compte"}</div>
                <div className="account-nav__email">{identite.email}</div>
              </div>
            </div>

            {MENU.map((item) => {
              const actif = pathname === item.href || (item.href !== "/compte" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`account-nav__link${actif ? " is-active" : ""}`}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}

            <div className="account-nav__sep" />
            <a href="/api/auth/signout" className="account-nav__link account-nav__link--logout">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </a>
          </nav>

          {/* Contenu */}
          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
