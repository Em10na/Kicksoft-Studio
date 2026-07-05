"use client";

import Link from "next/link";

const SECTIONS = [
  {
    titre: "FAQ",
    description: "Gérez les questions fréquemment posées.",
    icone: "ti ti-help",
    lien: "/admin/contenu/faq",
    couleur: "#13deb9",
  },
  {
    titre: "Newsletter",
    description: "Gérez les abonnés à la newsletter.",
    icone: "ti ti-mail",
    lien: "/admin/contenu/newsletter",
    couleur: "#fa896b",
  },
];

export default function ContenuPage() {
  return (
    <div className="ak-animate">
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Gestion du contenu</h1>
          <p className="ak-page-sub">Choisissez une section à gérer</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {SECTIONS.map((s) => (
          <Link key={s.lien} href={s.lien} style={{ textDecoration: "none" }}>
            <div className="ak-card ak-card--lift" style={{ padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: s.couleur + "18",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <i className={s.icone} style={{ fontSize: 24, color: s.couleur }}></i>
              </div>
              <div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{s.titre}</h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{s.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
