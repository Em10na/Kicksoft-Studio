"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Commande = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  profiles?: { full_name: string } | null;
};

type Produit = {
  id: string;
  title: string;
  stock: number;
  status: string;
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
};

const STATUTS: Record<string, { label: string; classe: string }> = {
  pending: { label: "En attente", classe: "bg-warning text-dark" },
  shipped: { label: "Expediee", classe: "bg-info text-white" },
  delivered: { label: "Livree", classe: "bg-success" },
  cancelled: { label: "Annulee", classe: "bg-danger" },
};

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ produits: 0, commandes: 0, utilisateurs: 0, tickets: 0, ventes: 0, ticketsOuverts: 0, produitsPublies: 0, stockFaible: 0 });
  const [commandesRecentes, setCommandesRecentes] = useState<Commande[]>([]);
  const [produitsStockFaible, setProduitsStockFaible] = useState<Produit[]>([]);
  const [ticketsRecents, setTicketsRecents] = useState<Ticket[]>([]);

  async function chargerDashboard() {
    setLoading(true);

    const [
      { count: totalProduits },
      { count: totalCommandes },
      { count: totalUtilisateurs },
      { count: totalTickets },
      { count: ticketsOuverts },
      { count: produitsPublies },
      { data: commandes },
      { data: ventesData },
      { data: stockFaible },
      { data: tickets },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("tickets_support").select("*", { count: "exact", head: true }),
      supabase.from("tickets_support").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
      supabase.from("orders").select("total").eq("status", "delivered"),
      supabase.from("products").select("id, title, stock, status").eq("status", "published").lt("stock", 5).order("stock", { ascending: true }).limit(5),
      supabase.from("tickets_support").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

    const totalVentes = (ventesData ?? []).reduce((acc, o) => acc + (o.total || 0), 0);

    setStats({
      produits: totalProduits ?? 0,
      commandes: totalCommandes ?? 0,
      utilisateurs: totalUtilisateurs ?? 0,
      tickets: totalTickets ?? 0,
      ventes: totalVentes,
      ticketsOuverts: ticketsOuverts ?? 0,
      produitsPublies: produitsPublies ?? 0,
      stockFaible: (stockFaible ?? []).length,
    });
    setCommandesRecentes(commandes ?? []);
    setProduitsStockFaible(stockFaible ?? []);
    setTicketsRecents(tickets ?? []);
    setLoading(false);
  }

  useEffect(() => {
    chargerDashboard();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <p className="text-muted text-center py-5">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">Tableau de bord</h5>
          <p className="mb-0 text-muted">Vue d&apos;ensemble de votre boutique</p>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={chargerDashboard}>
          <i className="ti ti-refresh me-1"></i> Actualiser
        </button>
      </div>

      {/* Stats principales */}
      <div className="row g-3 mb-4">
        {[
          { label: "Produits publies", value: stats.produitsPublies, total: stats.produits, icone: "ti-package", bg: "bg-light-primary", text: "text-primary", lien: "/admin/produits" },
          { label: "Commandes", value: stats.commandes, icone: "ti-shopping-cart", bg: "bg-light-success", text: "text-success", lien: "/admin/commandes" },
          { label: "Chiffre d'affaires", value: `${stats.ventes.toFixed(0)} DT`, icone: "ti-currency-dollar", bg: "bg-light-warning", text: "text-warning", lien: "/admin/commandes" },
          { label: "Utilisateurs", value: stats.utilisateurs, icone: "ti-users", bg: "bg-light-info", text: "text-info", lien: "/admin/utilisateurs" },
          { label: "Tickets ouverts", value: stats.ticketsOuverts, total: stats.tickets, icone: "ti-ticket", bg: "bg-light-danger", text: "text-danger", lien: "/admin/contenu/support" },
          { label: "Stock faible", value: stats.stockFaible, icone: "ti-alert-triangle", bg: "bg-light-warning", text: "text-warning", lien: "/admin/produits" },
        ].map((s) => (
          <div key={s.label} className="col-sm-6 col-xl-4 col-xxl-2">
            <a href={s.lien} className="text-decoration-none">
              <div className="card overflow-hidden rounded-2 h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className={`round-48 d-flex align-items-center justify-content-center rounded-circle ${s.bg} ${s.text}`}>
                      <i className={`ti ${s.icone} fs-6`}></i>
                    </div>
                    <span className="text-muted" style={{ fontSize: "13px" }}>{s.label}</span>
                  </div>
                  <h3 className="fw-semibold mb-0 text-dark">
                    {typeof s.value === "number" ? s.value : s.value}
                    {s.total !== undefined && (
                      <span className="text-muted fw-normal" style={{ fontSize: "14px" }}> / {s.total}</span>
                    )}
                  </h3>
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="card mb-4">
        <div className="card-body p-4">
          <h6 className="fw-semibold mb-3">Actions rapides</h6>
          <div className="d-flex flex-wrap gap-2">
            <a href="/admin/produits" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-plus"></i> Produit
            </a>
            <a href="/admin/categories" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-category"></i> Categorie
            </a>
            <a href="/admin/commandes" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-shopping-cart"></i> Commandes
            </a>
            <a href="/admin/contenu/blog" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-writing"></i> Article
            </a>
            <a href="/admin/medias" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-photo"></i> Medias
            </a>
            <a href="/admin/contenu" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-file-text"></i> Contenu
            </a>
            <a href="/admin/accueil" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              <i className="ti ti-home"></i> Page accueil
            </a>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Commandes recentes */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-semibold mb-0">Commandes recentes</h6>
                <a href="/admin/commandes" className="btn btn-sm btn-outline-primary">Voir tout</a>
              </div>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Client</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandesRecentes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Aucune commande pour le moment
                        </td>
                      </tr>
                    ) : (
                      commandesRecentes.map((c) => (
                        <tr key={c.id}>
                          <td><span className="fw-semibold">#{c.id.slice(0, 8)}</span></td>
                          <td>{c.profiles?.full_name ?? "Inconnu"}</td>
                          <td className="fw-semibold">{c.total} DT</td>
                          <td>
                            <span className={`badge rounded-3 fw-semibold ${STATUTS[c.status]?.classe ?? "bg-secondary"}`}>
                              {STATUTS[c.status]?.label ?? c.status}
                            </span>
                          </td>
                          <td className="text-muted">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="col-lg-4">
          {/* Alertes stock */}
          <div className="card mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-semibold mb-0">
                  <i className="ti ti-alert-triangle text-warning me-1"></i>
                  Stock faible
                </h6>
              </div>
              {produitsStockFaible.length === 0 ? (
                <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Tous les stocks sont suffisants.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {produitsStockFaible.map((p) => (
                    <div key={p.id} className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: "#fff5f5" }}>
                      <span style={{ fontSize: "13px" }} className="fw-semibold">{p.title}</span>
                      <span className={`badge ${p.stock === 0 ? "bg-danger" : "bg-warning text-dark"}`}>
                        {p.stock === 0 ? "Rupture" : `${p.stock} restant(s)`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tickets recents */}
          <div className="card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-semibold mb-0">Tickets recents</h6>
                <a href="/admin/contenu/support" className="btn btn-sm btn-outline-primary">Voir</a>
              </div>
              {ticketsRecents.length === 0 ? (
                <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Aucun ticket.</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {ticketsRecents.map((t) => (
                    <div key={t.id} className="d-flex align-items-center justify-content-between">
                      <span style={{ fontSize: "13px" }} className="text-truncate me-2">{t.subject}</span>
                      <span className={`badge rounded-3 ${t.status === "open" ? "bg-warning text-dark" : "bg-success"}`} style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                        {t.status === "open" ? "Ouvert" : "Ferme"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
