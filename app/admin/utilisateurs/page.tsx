"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = { id: string; name: string };
type Utilisateur = { id: string; full_name: string; phone: string | null; role_id: string | null; created_at: string; roles?: { name: string } | null };

export default function UtilisateursPage() {
  const supabase = createClient();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", full_name: "", phone: "", role_name: "admin" });

  function showAlert(msg: string, type: string) { setAlert({ message: msg, type }); setTimeout(() => setAlert({ message: "", type: "" }), 3000); }

  async function charger() {
    setLoading(true);
    // Filtre sur le rôle "client" uniquement via inner join
    const { data } = await supabase
      .from("profiles")
      .select("*, roles!inner(name)")
      .eq("roles.name", "client")
      .order("created_at", { ascending: false });
    setUtilisateurs(data ?? []);
    setLoading(false);
  }
  async function chargerRoles() { const { data } = await supabase.from("roles").select("id, name"); setRoles(data ?? []); }

  useEffect(() => { charger(); chargerRoles(); }, []);

  async function creerCompte() {
    setCreating(true);
    const res = await fetch("/api/admin/create-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createForm) });
    const data = await res.json();
    if (!res.ok) showAlert(data.error || "Erreur.", "danger");
    else { showAlert(`Compte ${createForm.role_name} créé !`, "success"); setShowCreateModal(false); setCreateForm({ email: "", password: "", full_name: "", phone: "", role_name: "admin" }); charger(); }
    setCreating(false);
  }

  async function supprimer(id: string, name: string) {
    if (!confirm(`Supprimer le compte de "${name}" ? Action irréversible.`)) return;
    const res = await fetch(`/api/admin/create-user?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) showAlert(data.error || "Erreur.", "danger");
    else { showAlert("Compte supprimé.", "success"); charger(); }
  }

  const filtres = utilisateurs.filter((u) => {
    const t = `${u.full_name} ${u.phone ?? ""}`.toLowerCase();
    return recherche === "" || t.includes(recherche.toLowerCase());
  });

  function roleClasses(name?: string) {
    if (name === "admin") return "ak-badge--danger";
    return "ak-badge--muted";
  }

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
          <h1 className="ak-page-title">Clients <span className="ak-count-badge">{utilisateurs.length}</span></h1>
          <p className="ak-page-sub">Liste des comptes clients enregistrés</p>
        </div>
        <button className="ak-btn ak-btn--primary" onClick={() => setShowCreateModal(true)}>
          <i className="ti ti-plus"></i>
          Créer un compte admin
        </button>
      </div>

      <div className="ak-card">
        <div className="ak-card__body">
          <div className="ak-filters">
            <div className="ak-search" style={{ flex: 1, minWidth: 200 }}>
              <i className="ti ti-search"></i>
              <input className="ak-input" placeholder="Rechercher par nom ou téléphone..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            </div>
            <span className="ak-filters__count">{filtres.length} résultat(s)</span>
          </div>
        </div>
        <div className="ak-table-wrap">
          <table className="ak-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Inscription</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Chargement...</td></tr>
              ) : filtres.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucun utilisateur trouvé.</td></tr>
              ) : filtres.map((u) => {
                const rn = (u.roles as { name: string } | null)?.name;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {u.full_name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>{u.full_name}</span>
                      </div>
                    </td>
                    <td><span className="ak-cell-muted">{u.phone ?? "Non renseigné"}</span></td>
                    <td><span className={`ak-badge ${roleClasses(rn)}`}>{rn ?? "Sans rôle"}</span></td>
                    <td><span className="ak-cell-muted">{new Date(u.created_at).toLocaleDateString("fr-FR")}</span></td>
                    <td className="ak-cell-actions">
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="ak-btn ak-btn--danger ak-btn--sm ak-btn--icon" onClick={() => supprimer(u.id, u.full_name)} title="Supprimer"><i className="ti ti-trash" style={{ fontSize: 15 }}></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création */}
      {showCreateModal && (
        <div className="ak-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="ak-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">Créer un compte</h3>
              <button className="ak-modal__close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="ak-modal__body">
              <div className="ak-field">
                <label className="ak-label">Nom complet <span>*</span></label>
                <input className="ak-input" placeholder="Prénom Nom" value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
              </div>
              <div className="ak-field">
                <label className="ak-label">Email <span>*</span></label>
                <input className="ak-input" type="email" placeholder="email@exemple.com" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="ak-field">
                <label className="ak-label">Mot de passe <span>*</span></label>
                <input className="ak-input" type="password" placeholder="Minimum 6 caractères" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
              <div className="ak-field">
                <label className="ak-label">Téléphone</label>
                <input className="ak-input" type="tel" placeholder="+216 XX XXX XXX" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div className="ak-field" style={{ marginBottom: 0 }}>
                <label className="ak-label">Rôle <span>*</span></label>
                <select className="ak-select" value={createForm.role_name} onChange={(e) => setCreateForm({ ...createForm, role_name: e.target.value })}>
                  <option value="admin">Admin</option>
                </select>
                <p className="ak-helper">Le rôle sera attribué automatiquement à la création.</p>
              </div>
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowCreateModal(false)}>Annuler</button>
              <button className="ak-btn ak-btn--primary" onClick={creerCompte} disabled={creating}>{creating ? "Création..." : "Créer le compte"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
