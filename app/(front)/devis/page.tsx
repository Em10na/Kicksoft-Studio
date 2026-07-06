"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function DevisForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const produitNom = searchParams.get("produit");
  const produitRef = searchParams.get("ref");
  const produitPrix = searchParams.get("prix");
  const hasProduit = !!(produitNom && produitRef);

  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");
  const [form, setForm] = useState({
    nom: "", prenom: "", cin: "", email: "", telephone: "",
    pays: "Tunisie", ville: "", adresse: "", code_postal: "",
  });

  async function envoyerDevis(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!/^\d{8}$/.test(form.cin.trim())) {
      setErreur("Le numéro CIN doit contenir exactement 8 chiffres.");
      return;
    }
    if (!/^[+\d][\d\s.-]{7,}$/.test(form.telephone.trim())) {
      setErreur("Numéro de téléphone invalide.");
      return;
    }

    const demandeur = `${form.prenom.trim()} ${form.nom.trim()}`;
    const subject = hasProduit
      ? `[DEVIS] ${demandeur} - Particulier - Produit: ${produitNom} (${produitRef})`
      : `[DEVIS] ${demandeur} - Particulier`;
    const { error } = await supabase.from("tickets_support").insert({
      subject,
      message: [
        `Nom: ${form.nom}`,
        `Prenom: ${form.prenom}`,
        `CIN: ${form.cin}`,
        `Email: ${form.email}`,
        `Telephone: ${form.telephone}`,
        `Pays: ${form.pays}`,
        `Ville: ${form.ville}`,
        `Adresse: ${form.adresse}`,
        `Code postal: ${form.code_postal}`,
        ...(hasProduit ? ["", `Produit demandé: ${produitNom} (Ref: ${produitRef}, Prix catalogue: ${produitPrix} DT)`] : []),
      ].join("\n"),
      status: "open",
    });
    if (error) setErreur("Erreur : " + error.message);
    else setEnvoye(true);
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* Bandeau produit */}
      {hasProduit && !envoye && (
        <div style={{ padding: "var(--s4)", marginBottom: "var(--s5)", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "var(--r)", display: "flex", alignItems: "center", gap: "var(--s3)" }}>
          <span style={{ fontSize: "20px" }}>&#x1F4E6;</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Devis pour : {produitNom}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>Ref: {produitRef} | Prix catalogue: {produitPrix} DT</div>
          </div>
        </div>
      )}

      {envoye ? (
        <div style={{ textAlign: "center", padding: "var(--s8) 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "var(--s4)" }}>&#x2713;</div>
          <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--s3)" }}>Demande envoyee !</h2>
          <p style={{ color: "var(--fg-soft)" }}>Notre equipe vous repondra sous 24 heures ouvrables.</p>
          <Link href="/" className="btn btn--indigo" style={{ marginTop: "var(--s5)" }}>Retour a l&apos;accueil</Link>
        </div>
      ) : (
        <form className="contact-form" onSubmit={envoyerDevis}>
          {erreur && <p style={{ color: "var(--rose)", marginBottom: "var(--s4)" }}>{erreur}</p>}
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-nom">Nom *</label>
              <input id="d-nom" type="text" required placeholder="Votre nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="d-prenom">Prenom *</label>
              <input id="d-prenom" type="text" required placeholder="Votre prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-cin">CIN *</label>
              <input id="d-cin" type="text" required inputMode="numeric" maxLength={8} placeholder="8 chiffres" value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div className="field">
              <label htmlFor="d-email">Email *</label>
              <input id="d-email" type="email" required placeholder="vous@exemple.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-pays">Pays *</label>
              <input id="d-pays" type="text" required placeholder="Tunisie" value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="d-ville">Ville *</label>
              <input id="d-ville" type="text" required placeholder="Ex: Tunis" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-adresse">Adresse *</label>
              <input id="d-adresse" type="text" required placeholder="Rue, numero, quartier..." value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="d-cp">Code postal *</label>
              <input id="d-cp" type="text" required inputMode="numeric" maxLength={4} placeholder="Ex: 1000" value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="d-tel">Num. telephone *</label>
              <input id="d-tel" type="tel" required placeholder="+216 XX XXX XXX" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="field"></div>
          </div>
          <button className="btn btn--indigo btn--block" type="submit" style={{ padding: "16px", fontSize: "var(--text-base)", marginTop: "var(--s2)" }}>
            Envoyer la demande de devis &rarr;
          </button>
        </form>
      )}
    </div>
  );
}

export default function DevisPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Devis</span>
          </div>
          <h1>Demander un devis</h1>
          <p>Recevez une offre personnalisee sous 24h. Gratuit et sans engagement.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: "720px" }}>
          <Suspense fallback={<p style={{ textAlign: "center", color: "var(--fg-mute)" }}>Chargement...</p>}>
            <DevisForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
