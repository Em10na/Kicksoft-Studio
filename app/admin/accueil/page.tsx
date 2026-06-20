"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Template = {
  id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  page: string;
};

type Produit = {
  id: string;
  title: string;
  price: number;
  featured: boolean;
  status: string;
};

export default function AccueilPage() {
  const supabase = createClient();
  const [template, setTemplate] = useState<Template | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    body: "",
  });

  async function chargerTemplate() {
    const { data } = await supabase
      .from("templates")
      .select("*")
      .eq("page", "home")
      .single();
    if (data) {
      setTemplate(data);
      setForm({
        title: data.title ?? "",
        subtitle: data.subtitle ?? "",
        body: data.body ?? "",
      });
    }
  }

  async function chargerProduits() {
    const { data } = await supabase
      .from("products")
      .select("id, title, price, featured, status")
      .eq("status", "published")
      .order("title", { ascending: true });
    setProduits(data ?? []);
  }

  useEffect(() => {
    Promise.all([chargerTemplate(), chargerProduits()]).then(() =>
      setLoading(false)
    );
  }, []);

  async function sauvegarderHero() {
    if (!template) return;
    const { error } = await supabase
      .from("templates")
      .update({
        title: form.title,
        subtitle: form.subtitle,
        body: form.body,
      })
      .eq("id", template.id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Hero mis a jour avec succes !", type: "success" });
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function toggleFeatured(produitId: string, actuel: boolean) {
    const { error } = await supabase
      .from("products")
      .update({ featured: !actuel })
      .eq("id", produitId);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({
        message: !actuel
          ? "Produit mis en avant !"
          : "Produit retire de la mise en avant.",
        type: "success",
      });
      chargerProduits();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <p className="text-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">Page d&apos;accueil</h5>
          <p className="mb-0 text-muted">
            Personnalisez le hero et les produits mis en avant
          </p>
        </div>
      </div>

      {/* Alert */}
      {alert.message && (
        <div className={`alert alert-${alert.type} mb-4`} role="alert">
          {alert.message}
        </div>
      )}

      {/* Section Hero */}
      <div className="card mb-4">
        <div className="card-body">
          <h6 className="fw-semibold mb-3">
            <i className="ti ti-star me-2"></i>Section Hero
          </h6>
          {!template ? (
            <p className="text-muted">
              Aucun template trouve pour la page d&apos;accueil.
            </p>
          ) : (
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Titre principal</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Sous-titre</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                />
              </div>
              <div className="col-12">
                <label className="form-label">Contenu (body)</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                ></textarea>
              </div>
              <div className="col-12">
                <button className="btn btn-primary" onClick={sauvegarderHero}>
                  <i className="ti ti-device-floppy me-1"></i> Enregistrer le
                  Hero
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Produits mis en avant */}
      <div className="card">
        <div className="card-body">
          <h6 className="fw-semibold mb-3">
            <i className="ti ti-sparkles me-2"></i>Produits mis en avant{" "}
            <span className="badge bg-light-primary text-primary ms-2">
              {produits.filter((p) => p.featured).length} /{" "}
              {produits.length}
            </span>
          </h6>
          {produits.length === 0 ? (
            <p className="text-muted">
              Aucun produit publie.{" "}
              <a href="/admin/produits">Ajouter des produits</a>
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>Vedette</th>
                    <th>Produit</th>
                    <th>Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((p) => (
                    <tr
                      key={p.id}
                      className={p.featured ? "table-active" : ""}
                    >
                      <td>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={p.featured}
                            onChange={() => toggleFeatured(p.id, p.featured)}
                          />
                        </div>
                      </td>
                      <td>
                        <h6 className="fw-semibold mb-0">{p.title}</h6>
                      </td>
                      <td>{p.price} DT</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
