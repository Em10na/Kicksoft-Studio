"use client";

import Link from "next/link";

export default function PanierPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span>{" "}
            <span>Panier</span>
          </div>
          <h1>Votre panier</h1>
          <p>Consultez vos articles et passez commande.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cart-layout">
            <div>
              <div className="cart-list">
                <p style={{ textAlign: "center", color: "var(--fg-mute)", padding: "var(--s8) 0" }}>
                  Votre panier est vide.{" "}
                  <Link href="/boutique" style={{ color: "var(--indigo)", fontWeight: 600 }}>
                    Decouvrir nos produits
                  </Link>
                </p>
              </div>

              <div style={{ marginTop: "var(--s5)", display: "flex", gap: "var(--s3)", flexWrap: "wrap" }}>
                <Link href="/boutique" className="btn btn--ghost">&larr; Continuer les achats</Link>
              </div>

              <div style={{
                marginTop: "var(--s7)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "var(--s4)",
                padding: "var(--s5)",
                background: "var(--bg)",
                borderRadius: "var(--r)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <div style={{
                    width: "40px", height: "40px",
                    background: "var(--indigo-soft)", color: "var(--indigo)",
                    borderRadius: "999px", display: "grid", placeItems: "center", fontSize: "18px",
                  }}>&#x26A1;</div>
                  <div>
                    <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-sm)" }}>
                      Livraison rapide
                    </div>
                    <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
                      2 - 3 jours ouvrables
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <div style={{
                    width: "40px", height: "40px",
                    background: "var(--indigo-soft)", color: "var(--indigo)",
                    borderRadius: "999px", display: "grid", placeItems: "center", fontSize: "18px",
                  }}>&#x21BA;</div>
                  <div>
                    <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-sm)" }}>
                      Retours gratuits
                    </div>
                    <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
                      Sous 30 jours
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <div style={{
                    width: "40px", height: "40px",
                    background: "var(--indigo-soft)", color: "var(--indigo)",
                    borderRadius: "999px", display: "grid", placeItems: "center", fontSize: "18px",
                  }}>&#x2605;</div>
                  <div>
                    <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-sm)" }}>
                      Garantie 2 ans
                    </div>
                    <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
                      Sur chaque commande
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="cart-summary">
              <h3>Recapitulatif</h3>

              <div className="cart-line">
                <span>Sous-total</span>
                <span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, color: "var(--ink)" }}>0 DT</span>
              </div>
              <div className="cart-line">
                <span>Livraison</span>
                <span style={{ color: "var(--emerald)", fontWeight: 600 }}>Gratuite</span>
              </div>
              <div className="cart-line is-total">
                <span>Total</span>
                <span>0 DT</span>
              </div>

              <button className="btn btn--indigo btn--block" disabled>
                Passer la commande &rarr;
              </button>

              <p style={{
                marginTop: "var(--s5)", fontSize: "11px",
                fontFamily: "var(--ff-mono)", color: "var(--fg-mute)",
                textAlign: "center", lineHeight: "1.6",
              }}>
                Paiement securise SSL. Vos informations ne sont jamais stockees.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
