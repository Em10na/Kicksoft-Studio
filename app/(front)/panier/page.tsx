"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import { LOYALTY } from "@/lib/loyalty-config";

export default function PanierPage() {
  const { items, count, total, updateQty, removeItem, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsPercentage, setPointsPercentage] = useState(100);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [guestForm, setGuestForm] = useState({ nom: "", prenom: "", adresse: "", telephone: "" });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (!u) return;
      const { data: txns } = await supabase.from("loyalty_transactions").select("points").eq("user_id", u.id);
      setPointsBalance((txns ?? []).reduce((s: number, t: { points: number }) => s + t.points, 0));
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (items.length === 0) { setCategoryMap({}); return; }
    supabase
      .from("products")
      .select("id, categories(name)")
      .in("id", items.map((i) => i.id))
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const p of data as any[]) {
          const cats = p.categories;
          map[p.id] = (Array.isArray(cats) ? cats[0]?.name : cats?.name) ?? "Général";
        }
        setCategoryMap(map);
      });
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const pointsToUse = usePoints ? Math.floor(pointsBalance * pointsPercentage / 100) : 0;
  const pointsDiscount = usePoints ? Math.min(pointsToUse * LOYALTY.REDEEM_RATE, total) : 0;
  const livraison = total >= 50 ? 0 : 7;
  const grandTotal = Math.max(0, total - pointsDiscount + livraison);

  // Étape 1 : ouvre le formulaire de livraison (obligatoire pour tous),
  // prérempli depuis le profil si l'utilisateur est connecté.
  async function ouvrirFormulaire() {
    setErreur("");
    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, phone, adresse, ville")
        .eq("id", user.id)
        .single();
      if (p) {
        const mots = (p.full_name ?? "").trim().split(/\s+/).filter(Boolean);
        setGuestForm({
          prenom: mots[0] ?? "",
          nom: mots.slice(1).join(" "),
          telephone: p.phone ?? "",
          adresse: [p.adresse, p.ville].filter(Boolean).join(", "),
        });
      }
    }
    setShowForm(true);
  }

  // Étape 2 : validation des champs obligatoires puis création de la commande
  async function confirmerCommande() {
    setErreur("");

    if (!guestForm.prenom.trim() || !guestForm.nom.trim() || !guestForm.telephone.trim() || !guestForm.adresse.trim()) {
      setErreur("Veuillez remplir tous les champs obligatoires (prénom, nom, téléphone, adresse).");
      return;
    }
    if (!/^[+\d][\d\s.-]{7,}$/.test(guestForm.telephone.trim())) {
      setErreur("Numéro de téléphone invalide.");
      return;
    }

    setLoading(true);
    const fullName = `${guestForm.prenom.trim()} ${guestForm.nom.trim()}`;

    if (user) {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: grandTotal,
          status: "pending",
          guest_name: fullName,
          guest_phone: guestForm.telephone.trim(),
          guest_address: guestForm.adresse.trim(),
        })
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

      if (usePoints && pointsToUse > 0) {
        await supabase.from("loyalty_transactions").insert({
          user_id: user.id,
          order_id: order.id,
          points: -pointsToUse,
          type: "redeem_reduction",
          description: `Reduction ${pointsDiscount.toFixed(2)} DT - commande #${order.id.slice(0, 8)} (${pointsToUse} pts utilises)`,
        });
      }
    } else {
      const res = await fetch("/api/orders/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: fullName,
          guest_phone: guestForm.telephone.trim(),
          guest_address: guestForm.adresse.trim(),
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.qty,
            unit_price: item.price,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Erreur lors de la commande.");
        setLoading(false);
        return;
      }
    }

    clearCart();
    setSucces(true);
    setLoading(false);
  }

  // Groupement des articles par catégorie
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    const cat = categoryMap[item.id] || "Général";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
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
              Votre commande a ete enregistree avec succes.
              {user ? " Vous pouvez suivre son statut dans votre espace client." : " Nous vous contacterons pour confirmer la livraison."}
            </p>
            <div style={{ display: "flex", gap: "var(--s4)", justifyContent: "center" }}>
              {user && <Link href="/compte/commandes" className="btn btn--indigo">Mes commandes</Link>}
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
                {/* Articles groupés par catégorie */}
                <div>
                  {Object.entries(grouped).map(([catName, catItems]) => (
                    <div key={catName} className="cart-cat-group">
                      <div className="cart-cat-header">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline points="9,22 9,12 15,12 15,22" />
                        </svg>
                        {catName}
                      </div>
                      {catItems.map((item) => (
                        <div key={item.id} className="cart-item-v2">
                          <div className="cart-item-v2__img">
                            <img
                              src={item.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"}
                              alt={item.title}
                            />
                          </div>
                          <div className="cart-item-v2__body">
                            <Link href={`/produit/${item.id}`} className="cart-item-v2__name">{item.title}</Link>
                            <span className="cart-item-v2__price">{item.price} DT / unité</span>
                            <div className="cart-item-v2__qty">
                              <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} aria-label="Diminuer">&#x2212;</button>
                              <input type="text" value={item.qty} readOnly inputMode="numeric" aria-label="Quantité" />
                              <button type="button" onClick={() => updateQty(item.id, item.qty + 1)} aria-label="Augmenter">+</button>
                            </div>
                          </div>
                          <div className="cart-item-v2__right">
                            <button className="cart-item-v2__remove" onClick={() => removeItem(item.id)} aria-label="Supprimer">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3,6 5,6 21,6" />
                                <path d="M19,6l-1,14a2 2 0 01-2 2H8a2 2 0 01-2-2L5,6" />
                                <path d="M10,11v6M14,11v6M9,6V4h6v2" />
                              </svg>
                            </button>
                            <span className="cart-item-v2__total">{(item.price * item.qty).toFixed(2)} DT</span>
                          </div>
                        </div>
                      ))}
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
                <div className="cart-line">
                  <span>Livraison</span>
                  <span style={{ color: livraison === 0 ? "var(--emerald)" : "var(--ink)", fontWeight: 600 }}>
                    {livraison === 0 ? "Gratuite" : `${livraison} DT`}
                  </span>
                </div>
                {livraison > 0 && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", marginBottom: "var(--s3)" }}>
                    Livraison gratuite a partir de 50 DT ({(50 - total).toFixed(2)} DT restants)
                  </div>
                )}

                {/* Points fidelite - seulement pour utilisateurs connectes */}
                {user && pointsBalance > 0 && (
                  <div style={{ padding: "var(--s4)", marginTop: "var(--s2)", background: usePoints ? "#f0fdf4" : "var(--bg)", border: `1px solid ${usePoints ? "#bbf7d0" : "var(--rule)"}`, borderRadius: "var(--r)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "var(--s3)", cursor: "pointer", fontSize: "var(--text-sm)" }}>
                      <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)}
                        style={{ width: "18px", height: "18px", accentColor: "var(--indigo)" }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Utiliser mes points de fidelite</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>
                          {pointsBalance} pts disponibles = <strong style={{ color: "#16a34a" }}>{Math.min(pointsBalance * LOYALTY.REDEEM_RATE, total).toFixed(2)} DT de reduction max</strong>
                        </div>
                      </div>
                    </label>
                    {usePoints && (
                      <div style={{ marginTop: "var(--s3)", display: "flex", gap: "var(--s2)", flexWrap: "wrap" }}>
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setPointsPercentage(pct)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "var(--r)",
                              border: pointsPercentage === pct ? "2px solid var(--indigo)" : "1px solid var(--rule)",
                              background: pointsPercentage === pct ? "var(--indigo-soft)" : "white",
                              color: pointsPercentage === pct ? "var(--indigo)" : "var(--fg-soft)",
                              fontWeight: pointsPercentage === pct ? 700 : 400,
                              fontSize: "var(--text-xs)",
                              cursor: "pointer",
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", alignSelf: "center" }}>
                          ({pointsToUse} pts = {Math.min(pointsToUse * LOYALTY.REDEEM_RATE, total).toFixed(2)} DT)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="cart-line" style={{ marginTop: "var(--s2)" }}>
                    <span>Reduction fidelite ({pointsToUse} pts)</span>
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>-{pointsDiscount.toFixed(2)} DT</span>
                  </div>
                )}
                <div className="cart-line is-total">
                  <span>Total</span>
                  <span>{grandTotal.toFixed(2)} DT</span>
                </div>

                {/* Formulaire de livraison — obligatoire pour toute commande */}
                {showForm && (
                  <div style={{ marginTop: "var(--s4)", padding: "var(--s4)", background: "var(--bg)", borderRadius: "var(--r)", border: "1px solid var(--rule)" }}>
                    <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "var(--s3)" }}>Vos informations de livraison</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s3)" }}>
                      <div>
                        <label style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", display: "block", marginBottom: "4px" }}>Prenom *</label>
                        <input
                          type="text"
                          required
                          placeholder="Prenom"
                          value={guestForm.prenom}
                          onChange={(e) => setGuestForm({ ...guestForm, prenom: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", display: "block", marginBottom: "4px" }}>Nom *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nom"
                          value={guestForm.nom}
                          onChange={(e) => setGuestForm({ ...guestForm, nom: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)" }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: "var(--s3)" }}>
                      <label style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", display: "block", marginBottom: "4px" }}>Adresse *</label>
                      <input
                        type="text"
                        required
                        placeholder="Adresse complete"
                        value={guestForm.adresse}
                        onChange={(e) => setGuestForm({ ...guestForm, adresse: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)" }}
                      />
                    </div>
                    <div style={{ marginTop: "var(--s3)" }}>
                      <label style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", display: "block", marginBottom: "4px" }}>Telephone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+216 XX XXX XXX"
                        value={guestForm.telephone}
                        onChange={(e) => setGuestForm({ ...guestForm, telephone: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-sm)" }}
                      />
                    </div>
                    <button
                      className="btn btn--indigo btn--block"
                      onClick={confirmerCommande}
                      disabled={loading}
                      style={{ marginTop: "var(--s4)" }}
                    >
                      {loading ? "Traitement..." : "Confirmer la commande"} &rarr;
                    </button>
                    {!user && (
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--fg-mute)", marginTop: "var(--s3)", textAlign: "center" }}>
                        Vous avez un compte ?{" "}
                        <Link href="/auth/connexion" style={{ color: "var(--indigo)" }}>Se connecter</Link>
                      </p>
                    )}
                  </div>
                )}

                {!showForm && (
                  <button
                    className="btn btn--indigo btn--block"
                    onClick={ouvrirFormulaire}
                    disabled={loading || items.length === 0}
                    style={{ marginTop: "var(--s3)" }}
                  >
                    Passer la commande &rarr;
                  </button>
                )}

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
