"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  message: string | null;
  status: string;
  created_at: string;
  profiles?: { full_name: string } | null;
};

const STATUTS_TICKET: Record<string, { label: string; classe: string }> = {
  open: { label: "Ouvert", classe: "bg-warning text-dark" },
  closed: { label: "Ferme", classe: "bg-success" },
};

export default function SupportPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showDetail, setShowDetail] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [recherche, setRecherche] = useState("");

  async function chargerTickets() {
    setLoading(true);
    const { data } = await supabase
      .from("tickets_support")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    chargerTickets();
  }, []);

  async function changerStatut(id: string, nouveauStatut: string) {
    const { error } = await supabase
      .from("tickets_support")
      .update({ status: nouveauStatut })
      .eq("id", id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Statut mis a jour avec succes !", type: "success" });
      chargerTickets();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerTicket(id: string) {
    if (!confirm("Confirmer la suppression de ce ticket ?")) return;
    const { error } = await supabase.from("tickets_support").delete().eq("id", id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Ticket supprime.", type: "success" });
      chargerTickets();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  function ouvrirDetail(ticket: Ticket) {
    setDetailTicket(ticket);
    setShowDetail(true);
  }

  const ticketsFiltres = tickets.filter((t) => {
    const texte = `${t.subject} ${t.profiles?.full_name ?? ""} ${t.message ?? ""}`.toLowerCase();
    const matchRecherche = recherche === "" || texte.includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === "" || t.status === filtreStatut;
    return matchRecherche && matchStatut;
  });

  const nbOuverts = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">
            Support{" "}
            <span className="badge bg-light-primary text-primary ms-2">
              {tickets.length}
            </span>
            {nbOuverts > 0 && (
              <span className="badge bg-warning text-dark ms-2">
                {nbOuverts} ouvert(s)
              </span>
            )}
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
                  placeholder="Rechercher par sujet, client, message..."
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
                {Object.entries(STATUTS_TICKET).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">
                {ticketsFiltres.length} resultat(s)
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
                  <th>Sujet</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      Chargement...
                    </td>
                  </tr>
                ) : ticketsFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      Aucun ticket de support.
                    </td>
                  </tr>
                ) : (
                  ticketsFiltres.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <h6 className="fw-semibold mb-0">{t.subject}</h6>
                        {t.message && (
                          <small className="text-muted">
                            {t.message.length > 60
                              ? t.message.slice(0, 60) + "..."
                              : t.message}
                          </small>
                        )}
                      </td>
                      <td>{t.profiles?.full_name ?? "Utilisateur inconnu"}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: "120px" }}
                          value={t.status}
                          onChange={(e) =>
                            changerStatut(t.id, e.target.value)
                          }
                        >
                          {Object.entries(STATUTS_TICKET).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-muted">
                        {new Date(t.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => ouvrirDetail(t)}
                          >
                            <i className="ti ti-eye me-1"></i> Voir
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => supprimerTicket(t.id)}
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
      {showDetail && detailTicket && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">
                  Ticket : {detailTicket.subject}
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
                    {detailTicket.profiles?.full_name ?? "Inconnu"}
                  </div>
                  <div className="col-md-4">
                    <strong>Statut :</strong>{" "}
                    <span
                      className={`badge rounded-3 fw-semibold ${STATUTS_TICKET[detailTicket.status]?.classe ?? "bg-secondary"}`}
                    >
                      {STATUTS_TICKET[detailTicket.status]?.label ??
                        detailTicket.status}
                    </span>
                  </div>
                  <div className="col-md-4">
                    <strong>Date :</strong>{" "}
                    {new Date(detailTicket.created_at).toLocaleDateString(
                      "fr-FR"
                    )}
                  </div>
                </div>
                <hr />
                <h6 className="fw-semibold mb-2">Message</h6>
                <div
                  className="p-3 rounded"
                  style={{ backgroundColor: "#f8f9fa", whiteSpace: "pre-wrap" }}
                >
                  {detailTicket.message ?? "Aucun message."}
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
