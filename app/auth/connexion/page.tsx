"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import AuthShell from "../AuthShell";

/* ─── icônes SVG réutilisables ────────────────────────────────────────────── */
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
  </svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.63 12 19.79 19.79 0 0 1 1.56 3.38 2 2 0 0 1 3.54 1.21h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
  </svg>
);

/* ─── composant champ générique ───────────────────────────────────────────── */
function Field({
  icon, type = "text", placeholder, value, onChange, error, onKeyDown, rightSlot,
}: {
  icon: React.ReactNode; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  error?: string; onKeyDown?: (e: React.KeyboardEvent) => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14, textAlign: "left" }}>
      <div style={{ position: "relative" }}>
        <input
          className={`auth-input${error ? " auth-input--error" : ""}`}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ paddingRight: rightSlot ? 48 : 16 }}
        />
        {rightSlot}
      </div>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

/* ─── barre de force mot de passe ────────────────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = password.length >= 10 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1;
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#10b981"];
  const labels = ["", "Très faible", "Faible", "Moyen", "Fort"];
  return (
    <div style={{ marginTop: -8, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : "#e5e7eb",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score], fontWeight: 600, textAlign: "right" }}>{labels[score]}</p>
    </div>
  );
}

/* ─── page principale ─────────────────────────────────────────────────────── */
export default function ConnexionPage() {
  const supabase = createClient();
  const router   = useRouter();

  /* onglet actif */
  const [onglet, setOnglet] = useState<"login" | "signup">("login");

  /* ── état LOGIN ── */
  const [loginEmail, setLoginEmail]     = useState("");
  const [loginPwd,   setLoginPwd]       = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginErr,   setLoginErr]       = useState("");
  const [loginErrs,  setLoginErrs]      = useState<Record<string,string>>({});
  const [loginLoad,  setLoginLoad]      = useState(false);

  /* ── état SIGNUP ── */
  const [nom,         setNom]         = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [telephone,   setTelephone]   = useState("");
  const [signupPwd,   setSignupPwd]   = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showSPwd,    setShowSPwd]    = useState(false);
  const [showCPwd,    setShowCPwd]    = useState(false);
  const [signupErr,   setSignupErr]   = useState("");
  const [signupOk,    setSignupOk]    = useState("");
  const [signupErrs,  setSignupErrs]  = useState<Record<string,string>>({});
  const [signupLoad,  setSignupLoad]  = useState(false);

  /* ──────────────── LOGIN ──────────────── */
  function validerLogin() {
    const e: Record<string,string> = {};
    if (!loginEmail.trim()) e.email = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) e.email = "Email invalide.";
    if (!loginPwd) e.pwd = "Le mot de passe est obligatoire.";
    setLoginErrs(e);
    return !Object.keys(e).length;
  }

  async function handleLogin() {
    if (!validerLogin()) return;
    setLoginLoad(true); setLoginErr("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(), password: loginPwd,
    });
    if (error) { setLoginErr("Email ou mot de passe incorrect."); setLoginLoad(false); return; }
    // Redirection selon le rôle : admin/manager → /admin, client → /compte
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const { data: profile } = await supabase.from("profiles").select("roles(name)").eq("id", u.id).single();
      // PostgREST peut retourner un tableau ou un objet selon le type de relation
      const rolesRaw = profile?.roles;
      const roles = (Array.isArray(rolesRaw) ? rolesRaw[0] : rolesRaw) as { name: string } | null | undefined;
      const role = roles?.name;
      router.push(role && role !== "client" ? "/admin" : "/compte");
    } else {
      router.push("/compte");
    }
    router.refresh();
  }

  /* ──────────────── SIGNUP ──────────────── */
  function validerSignup() {
    const e: Record<string,string> = {};
    if (!nom.trim())           e.nom    = "Le nom complet est obligatoire.";
    else if (nom.trim().length < 2) e.nom = "Au moins 2 caractères.";
    if (!signupEmail.trim())   e.email  = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) e.email = "Email invalide.";
    if (!signupPwd)            e.pwd    = "Le mot de passe est obligatoire.";
    else if (signupPwd.length < 6) e.pwd = "6 caractères minimum.";
    if (signupPwd !== confirmPwd)  e.confirm = "Les mots de passe ne correspondent pas.";
    if (telephone && !/^[+\d\s().-]{6,20}$/.test(telephone)) e.tel = "Numéro invalide.";
    setSignupErrs(e);
    return !Object.keys(e).length;
  }

  async function handleSignup() {
    if (!validerSignup()) return;
    setSignupLoad(true); setSignupErr(""); setSignupOk("");

    /* 1. Créer le compte Supabase Auth */
    const { data, error: authErr } = await supabase.auth.signUp({
      email: signupEmail.trim(), password: signupPwd,
    });
    if (authErr) {
      setSignupErr(
        authErr.message === "User already registered"
          ? "Un compte existe déjà avec cet email."
          : "Erreur : " + authErr.message
      );
      setSignupLoad(false); return;
    }

    /* 2. Upsert du profil */
    if (data.user) {
      await supabase.from("profiles").upsert({
        id:        data.user.id,
        full_name: nom.trim(),
        phone:     telephone.trim() || null,
      });
    }

    /* 3. Connexion directe et redirection */
    const { error: loginErr2 } = await supabase.auth.signInWithPassword({
      email: signupEmail.trim(), password: signupPwd,
    });
    if (loginErr2) {
      setSignupOk("Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.");
      setSignupLoad(false); setOnglet("login"); return;
    }
    // Nouveaux inscrits = clients par défaut → espace client
    router.push("/compte"); router.refresh();
  }

  /* ─── rendu ────────────────────────────────────────────────────────────── */
  return (
    <AuthShell>
      {/* ─── Onglets ─── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 24,
        background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4,
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setOnglet(tab); setLoginErr(""); setSignupErr(""); setSignupOk(""); }}
            style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 9,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              transition: "all 0.22s",
              background: onglet === tab ? "rgba(255,255,255,0.1)" : "transparent",
              color:      onglet === tab ? "#f1f5f9" : "#64748b",
              boxShadow:  onglet === tab ? "inset 0 0 0 1px rgba(255,255,255,0.12)" : "none",
            }}
          >
            {tab === "login" ? "Se connecter" : "Créer un profil"}
          </button>
        ))}
      </div>

      {/* ══════════════════ ÉCRAN LOGIN ══════════════════ */}
      {onglet === "login" && (
        <>
          <h1 className="auth-title">Espace administrateur</h1>
          <p className="auth-sub">Connectez-vous pour accéder au tableau de bord.</p>

          {loginErr && (
            <div className="auth-alert">
              <span style={{ fontSize: 16 }}>&#x26A0;</span>{loginErr}
            </div>
          )}

          <Field
            icon={<IconMail />} type="email" placeholder="Adresse e-mail"
            value={loginEmail} onChange={setLoginEmail} error={loginErrs.email}
          />
          <Field
            icon={<IconLock />} type={showLoginPwd ? "text" : "password"}
            placeholder="Mot de passe"
            value={loginPwd} onChange={setLoginPwd}
            error={loginErrs.pwd}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            rightSlot={
              <button type="button" className="auth-eye" onClick={() => setShowLoginPwd(!showLoginPwd)}>
                {showLoginPwd ? <EyeOff /> : <EyeOpen />}
              </button>
            }
          />

          <div className="auth-row">
            <span />
            <Link href="/auth/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          </div>

          <button className="auth-submit" onClick={handleLogin} disabled={loginLoad}>
            {loginLoad ? "Connexion…" : "Se connecter"}
          </button>
        </>
      )}

      {/* ══════════════════ ÉCRAN SIGNUP ══════════════════ */}
      {onglet === "signup" && (
        <>
          <h1 className="auth-title">Créer un profil</h1>
          <p className="auth-sub">Renseignez vos informations pour créer votre compte.</p>

          {signupErr && (
            <div className="auth-alert">
              <span style={{ fontSize: 16 }}>&#x26A0;</span>{signupErr}
            </div>
          )}
          {signupOk && (
            <div style={{
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
              color: "#6ee7b7", fontSize: 13, borderRadius: 12,
              padding: "11px 14px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 8, textAlign: "left",
            }}>
              <span style={{ fontSize: 16 }}>✓</span>{signupOk}
            </div>
          )}

          {/* Nom complet */}
          <Field
            icon={<IconUser />} placeholder="Nom complet"
            value={nom} onChange={setNom} error={signupErrs.nom}
          />

          {/* Email */}
          <Field
            icon={<IconMail />} type="email" placeholder="Adresse e-mail"
            value={signupEmail} onChange={setSignupEmail} error={signupErrs.email}
          />

          {/* Téléphone */}
          <Field
            icon={<IconPhone />} type="tel" placeholder="Téléphone (optionnel)"
            value={telephone} onChange={setTelephone} error={signupErrs.tel}
          />

          {/* Mot de passe */}
          <div>
            <Field
              icon={<IconLock />} type={showSPwd ? "text" : "password"}
              placeholder="Mot de passe"
              value={signupPwd} onChange={setSignupPwd} error={signupErrs.pwd}
              rightSlot={
                <button type="button" className="auth-eye" onClick={() => setShowSPwd(!showSPwd)}>
                  {showSPwd ? <EyeOff /> : <EyeOpen />}
                </button>
              }
            />
            <PasswordStrength password={signupPwd} />
          </div>

          {/* Confirmation */}
          <Field
            icon={<IconLock />} type={showCPwd ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            value={confirmPwd} onChange={setConfirmPwd} error={signupErrs.confirm}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            rightSlot={
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                {confirmPwd && confirmPwd === signupPwd && (
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>✓</span>
                )}
                <button type="button" className="auth-eye" style={{ position: "static", transform: "none" }}
                  onClick={() => setShowCPwd(!showCPwd)}>
                  {showCPwd ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            }
          />

          <button className="auth-submit" onClick={handleSignup} disabled={signupLoad}
            style={{ marginTop: 4 }}>
            {signupLoad ? "Création du profil…" : "Créer mon profil"}
          </button>

          <p className="auth-switch">
            Déjà un compte ?{" "}
            <button
              onClick={() => setOnglet("login")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#be185d", fontWeight: 700, fontSize: "inherit", padding: 0 }}
            >
              Se connecter
            </button>
          </p>
        </>
      )}
    </AuthShell>
  );
}
