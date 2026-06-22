import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductCard from "./components/ProductCard";
import NewsletterForm from "./components/NewsletterForm";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: template }, { data: featured }, { data: categories }, { data: trending }, { data: nouveautes }] = await Promise.all([
    supabase.from("templates").select("*").eq("page", "home").single(),
    supabase.from("products").select("*").eq("status", "published").eq("featured", true).limit(5),
    supabase.from("categories").select("*").order("name").limit(6),
    supabase.from("products").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(5),
    supabase.from("products").select("*").eq("status", "published").order("created_at", { ascending: false }).range(5, 9),
  ]);

  return (
    <>
      {/* HERO BENTO */}
      <section className="hero">
        <div className="container">
          <div className="bento">
            <article className="bento-card bento-card--lg">
              <div className="sparkle"></div>
              <div>
                <span className="eyebrow">&#x26A1; Kicksoft Studio</span>
                <h2>{template?.title || "Bienvenue chez Kicksoft"}</h2>
                <p>{template?.subtitle || "Decouvrez nos produits tech et gadgets de derniere generation."}</p>
                <Link href="/boutique" className="btn btn--paper">
                  Voir la boutique
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
                <div className="dots"><span className="active"></span><span></span><span></span></div>
              </div>
              <img className="product" src={featured?.[0]?.image_url || "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=80&auto=format&fit=crop"} alt={featured?.[0]?.title || "Produit vedette"} />
            </article>

            <article className="bento-card bento-card--purple">
              <div className="sparkle"></div>
              <span className="eyebrow">Nouveautes</span>
              <h3 style={{ fontSize: "var(--text-xl)", lineHeight: "1.15" }}>Explorez nos<br />derniers produits</h3>
              <Link href="/boutique" className="shop-now">
                Voir tout
                <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <img className="product" src={featured?.[1]?.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop"} alt="" />
            </article>

            <article className="bento-card bento-card--teal">
              <div className="sparkle"></div>
              <span className="eyebrow">Solutions Pro</span>
              <h3 style={{ fontSize: "var(--text-xl)", lineHeight: "1.15" }}>Equipements<br />professionnels</h3>
              <Link href="/solutions" className="shop-now">
                Decouvrir
                <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <img className="product" src={featured?.[2]?.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80&auto=format&fit=crop"} alt="" />
            </article>

            <div className="bento-row">
              <article className="bento-card bento-card--orange">
                <div className="sparkle"></div>
                <span className="eyebrow">Blog</span>
                <h3 style={{ fontSize: "var(--text-lg)", lineHeight: "1.2" }}>Conseils &amp;<br />actualites</h3>
                <Link href="/blog" className="shop-now">
                  Lire
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </article>
              <article className="bento-card bento-card--green">
                <div className="sparkle"></div>
                <span className="eyebrow">Devis</span>
                <h3 style={{ fontSize: "var(--text-lg)", lineHeight: "1.2" }}>Tarifs sur<br />mesure</h3>
                <Link href="/devis" className="shop-now">
                  Demander
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </article>
              <article className="bento-card bento-card--black">
                <div className="sparkle"></div>
                <span className="eyebrow">Support</span>
                <h3 style={{ fontSize: "var(--text-lg)", lineHeight: "1.2" }}>Aide &amp;<br />garantie</h3>
                <Link href="/support" className="shop-now">
                  Acceder
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING PRODUCTS */}
      <section className="section" style={{ paddingTop: "var(--s5)" }}>
        <div className="container">
          <div className="section-head">
            <h2>Produits tendance</h2>
            <Link href="/boutique" className="view-all">
              Voir tout
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
          <div className="products">
            {trending && trending.length > 0 ? (
              trending.map((p) => (
                <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
              ))
            ) : (
              <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--fg-mute)" }}>
                Aucun produit pour le moment. <Link href="/admin/produits" style={{ color: "var(--indigo)" }}>Ajoutez-en depuis l&apos;admin</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* DISCOUNT BANNERS */}
      <section className="section" style={{ paddingTop: "0" }}>
        <div className="container">
          <div className="discount-row">
            <article className="discount-card discount-card--watch">
              <span className="meta">CETTE SEMAINE</span>
              <h3>Mega Remises<br /><span className="pct">Jusqu&apos;a -50%</span></h3>
              <Link href="/boutique" className="shop-now">
                Voir les offres
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <img className="product" src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80&auto=format&fit=crop" alt="" />
            </article>
            <article className="discount-card discount-card--airpods">
              <span className="meta">EDITION LIMITEE</span>
              <h3>Accessoires Pro<br /><span className="pct">-30%</span></h3>
              <Link href="/boutique" className="shop-now">
                Decouvrir
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <img className="product" src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80&auto=format&fit=crop" alt="" />
            </article>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories && categories.length > 0 && (
        <section className="section" style={{ paddingTop: "var(--s5)" }}>
          <div className="container">
            <div className="section-head">
              <h2>Parcourir par categorie</h2>
              <Link href="/boutique" className="view-all">
                Tous les produits
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div className="cats-grid">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/boutique?categorie=${cat.id}`} className="cat-tile">
                  <div className="pic">
                    <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80&auto=format&fit=crop" alt={cat.name} />
                  </div>
                  <div className="name">{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NOUVEAUTES */}
      {nouveautes && nouveautes.length > 0 && (
        <section className="section" style={{ paddingTop: "0" }}>
          <div className="container">
            <div className="section-head">
              <h2>Nouveautes</h2>
              <Link href="/boutique" className="view-all">
                Plus de produits
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div className="compact-row">
              {nouveautes.map((p) => (
                <article key={p.id} className="compact-card">
                  <div className="pic">
                    <img src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80&auto=format&fit=crop"} alt={p.title} />
                  </div>
                  <div>
                    <div className="stock">EN STOCK - {p.stock}</div>
                    <div className="name">{p.title}</div>
                    <div className="price">{p.price} DT</div>
                    <Link href={`/produit/${p.id}`} className="btn">Commander &rarr;</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BRAND STRIP */}
      <section className="brands">
        <div className="container">
          <div className="brand-row">
            <span className="brand-logo">Kicksoft</span>
            <span className="brand-logo">TechPro</span>
            <span className="brand-logo">InnoGear</span>
            <span className="brand-logo">SmartDev</span>
            <span className="brand-logo">ProKit</span>
            <span className="brand-logo">NetWare</span>
          </div>
        </div>
      </section>

      {/* CTA PRO */}
      <section className="section">
        <div className="container">
          <div className="discount-row">
            <article className="discount-card discount-card--watch" style={{ flex: 1 }}>
              <span className="meta">PROFESSIONNELS</span>
              <h3>Solutions sur mesure<br /><span className="pct">pour votre entreprise</span></h3>
              <Link href="/solutions" className="shop-now">
                Decouvrir nos solutions
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </article>
            <article className="discount-card discount-card--airpods" style={{ flex: 1 }}>
              <span className="meta">REVENDEURS</span>
              <h3>Devenez partenaire<br /><span className="pct">Kicksoft</span></h3>
              <Link href="/revendeurs" className="shop-now">
                En savoir plus
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ background: "var(--paper)" }}>
        <div className="container">
          <div className="newsletter">
            <div className="newsletter-grid">
              <div>
                <h2>Recevez <strong>10% de reduction</strong> sur votre premiere commande</h2>
                <p>Inscrivez-vous a notre newsletter pour recevoir nos offres exclusives, lancements de produits et conseils tech.</p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
