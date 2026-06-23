"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LOYALTY, getUserTier, getNextTier, getProgressToNext } from "@/lib/loyalty-config";
import Link from "next/link";

type Reward = { id: string; name: string; description: string | null; points_required: number; reward_type: string; reduction_value: number | null };
type Transaction = { id: string; points: number; type: string; description: string | null; created_at: string; expires_at: string | null };

export default function FidelitePage() {
  const supabase = createClient();
  const [balance, setBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: txns }, { data: rw }] = await Promise.all([
        supabase.from("loyalty_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("loyalty_rewards").select("*").eq("active", true).order("points_required"),
      ]);

      const allTxns = txns ?? [];
      const bal = allTxns.reduce((s: number, t: { points: number }) => s + t.points, 0);
      const lifetime = allTxns.filter((t: { points: number }) => t.points > 0).reduce((s: number, t: { points: number }) => s + t.points, 0);
      setBalance(bal);
      setLifetimePoints(lifetime);
      setTransactions(allTxns);
      setRewards(rw ?? []);
      setLoading(false);
    }
    charger();
  }, []);

  async function echangerCadeau(reward: Reward) {
    if (!userId || balance < reward.points_required) return;
    if (!confirm(`Echanger ${reward.points_required} points contre "${reward.name}" ?`)) return;

    const { error } = await supabase.from("loyalty_transactions").insert({
      user_id: userId,
      points: -reward.points_required,
      type: "redeem_gift",
      description: `Cadeau echange : ${reward.name}`,
      reward_id: reward.id,
    });

    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "error" });
    } else {
      setBalance(balance - reward.points_required);
      setTransactions([{
        id: crypto.randomUUID(), points: -reward.points_required,
        type: "redeem_gift", description: `Cadeau echange : ${reward.name}`,
        created_at: new Date().toISOString(), expires_at: null,
      }, ...transactions]);
      setAlert({ message: `"${reward.name}" echange avec succes !`, type: "success" });
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 5000);
  }

  const tier = getUserTier(lifetimePoints);
  const nextTier = getNextTier(lifetimePoints);
  const progress = getProgressToNext(lifetimePoints);
  const pointsToNext = nextTier ? nextTier.min - lifetimePoints : 0;

  const TYPE_LABELS: Record<string, string> = {
    earn: "Gagne", redeem_reduction: "Reduction", redeem_gift: "Cadeau", admin_adjust: "Ajustement",
  };
  const TYPE_COLORS: Record<string, string> = {
    earn: "#16a34a", redeem_reduction: "#d97706", redeem_gift: "#4F46E5", admin_adjust: "#6B7280",
  };

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      {alert.message && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--r)", marginBottom: "var(--s5)", fontSize: "var(--text-sm)", background: alert.type === "success" ? "#f0fdf4" : "#fef2f2", color: alert.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${alert.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {alert.message}
        </div>
      )}

      {/* ====== HERO : Solde + Niveau + Progression ====== */}
      <div style={{ background: `linear-gradient(135deg, #0F172A, #1E293B)`, borderRadius: "var(--r-xl)", padding: "var(--s8)", marginBottom: "var(--s7)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", background: `${tier.color}15`, filter: "blur(80px)", top: "-80px", right: "-60px" }}></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s7)", position: "relative", zIndex: 2 }}>
          {/* Solde */}
          <div>
            <div style={{ fontSize: "11px", fontFamily: "var(--ff-mono)", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: "var(--s2)" }}>Votre solde disponible</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{balance}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.5)", marginTop: "var(--s1)" }}>points utilisables</div>
          </div>

          {/* Niveau */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", fontFamily: "var(--ff-mono)", textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: "var(--s2)" }}>Votre niveau</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 20px", background: `${tier.color}20`, border: `1px solid ${tier.color}40`, borderRadius: "999px" }}>
              <span style={{ fontSize: "24px" }}>{tier.icon}</span>
              <span style={{ fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: "var(--text-xl)", color: tier.color }}>{tier.name}</span>
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.4)", marginTop: "var(--s2)" }}>{lifetimePoints} points cumules au total</div>
          </div>
        </div>

        {/* Barre de progression */}
        {nextTier && (
          <div style={{ marginTop: "var(--s6)", position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--s2)" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.5)", fontFamily: "var(--ff-mono)" }}>
                {tier.icon} {tier.name}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.5)", fontFamily: "var(--ff-mono)" }}>
                {nextTier.icon} {nextTier.name} — encore {pointsToNext} pts
              </span>
            </div>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`, borderRadius: "999px", transition: "width 1s ease" }}></div>
            </div>
          </div>
        )}
        {!nextTier && (
          <div style={{ marginTop: "var(--s5)", textAlign: "center", fontSize: "var(--text-sm)", color: tier.color, position: "relative", zIndex: 2 }}>
            {tier.icon} Felicitations ! Vous avez atteint le niveau maximum !
          </div>
        )}
      </div>

      {/* ====== AVANTAGES DU NIVEAU ====== */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Avantages de votre niveau</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
        <div style={{ padding: "var(--s5)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "var(--s2)" }}>💰</div>
          <div style={{ fontWeight: 700, fontSize: "var(--text-base)", marginBottom: "var(--s1)" }}>{tier.discount}% de reduction</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>Sur toutes vos commandes</div>
        </div>
        <div style={{ padding: "var(--s5)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "var(--s2)" }}>🚚</div>
          <div style={{ fontWeight: 700, fontSize: "var(--text-base)", marginBottom: "var(--s1)" }}>{tier.freeShipping ? "Livraison gratuite" : "Livraison standard"}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>{tier.freeShipping ? "Sur toutes vos commandes" : `Gratuite a partir de ${tier.slug === "argent" ? "30" : "50"} DT`}</div>
        </div>
        <div style={{ padding: "var(--s5)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "var(--s2)" }}>⭐</div>
          <div style={{ fontWeight: 700, fontSize: "var(--text-base)", marginBottom: "var(--s1)" }}>{LOYALTY.POINTS_PER_DT} pt / DT</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>Points gagnes par DT depense</div>
        </div>
      </div>

      {/* ====== TOUS LES NIVEAUX ====== */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Les niveaux de fidelite</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s3)", marginBottom: "var(--s7)" }}>
        {LOYALTY.TIERS.map((t) => {
          const isCurrent = t.slug === tier.slug;
          return (
            <div key={t.slug} style={{ padding: "var(--s5)", background: isCurrent ? `${t.color}10` : "var(--paper)", border: `2px solid ${isCurrent ? t.color : "var(--rule)"}`, borderRadius: "var(--r)", textAlign: "center", opacity: lifetimePoints >= t.min ? 1 : 0.5 }}>
              <div style={{ fontSize: "28px", marginBottom: "var(--s2)" }}>{t.icon}</div>
              <div style={{ fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: "var(--text-base)", color: t.color }}>{t.name}</div>
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: "10px", color: "var(--fg-mute)", marginTop: "var(--s1)" }}>{t.min} pts</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-soft)", marginTop: "var(--s2)" }}>{t.discount}% reduction{t.freeShipping ? " + livraison gratuite" : ""}</div>
              {isCurrent && <div style={{ marginTop: "var(--s2)", fontSize: "10px", fontFamily: "var(--ff-mono)", color: t.color, fontWeight: 700 }}>NIVEAU ACTUEL</div>}
            </div>
          );
        })}
      </div>

      {/* ====== COMMENT GAGNER DES POINTS ====== */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Comment gagner des points</h3>
      <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: "var(--s7)" }}>
        {[
          { action: "Chaque DT depense", points: `+${LOYALTY.POINTS_PER_DT} pt`, icon: "🛒" },
          { action: "Bonus par produit", points: "Variable", icon: "📦" },
          { action: "Creation de compte", points: `+${LOYALTY.BONUS_SIGNUP} pts`, icon: "👤" },
          { action: "Premiere commande livree", points: `+${LOYALTY.BONUS_FIRST_ORDER} pts`, icon: "🎉" },
        ].map((row, i, arr) => (
          <div key={row.action} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--s4) var(--s5)", borderBottom: i < arr.length - 1 ? "1px solid var(--rule)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
              <span style={{ fontSize: "20px" }}>{row.icon}</span>
              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{row.action}</span>
            </div>
            <span style={{ fontFamily: "var(--ff-display)", fontWeight: 700, color: "#16a34a", fontSize: "var(--text-sm)" }}>{row.points}</span>
          </div>
        ))}
      </div>

      {/* ====== RECOMPENSES ====== */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Echanger vos points</h3>
      {rewards.length === 0 ? (
        <p style={{ color: "var(--fg-mute)", marginBottom: "var(--s6)" }}>Aucune recompense disponible pour le moment.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--s4)", marginBottom: "var(--s7)" }}>
          {rewards.map((r) => {
            const canRedeem = balance >= r.points_required;
            return (
              <div key={r.id} style={{ padding: "var(--s5)", background: "var(--paper)", border: `1px solid ${canRedeem ? "#fed7aa" : "var(--rule)"}`, borderRadius: "var(--r)", opacity: canRedeem ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s2)" }}>
                  <span style={{ fontSize: "20px" }}>{r.reward_type === "reduction" ? "💰" : "🎁"}</span>
                  <span style={{ fontFamily: "var(--ff-mono)", fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: r.reward_type === "reduction" ? "#fef3c7" : "#dbeafe", color: r.reward_type === "reduction" ? "#92400e" : "#1e40af" }}>
                    {r.reward_type === "reduction" ? "Reduction" : "Cadeau"}
                  </span>
                </div>
                <h4 style={{ fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "var(--s1)" }}>{r.name}</h4>
                {r.description && <p style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", marginBottom: "var(--s3)" }}>{r.description}</p>}
                <div style={{ fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: "var(--text-lg)", color: canRedeem ? "#d97706" : "var(--fg-mute)", marginBottom: "var(--s3)" }}>{r.points_required} pts</div>
                {r.reward_type === "gift" ? (
                  <button onClick={() => echangerCadeau(r)} disabled={!canRedeem}
                    style={{ width: "100%", padding: "10px", background: canRedeem ? "var(--indigo)" : "var(--bg-deep)", color: canRedeem ? "#fff" : "var(--fg-mute)", border: "none", borderRadius: "var(--r)", fontWeight: 600, fontSize: "var(--text-sm)", cursor: canRedeem ? "pointer" : "not-allowed" }}>
                    {canRedeem ? "Echanger" : `${r.points_required - balance} pts manquants`}
                  </button>
                ) : (
                  <Link href="/panier" style={{ display: "block", width: "100%", padding: "10px", background: canRedeem ? "#fff7ed" : "var(--bg)", color: canRedeem ? "#d97706" : "var(--fg-mute)", border: `1px solid ${canRedeem ? "#fed7aa" : "var(--rule)"}`, borderRadius: "var(--r)", fontWeight: 600, fontSize: "var(--text-sm)", textAlign: "center", textDecoration: "none" }}>
                    {canRedeem ? "Utiliser au checkout" : `${r.points_required - balance} pts manquants`}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ====== HISTORIQUE ====== */}
      <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s4)" }}>Historique des points</h3>
      {transactions.length === 0 ? (
        <p style={{ color: "var(--fg-mute)" }}>Aucune transaction. Achetez des produits pour commencer a gagner des points !</p>
      ) : (
        <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", overflow: "hidden" }}>
          {transactions.map((t, i) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--s4) var(--s5)", borderBottom: i < transactions.length - 1 ? "1px solid var(--rule)" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{t.description || TYPE_LABELS[t.type] || t.type}</div>
                <div style={{ display: "flex", gap: "var(--s3)", fontSize: "var(--text-xs)", color: "var(--fg-mute)", marginTop: "2px" }}>
                  <span>{new Date(t.created_at).toLocaleDateString("fr-FR")}</span>
                  <span style={{ color: TYPE_COLORS[t.type] }}>{TYPE_LABELS[t.type]}</span>
                  {t.expires_at && (
                    <span>Expire le {new Date(t.expires_at).toLocaleDateString("fr-FR")}</span>
                  )}
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
