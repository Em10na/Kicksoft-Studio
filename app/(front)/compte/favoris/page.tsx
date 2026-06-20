"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Favori = {
  id: string;
  product_id: string;
  products?: { id: string; title: string; price: number; image_url: string | null; stock: number } | null;
};

export default function FavorisPage() {
  const supabase = createClient();
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState("");

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wishlist").select("*, products(id, title, price, image_url, stock)").eq("user_id", user.id);
      setFavoris(data ?? []);
      setLoading(false);
    }
    charger();
  }, []);

  async function retirerFavori(id: string) {
    await supabase.from("wishlist").delete().eq("id", id);
    setFavoris(favoris.filter((f) => f.id !== id));
    setAlert("Produit retire des favoris.");
    setTimeout(() => setAlert(""), 3000);
  }

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>
        Mes favoris <span style={{ fontFamily: "var(--ff-mono)", fontSize: "var(--text-sm)", color: "var(--fg-mute)", fontWeight: 400 }}>({favoris.length})</span>
      </h2>

      {alert && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--r)", marginBottom: "var(--s4)", fontSize: "var(--text-sm)", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          {alert}
        </div>
      )}

      {favoris.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s8)", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r-lg)" }}>
          <p style={{ color: "var(--fg-mute)", marginBottom: "var(--s4)" }}>Votre liste de favoris est vide.</p>
          <Link href="/boutique" style={{ padding: "10px 20px", background: "var(--indigo)", color: "white", borderRadius: "var(--r)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
            Parcourir la boutique
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--s4)" }}>
          {favoris.map((f) => {
            const p = f.products;
            if (!p) return null;
            return (
              <div key={f.id} style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div style={{ height: "160px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80"} alt={p.title}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ padding: "var(--s4)" }}>
                  <Link href={`/produit/${p.id}`} style={{ textDecoration: "none", color: "var(--ink)", fontWeight: 600, fontSize: "var(--text-sm)", display: "block", marginBottom: "var(--s2)" }}>
                    {p.title}
                  </Link>
                  <div style={{ fontFamily: "var(--ff-display)", fontWeight: 700, color: "var(--indigo)", marginBottom: "var(--s3)" }}>{p.price} DT</div>
                  <div style={{ display: "flex", gap: "var(--s2)" }}>
                    <Link href={`/produit/${p.id}`} style={{ flex: 1, padding: "8px", background: "var(--indigo)", color: "white", borderRadius: "var(--r)", textDecoration: "none", fontSize: "var(--text-xs)", textAlign: "center", fontWeight: 600 }}>
                      Voir
                    </Link>
                    <button onClick={() => retirerFavori(f.id)} style={{ padding: "8px 12px", background: "none", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontSize: "var(--text-xs)", color: "var(--rose)", cursor: "pointer" }}>
                      &#x2715;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
