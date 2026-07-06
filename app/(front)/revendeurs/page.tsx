import Link from "next/link";

export const metadata = { title: "Revendeurs - DJI Store TN" };

export default function RevendeursPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Revendeurs</span>
          </div>
          <h1>Programme Revendeurs &amp; Partenaires</h1>
          <p>Rejoignez le reseau DJI Store TN et beneficiez de tarifs preferentiels, d&apos;un support dedie et d&apos;outils marketing.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "760px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s5)", marginBottom: "var(--s8)" }}>
            {[
              { etape: "1", titre: "Candidature", desc: "Remplissez le formulaire de candidature avec vos informations professionnelles." },
              { etape: "2", titre: "Validation", desc: "Notre equipe etudie votre dossier et vous contacte sous 48h." },
              { etape: "3", titre: "Activation", desc: "Accedez a vos tarifs revendeurs et commencez a commander." },
            ].map((e) => (
              <div key={e.etape} style={{ textAlign: "center", padding: "var(--s5)", background: "var(--bg)", borderRadius: "var(--r)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "999px", background: "var(--indigo)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: "var(--text-lg)", margin: "0 auto var(--s3)" }}>
                  {e.etape}
                </div>
                <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s2)" }}>{e.titre}</h3>
                <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.6" }}>{e.desc}</p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s4)" }}>Avantages du programme</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)", marginBottom: "var(--s8)" }}>
            {[
              "Tarifs preferentiels jusqu'a -40%",
              "Livraison prioritaire gratuite",
              "Account manager dedie",
              "Support technique prioritaire",
              "Acces aux avant-premieres produits",
              "Outils marketing co-brandes",
              "Formation produit gratuite",
              "Conditions de paiement flexibles (NET-30)",
            ].map((a) => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: "var(--s3)", padding: "var(--s3)", fontSize: "var(--text-sm)" }}>
                <span style={{ color: "var(--emerald)", fontWeight: 700 }}>&#x2713;</span>
                <span>{a}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/devis" className="btn btn--indigo" style={{ padding: "16px 32px", fontSize: "var(--text-base)" }}>
              Postuler au programme revendeurs &rarr;
            </Link>
            <p style={{ marginTop: "var(--s4)", fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
              Ou contactez-nous a <a href="mailto:revendeurs@kicksoft.studio" style={{ color: "var(--indigo)" }}>revendeurs@kicksoft.studio</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
