import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductCard from "./components/ProductCard";
import NewsletterForm from "./components/NewsletterForm";
import DroneCurtain from "./components/DroneCurtain";
import DroneHeroSlider from "./components/DroneHeroSlider";

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
      <DroneCurtain />

      {/* ====== HERO — DRONE SLIDER FULLSCREEN ====== */}
      <DroneHeroSlider />

      {/* ====== FEATURES BAR ====== */}
      <section className="features-bar">
        <div className="container">
          <div className="features-bar__grid">
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x26A1;</div>
              <div><strong>Livraison Express</strong><span>24-48h partout en Tunisie</span></div>
            </div>
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x21BA;</div>
              <div><strong>Retours Gratuits</strong><span>Sous 30 jours</span></div>
            </div>
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x2605;</div>
              <div><strong>Garantie 2 Ans</strong><span>Sur tous nos produits</span></div>
            </div>
            <div className="features-bar__item">
              <div className="features-bar__icon">&#x1F512;</div>
              <div><strong>Paiement Securise</strong><span>100% protege</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TRENDING PRODUCTS ====== */}
      <section className="section" style={{ paddingTop: "var(--s8)" }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="section-tag">Tendance</span>
              <h2>Produits populaires</h2>
            </div>
            <Link href="/boutique" className="view-all">
              Voir tout
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
          <div className="products">
            {trending && trending.length > 0 ? (
              trending.map((p) => (
                <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
              ))
            ) : (
              <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--fg-mute)" }}>
                Aucun produit pour le moment. <Link href="/admin/produits" style={{ color: "var(--indigo)" }}>Ajoutez-en depuis l&apos;admin</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ====== SOLDES ====== */}
      <section className="soldes">
        <div className="container">
          {/* Banner principal */}
          <div className="soldes__hero">
            <div className="soldes__hero-bg">
              <img src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80&auto=format&fit=crop" alt="" />
            </div>
            <div className="soldes__hero-overlay"></div>
            <div className="soldes__hero-particles">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className="soldes__hero-content">
              <div className="soldes__timer-badge">
                <span className="soldes__timer-dot"></span>
                OFFRE LIMITEE
              </div>
              <h2>MEGA<br /><span className="soldes__gradient">SOLDES</span></h2>
              <div className="soldes__pct">-50%</div>
              <p>Sur une selection de produits tech, peripheriques et accessoires. Jusqu&apos;a epuisement des stocks.</p>
              <Link href="/boutique" className="soldes__btn">
                Voir toutes les offres
                <svg width="16" height="12" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </div>

          {/* Cartes promo */}
          <div className="soldes__grid">
            <div className="soldes__card">
              <div className="soldes__card-img">
                <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80&auto=format&fit=crop" alt="Laptops" />
                <div className="soldes__card-badge">-30%</div>
              </div>
              <div className="soldes__card-body">
                <span className="soldes__card-tag">LAPTOPS</span>
                <h3>PC Portables Pro</h3>
                <p>Laptops haute performance pour le travail et la creation.</p>
                <Link href="/boutique" className="soldes__card-link">
                  Decouvrir
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </div>
            <div className="soldes__card">
              <div className="soldes__card-img">
                <img src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80&auto=format&fit=crop" alt="Accessoires" />
                <div className="soldes__card-badge">-40%</div>
              </div>
              <div className="soldes__card-body">
                <span className="soldes__card-tag">ACCESSOIRES</span>
                <h3>Casques &amp; Audio</h3>
                <p>Casques sans fil, ecouteurs et equipements audio premium.</p>
                <Link href="/boutique" className="soldes__card-link">
                  Decouvrir
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </div>
            <div className="soldes__card">
              <div className="soldes__card-img">
                <img src="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80&auto=format&fit=crop" alt="Peripheriques" />
                <div className="soldes__card-badge">-25%</div>
              </div>
              <div className="soldes__card-body">
                <span className="soldes__card-tag">PERIPHERIQUES</span>
                <h3>Claviers &amp; Souris</h3>
                <p>Gaming et bureautique, mecaniques RGB et ergonomiques.</p>
                <Link href="/boutique" className="soldes__card-link">
                  Decouvrir
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CATEGORIES ====== */}
      {categories && categories.length > 0 && (
        <section className="section" style={{ paddingTop: "var(--s5)" }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-tag">Explorer</span>
                <h2>Parcourir par categorie</h2>
              </div>
              <Link href="/boutique" className="view-all">
                Tous les produits
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div className="cats-grid">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/boutique?categorie=${cat.id}`} className="cat-tile">
                  <div className="pic">
                    <img src={cat.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80&auto=format&fit=crop"} alt={cat.name} />
                  </div>
                  <div className="name">{cat.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== NOUVEAUTES ====== */}
      {nouveautes && nouveautes.length > 0 && (
        <section className="section" style={{ paddingTop: "0" }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-tag">Nouveau</span>
                <h2>Derniers arrivages</h2>
              </div>
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

      {/* ====== BRAND STRIP ====== */}
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

      {/* ====== DJI SHOWCASE ====== */}
      <section className="dji-showcase">
        {/* Video background */}
        <video className="dji-showcase__video" autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=80&auto=format&fit=crop">
          <source src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4" type="video/mp4" />
        </video>
        <div className="dji-showcase__overlay"></div>

        {/* Floating drone image */}
        <img src="/front/images/drone-hero.png" alt="" className="dji-showcase__drone" />

        {/* Content */}
        <div className="container dji-showcase__content">
          <div className="dji-showcase__badge">NOUVEAU</div>
          <h2 className="dji-showcase__title">
            La precision<br />
            <span className="dji-showcase__gradient">rencontre l&apos;innovation</span>
          </h2>
          <p className="dji-showcase__desc">
            Decouvrez notre gamme de drones professionnels et equipements de pointe.
            Capture aerienne 4K, stabilisation avancee et autonomie record.
          </p>
          <div className="dji-showcase__specs">
            <div className="dji-showcase__spec">
              <strong>4K</strong>
              <span>Ultra HD</span>
            </div>
            <div className="dji-showcase__spec-divider"></div>
            <div className="dji-showcase__spec">
              <strong>45 min</strong>
              <span>Autonomie</span>
            </div>
            <div className="dji-showcase__spec-divider"></div>
            <div className="dji-showcase__spec">
              <strong>15 km</strong>
              <span>Portee</span>
            </div>
            <div className="dji-showcase__spec-divider"></div>
            <div className="dji-showcase__spec">
              <strong>GPS</strong>
              <span>Precision</span>
            </div>
          </div>
          <div className="dji-showcase__ctas">
            <Link href="/solutions" className="dji-showcase__btn dji-showcase__btn--primary">
              Decouvrir les solutions
              <svg width="16" height="12" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link href="/revendeurs" className="dji-showcase__btn dji-showcase__btn--outline">
              Devenir partenaire
            </Link>
          </div>
        </div>

        {/* Scan lines effect */}
        <div className="dji-showcase__scanlines"></div>
      </section>

      {/* ====== NEWSLETTER ====== */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-modern">
            <div className="newsletter-modern__glow"></div>
            <div className="newsletter-modern__content">
              <div className="newsletter-modern__left">
                <span className="newsletter-modern__badge">OFFRE EXCLUSIVE</span>
                <h2>Recevez <strong>10%</strong> sur votre premiere commande</h2>
                <p>Inscrivez-vous et recevez nos offres exclusives, lancements de produits et conseils tech directement dans votre boite mail.</p>
              </div>
              <div className="newsletter-modern__right">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
