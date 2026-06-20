"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Commande = { id: string; total: number; status: string; created_at: string };
type OrderItem = { id: string; quantity: number; unit_price: number; products?: { title: string } | null };

const STATUTS: Record<string, { label: string; couleur: string }> = {
  pending: { label: "En attente", couleur: "var(--amber)" },
  shipped: { label: "Expediee", couleur: "#0ea5e9" },
  delivered: { label: "Livree", couleur: "var(--emerald)" },
  cancelled: { label: "Annulee", couleur: "var(--rose)" },
};

export default function CommandesClientPage() {
  const supabase = createClient();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [articles, setArticles] = useState<OrderItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setCommandes(data ?? []);
      setLoading(false);
    }
    charger();
  }, []);

  async function voirDetail(id: string) {
    if (detailId === id) { setDetailId(null); return; }
    setDetailId(id);
    setLoadingDetail(true);
    const { data } = await supabase.from("order_items").select("*, products(title)").eq("order_id", id);
    setArticles(data ?? []);
    setLoadingDetail(false);
  }

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Mes commandes</h2>

      {commandes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s8)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)" }}>
          <p style={{ color: "var(--fg-mute)", marginBottom: "var(--s4)" }}>Vous n&apos;avez pas encore passe de commande.</p>
          <Link href="/boutique" style={{ padding: "10px 20px", background: "var(--indigo)", color: "white", borderRadius: "var(--r)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
            Decouvrir nos produits
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          {commandes.map((c) => {
            const s = STATUTS[c.status] || { label: c.status, couleur: "var(--fg-mute)" };
            return (
              <div key={c.id} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
                <div style={{ padding: "var(--s5)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => voirDetail(c.id)}>
                  <div>
                    <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, marginBottom: "4px" }}>Commande #{c.id.slice(0, 8)}</div>
                    <div style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
                      {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "var(--text-xs)", fontWeight: 600, background: `${s.couleur}15`, color: s.couleur }}>
                      {s.label}
                    </span>
                    <span style={{ fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: "var(--text-md)" }}>{c.total} DT</span>
                    <span style={{ color: "var(--fg-mute)", fontSize: "var(--text-sm)" }}>{detailId === c.id ? "▲" : "▼"}</span>
                  </div>
                </div>
                {detailId === c.id && (
                  <div style={{ borderTop: "1px solid var(--rule)", padding: "var(--s5)", background: "var(--bg)" }}>
                    {loadingDetail ? <p style={{ color: "var(--fg-mute)", fontSize: "var(--text-sm)" }}>Chargement...</p> : articles.length === 0 ? (
                      <p style={{ color: "var(--fg-mute)", fontSize: "var(--text-sm)" }}>Aucun article.</p>
                    ) : (
                      <table style={{ width: "100%", fontSize: "var(--text-sm)", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                            <th style={{ textAlign: "left", padding: "var(--s2) 0", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", color: "var(--fg-mute)", textTransform: "uppercase" }}>Produit</th>
                            <th style={{ textAlign: "center", padding: "var(--s2) 0", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>Qte</th>
                            <th style={{ textAlign: "right", padding: "var(--s2) 0", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>Prix</th>
                            <th style={{ textAlign: "right", padding: "var(--s2) 0", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", color: "var(--fg-mute)" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articles.map((a) => (
                            <tr key={a.id} style={{ borderBottom: "1px solid var(--rule)" }}>
                              <td style={{ padding: "var(--s3) 0" }}>{a.products?.title || "Produit"}</td>
                              <td style={{ textAlign: "center", padding: "var(--s3) 0" }}>{a.quantity}</td>
                              <td style={{ textAlign: "right", padding: "var(--s3) 0" }}>{a.unit_price} DT</td>
                              <td style={{ textAlign: "right", padding: "var(--s3) 0", fontWeight: 600 }}>{(a.quantity * a.unit_price).toFixed(2)} DT</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
