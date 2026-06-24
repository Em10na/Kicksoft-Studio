"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function CompteDashboard() {
  const supabase = createClient();
  const [nom, setNom] = useState("");
  const [stats, setStats] = useState({ commandes: 0, favoris: 0, tickets: 0, points: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profil }, { count: commandes }, { count: favoris }, { count: tickets }, { data: loyaltyTxns }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("wishlist").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("tickets_support").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("loyalty_transactions").select("points").eq("user_id", user.id),
      ]);
      const pointsBalance = (loyaltyTxns ?? []).reduce((s: number, t: { points: number }) => s + t.points, 0);
      setNom(profil?.full_name || user.email || "");
      setStats({ commandes: commandes ?? 0, favoris: favoris ?? 0, tickets: tickets ?? 0, points: pointsBalance });
      setLoading(false);
    }
    charger();
  }, []);

  if (loading) return <p style={{ color: "var(--fg-mute)", padding: "var(--s6)" }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s2)" }}>Bonjour, {nom} !</h2>
      <p style={{ color: "var(--fg-soft)", marginBottom: "var(--s6)" }}>Bienvenue dans votre espace client.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s4)", marginBottom: "var(--s6)" }}>
        {[
          { label: "Commandes", valeur: stats.commandes, lien: "/compte/commandes", couleur: "var(--indigo)" },
          { label: "Favoris", valeur: stats.favoris, lien: "/compte/favoris", couleur: "var(--rose)" },
          { label: "Tickets", valeur: stats.tickets, lien: "/compte/support", couleur: "var(--amber)" },
          { label: "Points fidelite", valeur: stats.points, lien: "/compte/fidelite", couleur: "#d97706" },
        ].map((s) => (
          <Link key={s.label} href={s.lien} style={{ textDecoration: "none" }}>
            <div style={{ padding: "var(--s5)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: "var(--text-3xl)", fontWeight: 800, color: s.couleur }}>{s.valeur}</div>
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)", marginTop: "var(--s2)" }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
        <Link href="/compte/profil" style={{ textDecoration: "none" }}>
          <div style={{ padding: "var(--s5)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)" }}>
            <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s2)", color: "var(--ink)" }}>Modifier mon profil</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-soft)" }}>Nom, telephone, adresse et preferences.</p>
          </div>
        </Link>
        <Link href="/boutique" style={{ textDecoration: "none" }}>
          <div style={{ padding: "var(--s5)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)" }}>
            <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--s2)", color: "var(--ink)" }}>Continuer mes achats</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-soft)" }}>Decouvrez nos derniers produits et offres.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
