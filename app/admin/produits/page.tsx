"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Produit = {
  id: string;
  title: string;
  price: number;
  compare_price: number | null;
  stock: number;
  status: string;
  short_description: string | null;
  category_id: string | null;
  categories?: { name: string } | null;
};

type Categorie = { id: string; name: string };

export default function ProduitsPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "", category_id: "", price: "", compare_price: "",
    stock: "0", short_description: "", status: "draft",
  });

  async function chargerProduits() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false });
    setProduits(data ?? []);
    setLoading(false);
  }

  async function chargerCategories() {
    const { data } = await supabase.from("categories").select("id, name");
    setCategories(data ?? []);
  }

  useEffect(() => { chargerProduits(); chargerCategories(); }, []);

  function ouvrirAjout() {
    setEditId(null);
    setErreurs({});
    setForm({ title: "", category_id: "", price: "", compare_price: "", stock: "0", short_description: "", status: "draft" });
    setShowModal(true);
  }

  function ouvrirEdition(p: Produit) {
    setEditId(p.id);
    setErreurs({});
    setForm({
      title: p.title, category_id: p.category_id ?? "",
      price: String(p.price), compare_price: String(p.compare_price ?? ""),
      stock: String(p.stock), short_description: p.short_description ?? "", status: p.status,
    });
    setShowModal(true);
  }

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Le nom du produit est obligatoire.";
    else if (form.title.trim().length < 3) e.title = "Le nom doit contenir au moins 3 caracteres.";
    if (!form.price || isNaN(Number(form.price))) e.price = "Le prix est obligatoire et doit etre un nombre.";
    else if (Number(form.price) <= 0) e.price = "Le prix doit etre superieur a 0.";
    if (form.compare_price && isNaN(Number(form.compare_price))) e.compare_price = "Le prix barre doit etre un nombre.";
    else if (form.compare_price && Number(form.compare_price) <= Number(form.price)) e.compare_price = "Le prix barre doit etre superieur au prix.";
    if (form.stock === "" || isNaN(Number(form.stock))) e.stock = "Le stock doit etre un nombre.";
    else if (Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))) e.stock = "Le stock doit etre un entier positif ou zero.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    const slug = form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = {
      title: form.title.trim(), slug,
      category_id: form.category_id || null,
      price: parseFloat(form.price), compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      stock: parseInt(form.stock), short_description: form.short_description.trim(), status: form.status,
    };
    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "Produit mis a jour avec succes !", type: "success" });
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { setAlert({ message: "Erreur : " + error.message, type: "danger" }); return; }
      setAlert({ message: "Produit ajoute avec succes !", type: "success" });
    }
    setShowModal(false);
    chargerProduits();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerProduit(id: string) {
    if (!confirm("Confirmer la suppression de ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id);
    setAlert({ message: "Produit supprime.", type: "success" });
    chargerProduits();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">
            Gestion des produits <span className="badge bg-light-primary text-primary ms-2">{produits.length}</span>
          </h5>
          <p className="mb-0 text-muted">Donnees synchronisees avec Supabase</p>
        </div>
        <button className="btn btn-primary" onClick={ouvrirAjout}>
          <i className="ti ti-plus me-1"></i> Ajouter un produit
        </button>
      </div>

      {alert.message && <div className={`alert alert-${alert.type} mb-4`}>{alert.message}</div>}

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Nom</th><th>Prix</th><th>Stock</th><th>Categorie</th><th>Statut</th><th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-muted">Chargement...</td></tr>
                ) : produits.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted py-4">Aucun produit — <button className="btn btn-link p-0" onClick={ouvrirAjout}>Ajouter le premier</button></td></tr>
                ) : (
                  produits.map((p) => (
                    <tr key={p.id}>
                      <td><h6 className="fw-semibold mb-0">{p.title}</h6></td>
                      <td>{p.price} DT{p.compare_price && <del className="text-muted ms-2">{p.compare_price} DT</del>}</td>
                      <td>
                        <span className={p.stock === 0 ? "text-danger fw-semibold" : p.stock < 5 ? "text-warning fw-semibold" : ""}>
                          {p.stock}
                        </span>
                      </td>
                      <td>{p.categories?.name ?? "Sans categorie"}</td>
                      <td>
                        <span className={`badge rounded-3 fw-semibold ${p.status === "published" ? "bg-success" : "bg-warning text-dark"}`}>
                          {p.status === "published" ? "Publie" : "Brouillon"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => ouvrirEdition(p)}><i className="ti ti-edit"></i></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => supprimerProduit(p.id)}><i className="ti ti-trash"></i></button>
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
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">{editId ? "Modifier le produit" : "Nouveau produit"}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Nom <span className="text-danger">*</span></label>
                    <input type="text" className={`form-control ${erreurs.title ? "is-invalid" : ""}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    {erreurs.title && <div className="invalid-feedback">{erreurs.title}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Categorie</label>
                    <select className="form-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Sans categorie</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Prix (DT) <span className="text-danger">*</span></label>
                    <input type="number" step="0.01" className={`form-control ${erreurs.price ? "is-invalid" : ""}`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    {erreurs.price && <div className="invalid-feedback">{erreurs.price}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Prix barre</label>
                    <input type="number" step="0.01" className={`form-control ${erreurs.compare_price ? "is-invalid" : ""}`} value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} />
                    {erreurs.compare_price && <div className="invalid-feedback">{erreurs.compare_price}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Stock <span className="text-danger">*</span></label>
                    <input type="number" className={`form-control ${erreurs.stock ? "is-invalid" : ""}`} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                    {erreurs.stock && <div className="invalid-feedback">{erreurs.stock}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description courte</label>
                    <textarea className="form-control" rows={3} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })}></textarea>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Statut</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="draft">Brouillon</option>
                      <option value="published">Publie</option>
                    </select>
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
