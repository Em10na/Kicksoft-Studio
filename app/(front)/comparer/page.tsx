"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Produit = {
  id: string;
  title: string;
  price: number;
  compare_price: number | null;
  stock: number;
  short_description: string | null;
  image_url: string | null;
  categories?: { name: string } | null;
};

export default function ComparerPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [selection, setSelection] = useState<Produit[]>([]);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*, categories(name)")
      .eq("status", "published")
      .order("title")
      .then(({ data }) => {
        setProduits(data ?? []);
        setLoading(false);
      });
  }, []);

  function toggleProduit(p: Produit) {
    if (selection.find((s) => s.id === p.id)) {
      setSelection(selection.filter((s) => s.id !== p.id));
    } else if (selection.length < 4) {
      setSelection([...selection, p]);
    }
  }

  const filtres = produits.filter(
    (p) => recherche === "" || p.title.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span> <span>Comparer</span>
          </div>
          <h1>Comparer des produits</h1>
          <p>Selectionnez jusqu&apos;a 4 produits pour comparer leurs caracteristiques cote a cote.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Selection */}
          <div style={{ marginBottom: "var(--s6)" }}>
            <div style={{ display: "flex", gap: "var(--s3)", alignItems: "center", marginBottom: "var(--s4)" }}>
              <input
                type="text"
                placeholder="Rechercher un produit a comparer..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                style={{ flex: 1, padding: "12px 16px", border: "1px solid var(--rule)", borderRadius: "var(--r)", fontFamily: "var(--ff-body)", fontSize: "var(--text-sm)" }}
              />
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
                {selection.length}/4 selectionnes
              </span>
            </div>

            {!loading && recherche && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--s3)", maxHeight: "300px", overflow: "auto", padding: "var(--s3)", background: "var(--bg)", borderRadius: "var(--r)" }}>
                {filtres.slice(0, 12).map((p) => {
                  const selected = !!selection.find((s) => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProduit(p)}
                      style={{
                        display: "flex", alignItems: "center", gap: "var(--s3)", padding: "var(--s3)",
                        background: selected ? "var(--indigo-soft)" : "var(--paper)",
                        border: `1px solid ${selected ? "var(--indigo)" : "var(--rule)"}`,
                        borderRadius: "var(--r)", cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <img src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80"} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "6px" }} />
                      <div>
                        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, lineHeight: 1.2 }}>{p.title}</div>
                        <div style={{ fontSize: "11px", color: "var(--fg-mute)" }}>{p.price} DT</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tableau de comparaison */}
          {selection.length >= 2 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "var(--s4)", textAlign: "left", borderBottom: "2px solid var(--rule)", width: "160px", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--fg-mute)" }}>
                      Critere
                    </th>
                    {selection.map((p) => (
                      <th key={p.id} style={{ padding: "var(--s4)", textAlign: "center", borderBottom: "2px solid var(--rule)" }}>
                        <img src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"} alt={p.title} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--r)", marginBottom: "var(--s2)" }} />
                        <div style={{ fontWeight: 700 }}>{p.title}</div>
                        <button onClick={() => toggleProduit(p)} style={{ marginTop: "var(--s2)", fontSize: "11px", color: "var(--rose)", background: "none", border: "none", cursor: "pointer" }}>
                          Retirer
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Prix", render: (p: Produit) => `${p.price} DT` },
                    { label: "Prix barre", render: (p: Produit) => p.compare_price ? `${p.compare_price} DT` : "—" },
                    { label: "Stock", render: (p: Produit) => p.stock > 0 ? `${p.stock} en stock` : "Rupture" },
                    { label: "Categorie", render: (p: Produit) => p.categories?.name || "—" },
                    { label: "Description", render: (p: Produit) => p.short_description || "—" },
                  ].map((row) => (
                    <tr key={row.label} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <td style={{ padding: "var(--s4)", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--fg-mute)" }}>
                        {row.label}
                      </td>
                      {selection.map((p) => (
                        <td key={p.id} style={{ padding: "var(--s4)", textAlign: "center", fontWeight: 600 }}>
                          {row.render(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: "var(--s4)", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", textTransform: "uppercase", color: "var(--fg-mute)" }}>
                      Action
                    </td>
                    {selection.map((p) => (
                      <td key={p.id} style={{ padding: "var(--s4)", textAlign: "center" }}>
                        <Link href={`/produit/${p.id}`} className="btn btn--indigo" style={{ fontSize: "var(--text-xs)" }}>
                          Voir le produit
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "var(--s8) 0", color: "var(--fg-mute)" }}>
              <p style={{ fontSize: "var(--text-lg)", marginBottom: "var(--s3)" }}>
                Selectionnez au moins 2 produits pour comparer
              </p>
              <p>Utilisez la barre de recherche ci-dessus pour trouver et selectionner des produits.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
