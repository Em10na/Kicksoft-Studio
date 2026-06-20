"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const supabase = createClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "Commande - suivi, modification ou annulation",
    message: "",
  });
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyerMessage(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    const { error } = await supabase.from("tickets_support").insert({
      subject: `[${form.subject}] ${form.firstName} ${form.lastName}`,
      message: `De: ${form.firstName} ${form.lastName}\nEmail: ${form.email}\nTel: ${form.phone}\n\n${form.message}`,
      status: "open",
    });

    if (error) {
      setErreur("Erreur lors de l'envoi : " + error.message);
    } else {
      setEnvoye(true);
    }
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span>{" "}
            <span>Contact</span>
          </div>
          <h1>Contactez-nous — nous sommes la pour vous aider.</h1>
          <p>
            Trois moyens de nous joindre : email, formulaire ou telephone.
            Nous repondons generalement sous 4 heures ouvrables.
          </p>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <div className="info-block">
                <div className="ic">&#x2709;</div>
                <div>
                  <div className="label">EMAIL</div>
                  <div className="value"><a href="mailto:contact@kicksoft.studio">contact@kicksoft.studio</a></div>
                </div>
              </div>
              <div className="info-block">
                <div className="ic">&#x260E;</div>
                <div>
                  <div className="label">TELEPHONE</div>
                  <div className="value"><a href="tel:+21612345678">+216 12 345 678</a></div>
                </div>
              </div>
              <div className="info-block">
                <div className="ic">&#x2316;</div>
                <div>
                  <div className="label">ADRESSE</div>
                  <div className="value">Tunis, Tunisie</div>
                </div>
              </div>
              <div className="info-block">
                <div className="ic">&#x23F1;</div>
                <div>
                  <div className="label">HORAIRES</div>
                  <div className="value">Lun - Ven : 08h - 18h<br />Sam : 09h - 13h</div>
                </div>
              </div>
            </div>

            {envoye ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "var(--s8)", textAlign: "center",
              }}>
                <div style={{ fontSize: "48px", marginBottom: "var(--s4)" }}>&#x2713;</div>
                <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--s2)" }}>Message envoye !</h2>
                <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)" }}>
                  Nous avons bien recu votre message et vous repondrons dans les plus brefs delais.
                </p>
                <Link href="/" className="btn btn--indigo" style={{ marginTop: "var(--s5)" }}>
                  Retour a l&apos;accueil
                </Link>
              </div>
            ) : (
              <form className="contact-form" onSubmit={envoyerMessage}>
                <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--s2)" }}>Envoyez-nous un message</h2>
                <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", marginBottom: "var(--s5)" }}>
                  Un vrai humain lira votre message et vous repondra.
                </p>

                {erreur && (
                  <p style={{ color: "var(--rose)", fontSize: "var(--text-sm)", marginBottom: "var(--s4)" }}>
                    {erreur}
                  </p>
                )}

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="c-first">Prenom</label>
                    <input id="c-first" type="text" required placeholder="Votre prenom"
                      value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="c-last">Nom</label>
                    <input id="c-last" type="text" required placeholder="Votre nom"
                      value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" required placeholder="vous@exemple.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="c-phone">Telephone (optionnel)</label>
                    <input id="c-phone" type="tel" placeholder="+216 XX XXX XXX"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="c-topic">Sujet</label>
                  <select id="c-topic" value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    <option>Commande - suivi, modification ou annulation</option>
                    <option>Retours ou remboursements</option>
                    <option>Reclamation garantie</option>
                    <option>Demande de partenariat</option>
                    <option>Autre</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="c-msg">Votre message</label>
                  <textarea id="c-msg" required placeholder="Decrivez votre demande..."
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}></textarea>
                </div>

                <button className="btn btn--indigo btn--block" type="submit"
                  style={{ padding: "16px", fontSize: "var(--text-base)", marginTop: "var(--s2)" }}>
                  Envoyer le message &rarr;
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
