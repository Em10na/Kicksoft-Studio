"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Gestion des articles soldés : remise, fin de solde, et mise en
// avant dans le slider (vidéos / images) de la page d'accueil.

type Produit = {
  id: string; title: string; price: number; compare_price: number | null;
  stock: number; status: string; image_url: string | null; solde_hero: boolean;
  solde_notified_at: string | null;
  short_description: string | null;
  categories?: { name: string } | null;
};

function remisePct(p: Produit) {
  if (!p.compare_price || p.compare_price <= p.price) return 0;
  return Math.round((1 - p.price / p.compare_price) * 100);
}

export default function SoldesPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"" | "solde" | "hors">("");
  const [saving, setSaving] = useState<string | null>(null);
  const [migrationManquante, setMigrationManquante] = useState(false);

  // Modal mise en solde
  const [showModal, setShowModal] = useState(false);
  const [modalProduit, setModalProduit] = useState<Produit | null>(null);
  const [modalRemise, setModalRemise] = useState("20");
  const [modalPrix, setModalPrix] = useState("");

  function showAlert(msg: string, type: string) { setAlert({ message: msg, type }); setTimeout(() => setAlert({ message: "", type: "" }), 3500); }

  async function charger() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, compare_price, stock, status, image_url, solde_hero, solde_notified_at, short_description, categories(name)")
      .eq("status", "published")
      .order("title");
    if (error && (error.message.includes("solde_hero") || error.message.includes("solde_notified_at"))) {
      setMigrationManquante(true);
      setProduits([]);
    } else {
      setProduits((data as unknown as Produit[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  function basePrix(p: Produit) { return p.compare_price ?? p.price; }

  function ouvrirSolde(p: Produit) {
    setModalProduit(p);
    const pct = remisePct(p) || 20;
    setModalRemise(String(pct));
    setModalPrix((basePrix(p) * (1 - pct / 100)).toFixed(2));
    setShowModal(true);
  }

  function onRemiseChange(v: string) {
    setModalRemise(v);
    const pct = Number(v);
    if (modalProduit && !isNaN(pct) && pct > 0 && pct < 100) {
      setModalPrix((basePrix(modalProduit) * (1 - pct / 100)).toFixed(2));
    }
  }

  function onPrixChange(v: string) {
    setModalPrix(v);
    const prix = Number(v);
    if (modalProduit && !isNaN(prix) && prix > 0 && prix < basePrix(modalProduit)) {
      setModalRemise(String(Math.round((1 - prix / basePrix(modalProduit)) * 100)));
    }
  }

  async function validerSolde() {
    if (!modalProduit) return;
    const base = basePrix(modalProduit);
    const prix = Number(modalPrix);
    if (isNaN(prix) || prix <= 0 || prix >= base) {
      showAlert(`Le prix soldé doit être entre 0 et ${base} DT.`, "danger");
      return;
    }

    const etaitEnSolde = modalProduit.compare_price !== null;
    setSaving(modalProduit.id);
    setShowModal(false);
    // Nouvelle solde → statut notification remis à « Non envoyée » :
    // c'est l'admin qui déclenche l'envoi depuis la colonne Notification
    const update: Record<string, unknown> = { price: prix, compare_price: base };
    if (!etaitEnSolde) update.solde_notified_at = null;
    const { error } = await supabase.from("products").update(update).eq("id", modalProduit.id);
    setSaving(null);
    if (error) { showAlert("Erreur : " + error.message, "danger"); return; }

    showAlert(`« ${modalProduit.title} » soldé à ${prix} DT (-${Math.round((1 - prix / base) * 100)}%). Pensez à envoyer la notification aux clients.`, "success");
    charger();
  }

  async function envoyerNotif(p: Produit) {
    if (!p.compare_price) return;
    const dejaEnvoyee = !!p.solde_notified_at;
    if (dejaEnvoyee && !confirm(`La notification de « ${p.title} » a déjà été envoyée le ${new Date(p.solde_notified_at!).toLocaleDateString("fr-FR")}. La renvoyer à tous les clients ?`)) return;
    if (!dejaEnvoyee && !confirm(`Envoyer la notification de solde de « ${p.title} » à tous les clients (cloche + push + email) ?`)) return;

    setSaving(p.id);
    const pct = remisePct(p);
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
      if (!res.ok) throw new Error();
      const stats = await res.json();
      await supabase.from("products").update({ solde_notified_at: new Date().toISOString() }).eq("id", p.id);
      showAlert(`Notification envoyée ! Push : ${stats.push?.sent ?? 0} appareil(s), emails : ${stats.emails ?? 0}.`, "success");
      charger();
    } catch {
      showAlert("Échec de l'envoi de la notification.", "danger");
    } finally {
      setSaving(null);
    }
  }

  async function terminerSolde(p: Produit) {
    if (!p.compare_price) return;
    if (!confirm(`Terminer la solde de « ${p.title} » ? Le prix reviendra à ${p.compare_price} DT.`)) return;
    setSaving(p.id);
    const { error } = await supabase.from("products")
      .update({ price: p.compare_price, compare_price: null, solde_hero: false, solde_notified_at: null })
      .eq("id", p.id);
    setSaving(null);
    if (error) { showAlert("Erreur : " + error.message, "danger"); return; }
    showAlert(`Solde terminée — « ${p.title} » repasse à ${p.compare_price} DT.`, "success");
    charger();
  }

  const soldes = produits.filter((p) => p.compare_price && p.compare_price > p.price);
  const remiseMoyenne = soldes.length > 0 ? Math.round(soldes.reduce((a, p) => a + remisePct(p), 0) / soldes.length) : 0;

  const filtres = produits.filter((p) => {
    const enSolde = p.compare_price && p.compare_price > p.price;
    if (recherche && !`${p.title} ${p.categories?.name ?? ""}`.toLowerCase().includes(recherche.toLowerCase())) return false;
    if (filtre === "solde") return !!enSolde;
    if (filtre === "hors") return !enSolde;
    return true;
  });

  const notifsEnAttente = soldes.filter((p) => !p.solde_notified_at).length;
  const notifsEnvoyees = soldes.filter((p) => p.solde_notified_at).length;
  const cards = [
    { label: "Articles en solde", value: String(soldes.length), icon: "ti-discount-2", color: "#f43f5e", bg: "#fff1f2" },
    { label: "Remise moyenne", value: soldes.length ? `-${remiseMoyenne}%` : "—", icon: "ti-percentage", color: "#f59e0b", bg: "#fffbeb" },
    { label: "Notifications envoyées", value: String(notifsEnvoyees), icon: "ti-checks", color: "#10b981", bg: "#ecfdf5" },
    { label: "Notifications à envoyer", value: String(notifsEnAttente), icon: "ti-send", color: "#0ea5e9", bg: "#f0f9ff" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i> {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Notifications des soldes <span className="ak-count-badge">{soldes.length}</span></h1>
          <p className="ak-page-sub">Remises et envoi des notifications aux clients — l&apos;affichage sur l&apos;accueil se gère dans Page accueil</p>
        </div>
        <Link href="/admin/accueil" className="ak-btn ak-btn--ghost ak-btn--sm">
          <i className="ti ti-home"></i> Affichage sur l&apos;accueil
        </Link>
      </div>

      {migrationManquante && (
        <div className="ak-alert ak-alert--warning">
          <i className="ti ti-alert-triangle"></i>
          Exécutez la migration <strong>migration-v10-soldes.sql</strong> dans le Supabase SQL Editor pour activer cette page.
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

      {/* Table */}
      <div className="ak-card">
        <div className="ak-card__body">
          <div className="ak-filters">
            <div className="ak-search" style={{ flex: 1, minWidth: 200 }}>
              <i className="ti ti-search"></i>
              <input className="ak-input" placeholder="Rechercher un produit..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            </div>
            <select className="ak-select" style={{ width: 180 }} value={filtre} onChange={(e) => setFiltre(e.target.value as typeof filtre)}>
              <option value="">Tous les produits</option>
              <option value="solde">En solde</option>
              <option value="hors">Hors solde</option>
            </select>
            <span className="ak-filters__count">{filtres.length} produit(s)</span>
          </div>
        </div>
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix actuel</th>
                <th>Prix barré</th>
                <th>Remise</th>
                <th>Notification</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
              ) : filtres.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucun produit trouvé.</td></tr>
              ) : filtres.map((p) => {
                const enSolde = !!(p.compare_price && p.compare_price > p.price);
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
                          <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{p.categories?.name ?? "Sans catégorie"}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="ak-cell-bold">{p.price} DT</span></td>
                    <td>
                      {enSolde
                        ? <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: 13 }}>{p.compare_price} DT</span>
                        : <span className="ak-cell-muted">—</span>}
                    </td>
                    <td>
                      {enSolde
                        ? <span className="ak-badge ak-badge--danger">-{remisePct(p)}%</span>
                        : <span className="ak-cell-muted">—</span>}
                    </td>
                    <td>
                      {enSolde ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {p.solde_notified_at ? (
                            <span className="ak-badge ak-badge--success" title={`Envoyée le ${new Date(p.solde_notified_at).toLocaleString("fr-FR")}`}>
                              Envoyée
                            </span>
                          ) : (
                            <span className="ak-badge ak-badge--warning">Non envoyée</span>
                          )}
                          <button
                            className="ak-btn ak-btn--ghost ak-btn--sm"
                            disabled={busy || migrationManquante}
                            onClick={() => envoyerNotif(p)}
                            title={p.solde_notified_at ? "Renvoyer la notification" : "Envoyer la notification (cloche + push + email)"}
                          >
                            <i className="ti ti-send"></i>
                          </button>
                        </div>
                      ) : (
                        <span className="ak-cell-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="ak-btn ak-btn--primary ak-btn--sm" disabled={busy} onClick={() => ouvrirSolde(p)}>
                          <i className="ti ti-discount-2"></i> {enSolde ? "Modifier" : "Mettre en solde"}
                        </button>
                        {enSolde && (
                          <button className="ak-btn ak-btn--ghost ak-btn--sm" disabled={busy} onClick={() => terminerSolde(p)} title="Terminer la solde">
                            <i className="ti ti-x"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal solde */}
      {showModal && modalProduit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 200, display: "grid", placeItems: "center", backdropFilter: "blur(2px)" }} onClick={() => setShowModal(false)}>
          <div className="ak-card" style={{ width: 440, maxWidth: "92vw", padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="ak-card__title" style={{ marginBottom: 4 }}>
              {modalProduit.compare_price ? "Modifier la solde" : "Mettre en solde"}
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              {modalProduit.title} — prix de référence : <strong>{basePrix(modalProduit)} DT</strong>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Remise (%)</label>
                <input type="number" min={1} max={99} className="ak-input" value={modalRemise} onChange={(e) => onRemiseChange(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Prix soldé (DT)</label>
                <input type="number" min={0} step="0.01" className="ak-input" value={modalPrix} onChange={(e) => onPrixChange(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#fff1f2", borderRadius: 10, fontSize: 12.5, color: "#9f1239" }}>
              Le client verra : <strong>{modalPrix || "?"} DT</strong>{" "}
              <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{basePrix(modalProduit)} DT</span>{" "}
              <span className="ak-badge ak-badge--danger">-{modalRemise || "?"}%</span>
              {!modalProduit.compare_price && <><br />La notification aux clients ne partira que lorsque vous cliquerez sur <strong>Envoyer</strong> (colonne Notification).</>}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={validerSolde}>
                <i className="ti ti-check"></i> Appliquer la solde
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
