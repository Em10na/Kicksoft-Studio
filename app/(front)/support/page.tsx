import Link from "next/link";

export const metadata = { title: "Support - Kicksoft Studio" };

export default function SupportPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Support</span>
          </div>
          <h1>Centre de support</h1>
          <p>Trouvez de l&apos;aide rapidement : FAQ, suivi de commande, retours, garantie et contact direct.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--s5)" }}>
            {[
              { titre: "Suivi de commande", desc: "Suivez l'etat de votre commande en temps reel.", lien: "/contact", icone: "&#x1F4E6;", cta: "Suivre ma commande" },
              { titre: "Retours & Remboursements", desc: "Retours gratuits sous 30 jours. Procede simple et rapide.", lien: "/contact", icone: "&#x21BA;", cta: "Initier un retour" },
              { titre: "Garantie", desc: "Tous nos produits beneficient d'une garantie minimum de 2 ans.", lien: "/garantie", icone: "&#x1F6E1;", cta: "Voir la politique" },
              { titre: "FAQ", desc: "Les reponses aux questions les plus frequemment posees.", lien: "/faq", icone: "&#x2753;", cta: "Consulter la FAQ" },
              { titre: "Contact direct", desc: "Parlez a un humain : email, telephone ou formulaire en ligne.", lien: "/contact", icone: "&#x1F4AC;", cta: "Nous contacter" },
              { titre: "Documentation technique", desc: "Fiches techniques, guides d'utilisation et manuels produits.", lien: "/boutique", icone: "&#x1F4D6;", cta: "Voir les produits" },
            ].map((item) => (
              <article key={item.titre} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", padding: "var(--s6)" }}>
                <div style={{ fontSize: "32px", marginBottom: "var(--s3)" }} dangerouslySetInnerHTML={{ __html: item.icone }} />
                <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s2)" }}>{item.titre}</h3>
                <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.6", marginBottom: "var(--s4)" }}>{item.desc}</p>
                <Link href={item.lien} className="shop-now" style={{ color: "var(--indigo)" }}>
                  {item.cta}
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </article>
            ))}
          </div>

          <div style={{ marginTop: "var(--s8)", padding: "var(--s6)", background: "linear-gradient(135deg, var(--indigo), #7c3aed)", borderRadius: "var(--r-lg)", color: "white", textAlign: "center" }}>
            <h2 style={{ color: "white", fontSize: "var(--text-2xl)", marginBottom: "var(--s3)" }}>Besoin d&apos;aide urgente ?</h2>
            <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: "var(--s5)" }}>Notre equipe est disponible du lundi au vendredi, 08h-18h.</p>
            <div style={{ display: "flex", gap: "var(--s3)", justifyContent: "center" }}>
              <Link href="/contact" className="btn btn--paper">Nous contacter &rarr;</Link>
              <a href="tel:+21612345678" className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
                +216 12 345 678
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
