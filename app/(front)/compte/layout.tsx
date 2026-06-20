"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { label: "Tableau de bord", href: "/compte", icone: "&#x1F4CA;" },
  { label: "Mon profil", href: "/compte/profil", icone: "&#x1F464;" },
  { label: "Mes commandes", href: "/compte/commandes", icone: "&#x1F4E6;" },
  { label: "Mes favoris", href: "/compte/favoris", icone: "&#x2764;" },
  { label: "Support", href: "/compte/support", icone: "&#x1F4AC;" },
  { label: "Parametres", href: "/compte/parametres", icone: "&#x2699;" },
];

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "var(--s6)", alignItems: "start" }}>
          {/* Sidebar */}
          <nav style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", padding: "var(--s4)", position: "sticky", top: "var(--s5)" }}>
            <div style={{ padding: "var(--s3) var(--s4)", marginBottom: "var(--s3)", fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-md)" }}>
              Mon compte
            </div>
            {MENU.map((item) => {
              const actif = pathname === item.href || (item.href !== "/compte" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: "var(--s3)",
                  padding: "10px var(--s4)", borderRadius: "var(--r)",
                  textDecoration: "none", fontSize: "var(--text-sm)",
                  color: actif ? "var(--indigo)" : "var(--fg-soft)",
                  background: actif ? "var(--indigo-soft, #eef2ff)" : "transparent",
                  fontWeight: actif ? 600 : 400,
                  marginBottom: "2px",
                }}>
                  <span dangerouslySetInnerHTML={{ __html: item.icone }} />
                  {item.label}
                </Link>
              );
            })}
            <div style={{ borderTop: "1px solid var(--rule)", marginTop: "var(--s3)", paddingTop: "var(--s3)" }}>
              <a href="/api/auth/signout" style={{
                display: "flex", alignItems: "center", gap: "var(--s3)",
                padding: "10px var(--s4)", borderRadius: "var(--r)",
                textDecoration: "none", fontSize: "var(--text-sm)", color: "var(--rose)",
              }}>
                <span>&#x1F6AA;</span> Deconnexion
              </a>
            </div>
          </nav>

          {/* Contenu */}
          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
