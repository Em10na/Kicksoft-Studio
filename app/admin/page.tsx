"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Commande = {
  id: string; total: number; status: string; created_at: string;
  guest_name: string | null;
  profiles?: { full_name: string } | null;
};
type Produit = { id: string; title: string; stock: number };
type DevisRecent = { id: string; subject: string; status: string; created_at: string };

// Subject format: "[DEVIS] Societe - Secteur" ou "[DEVIS] Societe - Secteur - Produit: Nom (ref)"
function parseDevisSubject(subject: string) {
  const body = subject.replace(/^\[DEVIS\]\s*/, "");
  const societe = body.split(" - ")[0]?.trim() || "Sans société";
  const produitMatch = body.match(/Produit:\s*([^(]+)/);
  return { societe, produit: produitMatch ? produitMatch[1].trim() : null };
}

const STATUTS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente", cls: "ak-badge--warning" },
  shipped:   { label: "Expédiée",   cls: "ak-badge--info" },
  delivered: { label: "Livrée",     cls: "ak-badge--success" },
  cancelled: { label: "Annulée",    cls: "ak-badge--danger" },
};

function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!value) return;
    let i = 0;
    const steps = 25;
    const step = value / steps;
    const t = setInterval(() => {
      i += step;
      if (i >= value) { setN(value); clearInterval(t); }
      else setN(Math.floor(i));
    }, 600 / steps);
    return () => clearInterval(t);
  }, [value]);
  return <>{n.toLocaleString("fr-FR")}</>;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ ventes: 0, commandes: 0, commandesAttente: 0, produits: 0, produitsPublies: 0, utilisateurs: 0, devisNouveaux: 0, devisTotal: 0, stockFaible: 0 });
  const [commandesRecentes, setCommandesRecentes] = useState<Commande[]>([]);
  const [stockFaible, setStockFaible] = useState<Produit[]>([]);
  const [devisRecents, setDevisRecents] = useState<DevisRecent[]>([]);

  async function load() {
    setLoading(true);
    const [
      { count: cProd }, { count: cCmd }, { count: cUsers }, { count: cDevis },
      { count: cDevisOpen }, { count: cProdPub }, { count: cCmdPend },
      { data: cmds }, { data: ventes }, { data: stock }, { data: devis },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("tickets_support").select("*", { count: "exact", head: true }).ilike("subject", "[DEVIS]%"),
      supabase.from("tickets_support").select("*", { count: "exact", head: true }).ilike("subject", "[DEVIS]%").eq("status", "open"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(6),
      supabase.from("orders").select("total").eq("status", "delivered"),
      supabase.from("products").select("id, title, stock").eq("status", "published").lte("stock", 5).order("stock").limit(5),
      supabase.from("tickets_support").select("id, subject, status, created_at").ilike("subject", "[DEVIS]%").order("created_at", { ascending: false }).limit(5),
    ]);
    const totalVentes = (ventes ?? []).reduce((a, o) => a + (o.total || 0), 0);
    setStats({ ventes: totalVentes, commandes: cCmd ?? 0, commandesAttente: cCmdPend ?? 0, produits: cProd ?? 0, produitsPublies: cProdPub ?? 0, utilisateurs: cUsers ?? 0, devisNouveaux: cDevisOpen ?? 0, devisTotal: cDevis ?? 0, stockFaible: (stock ?? []).length });
    setCommandesRecentes(cmds ?? []);
    setStockFaible(stock ?? []);
    setDevisRecents(devis ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "#64748b", fontSize: 13 }}>Chargement...</p>
      </div>
    </div>
  );

  const bigStats = [
    { label: "Chiffre d'affaires", value: stats.ventes, suffix: " DT", icon: "ti-trending-up", grad: "linear-gradient(135deg,#6366f1,#818cf8)", href: "/admin/commandes" },
    { label: "Commandes", value: stats.commandes, icon: "ti-shopping-cart", grad: "linear-gradient(135deg,#f43f5e,#fb7185)", href: "/admin/commandes", sub: stats.commandesAttente > 0 ? `${stats.commandesAttente} en attente` : undefined },
    { label: "Produits publiés", value: stats.produitsPublies, icon: "ti-package", grad: "linear-gradient(135deg,#0ea5e9,#38bdf8)", href: "/admin/produits", sub: `${stats.produits} total` },
    { label: "Utilisateurs", value: stats.utilisateurs, icon: "ti-users", grad: "linear-gradient(135deg,#10b981,#34d399)", href: "/admin/utilisateurs" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome */}
      <div className="ak-animate dash-welcome" style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)", borderRadius: 16, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "rgba(99,102,241,0.08)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -60, right: 100, width: 140, height: 140, background: "rgba(99,102,241,0.05)", borderRadius: "50%" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: "0 0 6px" }}>Bienvenue sur DJI Store TN Admin 👋</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>Voici un résumé de votre activité.</p>
          </div>
          <button onClick={load} className="ak-btn ak-btn--ghost ak-btn--sm" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
            <i className="ti ti-refresh" style={{ fontSize: 15 }}></i> Actualiser
          </button>
        </div>
      </div>

      {/* Big stats */}
      <div className="dash-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {bigStats.map((s, i) => (
          <Link key={s.label} href={s.href} className={`ak-animate ak-animate-${i + 1}`} style={{ textDecoration: "none" }}>
            <div className="ak-card ak-card--lift" style={{ background: s.grad, border: "none", color: "#fff", padding: "22px 22px 18px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>{s.label}</span>
                  <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.18)", borderRadius: 10, display: "grid", placeItems: "center" }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 18 }}></i>
                  </div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  <Counter value={Math.floor(s.value)} />{s.suffix}
                </div>
                {s.sub && <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>{s.sub}</div>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { label: "Devis à traiter", value: stats.devisNouveaux, total: stats.devisTotal, icon: "ti-file-invoice", color: "#f59e0b", bg: "#fffbeb", href: "/admin/devis" },
          { label: "Stock faible (≤ 5)", value: stats.stockFaible, icon: "ti-alert-triangle", color: "#ef4444", bg: "#fef2f2", href: "/admin/stock" },
        ].map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div className="ak-card ak-card--lift" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <i className={`ti ${s.icon}`} style={{ fontSize: 20, color: s.color }}></i>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  {s.value}
                  {s.total !== undefined && <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400 }}> / {s.total}</span>}
                </div>
              </div>
              {s.value > 0 && <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: s.color, animation: "pulse 2s infinite" }} />}
            </div>
          </Link>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}`}</style>

      {/* Quick actions */}
      <div className="ak-card">
        <div className="ak-card__header">
          <div>
            <h2 className="ak-card__title">Actions rapides</h2>
          </div>
        </div>
        <div className="ak-card__body" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { href: "/admin/produits", icon: "ti-plus", label: "Nouveau produit", primary: true },
            { href: "/admin/categories", icon: "ti-category", label: "Catégorie" },
            { href: "/admin/commandes", icon: "ti-shopping-cart", label: "Commandes" },
            { href: "/admin/devis", icon: "ti-file-invoice", label: "Devis" },
            { href: "/admin/contenu/faq", icon: "ti-help", label: "FAQ" },
            { href: "/admin/accueil", icon: "ti-home", label: "Page accueil" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className={`ak-btn ${a.primary ? "ak-btn--primary" : "ak-btn--ghost"} ak-btn--sm`}>
              <i className={`ti ${a.icon}`}></i> {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="dash-bottom-row" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Commandes récentes */}
        <div className="ak-card">
          <div className="ak-card__header">
            <div>
              <h2 className="ak-card__title">Commandes récentes</h2>
              <p className="ak-card__subtitle">Les 6 dernières commandes</p>
            </div>
            <Link href="/admin/commandes" className="ak-btn ak-btn--ghost ak-btn--sm">Voir tout →</Link>
          </div>
          <div className="ak-card__body" style={{ padding: 0 }}>
            <div className="ak-table-wrap">
              <table className="ak-table">
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
                    <tr><td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Aucune commande</td></tr>
                  ) : commandesRecentes.map((c) => {
                    const name = c.profiles?.full_name ?? c.guest_name ?? "Inconnu";
                    const s = STATUTS[c.status] ?? { label: c.status, cls: "ak-badge--muted" };
                    return (
                      <tr key={c.id}>
                        <td><span className="ak-cell-mono">#{c.id.slice(0,8)}</span></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{name}</div>
                              {!c.profiles?.full_name && c.guest_name && <div style={{ fontSize: 10, color: "#94a3b8" }}>Invité</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className="ak-cell-bold">{c.total} DT</span></td>
                        <td><span className={`ak-badge ak-badge--dot ${s.cls}`}>{s.label}</span></td>
                        <td><span className="ak-cell-muted">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Stock faible */}
          <div className="ak-card">
            <div className="ak-card__header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, background: "#fef2f2", borderRadius: 8, display: "grid", placeItems: "center" }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 15, color: "#ef4444" }}></i>
                </div>
                <h2 className="ak-card__title">Stock faible</h2>
              </div>
            </div>
            <div className="ak-card__body">
              {stockFaible.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#ecfdf5", borderRadius: 8, fontSize: 13, color: "#065f46" }}>
                  <i className="ti ti-check"></i> Tous les stocks OK
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stockFaible.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, background: p.stock === 0 ? "#fef2f2" : "#fffbeb" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{p.title}</span>
                      <span className={`ak-badge ${p.stock === 0 ? "ak-badge--danger" : "ak-badge--warning"}`}>
                        {p.stock === 0 ? "Rupture" : `${p.stock} restant`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Demandes de devis récentes */}
          <div className="ak-card">
            <div className="ak-card__header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, background: "#ede9fe", borderRadius: 8, display: "grid", placeItems: "center" }}>
                  <i className="ti ti-file-invoice" style={{ fontSize: 15, color: "#7c3aed" }}></i>
                </div>
                <h2 className="ak-card__title">Devis récents</h2>
              </div>
              <Link href="/admin/devis" className="ak-btn ak-btn--ghost ak-btn--sm">Voir tout →</Link>
            </div>
            <div className="ak-card__body">
              {devisRecents.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, textAlign: "center" }}>Aucune demande de devis</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {devisRecents.map((d, i) => {
                    const { societe, produit } = parseDevisSubject(d.subject);
                    return (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: i < devisRecents.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {societe}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {produit ? <><i className="ti ti-package" style={{ fontSize: 11 }}></i> {produit}</> : "Demande générale"}
                            {" · "}{new Date(d.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <span className={`ak-badge ${d.status === "open" ? "ak-badge--warning" : "ak-badge--success"}`}>
                          {d.status === "open" ? "Nouveau" : "Traité"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
