"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AuthShell from "../AuthShell";

export default function InscriptionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cgvOk, setCgvOk] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState("");
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", motDePasse: "", confirmation: "" });

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = "Le nom complet est obligatoire.";
    else if (form.nom.trim().length < 2) e.nom = "Le nom doit contenir au moins 2 caractères.";
    if (!form.email.trim()) e.email = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "L'email n'est pas valide.";
    if (!form.motDePasse) e.motDePasse = "Le mot de passe est obligatoire.";
    else if (form.motDePasse.length < 6) e.motDePasse = "Le mot de passe doit contenir au moins 6 caractères.";
    if (form.motDePasse !== form.confirmation) e.confirmation = "Les mots de passe ne correspondent pas.";
    if (form.telephone && !/^[+\d\s()-]{6,20}$/.test(form.telephone)) e.telephone = "Le numéro de téléphone n'est pas valide.";
    if (!cgvOk) e.cgv = "Vous devez accepter les CGV.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function handleInscription() {
    if (!valider()) return;
    setChargement(true);
    setErreurGlobale("");

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.motDePasse,
    });

    if (error) {
      setErreurGlobale(error.message === "User already registered" ? "Un compte existe déjà avec cet email." : "Erreur : " + error.message);
      setChargement(false);
      return;
    }

    if (data.user) {
      const { data: clientRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "client")
        .single();

      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.nom.trim(),
        phone: form.telephone.trim() || null,
        role_id: clientRole?.id ?? null,
      });

      await supabase.from("loyalty_transactions").insert({
        user_id: data.user.id,
        points: 50,
        type: "earn",
        description: "Bonus de bienvenue - creation de compte",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    router.push("/compte");
    router.refresh();
  }

  const forceCouleur = form.motDePasse.length >= 10 ? "#10B981" : form.motDePasse.length >= 6 ? "#F59E0B" : "#EF4444";

  return (
    <AuthShell>
      <h1 className="auth-title">Créer un compte</h1>
      <p className="auth-sub">Rejoignez DJI Store TN en quelques secondes.</p>

      {erreurGlobale && (
        <div className="auth-alert">
          <span style={{ fontSize: 16 }}>&#x26A0;</span>
          {erreurGlobale}
        </div>
      )}

      {/* Nom */}
      <div className="auth-field">
        <div className="auth-field__wrap">
          <span className="auth-field__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          </span>
          <input
            className={`auth-input${erreurs.nom ? " auth-input--error" : ""}`}
            type="text"
            placeholder="nom complet"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
          />
        </div>
        {erreurs.nom && <p className="auth-error">{erreurs.nom}</p>}
      </div>

      {/* Email */}
      <div className="auth-field">
        <div className="auth-field__wrap">
          <span className="auth-field__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" />
            </svg>
          </span>
          <input
            className={`auth-input${erreurs.email ? " auth-input--error" : ""}`}
            type="email"
            placeholder="e-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        {erreurs.email && <p className="auth-error">{erreurs.email}</p>}
      </div>

      {/* Téléphone */}
      <div className="auth-field">
        <div className="auth-field__wrap">
          <span className="auth-field__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <input
            className={`auth-input${erreurs.telephone ? " auth-input--error" : ""}`}
            type="tel"
            placeholder="téléphone (optionnel)"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
          />
        </div>
        {erreurs.telephone && <p className="auth-error">{erreurs.telephone}</p>}
      </div>

      {/* Mot de passe */}
      <div className="auth-field">
        <div className="auth-field__wrap">
          <span className="auth-field__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            className={`auth-input${erreurs.motDePasse ? " auth-input--error" : ""}`}
            style={{ paddingRight: 48 }}
            type={showPassword ? "text" : "password"}
            placeholder="mot de passe"
            value={form.motDePasse}
            onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
          />
          <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher le mot de passe">
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        {form.motDePasse && (
          <div className="auth-strength">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: form.motDePasse.length >= i * 3 ? forceCouleur : "#e5e7eb" }} />
            ))}
          </div>
        )}
        {erreurs.motDePasse && <p className="auth-error">{erreurs.motDePasse}</p>}
      </div>

      {/* Confirmation */}
      <div className="auth-field">
        <div className="auth-field__wrap">
          <span className="auth-field__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            className={`auth-input${erreurs.confirmation ? " auth-input--error" : ""}`}
            type="password"
            placeholder="confirmer le mot de passe"
            value={form.confirmation}
            onChange={(e) => setForm({ ...form, confirmation: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleInscription()}
          />
          {form.confirmation && form.confirmation === form.motDePasse && (
            <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", color: "#10B981", fontWeight: 700 }}>&#x2713;</span>
          )}
        </div>
        {erreurs.confirmation && <p className="auth-error">{erreurs.confirmation}</p>}
      </div>

      {/* CGV */}
      <label className="auth-check">
        <input type="checkbox" checked={cgvOk} onChange={(e) => setCgvOk(e.target.checked)} />
        <span>
          J&apos;accepte les <Link href="/cgv" target="_blank">conditions générales de vente</Link>
        </span>
      </label>
      {erreurs.cgv && <p className="auth-error" style={{ marginTop: -10, marginBottom: 12 }}>{erreurs.cgv}</p>}

      <button className="auth-submit" onClick={handleInscription} disabled={chargement}>
        {chargement ? "Création..." : "Créer mon compte"}
      </button>

      <div className="auth-perks">
        {["Livraison gratuite dès 50 DT", "Retours gratuits sous 30 jours", "50 points fidélité offerts"].map((txt) => (
          <div key={txt} className="auth-perk"><span>&#x2713;</span>{txt}</div>
        ))}
      </div>

      <p className="auth-switch">
        Déjà un compte ?{" "}
        <Link href="/auth/connexion">Se connecter</Link>
      </p>
    </AuthShell>
  );
}
