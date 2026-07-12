"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "products";

type Produit = {
  id: string; title: string; price: number; compare_price: number | null;
  stock: number; status: string; short_description: string | null;
  image_url: string | null; loyalty_points: number; category_id: string | null;
  display_order: number; categories?: { name: string } | null;
};
type Categorie = { id: string; name: string };
type Media = { id?: string; url: string; type: "image" | "video"; position: number; isNew?: boolean; file?: File };

export default function ProduitsPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideoInput, setShowVideoInput] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "", category_id: "", price: "",
    stock: "0", short_description: "", status: "draft", loyalty_points: "0", display_order: "0",
  });

  function getPublicUrl(path: string) { return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }
  function showAlert(msg: string, type: string) { setAlert({ message: msg, type }); setTimeout(() => setAlert({ message: "", type: "" }), 3000); }

  async function chargerProduits() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*, categories(name)")
      .order("display_order", { ascending: true }).order("created_at", { ascending: false });
    setProduits(data ?? []);
    setLoading(false);
  }
  async function chargerCategories() { const { data } = await supabase.from("categories").select("id, name"); setCategories(data ?? []); }

  useEffect(() => { chargerProduits(); chargerCategories(); }, []);

  async function chargerMedias(productId: string) {
    const { data } = await supabase.from("product_media").select("*").eq("product_id", productId).order("position");
    setMediaItems((data ?? []).map((m) => ({ id: m.id, url: m.url, type: m.type as "image" | "video", position: m.position })));
  }

  function ouvrirAjout() {
    setEditId(null); setErreurs({}); setMediaItems([]);
    setForm({ title: "", category_id: "", price: "", compare_price: "", stock: "0", short_description: "", status: "draft", loyalty_points: "0", display_order: "0" });
    setShowModal(true);
  }

  async function ouvrirEdition(p: Produit) {
    setEditId(p.id); setErreurs({});
    setForm({ title: p.title, category_id: p.category_id ?? "", price: String(p.price), stock: String(p.stock), short_description: p.short_description ?? "", status: p.status, loyalty_points: String(p.loyalty_points ?? 0), display_order: String(p.display_order ?? 0) });
    await chargerMedias(p.id);
    setShowModal(true);
  }

  function handleImagesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newItems: Media[] = files.map((file, i) => ({
      url: URL.createObjectURL(file),
      type: "image" as const,
      position: mediaItems.length + i,
      isNew: true,
      file,
    }));
    setMediaItems((prev) => [...prev, ...newItems]);
    if (imageFileRef.current) imageFileRef.current.value = "";
  }

  function addVideoUrl() {
    if (!videoUrl.trim()) return;
    setMediaItems((prev) => [...prev, { url: videoUrl.trim(), type: "video", position: prev.length, isNew: true }]);
    setVideoUrl(""); setShowVideoInput(false);
  }

  function removeMedia(idx: number) {
    setMediaItems((prev) => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, position: i })));
  }

  function moveMedia(idx: number, dir: "up" | "down") {
    const next = dir === "up" ? idx - 1 : idx + 1;
    if (next < 0 || next >= mediaItems.length) return;
    setMediaItems((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr.map((m, i) => ({ ...m, position: i }));
    });
  }

  function valider() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Nom obligatoire.";
    else if (form.title.trim().length < 3) e.title = "Min 3 caractères.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Prix obligatoire > 0.";
    if (form.stock === "" || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = "Stock invalide.";
    setErreurs(e); return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    setUploading(true);

    const slug = form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Première image comme image_url principale (pour rétrocompatibilité)
    const firstImage = mediaItems.find((m) => m.type === "image");
    let mainImageUrl: string | null = null;
    if (firstImage) {
      if (firstImage.isNew && firstImage.file) {
        const ext = firstImage.file.name.split(".").pop();
        const fileName = `${Date.now()}_main.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(fileName, firstImage.file, { upsert: false });
        if (!error) mainImageUrl = getPublicUrl(fileName);
      } else {
        mainImageUrl = firstImage.url;
      }
    }

    const payload = {
      title: form.title.trim(), slug,
      category_id: form.category_id || null,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      short_description: form.short_description.trim(),
      status: form.status,
      image_url: mainImageUrl,
      loyalty_points: parseInt(form.loyalty_points) || 0,
      display_order: parseInt(form.display_order) || 0,
    };

    let productId = editId;

    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) { showAlert("Erreur : " + error.message, "danger"); setUploading(false); return; }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) { showAlert("Erreur : " + (error?.message ?? ""), "danger"); setUploading(false); return; }
      productId = data.id;
    }

    // Supprimer les anciens médias si on est en édition
    if (editId) {
      await supabase.from("product_media").delete().eq("product_id", editId);
    }

    // Upload + insérer les médias
    const mediasToInsert = [];
    for (let i = 0; i < mediaItems.length; i++) {
      const m = mediaItems[i];
      let url = m.url;
      if (m.isNew && m.file) {
        const ext = m.file.name.split(".").pop();
        const fileName = `${productId}_${Date.now()}_${i}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(fileName, m.file, { upsert: false });
        if (!error) url = getPublicUrl(fileName);
      }
      mediasToInsert.push({ product_id: productId, url, type: m.type, position: i });
    }

    if (mediasToInsert.length > 0) {
      await supabase.from("product_media").insert(mediasToInsert);
    }

    // Notification automatique : nouveau produit publié uniquement.
    // Les notifications de solde sont envoyées manuellement depuis
    // Admin → Soldes (statut « Envoyée / Non envoyée »).
    const avant = editId ? produits.find((p) => p.id === editId) : null;
    const publie = payload.status === "published";
    const devientPublic = publie && (avant ? avant.status !== "published" : true);
    if (devientPublic) {
      fetch("/api/push/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🆕 Nouveau produit disponible",
          body: `${payload.title} — ${payload.price} DT`,
          tag: "nouveau",
          url: `/produit/${productId}`,
          image: mainImageUrl ?? undefined,
        }),
      }).catch(() => {});
    }

    showAlert(editId ? "Produit mis à jour !" : "Produit ajouté !", "success");
    setUploading(false);
    setShowModal(false);
    chargerProduits();
  }

  async function supprimerProduit(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id);
    showAlert("Produit supprimé.", "success");
    chargerProduits();
  }

  async function deplacerProduit(id: string, direction: "up" | "down") {
    const idx = produits.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= produits.length) return;
    const current = produits[idx];
    const other = produits[swapIdx];
    await Promise.all([
      supabase.from("products").update({ display_order: other.display_order }).eq("id", current.id),
      supabase.from("products").update({ display_order: current.display_order }).eq("id", other.id),
    ]);
    chargerProduits();
  }

  function isVideo(url: string) { return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo") || /\.(mp4|webm|mov)/.test(url); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i> {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Produits <span className="ak-count-badge">{produits.length}</span></h1>
          <p className="ak-page-sub">Gérer le catalogue de produits</p>
        </div>
        <button className="ak-btn ak-btn--primary" onClick={ouvrirAjout}>
          <i className="ti ti-plus"></i> Ajouter un produit
        </button>
      </div>

      <div className="ak-card">
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Ordre</th>
                <th style={{ width: 56 }}>Image</th>
                <th>Nom</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
              ) : produits.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  Aucun produit — <button onClick={ouvrirAjout} style={{ color: "#6366f1", border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>Ajouter le premier</button>
                </td></tr>
              ) : produits.map((p, idx) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <button onClick={() => deplacerProduit(p.id, "up")} disabled={idx === 0}
                        style={{ width: 24, height: 24, borderRadius: 6, border: "1.5px solid #e2e8f0", background: idx === 0 ? "#f8fafc" : "#fff", cursor: idx === 0 ? "default" : "pointer", display: "grid", placeItems: "center", color: idx === 0 ? "#cbd5e1" : "#64748b" }}>▲</button>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{p.display_order}</span>
                      <button onClick={() => deplacerProduit(p.id, "down")} disabled={idx === produits.length - 1}
                        style={{ width: 24, height: 24, borderRadius: 6, border: "1.5px solid #e2e8f0", background: idx === produits.length - 1 ? "#f8fafc" : "#fff", cursor: idx === produits.length - 1 ? "default" : "pointer", display: "grid", placeItems: "center", color: idx === produits.length - 1 ? "#cbd5e1" : "#64748b" }}>▼</button>
                    </div>
                  </td>
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center" }}>
                        <i className="ti ti-photo" style={{ color: "#94a3b8" }}></i>
                      </div>
                    )}
                  </td>
                  <td><span className="ak-cell-bold">{p.title}</span></td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{p.price} DT</span>
                    {p.compare_price && p.compare_price > p.price && (
                      <span className="ak-badge ak-badge--danger" style={{ marginLeft: 6, fontSize: 10 }}>Solde</span>
                    )}
                  </td>
                  <td><span style={{ fontWeight: 700, color: p.stock === 0 ? "#ef4444" : p.stock < 5 ? "#f59e0b" : "#10b981" }}>{p.stock}</span></td>
                  <td><span className="ak-cell-muted">{p.categories?.name ?? "Sans catégorie"}</span></td>
                  <td><span className={`ak-badge ${p.status === "published" ? "ak-badge--success" : "ak-badge--muted"}`}>{p.status === "published" ? "Publié" : "Brouillon"}</span></td>
                  <td className="ak-cell-actions">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon" onClick={() => ouvrirEdition(p)}><i className="ti ti-edit" style={{ fontSize: 15 }}></i></button>
                      <button className="ak-btn ak-btn--danger ak-btn--sm ak-btn--icon" onClick={() => supprimerProduit(p.id)}><i className="ti ti-trash" style={{ fontSize: 15 }}></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal produit */}
      {showModal && (
        <div className="ak-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">{editId ? "Modifier le produit" : "Nouveau produit"}</h3>
              <button className="ak-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="ak-modal__body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ===== SECTION MÉDIAS ===== */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <label className="ak-label" style={{ margin: 0 }}>Images & Vidéos</label>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>La 1ère image sera utilisée comme visuel principal</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => imageFileRef.current?.click()}>
                      <i className="ti ti-photo"></i> Ajouter images
                    </button>
                    <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setShowVideoInput(!showVideoInput)}>
                      <i className="ti ti-brand-youtube"></i> Ajouter vidéo
                    </button>
                    <input ref={imageFileRef} type="file" accept="image/*" multiple onChange={handleImagesSelect} style={{ display: "none" }} />
                  </div>
                </div>

                {/* Champ URL vidéo */}
                {showVideoInput && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: 12, background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                    <input className="ak-input" placeholder="URL YouTube, Vimeo ou fichier vidéo..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="ak-btn ak-btn--primary ak-btn--sm" onClick={addVideoUrl}>Ajouter</button>
                    <button type="button" className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => { setShowVideoInput(false); setVideoUrl(""); }}>✕</button>
                  </div>
                )}

                {/* Grille médias */}
                {mediaItems.length === 0 ? (
                  <div onClick={() => imageFileRef.current?.click()} style={{ border: "2px dashed #e2e8f0", borderRadius: 12, padding: 32, textAlign: "center", cursor: "pointer", background: "#f8fafc", transition: "border-color 0.2s" }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = "#6366f1")} onMouseOut={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                    <i className="ti ti-photo-plus" style={{ fontSize: 36, color: "#94a3b8", display: "block", marginBottom: 8 }}></i>
                    <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Cliquez pour ajouter des images ou vidéos</p>
                    <p style={{ color: "#94a3b8", fontSize: 11, margin: "4px 0 0" }}>JPG, PNG, WebP — max 5 Mo par fichier</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                    {mediaItems.map((m, idx) => (
                      <div key={idx} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: idx === 0 ? "2px solid #6366f1" : "1.5px solid #e2e8f0", background: "#f1f5f9", aspectRatio: "1" }}>
                        {m.type === "video" || isVideo(m.url) ? (
                          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "#0f172a" }}>
                            <i className="ti ti-player-play" style={{ fontSize: 28, color: "#fff" }}></i>
                          </div>
                        ) : (
                          <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        {idx === 0 && (
                          <div style={{ position: "absolute", top: 4, left: 4, background: "#6366f1", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>PRINCIPAL</div>
                        )}
                        {/* Controls overlay */}
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background 0.2s", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 4, gap: 3 }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.45)")} onMouseOut={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}>
                          <button onClick={() => moveMedia(idx, "up")} disabled={idx === 0}
                            style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: "rgba(255,255,255,0.9)", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 10 }}>◀</button>
                          <button onClick={() => removeMedia(idx)}
                            style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 12 }}>✕</button>
                          <button onClick={() => moveMedia(idx, "down")} disabled={idx === mediaItems.length - 1}
                            style={{ width: 22, height: 22, borderRadius: 4, border: "none", background: "rgba(255,255,255,0.9)", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 10 }}>▶</button>
                        </div>
                      </div>
                    ))}
                    {/* Zone d'ajout */}
                    <div onClick={() => imageFileRef.current?.click()} style={{ border: "2px dashed #e2e8f0", borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer", aspectRatio: "1", background: "#f8fafc", transition: "border-color 0.2s" }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = "#6366f1")} onMouseOut={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                      <i className="ti ti-plus" style={{ fontSize: 22, color: "#94a3b8" }}></i>
                    </div>
                  </div>
                )}
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />

              {/* ===== INFOS PRODUIT ===== */}
              <div className="ak-form-row">
                <div className="ak-field">
                  <label className="ak-label">Nom <span>*</span></label>
                  <input className={`ak-input${erreurs.title ? " ak-input--error" : ""}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  {erreurs.title && <p className="ak-field-error">{erreurs.title}</p>}
                </div>
                <div className="ak-field">
                  <label className="ak-label">Catégorie</label>
                  <select className="ak-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Sans catégorie</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div className="ak-field">
                  <label className="ak-label">Prix (DT) <span>*</span></label>
                  <input type="number" step="0.01" className={`ak-input${erreurs.price ? " ak-input--error" : ""}`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  {erreurs.price && <p className="ak-field-error">{erreurs.price}</p>}
                </div>
                <div className="ak-field">
                  <label className="ak-label">Stock <span>*</span></label>
                  <input type="number" className={`ak-input${erreurs.stock ? " ak-input--error" : ""}`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  {erreurs.stock && <p className="ak-field-error">{erreurs.stock}</p>}
                </div>
                <div className="ak-field">
                  <label className="ak-label">Position</label>
                  <input type="number" className="ak-input" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
                  <p className="ak-helper">Ordre d&apos;affichage</p>
                </div>
              </div>

              <div className="ak-field">
                <label className="ak-label">Description courte</label>
                <textarea className="ak-textarea" rows={3} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })}></textarea>
              </div>

              <div className="ak-form-row">
                <div className="ak-field" style={{ marginBottom: 0 }}>
                  <label className="ak-label">Statut</label>
                  <select className="ak-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </div>
                <div className="ak-field" style={{ marginBottom: 0 }}>
                  <label className="ak-label"><i className="ti ti-star" style={{ color: "#f59e0b" }}></i> Points fidélité</label>
                  <input type="number" className="ak-input" value={form.loyalty_points} onChange={(e) => setForm({ ...form, loyalty_points: e.target.value })} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="ak-btn ak-btn--primary" onClick={sauvegarder} disabled={uploading}>
                {uploading ? <><i className="ti ti-loader" style={{ animation: "spin 0.7s linear infinite" }}></i> Enregistrement...</> : "Enregistrer"}
              </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}
    </div>
  );
}
