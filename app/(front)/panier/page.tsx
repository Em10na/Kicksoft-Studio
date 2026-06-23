"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { getUserTier } from "@/lib/loyalty-config";

type ReductionReward = { id: string; name: string; points_required: number; reduction_value: number };

export default function PanierPage() {
  const { items, count, total, updateQty, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [reductions, setReductions] = useState<ReductionReward[]>([]);
  const [selectedReduction, setSelectedReduction] = useState<string | null>(null);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadLoyalty() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: txns }, { data: rw }] = await Promise.all([
        supabase.from("loyalty_transactions").select("points").eq("user_id", user.id),
        supabase.from("loyalty_rewards").select("id, name, points_required, reduction_value").eq("reward_type", "reduction").eq("active", true).order("points_required"),
      ]);
      const allTxns = txns ?? [];
      setPointsBalance(allTxns.reduce((s: number, t: { points: number }) => s + t.points, 0));
      setLifetimePoints(allTxns.filter((t: { points: number }) => t.points > 0).reduce((s: number, t: { points: number }) => s + t.points, 0));
      setReductions((rw ?? []) as ReductionReward[]);
    }
    loadLoyalty();
  }, []);

  const tier = getUserTier(lifetimePoints);
  const tierDiscount = tier.discount > 0 ? Math.round(total * tier.discount / 100) : 0;
  const tierFreeShipping = tier.freeShipping;
  const livraison = tierFreeShipping || total >= 50 ? 0 : 7;
  const grandTotal = Math.max(0, total - tierDiscount + livraison - pointsDiscount);

  async function passerCommande() {
    setLoading(true);
    setErreur("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/connexion");
      return;
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({ user_id: user.id, total: grandTotal, status: "pending" })
      .select("id")
      .single();

    if (orderErr || !order) {
      setErreur("Erreur lors de la creation de la commande : " + (orderErr?.message ?? ""));
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.qty,
      unit_price: item.price,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      setErreur("Erreur lors de l'ajout des articles : " + itemsErr.message);
      setLoading(false);
      return;
    }

    if (selectedReduction) {
      const reward = reductions.find((r) => r.id === selectedReduction);
      if (reward) {
        await supabase.from("loyalty_transactions").insert({
          user_id: user.id,
          order_id: order.id,
          points: -reward.points_required,
          type: "redeem_reduction",
          description: `Reduction ${reward.reduction_value} DT - commande #${order.id.slice(0, 8)}`,
          reward_id: reward.id,
        });
      }
    }

    clearCart();
    setSucces(true);
    setLoading(false);
  }

  if (succes) {
    return (
      <>
        <section className="page-head">
          <div className="container">
            <h1>Commande confirmee !</h1>
          </div>
        </section>
        <section className="section">
          <div className="container" style={{ textAlign: "center", padding: "var(--s9) 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "var(--s5)" }}>&#x2713;</div>
            <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s4)" }}>Merci pour votre commande !</h2>
            <p style={{ color: "var(--fg-soft)", marginBottom: "var(--s6)", maxWidth: "48ch", margin: "0 auto var(--s6)" }}>
              Votre commande a ete enregistree avec succes. Vous pouvez suivre son statut dans votre espace client.
            </p>
            <div style={{ display: "flex", gap: "var(--s4)", justifyContent: "center" }}>
              <Link href="/compte/commandes" className="btn btn--indigo">Mes commandes</Link>
              <Link href="/boutique" className="btn btn--ghost">Continuer les achats</Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Panier</span>
          </div>
          <h1>Votre panier {count > 0 && <span style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--text-lg)", color: "var(--fg-mute)", fontWeight: 400 }}>({count} article{count > 1 ? "s" : ""})</span>}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {erreur && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "var(--r)", marginBottom: "var(--s5)", fontSize: "var(--text-sm)" }}>
              {erreur}
            </div>
          )}

          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--s9) 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "var(--s4)", opacity: 0.3 }}>&#x1F6D2;</div>
              <p style={{ color: "var(--fg-mute)", marginBottom: "var(--s5)", fontSize: "var(--text-md)" }}>Votre panier est vide.</p>
              <Link href="/boutique" className="btn btn--indigo">Decouvrir nos produits &rarr;</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div>
                {/* Liste articles */}
                <div className="cart-list">
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: "var(--s5)", padding: "var(--s5) 0", borderBottom: "1px solid var(--rule)", alignItems: "center" }}>
                      {/* Image */}
                      <div style={{ width: 90, height: 90, borderRadius: "var(--r)", overflow: "hidden", background: "var(--bg)", flexShrink: 0 }}>
                        <img
                          src={item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/produit/${item.id}`} style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--ink)", textDecoration: "none", display: "block", marginBottom: "4px" }}>
                          {item.title}
                        </Link>
                        <div style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>
                          {item.price} DT / unite
                        </div>
                      </div>

                      {/* Quantite */}
                      <div className="qty" style={{ flexShrink: 0 }}>
                        <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} aria-label="Diminuer">&#x2212;</button>
                        <input type="text" value={item.qty} readOnly inputMode="numeric" aria-label="Quantite" />
                        <button type="button" onClick={() => updateQty(item.id, item.qty + 1)} aria-label="Augmenter">+</button>
                      </div>

                      {/* Sous-total */}
                      <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-base)", minWidth: "80px", textAlign: "right" }}>
                        {(item.price * item.qty).toFixed(2)} DT
                      </div>

                      {/* Supprimer */}
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-mute)", fontSize: "18px", padding: "8px", flexShrink: 0 }}
                        aria-label="Supprimer"
                      >
                        &#x2715;
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "var(--s5)", display: "flex", gap: "var(--s3)", flexWrap: "wrap" }}>
                  <Link href="/boutique" className="btn btn--ghost">&larr; Continuer les achats</Link>
                  <button className="btn btn--ghost" onClick={clearCart} style={{ color: "var(--rose)" }}>Vider le panier</button>
                </div>

                {/* Reassurance */}
                <div style={{
                  marginTop: "var(--s7)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "var(--s4)", padding: "var(--s5)", background: "var(--bg)", borderRadius: "var(--r)",
                }}>
                  {[
                    { icon: "⚡", title: "Livraison rapide", desc: "2-3 jours ouvrables" },
                    { icon: "↺", title: "Retours gratuits", desc: "Sous 30 jours" },
                    { icon: "★", title: "Garantie 2 ans", desc: "Sur chaque commande" },
                  ].map((f) => (
                    <div key={f.title} style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                      <div style={{ width: 40, height: 40, background: "var(--indigo-soft)", color: "var(--indigo)", borderRadius: "999px", display: "grid", placeItems: "center", fontSize: 18 }}>{f.icon}</div>
                      <div>
                        <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-sm)" }}>{f.title}</div>
                        <div style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--fg-mute)" }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recapitulatif */}
              <aside className="cart-summary">
                <h3>Recapitulatif</h3>

                <div className="cart-line">
                  <span>Sous-total ({count} article{count > 1 ? "s" : ""})</span>
                  <span style={{ fontFamily: "var(--ff-display)", fontWeight: 600, color: "var(--ink)" }}>{total.toFixed(2)} DT</span>
                </div>
                {tierDiscount > 0 && (
                  <div className="cart-line">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{tier.icon}</span> Reduction {tier.name} ({tier.discount}%)
                    </span>
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>-{tierDiscount.toFixed(2)} DT</span>
                  </div>
                )}
                <div className="cart-line">
                  <span>Livraison</span>
                  <span style={{ color: livraison === 0 ? "var(--emerald)" : "var(--ink)", fontWeight: 600 }}>
                    {livraison === 0 ? (tierFreeShipping ? `Gratuite (${tier.name})` : "Gratuite") : `${livraison} DT`}
                  </span>
                </div>
                {livraison > 0 && !tierFreeShipping && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", marginBottom: "var(--s3)" }}>
                    Livraison gratuite a partir de 50 DT ({(50 - total).toFixed(2)} DT restants)
                  </div>
                )}
                {/* Points fidelite */}
                {pointsBalance > 0 && reductions.length > 0 && (
                  <div style={{ padding: "var(--s4) 0", borderTop: "1px solid var(--rule)" }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", marginBottom: "var(--s2)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>&#x2B50;</span> Points fidelite : <strong style={{ color: "#d97706" }}>{pointsBalance} pts</strong>
                    </div>
                    {reductions.filter((r) => pointsBalance >= r.points_required).map((r) => (
                      <label key={r.id} style={{ display: "flex", alignItems: "center", gap: "var(--s2)", fontSize: "var(--text-sm)", cursor: "pointer", padding: "4px 0" }}>
                        <input type="radio" name="loyalty" checked={selectedReduction === r.id}
                          onChange={() => { setSelectedReduction(r.id); setPointsDiscount(r.reduction_value); }} />
                        {r.points_required} pts = -{r.reduction_value} DT
                      </label>
                    ))}
                    {selectedReduction && (
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "var(--text-xs)", color: "var(--rose)", padding: "4px 0" }}
                        onClick={() => { setSelectedReduction(null); setPointsDiscount(0); }}>
                        Annuler la reduction
                      </button>
                    )}
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="cart-line">
                    <span>Reduction fidelite</span>
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>-{pointsDiscount.toFixed(2)} DT</span>
                  </div>
                )}
                <div className="cart-line is-total">
                  <span>Total</span>
                  <span>{grandTotal.toFixed(2)} DT</span>
                </div>

                <button
                  className="btn btn--indigo btn--block"
                  onClick={passerCommande}
                  disabled={loading || items.length === 0}
                  style={{ marginTop: "var(--s3)" }}
                >
                  {loading ? "Traitement..." : "Passer la commande"} &rarr;
                </button>

                <p style={{
                  marginTop: "var(--s5)", fontSize: 11,
                  fontFamily: "var(--ff-mono)", color: "var(--fg-mute)",
                  textAlign: "center", lineHeight: 1.6,
                }}>
                  Paiement securise SSL. Vos informations ne sont jamais stockees.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
