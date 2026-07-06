import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "FAQ - DJI Store TN" };

export default async function FaqPublicPage() {
  const supabase = await createClient();
  const { data: faqs } = await supabase.from("faq").select("*").order("position", { ascending: true });

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>FAQ</span>
          </div>
          <h1>Questions frequentes</h1>
          <p>Retrouvez les reponses aux questions les plus posees. Vous ne trouvez pas votre reponse ? <Link href="/contact" style={{ color: "var(--indigo)" }}>Contactez-nous</Link>.</p>
        </div>
      </section>

      <section className="section" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: "760px" }}>
          {faqs && faqs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
              {faqs.map((faq) => (
                <article key={faq.id} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", padding: "var(--s5)" }}>
                  <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s3)", color: "var(--ink)" }}>{faq.question}</h3>
                  <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{faq.answer}</p>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "var(--fg-mute)", padding: "var(--s8) 0" }}>
              Aucune FAQ pour le moment.
            </p>
          )}

          <div style={{ textAlign: "center", marginTop: "var(--s8)" }}>
            <p style={{ color: "var(--fg-mute)", marginBottom: "var(--s4)" }}>Vous avez une autre question ?</p>
            <div style={{ display: "flex", gap: "var(--s3)", justifyContent: "center" }}>
              <Link href="/contact" className="btn btn--indigo">Nous contacter &rarr;</Link>
              <Link href="/support" className="btn btn--ghost">Support technique</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
