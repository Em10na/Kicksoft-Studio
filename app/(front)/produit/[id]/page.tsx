import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "../../components/ProductCard";

type Props = { params: Promise<{ id: string }> };

export default async function ProduitPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: produit } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!produit) notFound();

  const { data: similaires } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .neq("id", id)
    .eq("category_id", produit.category_id || "")
    .limit(5);

  const { data: accessoires } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .neq("id", id)
    .neq("category_id", produit.category_id || "")
    .limit(4);

  const onSale = produit.compare_price && produit.compare_price > produit.price;
  const remise = onSale ? Math.round(((produit.compare_price - produit.price) / produit.compare_price) * 100) : 0;
  const img = produit.image_url || "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=80&auto=format&fit=crop";

  return (
    <div className="container">
      <div className="crumbs" style={{ paddingTop: "var(--s5)" }}>
        <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span>{" "}
        <Link href="/boutique">Boutique</Link> <span className="sep">&rsaquo;</span>{" "}
        {produit.categories?.name && (
          <><Link href={`/boutique?categorie=${produit.category_id}`}>{produit.categories.name}</Link> <span className="sep">&rsaquo;</span>{" "}</>
        )}
        <span>{produit.title}</span>
      </div>

      <section className="product-detail">
        {/* Gallery */}
        <div className="gallery">
          <figure className="gallery-main">
            <img src={img} alt={produit.title} />
          </figure>
        </div>

        {/* Info */}
        <div className="pdp-info">
          {produit.categories?.name && (
            <span className="pdp-cat">&#x26A1; {produit.categories.name}</span>
          )}
          <h1>{produit.title}</h1>

          <div className="rating-row">
            <span style={{ color: "var(--emerald)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", background: produit.stock > 0 ? "var(--emerald)" : "var(--rose)", borderRadius: "999px", display: "inline-block" }}></span>
              {produit.stock > 0 ? `En stock - ${produit.stock} articles` : "Rupture de stock"}
            </span>
            <span style={{ color: "var(--rule-strong)" }}>|</span>
            <span style={{ fontFamily: "var(--ff-mono)", fontSize: "11px", color: "var(--fg-mute)" }}>
              REF: {produit.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {produit.short_description && (
            <p className="desc">{produit.short_description}</p>
          )}

          <div className="price-row">
            <span className="now">{produit.price} DT</span>
            {onSale && (
              <>
                <span className="was">{produit.compare_price} DT</span>
                <span className="save">-{remise}%</span>
              </>
            )}
          </div>

          <div className="pdp-cta" style={{ marginTop: "var(--s5)" }}>
            <div className="qty">
              <button type="button" data-act="-" aria-label="Diminuer">&#x2212;</button>
              <input type="text" defaultValue="1" inputMode="numeric" aria-label="Quantite" />
              <button type="button" data-act="+" aria-label="Augmenter">+</button>
            </div>
            <Link href="/panier" className="btn btn--indigo" style={{ flex: 1, minWidth: "160px" }}>
              Ajouter au panier &rarr;
            </Link>
            <Link href="/devis" className="btn btn--ink">Demander un devis</Link>
          </div>

          <div className="pdp-features" style={{ marginTop: "var(--s5)" }}>
            <div className="pf"><span className="ic">&#x26A1;</span><span>Livraison gratuite des 50 DT</span></div>
            <div className="pf"><span className="ic">&#x21BA;</span><span>Retours gratuits sous 30 jours</span></div>
            <div className="pf"><span className="ic">&#x2605;</span><span>Garantie 2 ans</span></div>
            <div className="pf"><span className="ic">&#x2713;</span><span>Produit authentique certifie</span></div>
          </div>
        </div>
      </section>

      {/* Specifications + Description */}
      <section className="section" style={{ paddingTop: "0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s8)" }}>
          <div>
            <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Caracteristiques techniques</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
              <tbody>
                {[
                  ["Reference", produit.id.slice(0, 8).toUpperCase()],
                  ["Categorie", produit.categories?.name || "Non classifie"],
                  ["Prix", `${produit.price} DT`],
                  ["Stock", `${produit.stock} unite(s)`],
                  ["Statut", produit.status === "published" ? "Disponible" : "Non disponible"],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid var(--rule)" }}>
                    <td style={{ padding: "var(--s4) 0", color: "var(--fg-mute)", fontFamily: "var(--ff-mono)", fontSize: "var(--text-xs)", letterSpacing: "0.06em", textTransform: "uppercase", width: "40%" }}>
                      {label}
                    </td>
                    <td style={{ padding: "var(--s4) 0", fontWeight: 600 }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--s5)" }}>Description</h2>
            {produit.short_description ? (
              <p style={{ color: "var(--fg-soft)", fontSize: "var(--text-sm)", lineHeight: "1.8" }}>
                {produit.short_description}
              </p>
            ) : (
              <p style={{ color: "var(--fg-mute)", fontStyle: "italic" }}>
                Aucune description disponible pour ce produit.
              </p>
            )}
            <div style={{ marginTop: "var(--s5)", display: "flex", gap: "var(--s3)" }}>
              <Link href="/comparer" className="btn btn--ghost">Comparer ce produit</Link>
              <Link href="/devis" className="btn btn--ghost">Demander un devis</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Accessoires associes */}
      {accessoires && accessoires.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Accessoires associes</h2>
            <Link href="/boutique" className="view-all">Voir tout &rarr;</Link>
          </div>
          <div className="products">
            {accessoires.map((p) => (
              <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} />
            ))}
          </div>
        </section>
      )}

      {/* Produits similaires */}
      {similaires && similaires.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Produits similaires</h2>
            <Link href="/boutique" className="view-all">Tous les produits &rarr;</Link>
          </div>
          <div className="products">
            {similaires.map((p) => (
              <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
