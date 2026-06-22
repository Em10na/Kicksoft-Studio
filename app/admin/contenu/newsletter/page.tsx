"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Abonne = {
  id: string;
  email: string;
  active: boolean;
  subscribed_at: string;
};

export default function NewsletterPage() {
  const supabase = createClient();
  const [abonnes, setAbonnes] = useState<Abonne[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [recherche, setRecherche] = useState("");
  const [filtreActif, setFiltreActif] = useState("");

  async function chargerAbonnes() {
    setLoading(true);
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    setAbonnes(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    chargerAbonnes();
  }, []);

  async function toggleActif(abonne: Abonne) {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ active: !abonne.active })
      .eq("id", abonne.id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({
        message: !abonne.active
          ? "Abonne reactive !"
          : "Abonne desactive.",
        type: "success",
      });
      chargerAbonnes();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerAbonne(id: string) {
    if (!confirm("Confirmer la suppression de cet abonne ?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Abonne supprime.", type: "success" });
      chargerAbonnes();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  function exporterCSV() {
    const lignes = [
      ["Email", "Actif", "Date inscription"],
      ...abonnesFiltres.map((a) => [
        a.email,
        a.active ? "Oui" : "Non",
        new Date(a.subscribed_at).toLocaleDateString("fr-FR"),
      ]),
    ];
    const csv = lignes.map((l) => l.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "newsletter_abonnes.csv";
    link.click();
    URL.revokeObjectURL(url);
    setAlert({ message: "Export CSV telecharge !", type: "success" });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  const abonnesFiltres = abonnes.filter((a) => {
    const matchRecherche =
      recherche === "" ||
      a.email.toLowerCase().includes(recherche.toLowerCase());
    const matchActif =
      filtreActif === "" ||
      (filtreActif === "active" ? a.active : !a.active);
    return matchRecherche && matchActif;
  });

  const nbActifs = abonnes.filter((a) => a.active).length;

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">
            Newsletter{" "}
            <span className="badge bg-light-primary text-primary ms-2">
              {abonnes.length}
            </span>
            <span className="badge bg-success ms-2">
              {nbActifs} actif(s)
            </span>
          </h5>
          <p className="mb-0 text-muted">Donnees synchronisees avec Supabase</p>
        </div>
        <button className="btn btn-primary" onClick={exporterCSV}>
          <i className="ti ti-download me-1"></i> Exporter CSV
        </button>
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
                  placeholder="Rechercher par email..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtreActif}
                onChange={(e) => setFiltreActif(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">
                {abonnesFiltres.length} resultat(s)
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
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Date inscription</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      Chargement...
                    </td>
                  </tr>
                ) : abonnesFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Aucun abonne trouve.
                    </td>
                  </tr>
                ) : (
                  abonnesFiltres.map((a) => (
                    <tr key={a.id} className={!a.active ? "opacity-50" : ""}>
                      <td>
                        <h6 className="fw-semibold mb-0">
                          <i className="ti ti-mail me-2 text-muted"></i>
                          {a.email}
                        </h6>
                      </td>
                      <td>
                        {a.active ? (
                          <span className="badge rounded-3 fw-semibold bg-success">
                            Actif
                          </span>
                        ) : (
                          <span className="badge rounded-3 fw-semibold bg-secondary">
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="text-muted">
                        {new Date(a.subscribed_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className={`btn btn-sm ${a.active ? "btn-outline-warning" : "btn-outline-success"}`}
                            onClick={() => toggleActif(a)}
                          >
                            <i
                              className={`ti ${a.active ? "ti-ban" : "ti-check"} me-1`}
                            ></i>
                            {a.active ? "Desactiver" : "Reactiver"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => supprimerAbonne(a.id)}
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
    </div>
  );
}
