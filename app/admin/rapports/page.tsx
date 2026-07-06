"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  order_id: string; product_id: string; quantity: number; unit_price: number;
  products?: { title: string; image_url: string | null } | null;
};
type LigneProduit = {
  product_id: string; title: string; image_url: string | null;
  quantite: number; revenu: number; commandes: number;
};

function moisCourant() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function bornesMois(mois: string) {
  const [y, m] = mois.split("-").map(Number);
  const debut = new Date(y, m - 1, 1);
  const fin = new Date(y, m, 1);
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}

export default function RapportsPage() {
  const supabase = createClient();
  const [mois, setMois] = useState(moisCourant());
  const [loading, setLoading] = useState(true);
  const [lignes, setLignes] = useState<LigneProduit[]>([]);
  const [nbCommandes, setNbCommandes] = useState(0);
  const [ventesParJour, setVentesParJour] = useState<Record<number, number>>({});

  async function charger() {
    setLoading(true);
    const { debut, fin } = bornesMois(mois);

    // Commandes du mois (hors annulées)
    const { data: orders } = await supabase
      .from("orders")
      .select("id, created_at")
      .neq("status", "cancelled")
      .gte("created_at", debut)
      .lt("created_at", fin);

    const orderIds = (orders ?? []).map((o) => o.id);
    setNbCommandes(orderIds.length);

    if (orderIds.length === 0) {
      setLignes([]); setVentesParJour({}); setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, product_id, quantity, unit_price, products(title, image_url)")
      .in("order_id", orderIds);

    // Agrégation par produit
    const parProduit = new Map<string, LigneProduit>();
    const cmdsParProduit = new Map<string, Set<string>>();
    for (const it of (items as unknown as OrderItem[]) ?? []) {
      const cur = parProduit.get(it.product_id) ?? {
        product_id: it.product_id,
        title: it.products?.title ?? "Produit supprimé",
        image_url: it.products?.image_url ?? null,
        quantite: 0, revenu: 0, commandes: 0,
      };
      cur.quantite += it.quantity;
      cur.revenu += it.quantity * (it.unit_price || 0);
      parProduit.set(it.product_id, cur);
      if (!cmdsParProduit.has(it.product_id)) cmdsParProduit.set(it.product_id, new Set());
      cmdsParProduit.get(it.product_id)!.add(it.order_id);
    }
    for (const [id, ligne] of parProduit) ligne.commandes = cmdsParProduit.get(id)?.size ?? 0;

    // Quantités vendues par jour du mois
    const qteParOrder = new Map<string, number>();
    for (const it of (items as unknown as OrderItem[]) ?? []) {
      qteParOrder.set(it.order_id, (qteParOrder.get(it.order_id) ?? 0) + it.quantity);
    }
    const parJour: Record<number, number> = {};
    for (const o of orders ?? []) {
      const jour = new Date(o.created_at).getDate();
      parJour[jour] = (parJour[jour] ?? 0) + (qteParOrder.get(o.id) ?? 0);
    }

    setLignes([...parProduit.values()].sort((a, b) => b.quantite - a.quantite));
    setVentesParJour(parJour);
    setLoading(false);
  }

  useEffect(() => { charger(); }, [mois]);

  const totalQuantite = lignes.reduce((a, l) => a + l.quantite, 0);
  const totalRevenu = lignes.reduce((a, l) => a + l.revenu, 0);
  const top = lignes[0] ?? null;
  const maxQte = Math.max(...lignes.map((l) => l.quantite), 1);
  const joursDuMois = new Date(Number(mois.split("-")[0]), Number(mois.split("-")[1]), 0).getDate();
  const maxJour = Math.max(...Object.values(ventesParJour), 1);
  const libelleMois = new Date(`${mois}-01T00:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const cards = [
    { label: "Produits vendus", value: totalQuantite.toLocaleString("fr-FR"), icon: "ti-package", color: "#6366f1", bg: "#eef2ff" },
    { label: "Chiffre d'affaires", value: `${totalRevenu.toLocaleString("fr-FR")} DT`, icon: "ti-trending-up", color: "#10b981", bg: "#ecfdf5" },
    { label: "Commandes", value: nbCommandes.toLocaleString("fr-FR"), icon: "ti-shopping-cart", color: "#f59e0b", bg: "#fffbeb" },
    { label: "Produits différents", value: lignes.length.toLocaleString("fr-FR"), icon: "ti-list-details", color: "#0ea5e9", bg: "#f0f9ff" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Rapports de ventes</h1>
          <p className="ak-page-sub">Produits vendus et produit le plus demandé — {libelleMois}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="month"
            className="ak-input"
            style={{ width: 170 }}
            value={mois}
            max={moisCourant()}
            onChange={(e) => e.target.value && setMois(e.target.value)}
          />
          <button onClick={charger} className="ak-btn ak-btn--ghost ak-btn--sm">
            <i className="ti ti-refresh"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: "#64748b", fontSize: 13 }}>Chargement...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats du mois */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {cards.map((s) => (
              <div key={s.label} className="ak-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Produit le plus demandé */}
          {top && (
            <div className="ak-card" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)", border: "none", padding: "24px 28px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "rgba(99,102,241,0.1)", borderRadius: "50%" }} />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                {top.image_url
                  ? <img src={top.image_url} alt="" style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover" }} />
                  : <div style={{ width: 64, height: 64, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center" }}><i className="ti ti-package" style={{ fontSize: 26, color: "#818cf8" }}></i></div>}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    <i className="ti ti-trophy"></i> Produit le plus demandé du mois
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{top.title}</div>
                </div>
                <div style={{ display: "flex", gap: 28 }}>
                  {[
                    { label: "Unités vendues", value: top.quantite.toLocaleString("fr-FR") },
                    { label: "Commandes", value: top.commandes.toLocaleString("fr-FR") },
                    { label: "Revenu", value: `${top.revenu.toLocaleString("fr-FR")} DT` },
                  ].map((k) => (
                    <div key={k.label} style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{k.value}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
            {/* Détail par produit */}
            <div className="ak-card">
              <div className="ak-card__header">
                <div>
                  <h2 className="ak-card__title">Ventes par produit</h2>
                  <p className="ak-card__subtitle">Commandes non annulées de {libelleMois}</p>
                </div>
              </div>
              <div className="ak-card__body" style={{ padding: 0 }}>
                <div className="ak-table-wrap">
                  <table className="ak-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Produit</th>
                        <th>Quantité</th>
                        <th>Commandes</th>
                        <th>Revenu</th>
                        <th>Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucune vente sur ce mois.</td></tr>
                      ) : lignes.map((l, i) => {
                        const part = totalQuantite > 0 ? Math.round((l.quantite / totalQuantite) * 100) : 0;
                        return (
                          <tr key={l.product_id}>
                            <td>
                              <span className="ak-cell-mono" style={i === 0 ? { color: "#f59e0b", fontWeight: 700 } : undefined}>
                                {i === 0 ? <i className="ti ti-trophy"></i> : i + 1}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {l.image_url
                                  ? <img src={l.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                                  : <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8", fontSize: 14 }}></i></div>}
                                <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{l.title}</span>
                              </div>
                            </td>
                            <td><span className="ak-cell-bold">{l.quantite}</span></td>
                            <td><span className="ak-cell-muted">{l.commandes}</span></td>
                            <td><span className="ak-cell-bold">{l.revenu.toLocaleString("fr-FR")} DT</span></td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
                                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                                  <div style={{ width: `${(l.quantite / maxQte) * 100}%`, height: "100%", background: i === 0 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 11, color: "#64748b", width: 32, textAlign: "right" }}>{part}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Ventes par jour */}
            <div className="ak-card">
              <div className="ak-card__header">
                <div>
                  <h2 className="ak-card__title">Ventes par jour</h2>
                  <p className="ak-card__subtitle">Unités vendues chaque jour du mois</p>
                </div>
              </div>
              <div className="ak-card__body">
                {totalQuantite === 0 ? (
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, textAlign: "center" }}>Aucune donnée.</p>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140 }}>
                    {Array.from({ length: joursDuMois }, (_, i) => i + 1).map((j) => {
                      const v = ventesParJour[j] ?? 0;
                      return (
                        <div key={j} title={`${j} ${libelleMois} : ${v} unité(s)`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                          <div style={{ height: v === 0 ? 2 : `${Math.max((v / maxJour) * 100, 6)}%`, background: v === 0 ? "#f1f5f9" : "linear-gradient(180deg,#818cf8,#6366f1)", borderRadius: 2 }} />
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 6 }}>
                  <span>1</span><span>{Math.ceil(joursDuMois / 2)}</span><span>{joursDuMois}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
