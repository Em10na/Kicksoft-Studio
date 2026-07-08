"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };
type Active = { categorie?: string; tri?: string; q?: string };

function url(active: Active, overrides: Record<string, string>) {
  const p = { ...active, ...overrides };
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.categorie) sp.set("categorie", p.categorie);
  if (p.tri && p.tri !== "recent") sp.set("tri", p.tri);
  const qs = sp.toString();
  return `/boutique${qs ? `?${qs}` : ""}`;
}

export default function BoutiqueFilters({ categories, active, total }: { categories: Category[]; active: Active; total: number }) {
  const router = useRouter();

  return (
    <div className="bfilters">
      {/* Catégorie pills — scroll horizontal */}
      <div className="bfilters__pills">
        <Link href={url(active, { categorie: "", page: "1" })} className={`bfilter-pill${!active.categorie ? " is-active" : ""}`}>
          Tous
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={url(active, { categorie: cat.id, page: "1" })}
            className={`bfilter-pill${active.categorie === cat.id ? " is-active" : ""}`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Barre tris + compteur */}
      <div className="bfilters__bar">
        <span className="bfilters__count">{total} produit{total !== 1 ? "s" : ""}</span>
        <select
          className="bfilters__sort"
          value={active.tri || "recent"}
          onChange={(e) => router.push(url(active, { tri: e.target.value, page: "1" }))}
          aria-label="Trier par"
        >
          <option value="recent">Plus récents</option>
          <option value="prix-asc">Prix ↑</option>
          <option value="prix-desc">Prix ↓</option>
          <option value="nom">Nom A–Z</option>
          <option value="categorie">Par catégorie</option>
        </select>
      </div>
    </div>
  );
}
