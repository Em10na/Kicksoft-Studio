"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Faq = { id: string; question: string; answer: string; position: number; created_at: string };

export default function FaqPage() {
  const supabase = createClient();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ question: "", answer: "", position: "0" });

  async function chargerFaqs() { setLoading(true); const { data } = await supabase.from("faqs").select("*").order("position", { ascending: true }); setFaqs(data ?? []); setLoading(false); }
  useEffect(() => { chargerFaqs(); }, []);

  function ouvrirAjout() { setEditId(null); setErreurs({}); setForm({ question: "", answer: "", position: String(faqs.length) }); setShowModal(true); }
  function ouvrirEdition(f: Faq) { setEditId(f.id); setErreurs({}); setForm({ question: f.question, answer: f.answer, position: String(f.position) }); setShowModal(true); }

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.question.trim()) e.question = "La question est obligatoire.";
    else if (form.question.trim().length < 10) e.question = "La question doit contenir au moins 10 caracteres.";
    if (!form.answer.trim()) e.answer = "La reponse est obligatoire.";
    else if (form.answer.trim().length < 10) e.answer = "La reponse doit contenir au moins 10 caracteres.";
    if (form.position === "" || isNaN(Number(form.position))) e.position = "L'ordre doit etre un nombre.";
    else if (Number(form.position) < 0) e.position = "L'ordre doit etre positif ou zero.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    const payload = { question: form.question.trim(), answer: form.answer.trim(), position: parseInt(form.position) || 0 };
    if (editId) {
      const { error } = await supabase.from("faqs").update(payload).eq("id", editId);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "FAQ mise a jour !", type: "success" });
    } else {
      const { error } = await supabase.from("faqs").insert(payload);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "FAQ ajoutee !", type: "success" });
    }
    setShowModal(false); chargerFaqs();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerFaq(id: string) { if (!confirm("Confirmer la suppression ?")) return; await supabase.from("faqs").delete().eq("id", id); setAlert({ message: "FAQ supprimee.", type: "success" }); chargerFaqs(); setTimeout(() => setAlert({ message: "", type: "" }), 3000); }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">FAQ <span className="badge bg-light-primary text-primary ms-2">{faqs.length}</span></h5>
          <p className="mb-0 text-muted">Donnees synchronisees avec Supabase</p>
        </div>
        <button className="btn btn-primary" onClick={ouvrirAjout}><i className="ti ti-plus me-1"></i> Ajouter une question</button>
      </div>

      {alert.message && <div className={`alert alert-${alert.type} mb-4`}>{alert.message}</div>}

      <div className="card">
        <div className="card-body">
          {loading ? <p className="text-center text-muted">Chargement...</p>
          : faqs.length === 0 ? <p className="text-center text-muted py-4">Aucune FAQ — <button className="btn btn-link p-0" onClick={ouvrirAjout}>Ajouter la premiere</button></p>
          : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th style={{ width: "60px" }}>Ordre</th><th>Question</th><th>Reponse</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {faqs.map((f) => (
                    <tr key={f.id}>
                      <td><span className="badge bg-light-primary text-primary">{f.position}</span></td>
                      <td><h6 className="fw-semibold mb-0">{f.question}</h6></td>
                      <td className="text-muted">{f.answer.length > 80 ? f.answer.slice(0, 80) + "..." : f.answer}</td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => ouvrirEdition(f)}><i className="ti ti-edit"></i></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => supprimerFaq(f.id)}><i className="ti ti-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">{editId ? "Modifier la FAQ" : "Nouvelle FAQ"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-10">
                    <label className="form-label">Question <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${erreurs.question ? "is-invalid" : ""}`} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
                    {erreurs.question && <div className="invalid-feedback">{erreurs.question}</div>}
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Ordre</label>
                    <input type="number" className={`form-control ${erreurs.position ? "is-invalid" : ""}`} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                    {erreurs.position && <div className="invalid-feedback">{erreurs.position}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Reponse <span className="text-danger">*</span></label>
                    <textarea className={`form-control ${erreurs.answer ? "is-invalid" : ""}`} rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })}></textarea>
                    {erreurs.answer && <div className="invalid-feedback">{erreurs.answer}</div>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={sauvegarder}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
