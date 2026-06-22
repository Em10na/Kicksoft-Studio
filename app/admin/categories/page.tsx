"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "medias";

type Categorie = { id: string; name: string; description: string | null; image_url: string | null; created_at: string };
type Collection = { id: string; name: string; description: string | null; image_url: string | null; created_at: string };

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"categorie" | "collection">("categorie");
  const [form, setForm] = useState({ name: "", description: "", image_url: "" });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [onglet, setOnglet] = useState<"categories" | "collections">("categories");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function getPublicUrl(path: string): string {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function chargerCategories() { const { data } = await supabase.from("categories").select("*").order("name"); setCategories(data ?? []); }
  async function chargerCollections() { const { data } = await supabase.from("collections").select("*").order("name"); setCollections(data ?? []); }

  useEffect(() => { Promise.all([chargerCategories(), chargerCollections()]).then(() => setLoading(false)); }, []);

  function ouvrirAjout(type: "categorie" | "collection") {
    setEditId(null); setModalType(type);
    setForm({ name: "", description: "", image_url: "" });
    setImagePreview(null); setImageFile(null);
    setErreurs({}); setShowModal(true);
  }

  function ouvrirEdition(item: Categorie | Collection, type: "categorie" | "collection") {
    setEditId(item.id); setModalType(type);
    setForm({ name: item.name, description: item.description ?? "", image_url: item.image_url ?? "" });
    setImagePreview(item.image_url || null); setImageFile(null);
    setErreurs({}); setShowModal(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErreurs({ ...erreurs, image: "Le fichier doit etre une image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErreurs({ ...erreurs, image: "L'image ne doit pas depasser 5 Mo." });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErreurs((prev) => { const { image, ...rest } = prev; return rest; });
  }

  function supprimerImage() {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image_url: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploaderImage(): Promise<string | null> {
    if (!imageFile) return form.image_url || null;
    const ext = imageFile.name.split(".").pop();
    const prefix = modalType === "categorie" ? "cat" : "col";
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, imageFile, { upsert: false });
    if (error) throw new Error("Erreur upload image : " + error.message);
    return getPublicUrl(fileName);
  }

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Le nom est obligatoire.";
    else if (form.name.trim().length < 2) e.name = "Le nom doit contenir au moins 2 caracteres.";
    const liste = modalType === "categorie" ? categories : collections;
    const doublon = liste.find((c) => c.name.toLowerCase() === form.name.trim().toLowerCase() && c.id !== editId);
    if (doublon) e.name = `Ce nom existe deja.`;
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    setUploading(true);

    let imageUrl: string | null;
    try {
      imageUrl = await uploaderImage();
    } catch (err) {
      setAlert({ message: (err as Error).message, type: "danger" });
      setUploading(false);
      return;
    }

    const table = modalType === "categorie" ? "categories" : "collections";
    const label = modalType === "categorie" ? "Categorie" : "Collection";
    const payload = { name: form.name.trim(), description: form.description.trim() || null, image_url: imageUrl };

    if (editId) {
      const { error } = await supabase.from(table).update(payload).eq("id", editId);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); setUploading(false); return; }
      setAlert({ message: label + " mise a jour !", type: "success" });
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); setUploading(false); return; }
      setAlert({ message: label + " ajoutee !", type: "success" });
    }
    setUploading(false);
    setShowModal(false);
    if (modalType === "categorie") chargerCategories(); else chargerCollections();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimer(id: string, type: "categorie" | "collection") {
    if (!confirm("Confirmer la suppression ?")) return;
    const table = type === "categorie" ? "categories" : "collections";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); }
    else { setAlert({ message: (type === "categorie" ? "Categorie" : "Collection") + " supprimee.", type: "success" }); if (type === "categorie") chargerCategories(); else chargerCollections(); }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  const listeActive = onglet === "categories" ? categories : collections;

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">Categories & Collections <span className="badge bg-light-primary text-primary ms-2">{categories.length + collections.length}</span></h5>
          <p className="mb-0 text-muted">Donnees synchronisees avec Supabase</p>
        </div>
        <button className="btn btn-primary" onClick={() => ouvrirAjout(onglet === "categories" ? "categorie" : "collection")}>
          <i className="ti ti-plus me-1"></i> {onglet === "categories" ? "Categorie" : "Collection"}
        </button>
      </div>

      {alert.message && <div className={`alert alert-${alert.type} mb-4`}>{alert.message}</div>}

      <ul className="nav nav-tabs mb-0">
        <li className="nav-item">
          <button className={`nav-link ${onglet === "categories" ? "active" : ""}`} onClick={() => setOnglet("categories")}>
            <i className="ti ti-category me-1"></i> Categories <span className="badge bg-light-primary text-primary ms-1">{categories.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${onglet === "collections" ? "active" : ""}`} onClick={() => setOnglet("collections")}>
            <i className="ti ti-folders me-1"></i> Collections <span className="badge bg-light-primary text-primary ms-1">{collections.length}</span>
          </button>
        </li>
      </ul>

      <div className="card" style={{ borderTopLeftRadius: 0 }}>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th style={{ width: "60px" }}>Image</th><th>Nom</th><th>Description</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center text-muted">Chargement...</td></tr>
                ) : listeActive.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-4">Aucun element — <button className="btn btn-link p-0" onClick={() => ouvrirAjout(onglet === "categories" ? "categorie" : "collection")}>Ajouter</button></td></tr>
                ) : (
                  listeActive.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "8px" }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: "8px", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className={`ti ${onglet === "categories" ? "ti-tag text-primary" : "ti-folder text-warning"}`}></i>
                          </div>
                        )}
                      </td>
                      <td><h6 className="fw-semibold mb-0">{c.name}</h6></td>
                      <td className="text-muted">{c.description || "—"}</td>
                      <td className="text-muted">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => ouvrirEdition(c, onglet === "categories" ? "categorie" : "collection")}><i className="ti ti-edit"></i></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => supprimer(c.id, onglet === "categories" ? "categorie" : "collection")}><i className="ti ti-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">{editId ? `Modifier la ${modalType}` : `Nouvelle ${modalType}`}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {/* Image upload */}
                  <div className="col-12">
                    <label className="form-label">Image</label>
                    <div className="d-flex align-items-start gap-3">
                      <div
                        onClick={() => fileRef.current?.click()}
                        style={{
                          width: "100px", height: "100px", borderRadius: "12px", flexShrink: 0, cursor: "pointer",
                          border: `2px dashed ${erreurs.image ? "#dc3545" : "#dee2e6"}`,
                          background: imagePreview ? `url(${imagePreview}) center/cover no-repeat` : "#f8f9fa",
                          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                        }}
                      >
                        {!imagePreview && (
                          <div className="text-center text-muted" style={{ fontSize: "11px" }}>
                            <i className="ti ti-cloud-upload" style={{ fontSize: "20px", display: "block", marginBottom: "2px" }}></i>
                            Cliquer
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                        <p className="text-muted mb-2" style={{ fontSize: "12px" }}>
                          JPG, PNG, WebP — max 5 Mo<br />
                          Bucket : <code>medias</code>
                        </p>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => fileRef.current?.click()}>
                            <i className="ti ti-upload me-1"></i> {imagePreview ? "Changer" : "Choisir"}
                          </button>
                          {imagePreview && (
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={supprimerImage}>
                              <i className="ti ti-trash"></i>
                            </button>
                          )}
                        </div>
                        {erreurs.image && <p className="text-danger mt-1" style={{ fontSize: "12px" }}>{erreurs.image}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Nom <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${erreurs.name ? "is-invalid" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    {erreurs.name && <div className="invalid-feedback">{erreurs.name}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={sauvegarder} disabled={uploading}>
                  {uploading ? "Upload en cours..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
