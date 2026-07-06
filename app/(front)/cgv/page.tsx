import Link from "next/link";

export const metadata = { title: "CGV - DJI Store TN" };

export default function CgvPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>CGV</span>
          </div>
          <h1>Conditions Generales de Vente</h1>
          <p>Dernieres mise a jour : Juin 2026</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "760px" }}>
          {[
            { titre: "1. Objet", contenu: "Les presentes conditions generales de vente (CGV) regissent les ventes de produits effectuees par DJI Store TN a travers son site web. Toute commande implique l'acceptation sans reserve de ces CGV." },
            { titre: "2. Prix", contenu: "Les prix sont indiques en Dinars Tunisiens (DT) toutes taxes comprises. DJI Store TN se reserve le droit de modifier ses prix a tout moment, les produits etant factures au prix en vigueur au moment de la commande." },
            { titre: "3. Commandes", contenu: "La validation d'une commande constitue un contrat de vente entre le client et DJI Store TN. Un email de confirmation est envoye a l'adresse fournie par le client." },
            { titre: "4. Livraison", contenu: "Les livraisons sont effectuees a l'adresse indiquee par le client. Les delais de livraison sont donnes a titre indicatif (generalement 2-5 jours ouvrables). La livraison est gratuite pour toute commande superieure a 50 DT." },
            { titre: "5. Droit de retour", contenu: "Le client dispose d'un delai de 30 jours a compter de la reception pour retourner un produit, dans son emballage d'origine et en parfait etat. Les frais de retour sont pris en charge par DJI Store TN." },
            { titre: "6. Garantie", contenu: "Tous les produits beneficient d'une garantie de 2 ans minimum. Consultez notre politique de garantie complete pour plus de details." },
            { titre: "7. Protection des donnees", contenu: "Les informations collectees sont necessaires au traitement des commandes et ne sont jamais transmises a des tiers. Conformement a la loi, vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees." },
            { titre: "8. Litiges", contenu: "Les presentes CGV sont soumises au droit tunisien. En cas de litige, une solution amiable sera recherchee avant toute action judiciaire." },
          ].map((section) => (
            <article key={section.titre} style={{ marginBottom: "var(--s6)" }}>
              <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s2)", color: "var(--ink)" }}>{section.titre}</h2>
              <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.8" }}>{section.contenu}</p>
            </article>
          ))}

          <div style={{ marginTop: "var(--s6)", paddingTop: "var(--s5)", borderTop: "1px solid var(--rule)", display: "flex", gap: "var(--s3)" }}>
            <Link href="/garantie" className="btn btn--ghost">Politique de garantie</Link>
            <Link href="/contact" className="btn btn--ghost">Nous contacter</Link>
          </div>
        </div>
      </section>
    </>
  );
}
