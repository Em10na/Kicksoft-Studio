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
      if (!o.points_credited) defaults[o.id] = String(Math.floor(o.total * LOYALTY.EARN_RATE));
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

  const filteredSummaries = searchUser
    ? userSummaries.filter((u) => u.full_name.toLowerCase().includes(searchUser.toLowerCase()))
    : userSummaries;

  const userTxns = selectedUser ? transactions.filter((t) => t.user_id === selectedUser) : [];
  const selectedUserInfo = selectedUser ? userSummaries.find((u) => u.user_id === selectedUser) : null;

  const TYPE_LABELS: Record<string, { label: string; badge: string }> = {
    earn:             { label: "Gagne",       badge: "ak-badge--success" },
    redeem_reduction: { label: "Reduction",   badge: "ak-badge--warning" },
    redeem_gift:      { label: "Cadeau",      badge: "ak-badge--info" },
    admin_adjust:     { label: "Ajustement",  badge: "ak-badge--muted" },
  };

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 20, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-star" style={{ color: "#f59e0b" }}></i>
            Programme de fidelite
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--a-ink-mute)", fontSize: 13 }}>Attribution des points et historique</p>
        </div>
      </div>

      {/* Alerte */}
      {alert.message && (
        <div style={{
          marginBottom: 20, padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: alert.type === "danger" ? "#fef2f2" : "#f0fdf4",
          color: alert.type === "danger" ? "#b91c1c" : "#15803d",
          border: `1px solid ${alert.type === "danger" ? "#fecaca" : "#bbf7d0"}`,
        }}>
          <i className={`ti ${alert.type === "danger" ? "ti-alert-circle" : "ti-circle-check"}`} style={{ marginRight: 6 }}></i>
          {alert.message}
        </div>
      )}

      {/* Onglets */}
      <div className="ak-tabs">
        <button className={`ak-tab-btn${onglet === "pending" ? " ak-tab-btn--active" : ""}`} onClick={() => setOnglet("pending")}>
          <i className="ti ti-clock"></i>
          A attribuer
          {pendingOrders.length > 0 && (
            <span className="ak-badge ak-badge--warning" style={{ marginLeft: 4 }}>{pendingOrders.length}</span>
          )}
        </button>
        <button className={`ak-tab-btn${onglet === "history" ? " ak-tab-btn--active" : ""}`} onClick={() => setOnglet("history")}>
          <i className="ti ti-list"></i>
          Historique
        </button>
      </div>

      {/* Contenu */}
      <div className="ak-card">
        <div className="ak-card__body">
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--a-ink-mute)", padding: "32px 0" }}>Chargement...</p>
          ) : (
            <>
              {/* ========== A ATTRIBUER ========== */}
              {onglet === "pending" && (
                <>
                  {pendingOrders.length > 0 && (
                    <>
                      <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
                        Commandes livrees — en attente d&apos;attribution
                      </h3>
                      <div className="ak-table-wrap" style={{ marginBottom: 32 }}>
                        <table className="ak-table">
                          <thead>
                            <tr>
                              <th>Client</th><th>Commande</th><th>Montant</th>
                              <th>Date</th><th>Points proposes</th>
                              <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingOrders.map((o) => {
                              const prof = o.profiles as { full_name: string } | null;
                              return (
                                <tr key={o.id}>
                                  <td style={{ fontWeight: 600 }}>{prof?.full_name ?? "Inconnu"}</td>
                                  <td><code style={{ fontFamily: "monospace", fontSize: 12, background: "var(--a-bg)", padding: "2px 6px", borderRadius: 5 }}>#{o.id.slice(0, 8)}</code></td>
                                  <td style={{ fontWeight: 600 }}>{o.total} DT</td>
                                  <td style={{ color: "var(--a-ink-mute)" }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                                  <td>
                                    <input
                                      type="number"
                                      className="ak-input ak-input--sm"
                                      style={{ width: 90 }}
                                      value={editPoints[o.id] ?? ""}
                                      onChange={(e) => setEditPoints({ ...editPoints, [o.id]: e.target.value })}
                                    />
                                  </td>
                                  <td style={{ textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                      <button className="ak-btn ak-btn--sm ak-btn--success" onClick={() => validerPoints(o.id)}>
                                        <i className="ti ti-check" style={{ marginRight: 4 }}></i>Valider
                                      </button>
                                      <button className="ak-btn ak-btn--sm ak-btn--danger-ghost" onClick={() => ignorerAttribution(o.id)}>
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
                    <p style={{ textAlign: "center", color: "var(--a-ink-mute)", padding: "32px 0" }}>
                      Aucune commande en attente d&apos;attribution de points.
                    </p>
                  )}

                  {creditedOrders.length > 0 && (
                    <>
                      <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: "var(--a-ink-mute)" }}>
                        Commandes deja traitees
                      </h3>
                      <div className="ak-table-wrap">
                        <table className="ak-table">
                          <thead>
                            <tr><th>Client</th><th>Commande</th><th>Montant</th><th>Date</th><th>Statut</th></tr>
                          </thead>
                          <tbody>
                            {creditedOrders.slice(0, 20).map((o) => {
                              const prof = o.profiles as { full_name: string } | null;
                              return (
                                <tr key={o.id} style={{ opacity: 0.7 }}>
                                  <td>{prof?.full_name ?? "Inconnu"}</td>
                                  <td><code style={{ fontFamily: "monospace", fontSize: 12, background: "var(--a-bg)", padding: "2px 6px", borderRadius: 5 }}>#{o.id.slice(0, 8)}</code></td>
                                  <td>{o.total} DT</td>
                                  <td style={{ color: "var(--a-ink-mute)" }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                                  <td><span className="ak-badge ak-badge--success">Points attribues</span></td>
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
                  <div style={{ marginBottom: 20 }}>
                    <div className="ak-input-group" style={{ maxWidth: 400 }}>
                      <span className="ak-input-prefix"><i className="ti ti-search"></i></span>
                      <input
                        type="text"
                        className="ak-input"
                        placeholder="Rechercher par nom d'utilisateur..."
                        value={searchUser}
                        onChange={(e) => { setSearchUser(e.target.value); setSelectedUser(null); }}
                      />
                    </div>
                  </div>

                  {/* Liste des utilisateurs */}
                  {!selectedUser && (
                    <div className="ak-table-wrap">
                      <table className="ak-table">
                        <thead>
                          <tr>
                            <th>Utilisateur</th><th>Niveau</th><th>Total cumule</th>
                            <th>Solde disponible</th><th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSummaries.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--a-ink-mute)", padding: "32px 0" }}>Aucun utilisateur trouve.</td></tr>
                          ) : filteredSummaries.map((u) => {
                            const tier = getUserTier(u.lifetime);
                            return (
                              <tr key={u.user_id}>
                                <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                <td>
                                  <span className="ak-badge" style={{ background: `${tier.color}20`, color: tier.color, border: `1px solid ${tier.color}40` }}>
                                    {tier.icon} {tier.name}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>{u.lifetime} pts</td>
                                <td>
                                  <span style={{
                                    fontWeight: 600,
                                    color: u.balance > 0 ? "#10b981" : u.balance < 0 ? "#ef4444" : "var(--a-ink-mute)"
                                  }}>
                                    {u.balance} pts
                                  </span>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <button className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setSelectedUser(u.user_id)}>
                                    <i className="ti ti-eye" style={{ marginRight: 4 }}></i>Voir l&apos;historique
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Detail transactions */}
                  {selectedUser && selectedUserInfo && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                        <button className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setSelectedUser(null)}>
                          <i className="ti ti-arrow-left" style={{ marginRight: 4 }}></i>Retour
                        </button>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedUserInfo.full_name}</div>
                          <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <span className="ak-badge" style={{
                              background: `${getUserTier(selectedUserInfo.lifetime).color}20`,
                              color: getUserTier(selectedUserInfo.lifetime).color,
                              border: `1px solid ${getUserTier(selectedUserInfo.lifetime).color}40`,
                            }}>
                              {getUserTier(selectedUserInfo.lifetime).icon} {getUserTier(selectedUserInfo.lifetime).name}
                            </span>
                            <span style={{ fontSize: 13, color: "var(--a-ink-mute)" }}>
                              Cumul : <strong style={{ color: "var(--a-ink)" }}>{selectedUserInfo.lifetime} pts</strong>
                            </span>
                            <span style={{ fontSize: 13, color: "var(--a-ink-mute)" }}>
                              Solde : <strong style={{ color: selectedUserInfo.balance >= 0 ? "#10b981" : "#ef4444" }}>{selectedUserInfo.balance} pts</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ak-table-wrap">
                        <table className="ak-table">
                          <thead>
                            <tr><th>Date</th><th>Type</th><th>Points</th><th>Description</th><th>Commande</th><th>Expiration</th></tr>
                          </thead>
                          <tbody>
                            {userTxns.length === 0 ? (
                              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--a-ink-mute)", padding: "32px 0" }}>Aucune transaction.</td></tr>
                            ) : userTxns.map((t) => (
                              <tr key={t.id}>
                                <td style={{ color: "var(--a-ink-mute)" }}>{new Date(t.created_at).toLocaleDateString("fr-FR")}</td>
                                <td>
                                  <span className={`ak-badge ${TYPE_LABELS[t.type]?.badge ?? "ak-badge--muted"}`}>
                                    {TYPE_LABELS[t.type]?.label ?? t.type}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600, color: t.points > 0 ? "#10b981" : t.points < 0 ? "#ef4444" : "var(--a-ink-mute)" }}>
                                  {t.points > 0 ? "+" : ""}{t.points}
                                </td>
                                <td style={{ color: "var(--a-ink-mute)", maxWidth: 280, fontSize: 13 }}>{t.description ?? "—"}</td>
                                <td>{t.order_id ? <code style={{ fontFamily: "monospace", fontSize: 12, background: "var(--a-bg)", padding: "2px 6px", borderRadius: 5 }}>#{t.order_id.slice(0, 8)}</code> : "—"}</td>
                                <td style={{ color: "var(--a-ink-mute)" }}>{t.expires_at ? new Date(t.expires_at).toLocaleDateString("fr-FR") : "—"}</td>
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
