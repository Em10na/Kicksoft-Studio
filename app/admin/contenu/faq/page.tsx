"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Faq = { id: string; question: string; answer: string; position: number; created_at: string };

export default function FaqPage() {
  const supabase = createClient();
  const [faqs, setFaqs]       = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert]     = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId]   = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ question: "", answer: "", position: "0" });

  /* ── données ── */
  async function charger() {
    setLoading(true);
    const { data } = await supabase.from("faq").select("*").order("position", { ascending: true });
    setFaqs(data ?? []);
    setLoading(false);
  }
  useEffect(() => { charger(); }, []);

  function showAlerte(msg: string, type: string) {
    setAlert({ message: msg, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  /* ── modal ajout / édition ── */
  function ouvrirAjout() {
    setEditId(null); setErreurs({});
    setForm({ question: "", answer: "", position: String(faqs.length) });
    setShowModal(true);
  }
  function ouvrirEdition(f: Faq) {
    setEditId(f.id); setErreurs({});
    setForm({ question: f.question, answer: f.answer, position: String(f.position) });
    setShowModal(true);
  }

  /* ── validation ── */
  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.question.trim())              e.question = "La question est obligatoire.";
    else if (form.question.trim().length < 10) e.question = "Minimum 10 caractères.";
    if (!form.answer.trim())               e.answer   = "La réponse est obligatoire.";
    else if (form.answer.trim().length < 10)  e.answer   = "Minimum 10 caractères.";
    if (form.position === "" || isNaN(Number(form.position))) e.position = "Nombre requis.";
    else if (Number(form.position) < 0)    e.position = "Doit être ≥ 0.";
    setErreurs(e);
    return !Object.keys(e).length;
  }

  /* ── sauvegarde ── */
  async function sauvegarder() {
    if (!valider()) return;
    setSaving(true);
    const payload = { question: form.question.trim(), answer: form.answer.trim(), position: parseInt(form.position) || 0 };
    if (editId) {
      const { error } = await supabase.from("faq").update(payload).eq("id", editId);
      if (error) { showAlerte("Erreur : " + error.message, "danger"); setSaving(false); return; }
      showAlerte("FAQ mise à jour !", "success");
    } else {
      const { error } = await supabase.from("faq").insert(payload);
      if (error) { showAlerte("Erreur : " + error.message, "danger"); setSaving(false); return; }
      showAlerte("Question ajoutée !", "success");
    }
    setSaving(false); setShowModal(false); charger();
  }

  /* ── suppression ── */
  async function supprimer(id: string) {
    await supabase.from("faq").delete().eq("id", id);
    setConfirmId(null);
    showAlerte("Question supprimée.", "success");
    charger();
  }

  /* ────────────── rendu ────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Alerte */}
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i>
          {alert.message}
        </div>
      )}

      {/* En-tête */}
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">
            FAQ <span className="ak-count-badge">{faqs.length}</span>
          </h1>
          <p className="ak-page-sub">Questions fréquentes affichées sur le site</p>
        </div>
        <button className="ak-btn ak-btn--primary" onClick={ouvrirAjout}>
          <i className="ti ti-plus"></i> Ajouter une question
        </button>
      </div>

      {/* Tableau */}
      <div className="ak-card">
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Ordre</th>
                <th>Question</th>
                <th>Réponse</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>Chargement…</td></tr>
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ color: "#94a3b8", marginBottom: 12 }}>Aucune question pour l&apos;instant.</div>
                    <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={ouvrirAjout}>
                      <i className="ti ti-plus"></i> Ajouter la première
                    </button>
                  </td>
                </tr>
              ) : faqs.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: 8,
                      background: "#ede9fe", color: "#7c3aed",
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {f.position}
                    </span>
                  </td>
                  <td>
                    <span className="ak-cell-bold" style={{ fontSize: 13 }}>{f.question}</span>
                  </td>
                  <td>
                    <span className="ak-cell-muted" style={{ fontSize: 13 }}>
                      {f.answer.length > 90 ? f.answer.slice(0, 90) + "…" : f.answer}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon"
                        onClick={() => ouvrirEdition(f)} title="Modifier"
                      >
                        <i className="ti ti-pencil"></i>
                      </button>
                      <button
                        className="ak-btn ak-btn--danger-ghost ak-btn--sm ak-btn--icon"
                        onClick={() => setConfirmId(f.id)} title="Supprimer"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal confirmation suppression ── */}
      {confirmId && (
        <div className="ak-modal-backdrop" onClick={() => setConfirmId(null)}>
          <div className="ak-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">
                <i className="ti ti-alert-triangle" style={{ marginRight: 8, color: "#f43f5e" }}></i>
                Supprimer la question
              </h3>
              <button className="ak-modal__close" onClick={() => setConfirmId(null)}>✕</button>
            </div>
            <div className="ak-modal__body">
              <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
                Voulez-vous vraiment supprimer cette question ?
                <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, display: "block" }}>
                  Cette action est irréversible.
                </span>
              </p>
              {/* Aperçu de la question à supprimer */}
              {(() => {
                const f = faqs.find((x) => x.id === confirmId);
                return f ? (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#fff1f2", borderRadius: 10, borderLeft: "3px solid #f43f5e", fontSize: 13, color: "#9f1239" }}>
                    {f.question}
                  </div>
                ) : null;
              })()}
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setConfirmId(null)}>Annuler</button>
              <button className="ak-btn ak-btn--danger" onClick={() => supprimer(confirmId)}>
                <i className="ti ti-trash"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ajout / édition ── */}
      {showModal && (
        <div className="ak-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">
                <i className="ti ti-help" style={{ marginRight: 8, color: "#7c3aed" }}></i>
                {editId ? "Modifier la question" : "Nouvelle question FAQ"}
              </h3>
              <button className="ak-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="ak-modal__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Question + Ordre */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12 }}>
                <div className="ak-field">
                  <label className="ak-label">
                    Question <span style={{ color: "#f43f5e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`ak-input${erreurs.question ? " ak-input--error" : ""}`}
                    placeholder="Ex : Comment passer une commande ?"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                  />
                  {erreurs.question && <p className="ak-field-error">{erreurs.question}</p>}
                </div>
                <div className="ak-field">
                  <label className="ak-label">Ordre</label>
                  <input
                    type="number"
                    min={0}
                    className={`ak-input${erreurs.position ? " ak-input--error" : ""}`}
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  />
                  {erreurs.position && <p className="ak-field-error">{erreurs.position}</p>}
                </div>
              </div>

              {/* Réponse */}
              <div className="ak-field">
                <label className="ak-label">
                  Réponse <span style={{ color: "#f43f5e" }}>*</span>
                </label>
                <textarea
                  className={`ak-input${erreurs.answer ? " ak-input--error" : ""}`}
                  rows={5}
                  placeholder="Rédigez une réponse claire et concise…"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  style={{ resize: "vertical", minHeight: 120 }}
                />
                {erreurs.answer && <p className="ak-field-error">{erreurs.answer}</p>}
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  {form.answer.length} caractère{form.answer.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button className="ak-btn ak-btn--primary" onClick={sauvegarder} disabled={saving}>
                {saving
                  ? <><i className="ti ti-loader" style={{ animation: "spin .7s linear infinite" }}></i> Enregistrement…</>
                  : <><i className="ti ti-check"></i> {editId ? "Mettre à jour" : "Ajouter"}</>
                }
              </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}
    </div>
  );
}
