"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function InscriptionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState("");
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", motDePasse: "", confirmation: "" });

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = "Le nom complet est obligatoire.";
    else if (form.nom.trim().length < 2) e.nom = "Le nom doit contenir au moins 2 caracteres.";
    if (!form.email.trim()) e.email = "L'email est obligatoire.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "L'email n'est pas valide.";
    if (!form.motDePasse) e.motDePasse = "Le mot de passe est obligatoire.";
    else if (form.motDePasse.length < 6) e.motDePasse = "Le mot de passe doit contenir au moins 6 caracteres.";
    if (form.motDePasse !== form.confirmation) e.confirmation = "Les mots de passe ne correspondent pas.";
    if (form.telephone && !/^[+\d\s()-]{6,20}$/.test(form.telephone)) e.telephone = "Le numero de telephone n'est pas valide.";
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
      setErreurGlobale(error.message === "User already registered" ? "Un compte existe deja avec cet email." : "Erreur : " + error.message);
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

  const champStyle = (hasError: boolean) => ({
    width: "100%", padding: "12px 14px 12px 40px",
    border: `1.5px solid ${hasError ? "#dc2626" : "#E5E7EB"}`,
    borderRadius: "10px", fontSize: "14px", color: "#111827",
    outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "42px", height: "42px", background: "#4F46E5", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: "18px" }}>K</span>
            </div>
            <span style={{ fontSize: "26px", fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>KICKSOFT</span>
          </Link>
          <p style={{ color: "#374151", marginTop: "0.75rem", fontSize: "15px" }}>Creez votre compte en quelques secondes</p>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem", color: "#111827" }}>Creer un compte</h2>
          <p style={{ fontSize: "14px", color: "#4B5563", marginBottom: "1.75rem" }}>Rejoignez Kicksoft et profitez d&apos;offres exclusives.</p>

          {erreurGlobale && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", borderRadius: "10px", padding: "12px 16px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>&#x26A0;</span>
              {erreurGlobale}
            </div>
          )}

          {/* Nom */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Nom complet <span style={{ color: "#dc2626" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x1F464;</span>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Prenom et nom"
                style={champStyle(!!erreurs.nom)}
                onFocus={(e) => e.target.style.borderColor = erreurs.nom ? "#dc2626" : "#4F46E5"}
                onBlur={(e) => e.target.style.borderColor = erreurs.nom ? "#dc2626" : "#E5E7EB"} />
            </div>
            {erreurs.nom && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.nom}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Adresse email <span style={{ color: "#dc2626" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x2709;</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com"
                style={champStyle(!!erreurs.email)}
                onFocus={(e) => e.target.style.borderColor = erreurs.email ? "#dc2626" : "#4F46E5"}
                onBlur={(e) => e.target.style.borderColor = erreurs.email ? "#dc2626" : "#E5E7EB"} />
            </div>
            {erreurs.email && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.email}</p>}
          </div>

          {/* Telephone */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Telephone <span style={{ color: "#6B7280", fontWeight: 400 }}>(optionnel)</span></label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x260E;</span>
              <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+216 XX XXX XXX"
                style={champStyle(!!erreurs.telephone)}
                onFocus={(e) => e.target.style.borderColor = erreurs.telephone ? "#dc2626" : "#4F46E5"}
                onBlur={(e) => e.target.style.borderColor = erreurs.telephone ? "#dc2626" : "#E5E7EB"} />
            </div>
            {erreurs.telephone && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.telephone}</p>}
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Mot de passe <span style={{ color: "#dc2626" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x1F512;</span>
              <input type={showPassword ? "text" : "password"} value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} placeholder="Minimum 6 caracteres"
                style={{ ...champStyle(!!erreurs.motDePasse), paddingRight: "44px" }}
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
            {form.motDePasse && (
              <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: form.motDePasse.length >= i * 3 ? (form.motDePasse.length >= 10 ? "#10B981" : form.motDePasse.length >= 6 ? "#F59E0B" : "#EF4444") : "#E5E7EB" }}></div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>Confirmer le mot de passe <span style={{ color: "#dc2626" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "16px" }}>&#x1F512;</span>
              <input type="password" value={form.confirmation} onChange={(e) => setForm({ ...form, confirmation: e.target.value })} placeholder="Retapez le mot de passe"
                onKeyDown={(e) => e.key === "Enter" && handleInscription()}
                style={champStyle(!!erreurs.confirmation)}
                onFocus={(e) => e.target.style.borderColor = erreurs.confirmation ? "#dc2626" : "#4F46E5"}
                onBlur={(e) => e.target.style.borderColor = erreurs.confirmation ? "#dc2626" : "#E5E7EB"} />
              {form.confirmation && form.confirmation === form.motDePasse && (
                <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#10B981", fontSize: "16px" }}>&#x2713;</span>
              )}
            </div>
            {erreurs.confirmation && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "6px" }}>{erreurs.confirmation}</p>}
          </div>

          {/* Submit */}
          <button onClick={handleInscription} disabled={chargement}
            style={{ width: "100%", padding: "14px", background: chargement ? "#818CF8" : "#4F46E5", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: chargement ? "not-allowed" : "pointer", transition: "background 0.2s", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
            {chargement ? "Creation du compte..." : "Creer mon compte"}
          </button>

          {/* Avantages */}
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "8px" }}>
            {["Livraison gratuite des 50 DT", "Retours gratuits sous 30 jours", "Offres exclusives membres"].map((txt) => (
              <div key={txt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151" }}>
                <span style={{ color: "#10B981", fontSize: "14px" }}>&#x2713;</span>
                {txt}
              </div>
            ))}
          </div>

          {/* Separator */}
          <div style={{ display: "flex", alignItems: "center", margin: "1.75rem 0", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }}></div>
            <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>OU</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }}></div>
          </div>

          {/* Login link */}
          <p style={{ textAlign: "center", fontSize: "14px", color: "#374151" }}>
            Deja un compte ?{" "}
            <Link href="/auth/connexion" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "#6B7280", marginTop: "1.5rem" }}>
          En creant un compte, vous acceptez nos{" "}
          <Link href="/cgv" style={{ color: "#4F46E5", textDecoration: "none" }}>CGV</Link>{" "}
          et notre{" "}
          <Link href="/garantie" style={{ color: "#4F46E5", textDecoration: "none" }}>politique de garantie</Link>.
        </p>
      </div>
    </div>
  );
}
