"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function MotDePasseOubliePage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "L'email n'est pas valide.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!valider()) return;
    setChargement(true);
    setErreur("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reinitialiser-mot-de-passe`,
    });

    if (error) {
      setErreur("Erreur : " + error.message);
      setChargement(false);
      return;
    }

    setEnvoye(true);
    setChargement(false);
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
          {envoye ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "28px" }}>
                &#x2709;
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>Email envoye !</h2>
              <p style={{ fontSize: "14px", color: "#4B5563", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                Si un compte est associe a <strong style={{ color: "#111827" }}>{email}</strong>, vous recevrez un lien de reinitialisation dans quelques instants.
              </p>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "1.5rem" }}>
                Pensez a verifier vos spams si vous ne recevez rien.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button onClick={() => { setEnvoye(false); setEmail(""); }}
                  style={{ width: "100%", padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                  Essayer avec un autre email
                </button>
                <Link href="/auth/connexion" style={{ width: "100%", padding: "12px", background: "#4F46E5", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "block", boxSizing: "border-box" }}>
                  Retour a la connexion
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <div style={{ width: "64px", height: "64px", background: "#EEF2FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "28px" }}>
                  &#x1F512;
                </div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Mot de passe oublie ?</h2>
                <p style={{ fontSize: "14px", color: "#4B5563" }}>
                  Pas de panique ! Entrez votre email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
                </p>
              </div>

              {erreur && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>&#x26A0;</span>
                  {erreur}
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Adresse email</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x2709;</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com"
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    style={{ width: "100%", padding: "12px 14px 12px 40px", border: `1.5px solid ${erreurs.email ? "#dc2626" : "#E5E7EB"}`, borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = erreurs.email ? "#dc2626" : "#4F46E5"}
                    onBlur={(e) => e.target.style.borderColor = erreurs.email ? "#dc2626" : "#E5E7EB"} />
                </div>
                {erreurs.email && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.email}</p>}
              </div>

              {/* Submit */}
              <button onClick={handleReset} disabled={chargement}
                style={{ width: "100%", padding: "14px", background: chargement ? "#818CF8" : "#4F46E5", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: chargement ? "not-allowed" : "pointer", transition: "background 0.2s", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
                {chargement ? "Envoi en cours..." : "Envoyer le lien de reinitialisation"}
              </button>

              {/* Back to login */}
              <p style={{ textAlign: "center", fontSize: "14px", color: "#374151", marginTop: "1.75rem" }}>
                <Link href="/auth/connexion" style={{ color: "#4F46E5", fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  &#x2190; Retour a la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
