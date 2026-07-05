"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Commande = { id: string; total: number; status: string; created_at: string };

const STATUTS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "account-badge--pending" },
  shipped: { label: "Expédiée", cls: "account-badge--shipped" },
  delivered: { label: "Livrée", cls: "account-badge--delivered" },
  cancelled: { label: "Annulée", cls: "account-badge--cancelled" },
};

// Compteur animé (monte progressivement jusqu'à la valeur)
function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!value) { setN(0); return; }
    let i = 0;
    const steps = 30;
    const step = value / steps;
    const t = setInterval(() => {
      i += step;
      if (i >= value) { setN(value); clearInterval(t); }
      else setN(Math.floor(i));
    }, 700 / steps);
    return () => clearInterval(t);
  }, [value]);
  return <>{n.toLocaleString("fr-FR")}</>;
}

// "emna.omri@esprit.tn" → "Emna" ; "Emna Omri" → "Emna"
function prenomDepuis(nom: string): string {
  const base = nom.includes("@") ? nom.split("@")[0].split(/[._-]/)[0] : nom.split(" ")[0];
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : nom;
}

export default function CompteDashboard() {
  const supabase = createClient();
  const [nom, setNom] = useState("");
  const [depuis, setDepuis] = useState<string | null>(null);
  const [stats, setStats] = useState({ commandes: 0, favoris: 0, tickets: 0, points: 0 });
  const [commandesRecentes, setCommandesRecentes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profil }, { count: commandes }, { count: favoris }, { count: tickets }, { data: loyaltyTxns }, { data: recentes }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("wishlist").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("tickets_support").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("loyalty_transactions").select("points").eq("user_id", user.id),
        supabase.from("orders").select("id, total, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
      ]);
      const pointsBalance = (loyaltyTxns ?? []).reduce((s: number, t: { points: number }) => s + t.points, 0);
      setNom(profil?.full_name || user.email || "");
      setDepuis(user.created_at ?? null);
      setStats({ commandes: commandes ?? 0, favoris: favoris ?? 0, tickets: tickets ?? 0, points: pointsBalance });
      setCommandesRecentes(recentes ?? []);
      setLoading(false);
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p style={{ color: "var(--fg-mute)", padding: "var(--s6)" }}>Chargement...</p>;

  const prenom = prenomDepuis(nom);
  // Progression vers le prochain palier de 1000 points
  const palier = Math.max(1000, Math.ceil((stats.points + 1) / 1000) * 1000);
  const progression = Math.min(100, Math.round(((stats.points % 1000) / 1000) * 100));
  const resteAvantPalier = palier - stats.points;

  const cartes = [
    {
      label: "Commandes", valeur: stats.commandes, lien: "/compte/commandes", couleur: "indigo",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
        </svg>
      ),
    },
    {
      label: "Favoris", valeur: stats.favoris, lien: "/compte/favoris", couleur: "rose",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      label: "Points fidélité", valeur: stats.points, lien: "/compte/fidelite", couleur: "amber",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      label: "Tickets support", valeur: stats.tickets, lien: "/compte/support", couleur: "emerald",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ];

  const liens = [
    {
      href: "/compte/profil", titre: "Modifier mon profil", sous: "Nom, téléphone, adresse et préférences", couleur: "indigo",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      href: "/boutique", titre: "Continuer mes achats", sous: "Derniers produits et offres", couleur: "rose",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2l-2 5v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-2-5z" /><path d="M4 7h16" /><path d="M16 11a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      href: "/compte/fidelite", titre: "Mes récompenses", sous: "Utilisez vos points fidélité", couleur: "amber",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      ),
    },
    {
      href: "/compte/support", titre: "Besoin d'aide ?", sous: "Contactez notre support", couleur: "emerald",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Bannière d'accueil */}
      <div className="account-hero account-animate">
        <span className="account-hero__halo" />
        <span className="account-hero__halo account-hero__halo--2" />
        <div className="account-hero__body">
          <h2>Bonjour, {prenom} 👋</h2>
          <p className="account-hero__sub">Heureux de vous revoir sur votre espace client.</p>
          {depuis && (
            <span className="account-hero__since">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Membre depuis {new Date(depuis).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
          )}
        </div>
        <div className="account-hero__points">
          <div className="account-hero__points-value">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <Counter value={stats.points} />
          </div>
          <div className="account-hero__points-label">Points fidélité</div>
          <div className="account-progress">
            <div className="account-progress__fill" style={{ width: `${progression}%` }} />
          </div>
          <div className="account-progress-hint">
            {resteAvantPalier > 0 ? `${resteAvantPalier.toLocaleString("fr-FR")} pts avant le palier ${palier.toLocaleString("fr-FR")}` : "Palier atteint 🎉"}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="account-stats">
        {cartes.map((s, i) => (
          <Link key={s.label} href={s.lien} className={`account-stat account-stat--${s.couleur} account-animate account-animate--${i + 1}`}>
            <div className="account-stat__icon">{s.icon}</div>
            <div className="account-stat__value"><Counter value={s.valeur} /></div>
            <div className="account-stat__label">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Bas : commandes + liens rapides */}
      <div className="account-bottom">
        <div className="account-panel account-animate account-animate--4" style={{ marginBottom: 0 }}>
          <div className="account-panel__head">
            <h3 className="account-panel__title">Dernières commandes</h3>
            <Link href="/compte/commandes" className="account-panel__link">Voir tout →</Link>
          </div>
          {commandesRecentes.length === 0 ? (
            <div className="account-empty">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
              </svg>
              Aucune commande pour le moment.
              <div style={{ marginTop: "var(--s4)" }}>
                <Link href="/boutique" className="btn btn--ink">Explorer la boutique →</Link>
              </div>
            </div>
          ) : (
            commandesRecentes.map((c) => {
              const s = STATUTS[c.status] ?? { label: c.status, cls: "" };
              return (
                <Link key={c.id} href="/compte/commandes" className="account-order">
                  <span className="account-order__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
                    </svg>
                  </span>
                  <span className="account-order__meta">
                    <span className="account-order__id">#{c.id.slice(0, 8)}</span>
                    <div className="account-order__date">
                      {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </span>
                  <span className={`account-badge ${s.cls}`}>{s.label}</span>
                  <span className="account-order__total">{c.total} DT</span>
                </Link>
              );
            })
          )}
        </div>

        <div className="account-panel account-animate account-animate--5" style={{ marginBottom: 0 }}>
          <div className="account-panel__head">
            <h3 className="account-panel__title">Accès rapides</h3>
          </div>
          {liens.map((l) => (
            <Link key={l.href + l.titre} href={l.href} className="account-links__item">
              <span className={`account-links__icon account-links__icon--${l.couleur}`}>{l.icon}</span>
              <span className="account-links__label">
                <strong>{l.titre}</strong>
                <span>{l.sous}</span>
              </span>
              <svg className="arrow" width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
