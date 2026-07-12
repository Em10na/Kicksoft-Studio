"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type NavItem = { href: string; icon: string; label: string; exact?: boolean };
type NavGroup = { section: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    section: "Tableau de bord",
    items: [
      { href: "/admin", icon: "ti-layout-dashboard", label: "Dashboard", exact: true },
      { href: "/admin/rapports", icon: "ti-chart-bar", label: "Rapports" },
    ],
  },
  {
    section: "Boutique",
    items: [
      { href: "/admin/produits", icon: "ti-package", label: "Produits" },
      { href: "/admin/soldes", icon: "ti-discount-2", label: "Articles soldés" },
      { href: "/admin/stock", icon: "ti-stack-2", label: "Stock" },
      { href: "/admin/categories", icon: "ti-category", label: "Catégories" },
      { href: "/admin/commandes", icon: "ti-shopping-cart", label: "Commandes" },
      { href: "/admin/devis", icon: "ti-file-invoice", label: "Devis" },
    ],
  },
  {
    section: "Clients",
    items: [
      { href: "/admin/utilisateurs", icon: "ti-users", label: "Utilisateurs" },
      { href: "/admin/fidelite", icon: "ti-star", label: "Fidélité" },
    ],
  },
  {
    section: "Contenu",
    items: [
      { href: "/admin/contenu/faq", icon: "ti-help", label: "FAQ" },
      { href: "/admin/accueil", icon: "ti-home", label: "Page accueil" },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/rapports": "Rapports de ventes",
  "/admin/produits": "Produits",
  "/admin/soldes": "Articles soldés",
  "/admin/stock": "Gestion du stock",
  "/admin/categories": "Catégories",
  "/admin/commandes": "Commandes",
  "/admin/devis": "Devis",
  "/admin/utilisateurs": "Utilisateurs",
  "/admin/fidelite": "Fidélité",
  "/admin/contenu/faq": "FAQ",
  "/admin/accueil": "Page accueil",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("full_name").eq("id", user.id).single()
        .then(({ data }) => { if (data?.full_name) setAdminName(data.full_name); });
    });
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const currentTitle = PAGE_TITLES[pathname] ?? "Admin";
  const initials = adminName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <link rel="stylesheet" href="/assets/css/admin-theme.css" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;600&display=swap" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <div className="admin-shell">
        {/* Backdrop mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 99, backdropFilter: "blur(2px)" }}
          />
        )}

        {/* Sidebar */}
        <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Logo */}
          <div className="admin-sidebar__logo">
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <img
                src="/assets/images/logos/logo-store.png"
                alt="DJI Store TN"
                style={{ height: 42, width: "auto", filter: "invert(1)" }}
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="admin-sidebar__nav">
            {NAV.map((group) => (
              <div key={group.section} className="admin-sidebar__section">
                <div className="admin-sidebar__section-label">{group.section}</div>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-nav-item${isActive(item.href, item.exact) ? " active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <i className={`ti ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}

            <div className="admin-sidebar__section" style={{ marginTop: 8 }}>
              <div className="admin-sidebar__section-label">Boutique</div>
              <Link href="/" className="admin-nav-item" target="_blank">
                <i className="ti ti-external-link"></i>
                <span>Voir la boutique</span>
              </Link>
              <Link href="/api/auth/signout" className="admin-nav-item admin-nav-item--danger">
                <i className="ti ti-logout"></i>
                <span>Déconnexion</span>
              </Link>
            </div>
          </nav>

          {/* User */}
          <div className="admin-sidebar__footer">
            <div className="admin-sidebar__user">
              <div className="admin-sidebar__avatar">{initials}</div>
              <div className="admin-sidebar__user-info">
                <div className="admin-sidebar__user-name">{adminName}</div>
                <div className="admin-sidebar__user-role">Administrateur</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="admin-main">
          {/* Header */}
          <header className="admin-header">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: "none", padding: 8, borderRadius: 8, border: "none", background: "var(--a-bg)", cursor: "pointer", fontSize: 20, color: "var(--a-ink)" }}
              className="admin-mobile-toggle"
            >
              <i className="ti ti-menu-2"></i>
            </button>
            <div className="admin-header__title">{currentTitle}</div>
            <div className="admin-header__actions">
              <Link
                href="/"
                target="_blank"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  background: "var(--a-indigo, #4f46e5)", color: "#fff",
                  fontWeight: 700, fontSize: 13, textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <i className="ti ti-world"></i>
                Voir le site
              </Link>
            </div>
          </header>

          <style>{`
            @media (max-width: 768px) {
              .admin-mobile-toggle { display: flex !important; }
              .admin-header { padding: 0 14px; gap: 10px; }
              .admin-header__title { font-size: 13px; }
            }
          `}</style>

          {/* Content */}
          <main className="admin-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
