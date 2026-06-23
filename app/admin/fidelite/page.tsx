"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LOYALTY, getUserTier } from "@/lib/loyalty-config";

type DeliveredOrder = {
  id: string;
  user_id: string;
  total: number;
  created_at: string;
  profiles?: { full_name: string } | null;
  points_credited: boolean;
};

type Transaction = {
  id: string;
  user_id: string;
  order_id: string | null;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
  expires_at: string | null;
  profiles?: { full_name: string } | null;
};

type UserSummary = { user_id: string; full_name: string; balance: number; lifetime: number };

export default function FidelitePage() {
  const supabase = createClient();
  const [onglet, setOnglet] = useState<"pending" | "history">("pending");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([]);
  const [editPoints, setEditPoints] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  async function chargerTout() {
    const [ordersRes, txRes] = await Promise.all([
      supabase.from("orders").select("*, profiles(full_name)").eq("status", "delivered").order("created_at", { ascending: false }),
      supabase.from("loyalty_transactions").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(500),
    ]);

    const orders = ordersRes.data ?? [];
    const txns = txRes.data ?? [];

    const creditedOrderIds = new Set(txns.filter((t: Transaction) => t.type === "earn" && t.order_id).map((t: Transaction) => t.order_id));
    const ordersWithStatus = orders.map((o) => ({ ...o, points_credited: creditedOrderIds.has(o.id) }));
    setDeliveredOrders(ordersWithStatus);

    const defaults: Record<string, string> = {};
    ordersWithStatus.forEach((o) => {
      if (!o.points_credited) defaults[o.id] = String(Math.floor(o.total * LOYALTY.POINTS_PER_DT));
    });
    setEditPoints(defaults);
    setTransactions(txns);

    const map = new Map<string, UserSummary>();
    txns.forEach((t: Record<string, unknown>) => {
      const uid = t.user_id as string;
      const pts = t.points as number;
      const prof = t.profiles as { full_name: string } | { full_name: string }[] | null;
      const name = Array.isArray(prof) ? prof[0]?.full_name : prof?.full_name;
      const existing = map.get(uid);
      if (existing) {
        existing.balance += pts;
        if (pts > 0) existing.lifetime += pts;
      } else {
        map.set(uid, { user_id: uid, full_name: name ?? "Inconnu", balance: pts, lifetime: pts > 0 ? pts : 0 });
      }
    });
    setUserSummaries(Array.from(map.values()).sort((a, b) => b.lifetime - a.lifetime));
    setLoading(false);
  }

  useEffect(() => { chargerTout(); }, []);

  function showAlert(message: string, type = "success") {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 4000);
  }

  const pendingOrders = deliveredOrders.filter((o) => !o.points_credited);
  const creditedOrders = deliveredOrders.filter((o) => o.points_credited);

  async function validerPoints(orderId: string) {
    const order = deliveredOrders.find((o) => o.id === orderId);
    if (!order) return;
    const pts = parseInt(editPoints[orderId]) || 0;
    if (pts <= 0) { showAlert("Le nombre de points doit etre positif.", "danger"); return; }

    const { error } = await supabase.from("loyalty_transactions").insert({
      user_id: order.user_id, order_id: orderId, points: pts, type: "earn",
      description: `Commande #${orderId.slice(0, 8)} — ${order.total} DT (${pts} pts attribues par admin)`,
      expires_at: new Date(Date.now() + LOYALTY.POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) { showAlert("Erreur : " + error.message, "danger"); return; }
    showAlert(`${pts} points attribues a ${(order.profiles as { full_name: string } | null)?.full_name ?? "l'utilisateur"} !`);
    chargerTout();
  }

  async function ignorerAttribution(orderId: string) {
    if (!confirm("Ignorer l'attribution de points pour cette commande ?")) return;
    const order = deliveredOrders.find((o) => o.id === orderId);
    if (!order) return;
    await supabase.from("loyalty_transactions").insert({
      user_id: order.user_id, order_id: orderId, points: 0, type: "earn",
      description: `Commande #${orderId.slice(0, 8)} — attribution ignoree par admin`,
    });
    showAlert("Attribution ignoree."); chargerTout();
  }

  // Filtrage historique
  const filteredSummaries = searchUser
    ? userSummaries.filter((u) => u.full_name.toLowerCase().includes(searchUser.toLowerCase()))
    : userSummaries;

  const userTxns = selectedUser
    ? transactions.filter((t) => t.user_id === selectedUser)
    : [];

  const selectedUserInfo = selectedUser ? userSummaries.find((u) => u.user_id === selectedUser) : null;

  const TYPE_LABELS: Record<string, { label: string; classe: string }> = {
    earn: { label: "Gagne", classe: "bg-success" },
    redeem_reduction: { label: "Reduction", classe: "bg-warning text-dark" },
    redeem_gift: { label: "Cadeau", classe: "bg-info text-white" },
    admin_adjust: { label: "Ajustement", classe: "bg-secondary" },
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1"><i className="ti ti-star text-warning me-2"></i>Programme de fidelite</h5>
          <p className="mb-0 text-muted">Attribution des points et historique</p>
        </div>
      </div>

      {alert.message && <div className={`alert alert-${alert.type} mb-4`}>{alert.message}</div>}

      <ul className="nav nav-tabs mb-0">
        <li className="nav-item">
          <button className={`nav-link ${onglet === "pending" ? "active" : ""}`} onClick={() => setOnglet("pending")}>
            <i className="ti ti-clock me-1"></i> A attribuer {pendingOrders.length > 0 && <span className="badge bg-warning text-dark ms-1">{pendingOrders.length}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${onglet === "history" ? "active" : ""}`} onClick={() => setOnglet("history")}>
            <i className="ti ti-list me-1"></i> Historique
          </button>
        </li>
      </ul>

      <div className="card" style={{ borderTopLeftRadius: 0 }}>
        <div className="card-body">
          {loading ? <p className="text-center text-muted">Chargement...</p> : (
            <>
              {/* ========== A ATTRIBUER ========== */}
              {onglet === "pending" && (
                <>
                  {pendingOrders.length > 0 && (
                    <>
                      <h6 className="fw-semibold mb-3">Commandes livrees — en attente d&apos;attribution</h6>
                      <div className="table-responsive mb-4">
                        <table className="table align-middle">
                          <thead><tr><th>Client</th><th>Commande</th><th>Montant</th><th>Date</th><th>Points proposes</th><th className="text-end">Actions</th></tr></thead>
                          <tbody>
                            {pendingOrders.map((o) => {
                              const prof = o.profiles as { full_name: string } | null;
                              return (
                                <tr key={o.id}>
                                  <td><h6 className="fw-semibold mb-0">{prof?.full_name ?? "Inconnu"}</h6></td>
                                  <td><code>#{o.id.slice(0, 8)}</code></td>
                                  <td className="fw-semibold">{o.total} DT</td>
                                  <td className="text-muted">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                                  <td>
                                    <input type="number" className="form-control form-control-sm" style={{ width: "100px" }}
                                      value={editPoints[o.id] ?? ""} onChange={(e) => setEditPoints({ ...editPoints, [o.id]: e.target.value })} />
                                  </td>
                                  <td className="text-end">
                                    <div className="d-flex gap-2 justify-content-end">
                                      <button className="btn btn-sm btn-success" onClick={() => validerPoints(o.id)}>
                                        <i className="ti ti-check me-1"></i> Valider
                                      </button>
                                      <button className="btn btn-sm btn-outline-danger" onClick={() => ignorerAttribution(o.id)}>
                                        <i className="ti ti-x"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  {pendingOrders.length === 0 && (
                    <p className="text-center text-muted py-4">Aucune commande en attente d&apos;attribution de points.</p>
                  )}
                  {creditedOrders.length > 0 && (
                    <>
                      <h6 className="fw-semibold mb-3 text-muted">Commandes deja traitees</h6>
                      <div className="table-responsive">
                        <table className="table align-middle table-sm">
                          <thead><tr><th>Client</th><th>Commande</th><th>Montant</th><th>Date</th><th>Statut</th></tr></thead>
                          <tbody>
                            {creditedOrders.slice(0, 20).map((o) => {
                              const prof = o.profiles as { full_name: string } | null;
                              return (
                                <tr key={o.id} className="opacity-75">
                                  <td>{prof?.full_name ?? "Inconnu"}</td>
                                  <td><code>#{o.id.slice(0, 8)}</code></td>
                                  <td>{o.total} DT</td>
                                  <td className="text-muted">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                                  <td><span className="badge bg-success">Points attribues</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ========== HISTORIQUE ========== */}
              {onglet === "history" && (
                <>
                  {/* Recherche */}
                  <div className="mb-4">
                    <div className="input-group" style={{ maxWidth: "400px" }}>
                      <span className="input-group-text"><i className="ti ti-search"></i></span>
                      <input type="text" className="form-control" placeholder="Rechercher par nom d'utilisateur..."
                        value={searchUser} onChange={(e) => { setSearchUser(e.target.value); setSelectedUser(null); }} />
                    </div>
                  </div>

                  {/* Liste des utilisateurs avec total points */}
                  {!selectedUser && (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead><tr><th>Utilisateur</th><th>Niveau</th><th>Total points cumules</th><th>Solde disponible</th><th className="text-end">Actions</th></tr></thead>
                        <tbody>
                          {filteredSummaries.length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-muted py-4">Aucun utilisateur trouve.</td></tr>
                          ) : filteredSummaries.map((u) => {
                            const t = getUserTier(u.lifetime);
                            return (
                              <tr key={u.user_id}>
                                <td><h6 className="fw-semibold mb-0">{u.full_name}</h6></td>
                                <td><span className="badge" style={{ background: `${t.color}20`, color: t.color, border: `1px solid ${t.color}40` }}>{t.icon} {t.name}</span></td>
                                <td className="fw-semibold">{u.lifetime} pts</td>
                                <td><span className={u.balance > 0 ? "text-success fw-semibold" : u.balance < 0 ? "text-danger fw-semibold" : "text-muted"}>{u.balance} pts</span></td>
                                <td className="text-end">
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedUser(u.user_id)}>
                                    <i className="ti ti-eye me-1"></i> Voir l&apos;historique
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Detail transactions d'un utilisateur */}
                  {selectedUser && selectedUserInfo && (
                    <>
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedUser(null)}>
                          <i className="ti ti-arrow-left me-1"></i> Retour
                        </button>
                        <div>
                          <h6 className="fw-semibold mb-0">{selectedUserInfo.full_name}</h6>
                          <div className="d-flex gap-3 mt-1">
                            <span className="badge" style={{ background: `${getUserTier(selectedUserInfo.lifetime).color}20`, color: getUserTier(selectedUserInfo.lifetime).color, border: `1px solid ${getUserTier(selectedUserInfo.lifetime).color}40` }}>
                              {getUserTier(selectedUserInfo.lifetime).icon} {getUserTier(selectedUserInfo.lifetime).name}
                            </span>
                            <span className="text-muted" style={{ fontSize: "13px" }}>Cumul : <strong>{selectedUserInfo.lifetime} pts</strong></span>
                            <span className="text-muted" style={{ fontSize: "13px" }}>Solde : <strong className={selectedUserInfo.balance >= 0 ? "text-success" : "text-danger"}>{selectedUserInfo.balance} pts</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table className="table align-middle">
                          <thead><tr><th>Date</th><th>Type</th><th>Points</th><th>Description</th><th>Commande</th><th>Expiration</th></tr></thead>
                          <tbody>
                            {userTxns.length === 0 ? (
                              <tr><td colSpan={6} className="text-center text-muted py-4">Aucune transaction.</td></tr>
                            ) : userTxns.map((t) => (
                              <tr key={t.id}>
                                <td className="text-muted">{new Date(t.created_at).toLocaleDateString("fr-FR")}</td>
                                <td><span className={`badge ${TYPE_LABELS[t.type]?.classe ?? "bg-secondary"}`}>{TYPE_LABELS[t.type]?.label ?? t.type}</span></td>
                                <td><span className={`fw-semibold ${t.points > 0 ? "text-success" : t.points < 0 ? "text-danger" : "text-muted"}`}>{t.points > 0 ? "+" : ""}{t.points}</span></td>
                                <td className="text-muted" style={{ maxWidth: "280px" }}>{t.description ?? "—"}</td>
                                <td>{t.order_id ? <code>#{t.order_id.slice(0, 8)}</code> : "—"}</td>
                                <td className="text-muted">{t.expires_at ? new Date(t.expires_at).toLocaleDateString("fr-FR") : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
