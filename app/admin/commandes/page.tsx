"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrderItem = { id: string; order_id: string; product_id: string; quantity: number; unit_price: number; products?: { title: string } | null };
type Commande = { id: string; user_id: string | null; total: number; status: string; notes: string | null; created_at: string; guest_name: string | null; guest_phone: string | null; guest_address: string | null; profiles?: { full_name: string } | null };

const STATUTS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente", cls: "ak-badge--warning" },
  shipped:   { label: "Expédiée",   cls: "ak-badge--info" },
  delivered: { label: "Livrée",     cls: "ak-badge--success" },
  cancelled: { label: "Annulée",    cls: "ak-badge--danger" },
};

export default function CommandesPage() {
  const supabase = createClient();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<Commande | null>(null);
  const [articles, setArticles] = useState<OrderItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; detail?: string; onConfirm: () => void } | null>(null);

  async function charger() {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false });
    setCommandes(data ?? []);
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  function showAlert(msg: string, type: string) {
    setAlert({ message: msg, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function changerStatut(id: string, statut: string) {
    const { error } = await supabase.from("orders").update({ status: statut }).eq("id", id);
    if (error) showAlert("Erreur : " + error.message, "danger");
    else { showAlert(statut === "delivered" ? "Livraison confirmée ! Pensez à attribuer les points fidélité." : "Statut mis à jour !", "success"); charger(); }
  }

  async function supprimerConfirme(id: string) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    setConfirmAction(null);
    if (error) showAlert("Erreur : " + error.message, "danger");
    else { showAlert("Commande supprimée.", "success"); charger(); }
  }

  function supprimer(c: Commande) {
    const client = c.profiles?.full_name ?? c.guest_name ?? "Inconnu";
    setConfirmAction({
      title: "Supprimer la commande",
      message: `Voulez-vous vraiment supprimer la commande de « ${client} » (#${c.id.slice(0, 8)}) ?`,
      detail: "Cette action est irréversible. Les articles liés seront également supprimés.",
      onConfirm: () => supprimerConfirme(c.id),
    });
  }

  async function ouvrirDetail(c: Commande) {
    setDetail(c); setShowDetail(true); setLoadingArticles(true);
    const { data } = await supabase.from("order_items").select("*, products(title)").eq("order_id", c.id);
    setArticles(data ?? []); setLoadingArticles(false);
  }

  function getClient(c: Commande) { return c.profiles?.full_name ?? c.guest_name ?? "Inconnu"; }

  const filtrees = commandes.filter((c) => {
    const t = `${c.id} ${c.profiles?.full_name ?? ""} ${c.guest_name ?? ""} ${c.guest_phone ?? ""} ${c.notes ?? ""}`.toLowerCase();
    return (recherche === "" || t.includes(recherche.toLowerCase())) && (filtreStatut === "" || c.status === filtreStatut);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alert.message && (
        <div className={`ak-toast ak-toast--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check-circle" : "ti-alert-circle"} ak-toast__icon`}></i>
          {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Commandes <span className="ak-count-badge">{commandes.length}</span></h1>
          <p className="ak-page-sub">Gestion de toutes les commandes</p>
        </div>
      </div>

      <div className="ak-card">
        <div className="ak-card__body">
          <div className="ak-filters">
            <div className="ak-search" style={{ flex: 1, minWidth: 200 }}>
              <i className="ti ti-search"></i>
              <input className="ak-input" placeholder="Rechercher par ID, client, notes..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            </div>
            <select className="ak-select" style={{ width: 180 }} value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="ak-filters__count">{filtrees.length} résultat(s)</span>
          </div>
        </div>
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
              ) : filtrees.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucune commande trouvée.</td></tr>
              ) : filtrees.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="ak-cell-mono">#{c.id.slice(0, 8)}</span>
                    {c.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{c.notes}</div>}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "grid", placeItems: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {getClient(c).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{getClient(c)}</div>
                        {!c.user_id && c.guest_name && <span className="ak-badge ak-badge--muted" style={{ fontSize: 10, padding: "2px 6px" }}>Invité</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="ak-cell-bold">{c.total} DT</span></td>
                  <td>
                    <select
                      value={c.status}
                      onChange={(e) => changerStatut(c.id, e.target.value)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#fff", color: "#0f172a" }}
                    >
                      {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td><span className="ak-cell-muted">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span></td>
                  <td className="ak-cell-actions">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon" onClick={() => ouvrirDetail(c)} title="Voir détail">
                        <i className="ti ti-eye" style={{ fontSize: 15 }}></i>
                      </button>
                      <button className="ak-btn ak-btn--danger ak-btn--sm ak-btn--icon" onClick={() => supprimer(c)} title="Supprimer">
                        <i className="ti ti-trash" style={{ fontSize: 15 }}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal confirmation suppression (pattern unifié) ── */}
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

      {/* Modal detail */}
      {showDetail && detail && (
        <div className="ak-modal-backdrop" onClick={() => setShowDetail(false)}>
          <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <div>
                <h3 className="ak-modal__title">
                  <i className="ti ti-shopping-cart" style={{ marginRight: 8, color: "#6366f1" }}></i>
                  Commande <span style={{ color: "#6366f1" }}>#{detail.id.slice(0, 8)}</span>
                </h3>
                {!detail.user_id && detail.guest_name && <span className="ak-badge ak-badge--muted" style={{ marginTop: 4 }}>Commande invité</span>}
              </div>
              <button className="ak-modal__close" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="ak-modal__body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Client</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{detail.profiles?.full_name ?? detail.guest_name ?? "Inconnu"}</div>
                </div>
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{detail.total} DT</div>
                </div>
                <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Statut</div>
                  <span className={`ak-badge ak-badge--dot ${STATUTS[detail.status]?.cls ?? "ak-badge--muted"}`}>{STATUTS[detail.status]?.label ?? detail.status}</span>
                </div>
              </div>

              {!detail.user_id && detail.guest_name && (
                <div style={{ background: "#ede9fe", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6", marginBottom: 10 }}>Informations invité</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[["Nom", detail.guest_name], ["Téléphone", detail.guest_phone ?? "—"], ["Adresse", detail.guest_address ?? "—"]].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, color: "#7c3aed", marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#0f172a" }}>Articles commandés</div>
              <div className="ak-table-wrap">
                <table className="ak-table">
                  <thead><tr><th>Produit</th><th>Quantité</th><th>Prix unit.</th><th>Sous-total</th></tr></thead>
                  <tbody>
                    {loadingArticles ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>Chargement...</td></tr>
                    ) : articles.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>Aucun article</td></tr>
                    ) : articles.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.products?.title ?? "Produit supprimé"}</td>
                        <td>{a.quantity}</td>
                        <td>{a.unit_price} DT</td>
                        <td><span className="ak-cell-bold">{(a.quantity * a.unit_price).toFixed(2)} DT</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowDetail(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
