"use client";

const SECTIONS = [
  {
    titre: "Pages statiques",
    description: "Gerez les pages comme A propos, CGV, Politique de confidentialite...",
    icone: "ti ti-file-text",
    lien: "/admin/contenu/pages",
    couleur: "#5d87ff",
  },
  {
    titre: "Blog",
    description: "Redigez et publiez des articles de blog.",
    icone: "ti ti-writing",
    lien: "/admin/contenu/blog",
    couleur: "#49beff",
  },
  {
    titre: "FAQ",
    description: "Gerez les questions frequemment posees.",
    icone: "ti ti-help",
    lien: "/admin/contenu/faq",
    couleur: "#13deb9",
  },
  {
    titre: "Support",
    description: "Consultez et gerez les tickets de support client.",
    icone: "ti ti-headset",
    lien: "/admin/contenu/support",
    couleur: "#ffae1f",
  },
  {
    titre: "Newsletter",
    description: "Gerez les abonnes a la newsletter.",
    icone: "ti ti-mail",
    lien: "/admin/contenu/newsletter",
    couleur: "#fa896b",
  },
];

export default function ContenuPage() {
  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="mb-4">
        <h5 className="fw-semibold mb-1">Gestion du contenu</h5>
        <p className="mb-0 text-muted">
          Choisissez une section a gerer
        </p>
      </div>

      {/* Grille de sections */}
      <div className="row g-4">
        {SECTIONS.map((s) => (
          <div key={s.lien} className="col-md-6 col-lg-4">
            <a href={s.lien} className="text-decoration-none">
              <div className="card h-100" style={{ cursor: "pointer" }}>
                <div className="card-body d-flex align-items-start gap-3">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      background: s.couleur + "15",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={s.icone}
                      style={{ fontSize: "24px", color: s.couleur }}
                    ></i>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1 text-dark">{s.titre}</h6>
                    <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                      {s.description}
                    </p>
                  </div>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
