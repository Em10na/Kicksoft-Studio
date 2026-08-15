"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "products";
type Item = { id: string; name: string; description: string | null; image_url: string | null; created_at: string };

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Item[]>([]);
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
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; detail?: string; onConfirm: () => void } | null>(null);

  function getPublicUrl(path: string) { return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }
  async function chargerCats() { const { data } = await supabase.from("categories").select("*").order("name"); setCategories(data ?? []); }
  async function chargerCols() { const { data } = await supabase.from("collections").select("*").order("name"); setCollections(data ?? []); }
  useEffect(() => { Promise.all([chargerCats(), chargerCols()]).then(() => setLoading(false)); }, []);

  function showAlert(msg: string, type: string) { setAlert({ message: msg, type }); setTimeout(() => setAlert({ message: "", type: "" }), 3000); }

  function ouvrirAjout(type: "categorie" | "collection") {
    setEditId(null); setModalType(type); setForm({ name: "", description: "", image_url: "" });
    setImagePreview(null); setImageFile(null); setErreurs({}); setShowModal(true);
  }
  function ouvrirEdition(item: Item, type: "categorie" | "collection") {
    setEditId(item.id); setModalType(type); setForm({ name: item.name, description: item.description ?? "", image_url: item.image_url ?? "" });
    setImagePreview(item.image_url || null); setImageFile(null); setErreurs({}); setShowModal(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setErreurs({ ...erreurs, image: "Image uniquement." }); return; }
    if (file.size > 5 * 1024 * 1024) { setErreurs({ ...erreurs, image: "Max 5 Mo." }); return; }
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
    setErreurs((p) => { const { image, ...r } = p; return r; });
  }

  async function uploaderImage(): Promise<string | null> {
    if (!imageFile) return form.image_url || null;
    const ext = imageFile.name.split(".").pop();
    const fileName = `${modalType === "categorie" ? "cat" : "col"}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, imageFile, { upsert: false });
    if (error) throw new Error(error.message);
    return getPublicUrl(fileName);
  }

  function valider() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nom obligatoire.";
    else if (form.name.trim().length < 2) e.name = "Min 2 caractères.";
    const liste = modalType === "categorie" ? categories : collections;
    if (liste.find((c) => c.name.toLowerCase() === form.name.trim().toLowerCase() && c.id !== editId)) e.name = "Ce nom existe déjà.";
    setErreurs(e); return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    setUploading(true);
    let imageUrl: string | null;
    try { imageUrl = await uploaderImage(); } catch (err) { showAlert((err as Error).message, "danger"); setUploading(false); return; }
    const table = modalType === "categorie" ? "categories" : "collections";
    const slug = form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { name: form.name.trim(), slug, description: form.description.trim() || null, image_url: imageUrl };
    if (editId) { const { error } = await supabase.from(table).update(payload).eq("id", editId); if (error) { showAlert("Erreur : " + error.message, "danger"); setUploading(false); return; } }
    else { const { error } = await supabase.from(table).insert(payload); if (error) { showAlert("Erreur : " + error.message, "danger"); setUploading(false); return; } }
    showAlert((modalType === "categorie" ? "Catégorie" : "Collection") + (editId ? " mise à jour !" : " ajoutée !"), "success");
    setUploading(false); setShowModal(false);
    if (modalType === "categorie") chargerCats(); else chargerCols();
  }

  async function supprimerConfirme(id: string, type: "categorie" | "collection") {
    const table = type === "categorie" ? "categories" : "collections";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) showAlert("Erreur : " + error.message, "danger");
    else { showAlert("Supprimé.", "success"); if (type === "categorie") chargerCats(); else chargerCols(); }
    setConfirmAction(null);
  }

  function supprimer(id: string, type: "categorie" | "collection", name: string) {
    setConfirmAction({
      title: `Supprimer ${type === "categorie" ? "la catégorie" : "la collection"}`,
      message: `Voulez-vous vraiment supprimer "${name}" ? Cette action est irréversible.`,
      onConfirm: () => supprimerConfirme(id, type),
    });
  }

  const liste = onglet === "categories" ? categories : collections;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i> {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Catégories & Collections <span className="ak-count-badge">{categories.length + collections.length}</span></h1>
          <p className="ak-page-sub">Organiser les produits par catégories et collections</p>
        </div>
        <button className="ak-btn ak-btn--primary" onClick={() => ouvrirAjout(onglet === "categories" ? "categorie" : "collection")}>
          <i className="ti ti-plus"></i> {onglet === "categories" ? "Catégorie" : "Collection"}
        </button>
      </div>

      <div className="ak-card">
        <div className="ak-card__body" style={{ paddingBottom: 0 }}>
          <div className="ak-tabs" style={{ marginBottom: 0 }}>
            <button className={`ak-tab${onglet === "categories" ? " active" : ""}`} onClick={() => setOnglet("categories")}>
              <i className="ti ti-category"></i> Catégories <span className="ak-count-badge" style={{ fontSize: 11 }}>{categories.length}</span>
            </button>
            <button className={`ak-tab${onglet === "collections" ? " active" : ""}`} onClick={() => setOnglet("collections")}>
              <i className="ti ti-folders"></i> Collections <span className="ak-count-badge" style={{ fontSize: 11 }}>{collections.length}</span>
            </button>
          </div>
        </div>
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Image</th>
                <th>Nom</th>
                <th>Description</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
              ) : liste.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  Aucun élément — <button onClick={() => ouvrirAjout(onglet === "categories" ? "categorie" : "collection")} style={{ color: "#6366f1", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>Ajouter</button>
                </td></tr>
              ) : liste.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center" }}>
                        <i className={`ti ${onglet === "categories" ? "ti-tag" : "ti-folder"}`} style={{ color: "#6366f1" }}></i>
                      </div>
                    )}
                  </td>
                  <td><span className="ak-cell-bold">{c.name}</span></td>
                  <td><span className="ak-cell-muted">{c.description || "—"}</span></td>
                  <td><span className="ak-cell-muted">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span></td>
                  <td className="ak-cell-actions">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon" onClick={() => ouvrirEdition(c, onglet === "categories" ? "categorie" : "collection")}><i className="ti ti-edit" style={{ fontSize: 15 }}></i></button>
                      <button className="ak-btn ak-btn--danger ak-btn--sm ak-btn--icon" onClick={() => supprimer(c.id, onglet === "categories" ? "categorie" : "collection", c.name)}><i className="ti ti-trash" style={{ fontSize: 15 }}></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="ak-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ak-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">{editId ? `Modifier la ${modalType}` : `Nouvelle ${modalType}`}</h3>
              <button className="ak-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-field">
                <label className="ak-label">Image</label>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div className={`ak-upload-zone${erreurs.image ? " ak-upload-zone--error" : ""}`} onClick={() => fileRef.current?.click()}
                    style={{ width: 90, height: 90, background: imagePreview ? `url(${imagePreview}) center/cover no-repeat` : undefined }}>
                    {!imagePreview && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 11 }}><i className="ti ti-cloud-upload" style={{ fontSize: 22, display: "block" }}></i>Cliquer</div>}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>JPG, PNG, WebP — max 5 Mo</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => fileRef.current?.click()}>
                        <i className="ti ti-upload"></i> {imagePreview ? "Changer" : "Choisir"}
                      </button>
                      {imagePreview && <button type="button" className="ak-btn ak-btn--danger ak-btn--sm ak-btn--icon" onClick={() => { setImageFile(null); setImagePreview(null); setForm({ ...form, image_url: "" }); }}><i className="ti ti-trash"></i></button>}
                    </div>
                    {erreurs.image && <p className="ak-field-error">{erreurs.image}</p>}
                  </div>
                </div>
              </div>
              <div className="ak-field">
                <label className="ak-label">Nom <span>*</span></label>
                <input className={`ak-input${erreurs.name ? " ak-input--error" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {erreurs.name && <p className="ak-field-error">{erreurs.name}</p>}
              </div>
              <div className="ak-field" style={{ marginBottom: 0 }}>
                <label className="ak-label">Description</label>
                <textarea className="ak-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}></textarea>
              </div>
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="ak-btn ak-btn--primary" onClick={sauvegarder} disabled={uploading}>{uploading ? "Upload..." : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation ── */}
      {confirmAction && (
        <div className="ak-modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="ak-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">
                <i className="ti ti-alert-triangle" style={{ marginRight: 8, color: "#f43f5e" }}></i>
                {confirmAction.title}
              </h3>
              <button className="ak-modal__close" onClick={() => setConfirmAction(null)}>✕</button>
            </div>
            <div className="ak-modal__body">
              <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>{confirmAction.message}</p>
              {confirmAction.detail && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff1f2", borderRadius: 10, borderLeft: "3px solid #f43f5e", fontSize: 13, color: "#9f1239" }}>
                  {confirmAction.detail}
                </div>
              )}
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setConfirmAction(null)}>Annuler</button>
              <button className="ak-btn ak-btn--danger" onClick={confirmAction.onConfirm}>
                <i className="ti ti-trash"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
