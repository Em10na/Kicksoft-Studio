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
  open: { label: "Nouveau", classe: "bg-warning text-dark" },
  in_progress: { label: "En cours", classe: "bg-info text-white" },
  replied: { label: "Repondu", classe: "bg-primary" },
  closed: { label: "Ferme", classe: "bg-success" },
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

  async function changerStatut(id: string, statut: string) {
    const { error } = await supabase.from("tickets_support").update({ status: statut }).eq("id", id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Statut mis a jour !", type: "success" });
      charger();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerDevis(id: string) {
    if (!confirm("Supprimer cette demande de devis ?")) return;
    await supabase.from("tickets_support").delete().eq("id", id);
    setAlert({ message: "Demande supprimee.", type: "success" });
    charger();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  const filtres = devis.filter((d) => {
    const texte = `${d.societe} ${d.nom} ${d.email} ${d.secteur} ${d.description}`.toLowerCase();
    const matchRecherche = !recherche || texte.includes(recherche.toLowerCase());
    const matchStatut = !filtreStatut || d.status === filtreStatut;
    return matchRecherche && matchStatut;
  });

  const nbOuverts = devis.filter((d) => d.status === "open").length;

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">
            Demandes de devis{" "}
            <span className="badge bg-light-primary text-primary ms-2">{devis.length}</span>
            {nbOuverts > 0 && <span className="badge bg-warning text-dark ms-2">{nbOuverts} nouveau(x)</span>}
          </h5>
          <p className="mb-0 text-muted">Demandes recues depuis le formulaire de devis</p>
        </div>
      </div>

      {alert.message && <div className={`alert alert-${alert.type} mb-4`}>{alert.message}</div>}

      {/* Filtres */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text"><i className="ti ti-search"></i></span>
                <input type="text" className="form-control" placeholder="Rechercher par societe, nom, email, secteur..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                {Object.entries(STATUTS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">{filtres.length} resultat(s)</span>
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
                  <th>Societe</th>
                  <th>Contact</th>
                  <th>Secteur</th>
                  <th>Budget</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center text-muted">Chargement...</td></tr>
                ) : filtres.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-4">Aucune demande de devis.</td></tr>
                ) : filtres.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <h6 className="fw-semibold mb-0">{d.societe || "—"}</h6>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px" }}>{d.nom}</div>
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>{d.email}</div>
                      {d.telephone && <div style={{ fontSize: "12px", color: "#6c757d" }}>{d.telephone}</div>}
                    </td>
                    <td><span className="badge bg-light-primary text-primary">{d.secteur || "—"}</span></td>
                    <td className="fw-semibold">{d.budget || "—"}</td>
                    <td>
                      <select className="form-select form-select-sm" style={{ width: "130px" }} value={d.status} onChange={(e) => changerStatut(d.id, e.target.value)}>
                        {Object.entries(STATUTS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-muted">{new Date(d.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => { setDetail(d); setShowDetail(true); }}>
                          <i className="ti ti-eye me-1"></i> Detail
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => supprimerDevis(d.id)}>
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal detail */}
      {showDetail && detail && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">Demande de devis — {detail.societe}</h5>
                <button className="btn-close" onClick={() => setShowDetail(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Societe</label>
                      <div className="fw-semibold">{detail.societe || "—"}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nom complet</label>
                      <div className="fw-semibold">{detail.nom || "—"}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                      <div><a href={`mailto:${detail.email}`} style={{ color: "#5d87ff" }}>{detail.email || "—"}</a></div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Telephone</label>
                      <div>{detail.telephone || "—"}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Secteur</label>
                      <div className="fw-semibold">{detail.secteur || "—"}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Budget estimatif</label>
                      <div className="fw-semibold">{detail.budget || "—"}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</label>
                      <div>{new Date(detail.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Statut</label>
                      <div>
                        <span className={`badge ${STATUTS[detail.status]?.classe ?? "bg-secondary"}`}>
                          {STATUTS[detail.status]?.label ?? detail.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <hr />
                <label className="text-muted mb-2" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description du besoin</label>
                <div className="p-3 rounded" style={{ backgroundColor: "#f8f9fa", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.7" }}>
                  {detail.description || "Aucune description."}
                </div>
              </div>
              <div className="modal-footer">
                {detail.email && (
                  <a href={`mailto:${detail.email}?subject=Re: Votre demande de devis - Kicksoft`} className="btn btn-primary">
                    <i className="ti ti-mail me-1"></i> Repondre par email
                  </a>
                )}
                <button className="btn btn-light" onClick={() => setShowDetail(false)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
