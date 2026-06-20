import Link from "next/link";

export const metadata = { title: "Politique de garantie - Kicksoft Studio" };

export default function GarantiePage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Garantie</span>
          </div>
          <h1>Politique de garantie</h1>
          <p>Tous les produits vendus par Kicksoft Studio beneficient d&apos;une couverture garantie complete.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "760px" }}>
          {[
            { titre: "Garantie standard - 2 ans", contenu: "Tous les produits neufs achetes sur Kicksoft Studio sont couverts par une garantie de 2 ans a compter de la date de livraison. Cette garantie couvre les defauts de fabrication et les pannes materielles survenant dans des conditions normales d'utilisation." },
            { titre: "Ce qui est couvert", contenu: "- Defauts de fabrication\n- Pannes materielles spontanees\n- Composants defectueux\n- Problemes de batterie (hors usure normale)" },
            { titre: "Ce qui n'est pas couvert", contenu: "- Dommages causes par une mauvaise utilisation ou negligence\n- Dommages physiques (chutes, chocs, liquides)\n- Modifications non autorisees du produit\n- Usure normale des consommables (cables, embouts)" },
            { titre: "Comment faire valoir la garantie", contenu: "1. Contactez notre support via le formulaire de contact ou par telephone\n2. Fournissez votre numero de commande et une description du probleme\n3. Notre equipe technique evaluera votre demande sous 48h\n4. Si la garantie s'applique, nous organisons la reparation ou le remplacement" },
            { titre: "Remplacement et reparation", contenu: "En cas de produit defectueux couvert par la garantie, Kicksoft Studio s'engage a reparer ou remplacer le produit sans frais supplementaires. Les frais de retour sont pris en charge par Kicksoft Studio." },
          ].map((section) => (
            <article key={section.titre} style={{ marginBottom: "var(--s7)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--s3)", color: "var(--ink)" }}>{section.titre}</h2>
              <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{section.contenu}</p>
            </article>
          ))}

          <div style={{ padding: "var(--s5)", background: "var(--bg)", borderRadius: "var(--r)", textAlign: "center" }}>
            <p style={{ marginBottom: "var(--s4)" }}>Un probleme avec un produit ?</p>
            <Link href="/contact" className="btn btn--indigo">Contacter le support &rarr;</Link>
          </div>
        </div>
      </section>
    </>
  );
}
