import Link from "next/link";

export const metadata = { title: "Solutions professionnelles - Kicksoft Studio" };

const SOLUTIONS = [
  {
    titre: "Entreprises & Bureaux",
    description: "Equipez vos equipes avec du materiel performant : postes de travail, peripheriques, accessoires de bureau et solutions de connectivite.",
    icone: "&#x1F3E2;",
    couleur: "var(--indigo)",
    usages: ["Postes informatiques", "Peripheriques", "Reseaux", "Accessoires ergonomiques"],
  },
  {
    titre: "Education & Formation",
    description: "Solutions numeriques pour les etablissements d'enseignement : tablettes, ordinateurs portables, tableaux interactifs et kits pedagogiques.",
    icone: "&#x1F393;",
    couleur: "var(--emerald)",
    usages: ["Tablettes educatives", "Portables etudiants", "Ecrans interactifs", "Kits de formation"],
  },
  {
    titre: "Commerce & Retail",
    description: "Equipements de point de vente, terminaux de paiement, systemes de gestion et solutions d'affichage dynamique.",
    icone: "&#x1F6D2;",
    couleur: "var(--amber)",
    usages: ["Terminaux POS", "Ecrans d'affichage", "Scanners", "Tiroirs-caisse"],
  },
  {
    titre: "Industrie & Logistique",
    description: "Materiel robuste pour les environnements industriels : terminaux durcis, lecteurs de codes-barres, imprimantes d'etiquettes et solutions de tracking.",
    icone: "&#x1F3ED;",
    couleur: "var(--rose)",
    usages: ["Terminaux durcis", "Lecteurs codes-barres", "Imprimantes etiquettes", "Solutions IoT"],
  },
  {
    titre: "Sante & Medical",
    description: "Solutions technologiques conformes aux normes medicales : terminaux patients, systemes de suivi, materiel de telemedecine.",
    icone: "&#x1F3E5;",
    couleur: "#0ea5e9",
    usages: ["Terminaux patients", "Telemedecine", "Suivi medical", "Materiel certifie"],
  },
  {
    titre: "Evenementiel & Media",
    description: "Equipements audio-visuels, systemes de diffusion, materiel de streaming et solutions d'eclairage pour vos evenements.",
    icone: "&#x1F3A4;",
    couleur: "#a855f7",
    usages: ["Equipement AV", "Streaming", "Eclairage", "Sonorisation"],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Solutions</span>
          </div>
          <h1>Solutions professionnelles</h1>
          <p>
            Des solutions technologiques adaptees a chaque secteur d&apos;activite.
            Decouvrez nos offres sur mesure pour les professionnels.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "var(--s6)" }}>
            {SOLUTIONS.map((sol) => (
              <article key={sol.titre} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", padding: "var(--s6)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: `${sol.couleur}08`, borderRadius: "0 0 0 120px" }}></div>
                <div style={{ fontSize: "36px", marginBottom: "var(--s4)" }} dangerouslySetInnerHTML={{ __html: sol.icone }} />
                <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--s3)", color: "var(--ink)" }}>{sol.titre}</h3>
                <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.6", marginBottom: "var(--s5)" }}>
                  {sol.description}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s2)", marginBottom: "var(--s5)" }}>
                  {sol.usages.map((u) => (
                    <span key={u} style={{ padding: "4px 10px", background: `${sol.couleur}12`, color: sol.couleur, fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", borderRadius: "999px", fontWeight: 500 }}>
                      {u}
                    </span>
                  ))}
                </div>
                <Link href="/devis" className="shop-now" style={{ color: sol.couleur }}>
                  Demander un devis
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--paper)" }}>
        <div className="container">
          <div className="newsletter">
            <div className="newsletter-grid">
              <div>
                <h2>Un projet <strong>sur mesure</strong> ?</h2>
                <p>Nos experts vous accompagnent dans le choix et la configuration de vos equipements professionnels. Devis gratuit sous 24h.</p>
              </div>
              <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center" }}>
                <Link href="/devis" className="btn btn--indigo">Demander un devis &rarr;</Link>
                <Link href="/contact" className="btn btn--ghost">Nous contacter</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
