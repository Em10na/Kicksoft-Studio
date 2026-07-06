import Link from "next/link";

export const metadata = { title: "A propos - DJI Store TN" };

export default function AProposPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>A propos</span>
          </div>
          <h1>A propos de DJI Store TN</h1>
          <p>Votre partenaire technologique de confiance, depuis la Tunisie vers le monde.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "760px" }}>
          <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s4)" }}>Notre mission</h2>
          <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-base)", lineHeight: "1.8", marginBottom: "var(--s6)" }}>
            DJI Store TN a ete fonde avec une vision simple : rendre la technologie de qualite accessible a tous — particuliers comme professionnels. Nous selectionnons rigoureusement chaque produit pour garantir qualite, fiabilite et rapport qualite-prix.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--s5)", marginBottom: "var(--s8)" }}>
            {[
              { chiffre: "1000+", label: "Produits disponibles" },
              { chiffre: "24h", label: "Livraison rapide" },
              { chiffre: "2 ans", label: "Garantie minimum" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: "var(--s6)", background: "var(--bg)", borderRadius: "var(--r)" }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--indigo)" }}>{s.chiffre}</div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)", marginTop: "var(--s2)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s4)" }}>Nos valeurs</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s5)", marginBottom: "var(--s8)" }}>
            {[
              { titre: "Qualite", desc: "Chaque produit est teste et certifie avant d'etre propose a la vente." },
              { titre: "Transparence", desc: "Prix clairs, pas de frais caches. Ce que vous voyez est ce que vous payez." },
              { titre: "Support reactif", desc: "Notre equipe repond sous 4 heures ouvrables, en francais et en arabe." },
              { titre: "Innovation", desc: "Nous suivons les dernieres tendances pour vous proposer le meilleur de la tech." },
            ].map((v) => (
              <article key={v.titre} style={{ padding: "var(--s5)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)" }}>
                <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s2)" }}>{v.titre}</h3>
                <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.6" }}>{v.desc}</p>
              </article>
            ))}
          </div>

          <div style={{ display: "flex", gap: "var(--s3)" }}>
            <Link href="/contact" className="btn btn--indigo">Nous contacter &rarr;</Link>
            <Link href="/revendeurs" className="btn btn--ghost">Devenir revendeur</Link>
          </div>
        </div>
      </section>
    </>
  );
}
