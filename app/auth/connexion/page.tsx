"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "42px", height: "42px", background: "#4F46E5", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: "18px" }}>K</span>
            </div>
            <span style={{ fontSize: "26px", fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>KICKSOFT</span>
          </Link>
          <p style={{ color: "#374151", marginTop: "0.75rem", fontSize: "15px" }}>Connectez-vous a votre espace</p>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", color: "#111827" }}>Bon retour !</h2>
          <p style={{ fontSize: "14px", color: "#4B5563", marginBottom: "1.75rem" }}>Entrez vos identifiants pour acceder a votre compte.</p>

          {erreur && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>&#x26A0;</span>
              {erreur}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Adresse email</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x2709;</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com"
                style={{ width: "100%", padding: "12px 14px 12px 40px", border: `1.5px solid ${erreurs.email ? "#dc2626" : "#E5E7EB"}`, borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = erreurs.email ? "#dc2626" : "#4F46E5"}
                onBlur={(e) => e.target.style.borderColor = erreurs.email ? "#dc2626" : "#E5E7EB"} />
            </div>
            {erreurs.email && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.email}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>Mot de passe</label>
              <Link href="/auth/mot-de-passe-oublie" style={{ fontSize: "12px", color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}>
                Mot de passe oublie ?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x1F512;</span>
              <input type={showPassword ? "text" : "password"} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Votre mot de passe"
                onKeyDown={(e) => e.key === "Enter" && handleConnexion()}
                style={{ width: "100%", padding: "12px 44px 12px 40px", border: `1.5px solid ${erreurs.motDePasse ? "#dc2626" : "#E5E7EB"}`, borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = erreurs.motDePasse ? "#dc2626" : "#4F46E5"}
                onBlur={(e) => e.target.style.borderColor = erreurs.motDePasse ? "#dc2626" : "#E5E7EB"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: "0", display: "flex" }}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {erreurs.motDePasse && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.motDePasse}</p>}
          </div>

          {/* Submit */}
          <button onClick={handleConnexion} disabled={chargement}
            style={{ width: "100%", padding: "14px", background: chargement ? "#818CF8" : "#4F46E5", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: chargement ? "not-allowed" : "pointer", marginTop: "1rem", transition: "background 0.2s", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>

          {/* Separator */}
          <div style={{ display: "flex", alignItems: "center", margin: "1.75rem 0", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }}></div>
            <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>OU</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }}></div>
          </div>

          {/* Inscription link */}
          <p style={{ textAlign: "center", fontSize: "14px", color: "#374151" }}>
            Pas encore de compte ?{" "}
            <Link href="/auth/inscription" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Creer un compte gratuitement</Link>
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "#6B7280", marginTop: "1.5rem" }}>
          En vous connectant, vous acceptez nos{" "}
          <Link href="/cgv" style={{ color: "#4F46E5", textDecoration: "none" }}>CGV</Link>{" "}
          et notre{" "}
          <Link href="/garantie" style={{ color: "#4F46E5", textDecoration: "none" }}>politique de garantie</Link>.
        </p>
      </div>
    </div>
  );
}
