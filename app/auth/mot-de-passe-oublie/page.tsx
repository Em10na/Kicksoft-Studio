"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// Durée du blocage après un rate limit (en secondes)
const COOLDOWN_SECS = 120;

function MotDePasseOublieContenu() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [cooldown, setCooldown] = useState(0); // secondes restantes avant réessai

  // Si le callback a renvoyé une erreur (lien invalide/expiré)
  useEffect(() => {
    if (searchParams.get("erreur") === "lien_invalide") {
      setErreur("Ce lien de réinitialisation est invalide ou a expiré. Faites une nouvelle demande.");
    }
  }, [searchParams]);

  // Décompte du cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function formatCooldown(secs: number) {
    const m = Math.floor(secs / 60);
    const s = String(secs % 60).padStart(2, "0");
    return m > 0 ? `${m}:${s}` : `${secs}s`;
  }

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "L'email n'est pas valide.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!valider() || cooldown > 0) return;
    setChargement(true);
    setErreur("");

    // redirectTo → callback qui échange le code PKCE puis redirige vers le reset
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reinitialiser-mot-de-passe`,
    });

    if (error) {
      const isRateLimit = /rate.?limit|too many/i.test(error.message) || (error as { status?: number }).status === 429;
      if (isRateLimit) {
        setErreur(`Trop de tentatives envoyées. Patientez ${formatCooldown(COOLDOWN_SECS)} avant de réessayer.`);
        setCooldown(COOLDOWN_SECS);
      } else {
        setErreur("Une erreur est survenue. Vérifiez l'adresse email et réessayez.");
      }
      setChargement(false);
      return;
    }

    setEnvoye(true);
    setChargement(false);
  }

  const btnDisabled = chargement || cooldown > 0;
  const btnLabel = cooldown > 0
    ? `Réessayer dans ${formatCooldown(cooldown)}`
    : chargement
      ? "Envoi en cours..."
      : "Envoyer le lien de réinitialisation";

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
            /* ── Vue : email envoyé ── */
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", background: "#ECFDF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "28px" }}>
                &#x2709;
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>Email envoyé !</h2>
              <p style={{ fontSize: "14px", color: "#4B5563", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                Si un compte est associé à <strong style={{ color: "#111827" }}>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "1.5rem" }}>
                Pensez à vérifier vos spams si vous ne recevez rien.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={() => { setEnvoye(false); setEmail(""); }}
                  style={{ width: "100%", padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
                >
                  Essayer avec un autre email
                </button>
                <Link
                  href="/auth/connexion"
                  style={{ width: "100%", padding: "12px", background: "#4F46E5", color: "white", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none", textAlign: "center", display: "block", boxSizing: "border-box" }}
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          ) : (
            /* ── Vue : formulaire ── */
            <>
              <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <div style={{ width: "64px", height: "64px", background: "#EEF2FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "28px" }}>
                  &#x1F512;
                </div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Mot de passe oublié ?</h2>
                <p style={{ fontSize: "14px", color: "#4B5563" }}>
                  Entrez votre email admin et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {/* Erreur */}
              {erreur && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: "1.5" }}>
                  <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>&#x26A0;</span>
                  <span>{erreur}</span>
                </div>
              )}

              {/* Barre de progression cooldown */}
              {cooldown > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ height: "4px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: "#4F46E5",
                        borderRadius: "4px",
                        width: `${(cooldown / COOLDOWN_SECS) * 100}%`,
                        transition: "width 1s linear",
                      }}
                    />
                  </div>
                  <p style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
                    Prochain envoi possible dans <strong>{formatCooldown(cooldown)}</strong>
                  </p>
                </div>
              )}

              {/* Champ email */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
                  Adresse email
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x2709;</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@exemple.com"
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    disabled={btnDisabled}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 40px",
                      border: `1.5px solid ${erreurs.email ? "#dc2626" : "#E5E7EB"}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                      color: "#111827",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                      opacity: btnDisabled ? 0.6 : 1,
                    }}
                    onFocus={(e) => { if (!btnDisabled) e.target.style.borderColor = erreurs.email ? "#dc2626" : "#4F46E5"; }}
                    onBlur={(e) => { e.target.style.borderColor = erreurs.email ? "#dc2626" : "#E5E7EB"; }}
                  />
                </div>
                {erreurs.email && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.email}</p>}
              </div>

              {/* Bouton */}
              <button
                onClick={handleReset}
                disabled={btnDisabled}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: btnDisabled ? "#a5b4fc" : "#4F46E5",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: btnDisabled ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  boxShadow: btnDisabled ? "none" : "0 2px 8px rgba(79,70,229,0.3)",
                }}
              >
                {btnLabel}
              </button>

              {/* Retour connexion */}
              <p style={{ textAlign: "center", fontSize: "14px", color: "#374151", marginTop: "1.75rem" }}>
                <Link href="/auth/connexion" style={{ color: "#4F46E5", fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  &#x2190; Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// useSearchParams force le rendu client de l'arbre jusqu'à la Suspense la plus
// proche : sans cette frontière, le prerender de la page échoue au build.
// Le fallback reprend le fond de la page pour éviter un flash blanc.
export default function MotDePasseOubliePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)" }} />
      }
    >
      <MotDePasseOublieContenu />
    </Suspense>
  );
}
