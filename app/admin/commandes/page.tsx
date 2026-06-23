"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: { title: string } | null;
};

type Commande = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
};

const STATUTS: Record<string, { label: string; classe: string }> = {
  pending: { label: "En attente", classe: "bg-warning text-dark" },
  shipped: { label: "Expediee", classe: "bg-info text-white" },
  delivered: { label: "Livree", classe: "bg-success" },
  cancelled: { label: "Annulee", classe: "bg-danger" },
};

export default function CommandesPage() {
  const supabase = createClient();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showDetail, setShowDetail] = useState(false);
  const [detailCommande, setDetailCommande] = useState<Commande | null>(null);
  const [articles, setArticles] = useState<OrderItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");

  async function chargerCommandes() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });
    setCommandes(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    chargerCommandes();
  }, []);

  async function changerStatut(id: string, nouveauStatut: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: nouveauStatut })
      .eq("id", id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      const msg = nouveauStatut === "delivered"
        ? "Commande livree ! Rendez-vous dans Fidelite pour attribuer les points."
        : "Statut mis a jour avec succes !";
      setAlert({ message: msg, type: "success" });
      chargerCommandes();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerCommande(id: string) {
    if (!confirm("Confirmer la suppression de cette commande ?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Commande supprimee.", type: "success" });
      chargerCommandes();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function ouvrirDetail(commande: Commande) {
    setDetailCommande(commande);
    setShowDetail(true);
    setLoadingArticles(true);
    const { data } = await supabase
      .from("order_items")
      .select("*, products(title)")
      .eq("order_id", commande.id);
    setArticles(data ?? []);
    setLoadingArticles(false);
  }

  const commandesFiltrees = commandes.filter((c) => {
    const texte = `${c.id} ${c.profiles?.full_name ?? ""} ${c.notes ?? ""}`.toLowerCase();
    const matchRecherche = recherche === "" || texte.includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === "" || c.status === filtreStatut;
    return matchRecherche && matchStatut;
  });

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">
            Gestion des commandes{" "}
            <span className="badge bg-light-primary text-primary ms-2">
              {commandes.length}
            </span>
          </h5>
          <p className="mb-0 text-muted">Donnees synchronisees avec Supabase</p>
        </div>
      </div>

      {/* Alert */}
      {alert.message && (
        <div className={`alert alert-${alert.type} mb-4`} role="alert">
          {alert.message}
        </div>
      )}

      {/* Filtres */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher par ID, client, notes..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUTS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">
                {commandesFiltrees.length} resultat(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      Chargement...
                    </td>
                  </tr>
                ) : commandesFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      Aucune commande trouvee.
                    </td>
                  </tr>
                ) : (
                  commandesFiltrees.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <h6 className="fw-semibold mb-0">
                          #{c.id.slice(0, 8)}
                        </h6>
                        {c.notes && (
                          <small className="text-muted">{c.notes}</small>
                        )}
                      </td>
                      <td>{c.profiles?.full_name ?? "Client inconnu"}</td>
                      <td className="fw-semibold">{c.total} DT</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: "140px" }}
                          value={c.status}
                          onChange={(e) => changerStatut(c.id, e.target.value)}
                        >
                          {Object.entries(STATUTS).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-muted">
                        {new Date(c.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => ouvrirDetail(c)}
                          >
                            <i className="ti ti-eye me-1"></i> Detail
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => supprimerCommande(c.id)}
                          >
                            <i className="ti ti-trash"></i>
                          </button>
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

      {/* Modal detail */}
      {showDetail && detailCommande && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">
                  Commande #{detailCommande.id.slice(0, 8)}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDetail(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-4">
                    <strong>Client :</strong>{" "}
                    {detailCommande.profiles?.full_name ?? "Inconnu"}
                  </div>
                  <div className="col-md-4">
                    <strong>Total :</strong> {detailCommande.total} DT
                  </div>
                  <div className="col-md-4">
                    <strong>Statut :</strong>{" "}
                    <span
                      className={`badge rounded-3 fw-semibold ${STATUTS[detailCommande.status]?.classe ?? "bg-secondary"}`}
                    >
                      {STATUTS[detailCommande.status]?.label ?? detailCommande.status}
                    </span>
                  </div>
                </div>
                {detailCommande.notes && (
                  <p className="text-muted mb-3">
                    <strong>Notes :</strong> {detailCommande.notes}
                  </p>
                )}
                <h6 className="fw-semibold mb-2">Articles</h6>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Quantite</th>
                        <th>Prix unitaire</th>
                        <th>Sous-total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingArticles ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            Chargement...
                          </td>
                        </tr>
                      ) : articles.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            Aucun article.
                          </td>
                        </tr>
                      ) : (
                        articles.map((a) => (
                          <tr key={a.id}>
                            <td>{a.products?.title ?? "Produit supprime"}</td>
                            <td>{a.quantity}</td>
                            <td>{a.unit_price} DT</td>
                            <td className="fw-semibold">
                              {(a.quantity * a.unit_price).toFixed(2)} DT
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-light"
                  onClick={() => setShowDetail(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
