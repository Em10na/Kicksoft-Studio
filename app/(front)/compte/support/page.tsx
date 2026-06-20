"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ticket = { id: string; subject: string; message: string | null; status: string; created_at: string };

export default function SupportClientPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ subject: "", message: "" });

  useEffect(() => {
    chargerTickets();
  }, []);

  async function chargerTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("tickets_support").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.subject.trim()) e.subject = "Le sujet est obligatoire.";
    else if (form.subject.trim().length < 5) e.subject = "Minimum 5 caracteres.";
    if (!form.message.trim()) e.message = "Le message est obligatoire.";
    else if (form.message.trim().length < 20) e.message = "Minimum 20 caracteres pour decrire votre probleme.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function envoyerTicket() {
    if (!valider()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("tickets_support").insert({
      user_id: user.id, subject: form.subject.trim(), message: form.message.trim(), status: "open",
    });
    if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
    setAlert({ message: "Ticket envoye avec succes ! Nous vous repondrons rapidement.", type: "success" });
    setForm({ subject: "", message: "" });
    setShowForm(false);
    chargerTickets();
    setTimeout(() => setAlert({ message: "", type: "" }), 4000);
  }

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s5)" }}>
        <h2 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>Support</h2>
        <button onClick={() => { setShowForm(!showForm); setErreurs({}); }}
          style={{ padding: "10px 20px", background: "var(--indigo)", color: "white", border: "none", borderRadius: "var(--r)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer" }}>
          {showForm ? "Annuler" : "Nouveau ticket"}
        </button>
      </div>

      {alert.message && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--r)", marginBottom: "var(--s4)", fontSize: "var(--text-sm)",
          background: alert.type === "success" ? "#f0fdf4" : "#fef2f2", color: alert.type === "success" ? "#16a34a" : "#dc2626",
          border: `1px solid ${alert.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {alert.message}
        </div>
      )}

      {showForm && (
        <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", padding: "var(--s6)", marginBottom: "var(--s5)" }}>
          <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s4)" }}>Nouveau ticket de support</h3>
          <div style={{ marginBottom: "var(--s4)" }}>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Sujet <span style={{ color: "var(--rose)" }}>*</span></label>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Probleme avec ma commande"
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.subject ? "var(--rose)" : "var(--rule)"}`, borderRadius: "var(--r)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
            {erreurs.subject && <p style={{ color: "var(--rose)", fontSize: "12px", marginTop: "4px" }}>{erreurs.subject}</p>}
          </div>
          <div style={{ marginBottom: "var(--s4)" }}>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontFamily: "var(--ff-mono)", color: "var(--fg-mute)", marginBottom: "6px", textTransform: "uppercase" }}>Message <span style={{ color: "var(--rose)" }}>*</span></label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Decrivez votre probleme en detail..."
              style={{ width: "100%", padding: "10px 14px", border: `1px solid ${erreurs.message ? "var(--rose)" : "var(--rule)"}`, borderRadius: "var(--r)", fontSize: "var(--text-sm)", boxSizing: "border-box", resize: "vertical" }} />
            {erreurs.message && <p style={{ color: "var(--rose)", fontSize: "12px", marginTop: "4px" }}>{erreurs.message}</p>}
            <p style={{ fontSize: "11px", color: "var(--fg-mute)", marginTop: "4px" }}>{form.message.length} caractere(s) - minimum 20</p>
          </div>
          <button onClick={envoyerTicket} style={{ padding: "10px 20px", background: "var(--indigo)", color: "white", border: "none", borderRadius: "var(--r)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer" }}>
            Envoyer le ticket
          </button>
        </div>
      )}

      {tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s8)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)" }}>
          <p style={{ color: "var(--fg-mute)" }}>Aucun ticket de support. Tout va bien !</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {tickets.map((t) => (
            <div key={t.id} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", padding: "var(--s5)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s2)" }}>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: 0 }}>{t.subject}</h4>
                <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                  background: t.status === "open" ? "var(--amber)15" : "var(--emerald)15",
                  color: t.status === "open" ? "var(--amber)" : "var(--emerald)" }}>
                  {t.status === "open" ? "Ouvert" : "Ferme"}
                </span>
              </div>
              {t.message && <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.6", marginBottom: "var(--s2)" }}>{t.message.length > 150 ? t.message.slice(0, 150) + "..." : t.message}</p>}
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
                {new Date(t.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
