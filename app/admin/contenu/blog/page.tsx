"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Post = { id: string; slug: string; title: string; content: string | null; published: boolean; created_at: string };

export default function BlogPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ title: "", slug: "", content: "", published: false });

  async function chargerPosts() { setLoading(true); const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }); setPosts(data ?? []); setLoading(false); }
  useEffect(() => { chargerPosts(); }, []);

  function genererSlug(titre: string) { return titre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""); }

  function ouvrirAjout() { setEditId(null); setErreurs({}); setForm({ title: "", slug: "", content: "", published: false }); setShowModal(true); }
  function ouvrirEdition(p: Post) { setEditId(p.id); setErreurs({}); setForm({ title: p.title, slug: p.slug, content: p.content ?? "", published: p.published }); setShowModal(true); }

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Le titre est obligatoire.";
    else if (form.title.trim().length < 3) e.title = "Le titre doit contenir au moins 3 caracteres.";
    const slug = form.slug || genererSlug(form.title);
    if (!slug) e.slug = "Le slug ne peut pas etre vide.";
    const doublon = posts.find((p) => p.slug === slug && p.id !== editId);
    if (doublon) e.slug = "Ce slug existe deja.";
    if (!form.content.trim()) e.content = "Le contenu de l'article est obligatoire.";
    else if (form.content.trim().length < 50) e.content = "Le contenu doit contenir au moins 50 caracteres.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    const payload = { title: form.title.trim(), slug: form.slug || genererSlug(form.title), content: form.content.trim(), published: form.published };
    if (editId) {
      const { error } = await supabase.from("posts").update(payload).eq("id", editId);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "Article mis a jour !", type: "success" });
    } else {
      const { error } = await supabase.from("posts").insert(payload);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "Article ajoute !", type: "success" });
    }
    setShowModal(false); chargerPosts();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerPost(id: string) { if (!confirm("Confirmer la suppression ?")) return; await supabase.from("posts").delete().eq("id", id); setAlert({ message: "Article supprime.", type: "success" }); chargerPosts(); setTimeout(() => setAlert({ message: "", type: "" }), 3000); }

  async function togglePublie(p: Post) {
    const { error } = await supabase.from("posts").update({ published: !p.published }).eq("id", p.id);
    if (error) setAlert({ message: "Erreur : " + error.message, type: "danger" });
    else { setAlert({ message: !p.published ? "Article publie !" : "Article repasse en brouillon.", type: "success" }); chargerPosts(); }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">Blog <span className="badge bg-light-primary text-primary ms-2">{posts.length}</span></h5>
          <p className="mb-0 text-muted">Donnees synchronisees avec Supabase</p>
        </div>
        <button className="btn btn-primary" onClick={ouvrirAjout}><i className="ti ti-plus me-1"></i> Nouvel article</button>
      </div>

      {alert.message && <div className={`alert alert-${alert.type} mb-4`}>{alert.message}</div>}

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Titre</th><th>Slug</th><th>Statut</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="text-center text-muted">Chargement...</td></tr>
                : posts.length === 0 ? <tr><td colSpan={5} className="text-center text-muted py-4">Aucun article — <button className="btn btn-link p-0" onClick={ouvrirAjout}>Ecrire le premier</button></td></tr>
                : posts.map((p) => (
                  <tr key={p.id}>
                    <td><h6 className="fw-semibold mb-0">{p.title}</h6></td>
                    <td><code className="text-muted">/{p.slug}</code></td>
                    <td>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={p.published} onChange={() => togglePublie(p)} />
                        <label className="form-check-label">
                          <span className={`badge rounded-3 fw-semibold ${p.published ? "bg-success" : "bg-warning text-dark"}`}>{p.published ? "Publie" : "Brouillon"}</span>
                        </label>
                      </div>
                    </td>
                    <td className="text-muted">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => ouvrirEdition(p)}><i className="ti ti-edit"></i></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => supprimerPost(p.id)}><i className="ti ti-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">{editId ? "Modifier l'article" : "Nouvel article"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Titre <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${erreurs.title ? "is-invalid" : ""}`} value={form.title}
                      onChange={(e) => { const t = e.target.value; setForm({ ...form, title: t, slug: editId ? form.slug : genererSlug(t) }); }} />
                    {erreurs.title && <div className="invalid-feedback">{erreurs.title}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Slug</label>
                    <input type="text" className={`form-control ${erreurs.slug ? "is-invalid" : ""}`} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                    {erreurs.slug && <div className="invalid-feedback">{erreurs.slug}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Contenu <span className="text-danger">*</span></label>
                    <textarea className={`form-control ${erreurs.content ? "is-invalid" : ""}`} rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}></textarea>
                    {erreurs.content && <div className="invalid-feedback">{erreurs.content}</div>}
                    <small className="text-muted">{form.content.length} caractere(s) — minimum 50</small>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                      <label className="form-check-label">{form.published ? "Publie" : "Brouillon"}</label>
                    </div>
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
