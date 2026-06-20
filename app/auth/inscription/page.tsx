"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function InscriptionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
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
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.nom.trim(),
        phone: form.telephone.trim() || null,
      });
    }

    router.push("/compte");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#4F46E5", letterSpacing: "-0.5px" }}>KICKSOFT</span>
          </Link>
          <p style={{ color: "#6c757d", marginTop: "0.5rem", fontSize: "14px" }}>Creez votre compte client</p>
        </div>

        <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Inscription</h2>

          {erreurGlobale && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem" }}>
              {erreurGlobale}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#6c757d", marginBottom: "6px" }}>Nom complet <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom complet"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.nom ? "#dc2626" : "#dee2e6"}`, borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            {erreurs.nom && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{erreurs.nom}</p>}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#6c757d", marginBottom: "6px" }}>Email <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.email ? "#dc2626" : "#dee2e6"}`, borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            {erreurs.email && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{erreurs.email}</p>}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#6c757d", marginBottom: "6px" }}>Telephone (optionnel)</label>
            <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+216 XX XXX XXX"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.telephone ? "#dc2626" : "#dee2e6"}`, borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            {erreurs.telephone && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{erreurs.telephone}</p>}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#6c757d", marginBottom: "6px" }}>Mot de passe <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} placeholder="Minimum 6 caracteres"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.motDePasse ? "#dc2626" : "#dee2e6"}`, borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            {erreurs.motDePasse && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{erreurs.motDePasse}</p>}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#6c757d", marginBottom: "6px" }}>Confirmer le mot de passe <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="password" value={form.confirmation} onChange={(e) => setForm({ ...form, confirmation: e.target.value })} placeholder="Retapez le mot de passe"
              onKeyDown={(e) => e.key === "Enter" && handleInscription()}
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.confirmation ? "#dc2626" : "#dee2e6"}`, borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            {erreurs.confirmation && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{erreurs.confirmation}</p>}
          </div>

          <button onClick={handleInscription} disabled={chargement}
            style={{ width: "100%", padding: "12px", background: chargement ? "#93c5fd" : "#4F46E5", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: chargement ? "not-allowed" : "pointer" }}>
            {chargement ? "Inscription en cours..." : "Creer mon compte"}
          </button>

          <p style={{ textAlign: "center", fontSize: "13px", color: "#6c757d", marginTop: "1.5rem" }}>
            Deja un compte ?{" "}
            <Link href="/auth/connexion" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
