"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Devis = {
  id: string;
  subject: string;
  message: string | null;
  status: string;
  created_at: string;
};

type DevisParsed = Devis & {
  societe: string;
  nom: string;
  email: string;
  telephone: string;
  secteur: string;
  budget: string;
  description: string;
};

function parseDevis(d: Devis): DevisParsed {
  const lines = (d.message ?? "").split("\n");
  const get = (key: string) => {
    const line = lines.find((l) => l.startsWith(key + ":"));
    return line ? line.slice(key.length + 1).trim() : "";
  };
  const descIdx = lines.findIndex((l) => l.startsWith("Description:"));
  const description = descIdx >= 0 ? lines.slice(descIdx + 1).join("\n").trim() : "";
  return { ...d, societe: get("Societe"), nom: get("Nom"), email: get("Email"), telephone: get("Telephone"), secteur: get("Secteur"), budget: get("Budget"), description };
}

const STATUTS: Record<string, { label: string; classe: string }> = {
  open: { label: "Nouveau", classe: "ak-badge--warning" },
  in_progress: { label: "En cours", classe: "ak-badge--info" },
  replied: { label: "Répondu", classe: "ak-badge--accent" },
  closed: { label: "Fermé", classe: "ak-badge--success" },
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#94a3b8",
  marginBottom: 3,
};

export default function DevisAdminPage() {
  const supabase = createClient();
  const [devis, setDevis] = useState<DevisParsed[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<DevisParsed | null>(null);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [recherche, setRecherche] = useState("");

  async function charger() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets_support")
      .select("*")
      .ilike("subject", "[DEVIS]%")
      .order("created_at", { ascending: false });
    setDevis((data ?? []).map(parseDevis));
    setLoading(false);
  }

  useEffect(() => { charger(); }, []);

  function notifier(message: string, type: "success" | "danger" = "success") {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function changerStatut(id: string, statut: string) {
    const { error } = await supabase.from("tickets_support").update({ status: statut }).eq("id", id);
    if (error) notifier("Erreur : " + error.message, "danger");
    else {
      notifier("Statut mis à jour !");
      charger();
    }
  }

  async function supprimerDevis(id: string) {
    if (!confirm("Supprimer cette demande de devis ?")) return;
    await supabase.from("tickets_support").delete().eq("id", id);
    notifier("Demande supprimée.");
    charger();
  }

  const filtres = devis.filter((d) => {
    const texte = `${d.societe} ${d.nom} ${d.email} ${d.secteur} ${d.description}`.toLowerCase();
    const matchRecherche = !recherche || texte.includes(recherche.toLowerCase());
    const matchStatut = !filtreStatut || d.status === filtreStatut;
    return matchRecherche && matchStatut;
  });

  const nbOuverts = devis.filter((d) => d.status === "open").length;

  return (
    <div className="ak-animate">
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i> {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">
            Demandes de devis <span className="ak-count-badge">{devis.length}</span>
            {nbOuverts > 0 && (
              <span className="ak-badge ak-badge--warning" style={{ marginLeft: 8 }}>{nbOuverts} nouveau(x)</span>
            )}
          </h1>
          <p className="ak-page-sub">Demandes reçues depuis le formulaire de devis</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="ak-filters" style={{ marginBottom: 16 }}>
        <div className="ak-search" style={{ flex: "1 1 320px", maxWidth: 420 }}>
          <i className="ti ti-search"></i>
          <input
            className="ak-input"
            placeholder="Rechercher par société, nom, email, secteur..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <select className="ak-select" style={{ width: 180 }} value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <span className="ak-filters__count">{filtres.length} résultat(s)</span>
      </div>

      {/* Tableau */}
      <div className="ak-card">
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th>Société</th>
                <th>Contact</th>
                <th>Secteur</th>
                <th>Budget</th>
                <th style={{ width: 150 }}>Statut</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
              ) : filtres.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucune demande de devis.</td></tr>
              ) : filtres.map((d) => (
                <tr key={d.id}>
                  <td><span className="ak-cell-bold">{d.societe || "—"}</span></td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.nom}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{d.email}</div>
                    {d.telephone && <div style={{ fontSize: 12, color: "#94a3b8" }}>{d.telephone}</div>}
                  </td>
                  <td><span className="ak-badge ak-badge--muted">{d.secteur || "—"}</span></td>
                  <td><span className="ak-cell-mono">{d.budget || "—"}</span></td>
                  <td>
                    <select
                      className="ak-select"
                      style={{ width: 130, padding: "6px 10px", fontSize: 12.5 }}
                      value={d.status}
                      onChange={(e) => changerStatut(d.id, e.target.value)}
                    >
                      {Object.entries(STATUTS).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </td>
                  <td><span className="ak-cell-muted">{new Date(d.created_at).toLocaleDateString("fr-FR")}</span></td>
                  <td className="ak-cell-actions">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => { setDetail(d); setShowDetail(true); }}>
                        <i className="ti ti-eye" style={{ fontSize: 15 }}></i> Détail
                      </button>
                      <button className="ak-btn ak-btn--danger ak-btn--sm ak-btn--icon" onClick={() => supprimerDevis(d.id)}>
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

      {/* Modal détail */}
      {showDetail && detail && (
        <div className="ak-modal-backdrop" onClick={() => setShowDetail(false)}>
          <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">Demande de devis — {detail.societe || "Sans société"}</h3>
              <button className="ak-modal__close" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="ak-modal__body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 18 }}>
                <div>
                  <span style={LABEL_STYLE}>Société</span>
                  <span style={{ fontWeight: 600 }}>{detail.societe || "—"}</span>
                </div>
                <div>
                  <span style={LABEL_STYLE}>Secteur</span>
                  <span className="ak-badge ak-badge--muted">{detail.secteur || "—"}</span>
                </div>
                <div>
                  <span style={LABEL_STYLE}>Nom complet</span>
                  <span style={{ fontWeight: 600 }}>{detail.nom || "—"}</span>
                </div>
                <div>
                  <span style={LABEL_STYLE}>Budget estimatif</span>
                  <span style={{ fontWeight: 600 }}>{detail.budget || "—"}</span>
                </div>
                <div>
                  <span style={LABEL_STYLE}>Email</span>
                  {detail.email ? <a href={`mailto:${detail.email}`} style={{ color: "#6366f1", fontWeight: 600 }}>{detail.email}</a> : "—"}
                </div>
                <div>
                  <span style={LABEL_STYLE}>Date</span>
                  <span>{new Date(detail.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div>
                  <span style={LABEL_STYLE}>Téléphone</span>
                  <span>{detail.telephone || "—"}</span>
                </div>
                <div>
                  <span style={LABEL_STYLE}>Statut</span>
                  <span className={`ak-badge ${STATUTS[detail.status]?.classe ?? "ak-badge--muted"}`}>
                    {STATUTS[detail.status]?.label ?? detail.status}
                  </span>
                </div>
              </div>
              <span style={LABEL_STYLE}>Description du besoin</span>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.7 }}>
                {detail.description || "Aucune description."}
              </div>
            </div>
            <div className="ak-modal__footer">
              {detail.email && (
                <a href={`mailto:${detail.email}?subject=Re: Votre demande de devis - Kicksoft`} className="ak-btn ak-btn--primary">
                  <i className="ti ti-mail"></i> Répondre par email
                </a>
              )}
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowDetail(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
