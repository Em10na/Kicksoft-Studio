"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = {
  id: string;
  name: string;
};

type Utilisateur = {
  id: string;
  full_name: string;
  phone: string | null;
  role_id: string | null;
  created_at: string;
  roles?: { name: string } | null;
};

const COULEURS_ROLES: Record<string, string> = {
  admin: "bg-danger",
  manager: "bg-warning text-dark",
  client: "bg-light-primary text-primary",
};

export default function UtilisateursPage() {
  const supabase = createClient();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("");

  async function chargerUtilisateurs() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, roles(name)")
      .order("created_at", { ascending: false });
    setUtilisateurs(data ?? []);
    setLoading(false);
  }

  async function chargerRoles() {
    const { data } = await supabase.from("roles").select("id, name");
    setRoles(data ?? []);
  }

  useEffect(() => {
    chargerUtilisateurs();
    chargerRoles();
  }, []);

  async function changerRole(userId: string, nouveauRoleId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ role_id: nouveauRoleId || null })
      .eq("id", userId);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Role mis a jour avec succes !", type: "success" });
      chargerUtilisateurs();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  const utilisateursFiltres = utilisateurs.filter((u) => {
    const texte = `${u.full_name} ${u.phone ?? ""} ${u.roles?.name ?? ""}`.toLowerCase();
    const matchRecherche = recherche === "" || texte.includes(recherche.toLowerCase());
    const matchRole = filtreRole === "" || u.role_id === filtreRole;
    return matchRecherche && matchRole;
  });

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">
            Gestion des utilisateurs{" "}
            <span className="badge bg-light-primary text-primary ms-2">
              {utilisateurs.length}
            </span>
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
                  placeholder="Rechercher par nom, telephone, role..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filtreRole}
                onChange={(e) => setFiltreRole(e.target.value)}
              >
                <option value="">Tous les roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">
                {utilisateursFiltres.length} resultat(s)
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
                  <th>Nom complet</th>
                  <th>Telephone</th>
                  <th>Role</th>
                  <th>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      Chargement...
                    </td>
                  </tr>
                ) : utilisateursFiltres.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      Aucun utilisateur trouve.
                    </td>
                  </tr>
                ) : (
                  utilisateursFiltres.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: 35,
                              height: 35,
                              borderRadius: "50%",
                              background: "#5d87ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}
                          >
                            {u.full_name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <h6 className="fw-semibold mb-0">{u.full_name}</h6>
                        </div>
                      </td>
                      <td>{u.phone ?? "Non renseigne"}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: "130px" }}
                          value={u.role_id ?? ""}
                          onChange={(e) => changerRole(u.id, e.target.value)}
                        >
                          <option value="">Sans role</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-muted">
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
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
