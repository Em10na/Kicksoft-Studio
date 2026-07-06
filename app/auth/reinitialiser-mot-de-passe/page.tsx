"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ReinitialiserMotDePassePage() {
  const supabase = createClient();
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!motDePasse) e.motDePasse = "Le nouveau mot de passe est obligatoire.";
    else if (motDePasse.length < 6) e.motDePasse = "Le mot de passe doit contenir au moins 6 caracteres.";
    if (motDePasse !== confirmation) e.confirmation = "Les mots de passe ne correspondent pas.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!valider()) return;
    setChargement(true);
    setErreur("");

    const { error } = await supabase.auth.updateUser({ password: motDePasse });

    if (error) {
      setErreur("Erreur : " + error.message);
      setChargement(false);
      return;
    }

    setSucces(true);
    setChargement(false);
    setTimeout(() => {
      router.push("/auth/connexion");
    }, 3000);
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
            <span style={{ fontSize: "26px", fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>DJI STORE TN</span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}>
          {succes ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "28px" }}>
                &#x2713;
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>Mot de passe modifie !</h2>
              <p style={{ fontSize: "14px", color: "#4B5563", marginBottom: "1.5rem" }}>
                Votre mot de passe a ete reinitialise avec succes. Vous allez etre redirige vers la page de connexion.
              </p>
              <Link href="/auth/connexion" style={{ width: "100%", padding: "14px", background: "#4F46E5", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, textDecoration: "none", textAlign: "center", display: "block", boxSizing: "border-box" }}>
                Se connecter maintenant
              </Link>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <div style={{ width: "64px", height: "64px", background: "#EEF2FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "28px" }}>
                  &#x1F511;
                </div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Nouveau mot de passe</h2>
                <p style={{ fontSize: "14px", color: "#4B5563" }}>
                  Choisissez un nouveau mot de passe securise pour votre compte.
                </p>
              </div>

              {erreur && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>&#x26A0;</span>
                  {erreur}
                </div>
              )}

              {/* New password */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Nouveau mot de passe</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x1F512;</span>
                  <input type={showPassword ? "text" : "password"} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Minimum 6 caracteres"
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
                {motDePasse && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: motDePasse.length >= i * 3 ? (motDePasse.length >= 10 ? "#10B981" : motDePasse.length >= 6 ? "#F59E0B" : "#EF4444") : "#E5E7EB" }}></div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Confirmer le nouveau mot de passe</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x1F512;</span>
                  <input type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Retapez le mot de passe"
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    style={{ width: "100%", padding: "12px 14px 12px 40px", border: `1.5px solid ${erreurs.confirmation ? "#dc2626" : "#E5E7EB"}`, borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = erreurs.confirmation ? "#dc2626" : "#4F46E5"}
                    onBlur={(e) => e.target.style.borderColor = erreurs.confirmation ? "#dc2626" : "#E5E7EB"} />
                  {confirmation && confirmation === motDePasse && (
                    <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#10B981", fontSize: "16px" }}>&#x2713;</span>
                  )}
                </div>
                {erreurs.confirmation && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.confirmation}</p>}
              </div>

              {/* Submit */}
              <button onClick={handleReset} disabled={chargement}
                style={{ width: "100%", padding: "14px", background: chargement ? "#818CF8" : "#4F46E5", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: chargement ? "not-allowed" : "pointer", transition: "background 0.2s", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
                {chargement ? "Modification en cours..." : "Reinitialiser le mot de passe"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
