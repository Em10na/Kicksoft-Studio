"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Categorie = { id: string; name: string };

type Produit = {
  id: string; title: string; price: number; compare_price: number | null;
  image_url: string | null; solde_hero: boolean; solde_notified_at: string | null;
  category_id: string | null; categories?: { name: string } | null;
};

function remisePct(price: number, compare: number) {
  return Math.round((1 - price / compare) * 100);
}

export default function SoldesPage() {
  const supabase = createClient();
  const [soldes, setSoldes] = useState<Produit[]>([]);
  const [disponibles, setDisponibles] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [migrationManquante, setMigrationManquante] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [prixBarre, setPrixBarre] = useState("");
  const [prixSolde, setPrixSolde] = useState("");
  const [remise, setRemise] = useState("20");

  function showAlert(msg: string, type: string) {
    setAlert({ message: msg, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3500);
  }

  async function charger() {
    setLoading(true);
    const [{ data: prodData, error }, { data: catData }] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, price, compare_price, image_url, solde_hero, solde_notified_at, category_id, categories(name)")
        .eq("status", "published")
        .order("title"),
      supabase.from("categories").select("id, name").order("name"),
    ]);

    if (error && (error.message.includes("solde_hero") || error.message.includes("solde_notified_at"))) {
      setMigrationManquante(true);
    } else {
      const all = (prodData as unknown as Produit[]) ?? [];
      setSoldes(all.filter((p) => p.compare_price && p.compare_price > p.price));
      setDisponibles(all.filter((p) => !p.compare_price || p.compare_price <= p.price));
    }
    setCategories(catData ?? []);
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  function ouvrirAjout() {
    setEditingId(null);
    setSelectedId("");
    setPrixBarre("");
    setPrixSolde("");
    setRemise("20");
    setShowModal(true);
  }

  function ouvrirEdit(p: Produit) {
    setEditingId(p.id);
    setSelectedId("");
    setPrixBarre(String(p.compare_price ?? ""));
    setPrixSolde(String(p.price));
    setRemise(p.compare_price ? String(remisePct(p.price, p.compare_price)) : "20");
    setShowModal(true);
  }

  // When picking a product in new-sale modal, pre-fill prix barré with current price
  function onSelectProduit(id: string) {
    setSelectedId(id);
    const p = disponibles.find((x) => x.id === id);
    if (p) {
      setPrixBarre(String(p.price));
      const soldePct = Number(remise) || 20;
      setPrixSolde((p.price * (1 - soldePct / 100)).toFixed(2));
    }
  }

  function onRemiseChange(v: string) {
    setRemise(v);
    const pct = Number(v);
    const base = Number(prixBarre);
    if (!isNaN(pct) && !isNaN(base) && base > 0 && pct > 0 && pct < 100) {
      setPrixSolde((base * (1 - pct / 100)).toFixed(2));
    }
  }

  function onPrixSoldeChange(v: string) {
    setPrixSolde(v);
    const prix = Number(v);
    const base = Number(prixBarre);
    if (!isNaN(prix) && !isNaN(base) && base > 0 && prix > 0 && prix < base) {
      setRemise(String(remisePct(prix, base)));
    }
  }

  function onPrixBarreChange(v: string) {
    setPrixBarre(v);
    const base = Number(v);
    const pct = Number(remise) || 20;
    if (!isNaN(base) && base > 0) {
      setPrixSolde((base * (1 - pct / 100)).toFixed(2));
    }
  }

  async function valider() {
    const id = editingId ?? selectedId;
    if (!id) { showAlert("Sélectionnez un produit.", "danger"); return; }
    const base = Number(prixBarre);
    const solde = Number(prixSolde);
    if (!base || base <= 0) { showAlert("Prix barré obligatoire.", "danger"); return; }
    if (!solde || solde <= 0 || solde >= base) { showAlert("Le prix soldé doit être inférieur au prix barré.", "danger"); return; }

    setSaving(true);
    const isNew = !editingId;

    const { error } = await supabase
      .from("products")
      .update({ price: solde, compare_price: base, ...(isNew ? { solde_notified_at: null } : {}) })
      .eq("id", id);

    if (error) { showAlert("Erreur : " + error.message, "danger"); setSaving(false); return; }

    // Auto-notification pour un nouvel article en solde
    if (isNew) {
      const p = disponibles.find((x) => x.id === id);
      const pct = remisePct(solde, base);
      try {
        const res = await fetch("/api/push/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `🏷️ Solde -${pct}% !`,
            body: `${p?.title ?? "Produit"} à ${solde} DT au lieu de ${base} DT`,
            url: `/produit/${id}`,
            image: p?.image_url ?? undefined,
            tag: "solde",
          }),
        });
        if (res.ok) {
          await supabase.from("products").update({ solde_notified_at: new Date().toISOString() }).eq("id", id);
          showAlert("Article mis en solde — notification envoyée aux clients !", "success");
        } else {
          showAlert("Article mis en solde (notification échouée).", "warning");
        }
      } catch {
        showAlert("Article mis en solde (notification échouée).", "warning");
      }
    } else {
      showAlert("Solde mise à jour.", "success");
    }

    setSaving(false);
    setShowModal(false);
    charger();
  }

  async function terminerSolde(p: Produit) {
    if (!p.compare_price) return;
    if (!confirm(`Terminer la solde de « ${p.title} » ? Le prix reviendra à ${p.compare_price} DT.`)) return;
    const { error } = await supabase
      .from("products")
      .update({ price: p.compare_price, compare_price: null, solde_hero: false, solde_notified_at: null })
      .eq("id", p.id);
    if (error) { showAlert("Erreur : " + error.message, "danger"); return; }
    showAlert(`Solde terminée — « ${p.title} » repasse à ${p.compare_price} DT.`, "success");
    charger();
  }

  async function renvoyerNotif(p: Produit) {
    if (!p.compare_price) return;
    if (!confirm(`Renvoyer la notification de solde de « ${p.title} » à tous les clients ?`)) return;
    const pct = remisePct(p.price, p.compare_price);
    setSaving(true);
    try {
      const res = await fetch("/api/push/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `🏷️ Solde -${pct}% !`,
          body: `${p.title} à ${p.price} DT au lieu de ${p.compare_price} DT`,
          url: `/produit/${p.id}`,
          image: p.image_url ?? undefined,
          tag: "solde",
        }),
      });
      if (res.ok) {
        await supabase.from("products").update({ solde_notified_at: new Date().toISOString() }).eq("id", p.id);
        showAlert("Notification renvoyée !", "success");
        charger();
      } else {
        showAlert("Échec de l'envoi.", "danger");
      }
    } catch {
      showAlert("Échec de l'envoi.", "danger");
    } finally {
      setSaving(false);
    }
  }

  const remiseMoyenne = soldes.length
    ? Math.round(soldes.reduce((a, p) => a + remisePct(p.price, p.compare_price!), 0) / soldes.length)
    : 0;

  const cards = [
    { label: "Articles en solde", value: String(soldes.length), icon: "ti-discount-2", color: "#f43f5e", bg: "#fff1f2" },
    { label: "Remise moyenne", value: soldes.length ? `-${remiseMoyenne}%` : "—", icon: "ti-percentage", color: "#f59e0b", bg: "#fffbeb" },
    { label: "Notifications envoyées", value: String(soldes.filter((p) => p.solde_notified_at).length), icon: "ti-checks", color: "#10b981", bg: "#ecfdf5" },
    { label: "Disponibles pour solde", value: String(disponibles.length), icon: "ti-package", color: "#6366f1", bg: "#f5f3ff" },
  ];

  const selectedProduit = editingId
    ? soldes.find((p) => p.id === editingId)
    : disponibles.find((p) => p.id === selectedId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i> {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Articles soldés <span className="ak-count-badge">{soldes.length}</span></h1>
          <p className="ak-page-sub">Gérez les remises — la notification push est envoyée automatiquement à l&apos;ajout</p>
        </div>
        <button className="ak-btn ak-btn--primary" onClick={ouvrirAjout} disabled={migrationManquante}>
          <i className="ti ti-plus"></i> Ajouter un article en solde
        </button>
      </div>

      {migrationManquante && (
        <div className="ak-alert ak-alert--warning">
          <i className="ti ti-alert-triangle"></i>
          Exécutez <strong>migration-v10-soldes.sql</strong> dans le Supabase SQL Editor pour activer cette page.
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

      {/* Table des articles en solde */}
      <div className="ak-card">
        <div className="ak-card__header">
          <div>
            <h3 className="ak-card__title"><i className="ti ti-discount-2" style={{ marginRight: 6, color: "#f43f5e" }}></i>Articles actuellement en solde</h3>
          </div>
        </div>
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix soldé</th>
                <th>Prix barré</th>
                <th>Remise</th>
                <th>Notification</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
              ) : soldes.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  Aucun article en solde — cliquez sur <strong>Ajouter un article en solde</strong>.
                </td></tr>
              ) : soldes.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {p.image_url
                        ? <img src={p.image_url} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                        : <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></div>}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.categories?.name ?? "Sans catégorie"}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="ak-cell-bold" style={{ color: "#f43f5e" }}>{p.price} DT</span></td>
                  <td><span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: 13 }}>{p.compare_price} DT</span></td>
                  <td><span className="ak-badge ak-badge--danger">-{remisePct(p.price, p.compare_price!)}%</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {p.solde_notified_at
                        ? <span className="ak-badge ak-badge--success" title={`Envoyée le ${new Date(p.solde_notified_at).toLocaleString("fr-FR")}`}>Envoyée</span>
                        : <span className="ak-badge ak-badge--warning">En attente</span>}
                      <button className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon" disabled={saving} onClick={() => renvoyerNotif(p)} title="Renvoyer la notification">
                        <i className="ti ti-send"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="ak-btn ak-btn--ghost ak-btn--sm" disabled={saving} onClick={() => ouvrirEdit(p)}>
                        <i className="ti ti-pencil"></i> Modifier
                      </button>
                      <button className="ak-btn ak-btn--danger-ghost ak-btn--sm" disabled={saving} onClick={() => terminerSolde(p)}>
                        <i className="ti ti-x"></i> Terminer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajout / modification */}
      {showModal && (
        <div className="ak-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="ak-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">
                <i className="ti ti-discount-2" style={{ marginRight: 8, color: "#f43f5e" }}></i>
                {editingId ? "Modifier la solde" : "Ajouter un article en solde"}
              </h3>
              <button className="ak-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="ak-modal__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Sélecteur produit (nouveau seulement) */}
              {!editingId && (
                <div className="ak-field">
                  <label className="ak-label">Produit <span style={{ color: "#f43f5e" }}>*</span></label>
                  <select
                    className="ak-input"
                    value={selectedId}
                    onChange={(e) => onSelectProduit(e.target.value)}
                  >
                    <option value="">Choisir un produit…</option>
                    {categories.map((cat) => {
                      const opts = disponibles.filter((p) => p.category_id === cat.id);
                      if (opts.length === 0) return null;
                      return (
                        <optgroup key={cat.id} label={cat.name}>
                          {opts.map((p) => (
                            <option key={p.id} value={p.id}>{p.title} — {p.price} DT</option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {(() => {
                      const catIds = new Set(categories.map((c) => c.id));
                      const sans = disponibles.filter((p) => !p.category_id || !catIds.has(p.category_id));
                      if (sans.length === 0) return null;
                      return (
                        <optgroup label="Sans catégorie">
                          {sans.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.price} DT</option>)}
                        </optgroup>
                      );
                    })()}
                  </select>
                </div>
              )}

              {/* Miniature produit sélectionné */}
              {selectedProduit && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--a-bg)", borderRadius: 10, border: "1.5px solid var(--a-rule)" }}>
                  {selectedProduit.image_url
                    ? <img src={selectedProduit.image_url} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover" }} />
                    : <div style={{ width: 46, height: 46, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center" }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></div>}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedProduit.title}</div>
                    <div style={{ fontSize: 12, color: "var(--a-ink-mute)" }}>{selectedProduit.categories?.name ?? "Sans catégorie"}</div>
                  </div>
                </div>
              )}

              {/* Prix */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="ak-field">
                  <label className="ak-label">Prix barré (DT)</label>
                  <input type="number" step="0.01" className="ak-input" placeholder="100" value={prixBarre} onChange={(e) => onPrixBarreChange(e.target.value)} />
                  <p style={{ fontSize: 11, color: "var(--a-ink-mute)", marginTop: 3 }}>Prix original</p>
                </div>
                <div className="ak-field">
                  <label className="ak-label">Remise (%)</label>
                  <input type="number" min={1} max={99} className="ak-input" value={remise} onChange={(e) => onRemiseChange(e.target.value)} />
                </div>
                <div className="ak-field">
                  <label className="ak-label">Prix soldé (DT)</label>
                  <input type="number" step="0.01" className="ak-input" value={prixSolde} onChange={(e) => onPrixSoldeChange(e.target.value)} />
                </div>
              </div>

              {/* Aperçu */}
              {prixBarre && prixSolde && Number(prixSolde) < Number(prixBarre) && (
                <div style={{ padding: "10px 14px", background: "#fff1f2", borderRadius: 10, fontSize: 13, color: "#9f1239", display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="ti ti-tag" style={{ fontSize: 16 }}></i>
                  <span>
                    Le client verra : <strong>{prixSolde} DT</strong>{" "}
                    <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{prixBarre} DT</span>{" "}
                    <span className="ak-badge ak-badge--danger">-{remise}%</span>
                  </span>
                  {!editingId && (
                    <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#be123c" }}>
                      <i className="ti ti-send" style={{ marginRight: 4 }}></i>Notif auto à l&apos;enregistrement
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="ak-btn ak-btn--primary" onClick={valider} disabled={saving}>
                {saving
                  ? <><i className="ti ti-loader" style={{ animation: "spin 0.7s linear infinite" }}></i> Enregistrement…</>
                  : <><i className="ti ti-check"></i> {editingId ? "Enregistrer" : "Mettre en solde"}</>}
              </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}
    </div>
  );
}
