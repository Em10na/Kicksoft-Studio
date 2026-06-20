"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ full_name: "", phone: "", adresse: "", ville: "", code_postal: "" });
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setForm({
          full_name: data.full_name || "", phone: data.phone || "",
          adresse: data.adresse || "", ville: data.ville || "", code_postal: data.code_postal || "",
        });
      }
      setLoading(false);
    }
    charger();
  }, []);

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Le nom est obligatoire.";
    else if (form.full_name.trim().length < 2) e.full_name = "Minimum 2 caracteres.";
    if (form.phone && !/^[+\d\s()-]{6,20}$/.test(form.phone)) e.phone = "Numero invalide.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(), phone: form.phone.trim() || null,
      adresse: form.adresse.trim() || null, ville: form.ville.trim() || null, code_postal: form.code_postal.trim() || null,
    }).eq("id", user.id);
    if (error) setAlert({ message: "Erreur : " + error.message, type: "danger" });
    else setAlert({ message: "Profil mis a jour avec succes !", type: "success" });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Mon profil</h2>

      {alert.message && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--r)", marginBottom: "var(--s4)", fontSize: "var(--text-sm)",
          background: alert.type === "success" ? "#f0fdf4" : "#fef2f2", color: alert.type === "success" ? "#16a34a" : "#dc2626",
          border: `1px solid ${alert.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {alert.message}
        </div>
      )}

      <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", padding: "var(--s6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Nom complet <span style={{ color: "var(--rose)" }}>*</span></label>
            <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.full_name ? "var(--rose)" : "var(--rule)"}`, borderRadius: "var(--r)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
            {erreurs.full_name && <p style={{ color: "var(--rose)", fontSize: "12px", marginTop: "4px" }}>{erreurs.full_name}</p>}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Email</label>
            <input type="email" value={email} disabled
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)", background: "var(--bg)", color: "var(--fg-mute)", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Telephone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+216 XX XXX XXX"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.phone ? "var(--rose)" : "var(--rule)"}`, borderRadius: "var(--r)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
            {erreurs.phone && <p style={{ color: "var(--rose)", fontSize: "12px", marginTop: "4px" }}>{erreurs.phone}</p>}
          </div>
        </div>

        <h3 style={{ fontSize: "var(--text-md)", marginTop: "var(--s6)", marginBottom: "var(--s4)", color: "var(--ink)" }}>Adresse de livraison</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--s4)" }}>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Adresse</label>
            <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Rue, numero, immeuble..."
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Ville</label>
              <input type="text" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} placeholder="Tunis"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Code postal</label>
              <input type="text" value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} placeholder="1000"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        <button onClick={sauvegarder} style={{ marginTop: "var(--s5)", padding: "12px 24px", background: "var(--indigo)", color: "white", border: "none", borderRadius: "var(--r)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer" }}>
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
}
