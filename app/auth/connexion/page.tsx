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
    <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#4F46E5", letterSpacing: "-0.5px" }}>KICKSOFT</span>
          </Link>
          <p style={{ color: "#6c757d", marginTop: "0.5rem", fontSize: "14px" }}>Connectez-vous a votre compte</p>
        </div>

        <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Connexion</h2>

          {erreur && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem" }}>
              {erreur}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#6c757d", marginBottom: "6px" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.email ? "#dc2626" : "#dee2e6"}`, borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            {erreurs.email && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{erreurs.email}</p>}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#6c757d", marginBottom: "6px" }}>Mot de passe</label>
            <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Votre mot de passe"
              onKeyDown={(e) => e.key === "Enter" && handleConnexion()}
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.motDePasse ? "#dc2626" : "#dee2e6"}`, borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            {erreurs.motDePasse && <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>{erreurs.motDePasse}</p>}
          </div>

          <button onClick={handleConnexion} disabled={chargement}
            style={{ width: "100%", padding: "12px", background: chargement ? "#93c5fd" : "#4F46E5", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: chargement ? "not-allowed" : "pointer" }}>
            {chargement ? "Connexion..." : "Se connecter"}
          </button>

          <p style={{ textAlign: "center", fontSize: "13px", color: "#6c757d", marginTop: "1.5rem" }}>
            Pas encore de compte ?{" "}
            <Link href="/auth/inscription" style={{ color: "#4F46E5", fontWeight: 600, textDecoration: "none" }}>Creer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
