"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LOYALTY } from "@/lib/loyalty-config";

type Transaction = { id: string; points: number; type: string; description: string | null; created_at: string; order_id: string | null };

export default function FidelitePage() {
  const supabase = createClient();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: txns } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const all = txns ?? [];
      setBalance(all.reduce((s: number, t: { points: number }) => s + t.points, 0));
      setTransactions(all);
      setLoading(false);
    }
    charger();
  }, []);

  const TYPE_LABELS: Record<string, string> = {
    earn: "Points gagnes",
    redeem_reduction: "Reduction utilisee",
    admin_adjust: "Ajustement",
  };
  const TYPE_COLORS: Record<string, string> = {
    earn: "#16a34a",
    redeem_reduction: "#d97706",
    admin_adjust: "#6B7280",
  };

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Mes points de fidelite</h2>

      {/* Solde */}
      <div style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)", borderRadius: "var(--r-xl)", padding: "var(--s8)", marginBottom: "var(--s7)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(245,158,11,0.1)", filter: "blur(80px)", top: "-80px", right: "-60px" }}></div>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div style={{ fontSize: "11px", fontFamily: "var(--ff-mono)", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: "var(--s3)" }}>
            Solde total disponible
          </div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(3rem, 6vw, 4.5rem)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {balance}
          </div>
          <div style={{ fontSize: "var(--text-md)", color: "rgba(255,255,255,0.5)", marginTop: "var(--s2)" }}>
            points de fidelite
          </div>
          <div style={{ marginTop: "var(--s5)", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.4)" }}>
            Gagnez {LOYALTY.POINTS_PER_DT} point par DT depense. Utilisez vos points pour reduire le prix de vos commandes.
          </div>
        </div>
      </div>

      {/* Historique */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Historique</h3>
      {transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s8)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)" }}>
          <p style={{ color: "var(--fg-mute)", marginBottom: "var(--s3)" }}>Vous n&apos;avez pas encore de points.</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-mute)" }}>Passez une commande pour commencer a en cumuler !</p>
        </div>
      ) : (
        <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", overflow: "hidden" }}>
          {transactions.map((t, i) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--s4) var(--s5)", borderBottom: i < transactions.length - 1 ? "1px solid var(--rule)" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                  {t.description || TYPE_LABELS[t.type] || t.type}
                </div>
                <div style={{ display: "flex", gap: "var(--s3)", fontSize: "var(--text-xs)", color: "var(--fg-mute)", marginTop: "2px" }}>
                  <span>{new Date(t.created_at).toLocaleDateString("fr-FR")}</span>
                  <span style={{ color: TYPE_COLORS[t.type] }}>{TYPE_LABELS[t.type] || t.type}</span>
                  {t.order_id && <span>Commande #{t.order_id.slice(0, 8)}</span>}
                </div>
              </div>
              <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-md)", color: t.points > 0 ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>
                {t.points > 0 ? "+" : ""}{t.points} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
