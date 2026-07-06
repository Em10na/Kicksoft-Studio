"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AuthShell from "../AuthShell";

export default function ConnexionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "L'email n'est pas valide.";
    if (!motDePasse) e.motDePasse = "Le mot de passe est obligatoire.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function handleConnexion() {
    if (!valider()) return;
    setChargement(true);
    setErreur("");

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse });

    if (error) {
      setErreur("Email ou mot de passe incorrect.");
      setChargement(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role_id, roles(name)").eq("id", user.id).single();
      const roles = profile?.roles as unknown as { name: string } | null;
      const roleName = roles?.name;
      if (roleName === "admin" || roleName === "manager") {
        router.push("/admin");
      } else {
        router.push("/compte");
      }
    } else {
      router.push("/compte");
    }
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="auth-title">Bon retour !</h1>
      <p className="auth-sub">Connectez-vous pour accéder à votre espace.</p>

      {erreur && (
        <div className="auth-alert">
          <span style={{ fontSize: 16 }}>&#x26A0;</span>
          {erreur}
        </div>
      )}

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {erreurs.email && <p className="auth-error">{erreurs.email}</p>}
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
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConnexion()}
          />
          <button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Afficher le mot de passe">
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        {erreurs.motDePasse && <p className="auth-error">{erreurs.motDePasse}</p>}
      </div>

      <div className="auth-row">
        <span />
        <Link href="/auth/mot-de-passe-oublie">Mot de passe oublié ?</Link>
      </div>

      <button className="auth-submit" onClick={handleConnexion} disabled={chargement}>
        {chargement ? "Connexion..." : "Se connecter"}
      </button>

      <p className="auth-switch">
        Pas encore de compte ?{" "}
        <Link href="/auth/inscription">Créer un compte</Link>
      </p>
    </AuthShell>
  );
}
