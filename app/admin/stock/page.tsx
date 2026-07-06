"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SEUIL_ALERTE = 5;

type Produit = {
  id: string; title: string; price: number; stock: number; status: string;
  image_url: string | null; categories?: { name: string } | null;
};
type Mouvement = {
  id: string; product_id: string; delta: number; reason: string; note: string | null;
  created_at: string; products?: { title: string } | null;
};

const RAISONS: Record<string, { label: string; cls: string; icon: string }> = {
  vente:      { label: "Vente",      cls: "ak-badge--info",    icon: "ti-shopping-cart" },
  annulation: { label: "Annulation", cls: "ak-badge--muted",   icon: "ti-arrow-back-up" },
  ajustement: { label: "Ajustement", cls: "ak-badge--warning", icon: "ti-adjustments" },
  reception:  { label: "Réception",  cls: "ak-badge--success", icon: "ti-truck-delivery" },
};

function etatStock(stock: number) {
  if (stock === 0) return { label: "Rupture", cls: "ak-badge--danger" };
  if (stock <= SEUIL_ALERTE) return { label: "Stock faible", cls: "ak-badge--warning" };
  return { label: "En stock", cls: "ak-badge--success" };
}

export default function StockPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"" | "faible" | "rupture" | "ok">("");
  const [saving, setSaving] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalProduit, setModalProduit] = useState<Produit | null>(null);
  const [modalStock, setModalStock] = useState("");
  const [modalNote, setModalNote] = useState("");

  function showAlert(msg: string, type: string) { setAlert({ message: msg, type }); setTimeout(() => setAlert({ message: "", type: "" }), 3000); }

  async function charger() {
    setLoading(true);
    const [{ data: prods }, { data: moves }] = await Promise.all([
      supabase.from("products").select("id, title, price, stock, status, image_url, categories(name)").order("stock").order("title"),
      supabase.from("stock_movements").select("*, products(title)").order("created_at", { ascending: false }).limit(12),
    ]);
    setProduits((prods as unknown as Produit[]) ?? []);
    setMouvements((moves as unknown as Mouvement[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  async function appliquerStock(p: Produit, nouveau: number, note: string | null) {
    if (nouveau < 0 || nouveau === p.stock) return;
    setSaving(p.id);
    const { error } = await supabase.from("products").update({ stock: nouveau }).eq("id", p.id);
    if (error) { showAlert("Erreur : " + error.message, "danger"); setSaving(null); return; }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("stock_movements").insert({
      product_id: p.id,
      delta: nouveau - p.stock,
      reason: nouveau > p.stock ? "reception" : "ajustement",
      note,
      created_by: user?.id ?? null,
    });

    showAlert(`Stock de « ${p.title} » mis à jour : ${p.stock} → ${nouveau}`, "success");
    setSaving(null);
    charger();
  }

  function ouvrirAjustement(p: Produit) {
    setModalProduit(p); setModalStock(String(p.stock)); setModalNote(""); setShowModal(true);
  }

  async function validerAjustement() {
    if (!modalProduit) return;
    const n = Number(modalStock);
    if (isNaN(n) || n < 0) { showAlert("Quantité invalide.", "danger"); return; }
    setShowModal(false);
    await appliquerStock(modalProduit, n, modalNote.trim() || null);
  }

  const rupture = produits.filter((p) => p.stock === 0);
  const faible = produits.filter((p) => p.stock > 0 && p.stock <= SEUIL_ALERTE);
  const valeurStock = produits.reduce((a, p) => a + p.stock * (p.price || 0), 0);

  const filtres = produits.filter((p) => {
    if (recherche && !`${p.title} ${p.categories?.name ?? ""}`.toLowerCase().includes(recherche.toLowerCase())) return false;
    if (filtre === "rupture") return p.stock === 0;
    if (filtre === "faible") return p.stock > 0 && p.stock <= SEUIL_ALERTE;
    if (filtre === "ok") return p.stock > SEUIL_ALERTE;
    return true;
  });

  const cards = [
    { label: "Produits suivis", value: String(produits.length), icon: "ti-package", color: "#6366f1", bg: "#eef2ff" },
    { label: `Stock faible (≤ ${SEUIL_ALERTE})`, value: String(faible.length), icon: "ti-alert-triangle", color: "#f59e0b", bg: "#fffbeb" },
    { label: "En rupture", value: String(rupture.length), icon: "ti-circle-x", color: "#ef4444", bg: "#fef2f2" },
    { label: "Valeur du stock", value: `${valeurStock.toLocaleString("fr-FR")} DT`, icon: "ti-coin", color: "#10b981", bg: "#ecfdf5" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i>
          {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Gestion du stock</h1>
          <p className="ak-page-sub">Suivi des quantités, alertes et mouvements de stock</p>
        </div>
        <button onClick={charger} className="ak-btn ak-btn--ghost ak-btn--sm">
          <i className="ti ti-refresh"></i> Actualiser
        </button>
      </div>

      {/* Alerte stock faible / rupture */}
      {(faible.length > 0 || rupture.length > 0) && (
        <div className="ak-alert ak-alert--warning" style={{ alignItems: "flex-start" }}>
          <i className="ti ti-alert-triangle" style={{ marginTop: 2 }}></i>
          <div>
            <strong>Attention :</strong>{" "}
            {rupture.length > 0 && <>{rupture.length} produit(s) en rupture</>}
            {rupture.length > 0 && faible.length > 0 && " et "}
            {faible.length > 0 && <>{faible.length} produit(s) avec un stock ≤ {SEUIL_ALERTE}</>}
            {" — "}
            {[...rupture, ...faible].slice(0, 4).map((p) => p.title).join(", ")}
            {rupture.length + faible.length > 4 && "…"}
          </div>
        </div>
      )}

      {/* Stats */}
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Table stock */}
        <div className="ak-card">
          <div className="ak-card__body">
            <div className="ak-filters">
              <div className="ak-search" style={{ flex: 1, minWidth: 180 }}>
                <i className="ti ti-search"></i>
                <input className="ak-input" placeholder="Rechercher un produit..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              </div>
              <select className="ak-select" style={{ width: 170 }} value={filtre} onChange={(e) => setFiltre(e.target.value as typeof filtre)}>
                <option value="">Tous les stocks</option>
                <option value="rupture">En rupture</option>
                <option value="faible">Stock faible (≤ {SEUIL_ALERTE})</option>
                <option value="ok">Stock OK</option>
              </select>
              <span className="ak-filters__count">{filtres.length} produit(s)</span>
            </div>
          </div>
          <div className="ak-table-wrap">
            <table className="ak-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Stock</th>
                  <th>État</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
                ) : filtres.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucun produit trouvé.</td></tr>
                ) : filtres.map((p) => {
                  const etat = etatStock(p.stock);
                  const busy = saving === p.id;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {p.image_url
                            ? <img src={p.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                            : <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></div>}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{p.title}</div>
                            {p.status !== "published" && <div style={{ fontSize: 10, color: "#94a3b8" }}>Brouillon</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="ak-cell-muted">{p.categories?.name ?? "—"}</span></td>
                      <td>
                        <span className="ak-cell-bold" style={{ color: p.stock === 0 ? "#ef4444" : p.stock <= SEUIL_ALERTE ? "#f59e0b" : "#0f172a" }}>
                          {p.stock}
                        </span>
                      </td>
                      <td><span className={`ak-badge ak-badge--dot ${etat.cls}`}>{etat.label}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="ak-btn ak-btn--ghost ak-btn--sm" disabled={busy || p.stock === 0} onClick={() => appliquerStock(p, p.stock - 1, null)} title="Retirer 1">
                            <i className="ti ti-minus"></i>
                          </button>
                          <button className="ak-btn ak-btn--ghost ak-btn--sm" disabled={busy} onClick={() => appliquerStock(p, p.stock + 1, null)} title="Ajouter 1">
                            <i className="ti ti-plus"></i>
                          </button>
                          <button className="ak-btn ak-btn--primary ak-btn--sm" disabled={busy} onClick={() => ouvrirAjustement(p)}>
                            <i className="ti ti-adjustments"></i> Ajuster
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Derniers mouvements */}
        <div className="ak-card">
          <div className="ak-card__header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, background: "#eef2ff", borderRadius: 8, display: "grid", placeItems: "center" }}>
                <i className="ti ti-history" style={{ fontSize: 15, color: "#6366f1" }}></i>
              </div>
              <h2 className="ak-card__title">Derniers mouvements</h2>
            </div>
          </div>
          <div className="ak-card__body">
            {mouvements.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, textAlign: "center" }}>
                Aucun mouvement enregistré.<br />
                <span style={{ fontSize: 11 }}>Exécutez la migration v7 si la table n&apos;existe pas encore.</span>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {mouvements.map((m, i) => {
                  const r = RAISONS[m.reason] ?? { label: m.reason, cls: "ak-badge--muted", icon: "ti-arrows-exchange" };
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: i < mouvements.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.products?.title ?? "Produit supprimé"}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {new Date(m.created_at).toLocaleDateString("fr-FR")} · {r.label}
                          {m.note ? ` · ${m.note}` : ""}
                        </div>
                      </div>
                      <span className={`ak-badge ${m.delta > 0 ? "ak-badge--success" : "ak-badge--danger"}`}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal ajustement */}
      {showModal && modalProduit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 200, display: "grid", placeItems: "center", backdropFilter: "blur(2px)" }} onClick={() => setShowModal(false)}>
          <div className="ak-card" style={{ width: 420, maxWidth: "92vw", padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="ak-card__title" style={{ marginBottom: 4 }}>Ajuster le stock</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              {modalProduit.title} — stock actuel : <strong>{modalProduit.stock}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Nouvelle quantité</label>
                <input type="number" min={0} className="ak-input" value={modalStock} onChange={(e) => setModalStock(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Note (optionnel)</label>
                <input className="ak-input" placeholder="Ex : réception fournisseur, inventaire..." value={modalNote} onChange={(e) => setModalNote(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setShowModal(false)}>Annuler</button>
                <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={validerAjustement}>
                  <i className="ti ti-check"></i> Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:1100px){.admin-content > div > div[style*="340px"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
