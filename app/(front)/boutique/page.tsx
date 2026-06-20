import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductCard from "../components/ProductCard";

type Props = {
  searchParams: Promise<{ q?: string; categorie?: string; tri?: string; page?: string }>;
};

const ITEMS_PAR_PAGE = 12;

export default async function BoutiquePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const pageNum = Math.max(1, parseInt(params.page || "1"));
  const debut = (pageNum - 1) * ITEMS_PAR_PAGE;
  const fin = debut + ITEMS_PAR_PAGE - 1;

  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  let query = supabase
    .from("products")
    .select("*, categories(name)", { count: "exact" })
    .eq("status", "published");

  if (params.categorie) query = query.eq("category_id", params.categorie);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  switch (params.tri) {
    case "prix-asc": query = query.order("price", { ascending: true }); break;
    case "prix-desc": query = query.order("price", { ascending: false }); break;
    case "nom": query = query.order("title", { ascending: true }); break;
    default: query = query.order("created_at", { ascending: false }); break;
  }

  const { data: produits, count: totalCount } = await query.range(debut, fin);
  const total = totalCount ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PAR_PAGE);
  const categorieActive = categories?.find((c) => c.id === params.categorie);

  function buildUrl(overrides: Record<string, string>) {
    const p = { ...params, ...overrides };
    const sp = new URLSearchParams();
    if (p.q) sp.set("q", p.q);
    if (p.categorie) sp.set("categorie", p.categorie);
    if (p.tri) sp.set("tri", p.tri);
    if (p.page && p.page !== "1") sp.set("page", p.page);
    const qs = sp.toString();
    return `/boutique${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link href="/">Accueil</Link> <span className="sep">&rsaquo;</span>{" "}
            <span>{categorieActive ? categorieActive.name : "Boutique"}</span>
          </div>
          <h1>{categorieActive ? categorieActive.name : "Tous les produits"}</h1>
          <p>
            {total} produit(s) disponible(s).
            {params.q && ` Recherche : "${params.q}"`}
            {" "}Utilisez les filtres pour affiner votre selection.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="shop-layout">
            {/* Sidebar */}
            <aside className="filters" aria-label="Filtres">
              <div className="filter-block">
                <h3>Categories</h3>
                <label>
                  <input type="checkbox" checked={!params.categorie} readOnly />
                  <Link href={buildUrl({ categorie: "", page: "1" })} style={{ color: "inherit", textDecoration: "none" }}>
                    Toutes les categories
                  </Link>
                  <span className="ct">{total}</span>
                </label>
                {categories?.map((cat) => (
                  <label key={cat.id}>
                    <input type="checkbox" checked={params.categorie === cat.id} readOnly />
                    <Link href={buildUrl({ categorie: cat.id, page: "1" })} style={{ color: "inherit", textDecoration: "none" }}>
                      {cat.name}
                    </Link>
                  </label>
                ))}
              </div>
              <div className="filter-block">
                <h3>Trier par</h3>
                <label>
                  <input type="radio" name="tri" checked={!params.tri || params.tri === "recent"} readOnly />
                  <Link href={buildUrl({ tri: "recent", page: "1" })} style={{ color: "inherit", textDecoration: "none" }}>
                    Plus recents
                  </Link>
                </label>
                <label>
                  <input type="radio" name="tri" checked={params.tri === "prix-asc"} readOnly />
                  <Link href={buildUrl({ tri: "prix-asc", page: "1" })} style={{ color: "inherit", textDecoration: "none" }}>
                    Prix croissant
                  </Link>
                </label>
                <label>
                  <input type="radio" name="tri" checked={params.tri === "prix-desc"} readOnly />
                  <Link href={buildUrl({ tri: "prix-desc", page: "1" })} style={{ color: "inherit", textDecoration: "none" }}>
                    Prix decroissant
                  </Link>
                </label>
                <label>
                  <input type="radio" name="tri" checked={params.tri === "nom"} readOnly />
                  <Link href={buildUrl({ tri: "nom", page: "1" })} style={{ color: "inherit", textDecoration: "none" }}>
                    Nom A-Z
                  </Link>
                </label>
              </div>
              <div className="filter-block">
                <h3>Outils</h3>
                <Link href="/comparer" className="btn btn--indigo btn--block">Comparer des produits</Link>
              </div>
            </aside>

            <div>
              <div className="shop-toolbar">
                <span className="count">
                  {total > 0
                    ? `Affichage ${debut + 1} - ${Math.min(fin + 1, total)} sur ${total} produits`
                    : "0 produit"}
                </span>
              </div>

              <div className="shop-grid" id="shop-grid">
                {produits && produits.length > 0 ? (
                  produits.map((p) => (
                    <ProductCard
                      key={p.id} id={p.id} title={p.title} price={p.price}
                      compare_price={p.compare_price} stock={p.stock} image_url={p.image_url}
                    />
                  ))
                ) : (
                  <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--fg-mute)", padding: "var(--s8) 0" }}>
                    Aucun produit trouve.{" "}
                    <Link href="/boutique" style={{ color: "var(--indigo)" }}>Voir tous les produits</Link>
                  </p>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  {pageNum > 1 && (
                    <Link href={buildUrl({ page: String(pageNum - 1) })} className="pg">&lsaquo;</Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - pageNum) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pg">&hellip;</span>}
                        <Link href={buildUrl({ page: String(p) })} className={`pg ${p === pageNum ? "is-active" : ""}`}>
                          {p}
                        </Link>
                      </span>
                    ))}
                  {pageNum < totalPages && (
                    <Link href={buildUrl({ page: String(pageNum + 1) })} className="pg">&rsaquo;</Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
