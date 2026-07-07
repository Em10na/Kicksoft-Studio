import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProductCard from "./components/ProductCard";
import DroneHeroSlider, { type HeroSlide } from "./components/DroneHeroSlider";
import ScrollReveal from "./components/ScrollReveal";
import BannerMedia, { type BannerMediaItem } from "./components/BannerMedia";
import CategoryStrip from "./components/CategoryStrip";

type HomeSectionMedia = BannerMediaItem & { display_order: number };
type HomeSectionRow = {
  id: string;
  section: "suggestion" | "recommandation" | "solde";
  title: string;
  tagline: string | null;
  cta_label: string | null;
  cta_href: string | null;
  visible: boolean;
  home_section_media: HomeSectionMedia[] | null;
};

// Fallback bubbles shown only while no category exists in the admin
const CIRCLE_CATS = [
  { label: "Drones Pro", href: "/boutique?q=drone", img: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=300&q=80&auto=format&fit=crop" },
  { label: "Caméras", href: "/boutique?q=camera", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80&auto=format&fit=crop" },
  { label: "Action 4K", href: "/boutique?q=action", img: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=300&q=80&auto=format&fit=crop" },
  { label: "Gimbals", href: "/boutique?q=gimbal", img: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=300&q=80&auto=format&fit=crop" },
  { label: "Audio Pro", href: "/boutique?q=audio", img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&q=80&auto=format&fit=crop" },
  { label: "Batteries", href: "/boutique?q=batterie", img: "https://images.unsplash.com/photo-1619641805634-b867f535071c?w=300&q=80&auto=format&fit=crop" },
  { label: "Éclairage", href: "/boutique?q=eclairage", img: "https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=300&q=80&auto=format&fit=crop" },
  { label: "Sacs & Étuis", href: "/boutique?q=sac", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80&auto=format&fit=crop" },
];

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: template }, { data: featured }, { data: categories }, { data: whatsNew }, { data: handheld }, { data: homeSections }, { data: promoPool }, { data: heroSoldes }] = await Promise.all([
    supabase.from("templates").select("*").eq("page", "home").single(),
    supabase.from("products").select("*").eq("status", "published").eq("featured", true).limit(4),
    supabase.from("categories").select("*").order("name"),
    // Pool trié du plus récent au plus ancien — « Quoi de neuf » garde le
    // dernier article de chaque catégorie
    supabase.from("products").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(60),
    supabase.from("products").select("*").eq("status", "published").order("display_order", { ascending: true }).order("created_at", { ascending: false }).range(8, 11),
    supabase.from("home_sections").select("*, home_section_media(*)"),
    supabase.from("products").select("*").eq("status", "published").not("compare_price", "is", null).limit(24),
    // Articles soldés mis en avant dans le slider (admin → Soldes) ;
    // renvoie null tant que la migration v10 n'est pas passée → slides démo
    supabase.from("products").select("id, title, price, compare_price, short_description, image_url, product_media(url, type, position)").eq("status", "published").eq("solde_hero", true).not("compare_price", "is", null).order("display_order", { ascending: true }).limit(5),
  ]);

  // Admin-managed media sections; each falls back to the hardcoded
  // template content while the v5 migration has not been run.
  const sectionMap = new Map(
    ((homeSections ?? []) as HomeSectionRow[]).map((s) => [
      s.section,
      { ...s, media: [...(s.home_section_media ?? [])].sort((a, b) => a.display_order - b.display_order) },
    ])
  );
  const suggestion = sectionMap.get("suggestion");
  const recommandation = sectionMap.get("recommandation");
  const solde = sectionMap.get("solde");

  // « Quoi de neuf » : le produit le plus récent de chaque catégorie
  const vuCategories = new Set<string>();
  const nouveautes = (whatsNew ?? []).filter((p) => {
    const cle = p.category_id ?? "sans-categorie";
    if (vuCategories.has(cle)) return false;
    vuCategories.add(cle);
    return true;
  }).slice(0, 8);
  const soldeProducts = (promoPool ?? []).filter((p) => p.compare_price && p.compare_price > p.price).slice(0, 4);

  // Slides du hero : articles soldés « à la une » avec leur vidéo
  // (fichier direct) ou image ; sinon le slider garde ses slides démo.
  type HeroSoldeRow = {
    id: string; title: string; price: number; compare_price: number;
    short_description: string | null; image_url: string | null;
    product_media: { url: string; type: string; position: number }[] | null;
  };
  const heroSoldesActifs = ((heroSoldes ?? []) as HeroSoldeRow[]).filter((p) => p.compare_price > p.price);

  // Synchronisation : la bannière de la section « Articles en Solde »
  // affiche les médias (vidéo ou image) des articles soldés mis en
  // avant par l'admin ; les médias saisis manuellement dans
  // Admin → Page accueil ne servent que de repli.
  const soldeSyncMedia: BannerMediaItem[] = heroSoldesActifs.flatMap((p): BannerMediaItem[] => {
    const media = [...(p.product_media ?? [])].sort((a, b) => a.position - b.position);
    const video = media.find((m) => m.type === "video" && /\.(mp4|webm|mov)(\?|$)/i.test(m.url));
    if (video) return [{ id: `sync-${p.id}`, media_type: "video" as const, url: video.url, poster_url: p.image_url }];
    const image = p.image_url || media.find((m) => m.type === "image")?.url;
    return image ? [{ id: `sync-${p.id}`, media_type: "image" as const, url: image, poster_url: null }] : [];
  });

  const heroSlides: HeroSlide[] = heroSoldesActifs
    .map((p) => {
      const media = [...(p.product_media ?? [])].sort((a, b) => a.position - b.position);
      const video = media.find((m) => m.type === "video" && /\.(mp4|webm|mov)(\?|$)/i.test(m.url));
      const image = p.image_url || media.find((m) => m.type === "image")?.url;
      const pct = Math.round((1 - p.price / p.compare_price) * 100);
      return {
        bg: image ?? "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=95&auto=format&fit=crop",
        video: video?.url ?? null,
        badge: `Soldes — jusqu'à -${pct}%`,
        name: p.title,
        tagline: p.short_description ?? "Offre à durée limitée",
        buy: `/produit/${p.id}`,
        more: `/produit/${p.id}`,
        price: p.price,
        compare_price: p.compare_price,
      };
    });

  // Bubbles come from the admin categories; fall back to the demo list when empty
  const circleCats =
    categories && categories.length > 0
      ? categories.map((c) => ({
          label: c.name,
          href: `/boutique?categorie=${c.id}`,
          img: c.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80&auto=format&fit=crop",
        }))
      : CIRCLE_CATS;
  // Marquee only when there are enough bubbles to fill the screen (the
  // animation needs the track duplicated); otherwise a static centered row
  // so each category appears exactly once.
  const marquee = circleCats.length >= 8;

  return (
    <>
      {/* ====== HERO — BANNER CAROUSEL (articles soldés ou slides démo) ====== */}
      <DroneHeroSlider slides={heroSlides.length > 0 ? heroSlides : undefined} />

      {/* ====== CIRCLE CATEGORY STRIP (auto + flèches + glissement) ====== */}
      <CategoryStrip items={circleCats} marquee={marquee} />

      {/* ====== PROMO TILES — 4 photos plein cadre (sans texte) ====== */}
      <section className="promo-tiles">
        <div className="container">
          <div className="promo-tiles__grid">
            <Link href="/boutique?q=camera" className="promo-tile" aria-label="Caméras">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&q=85&auto=format&fit=crop)" }} />
            </Link>
            <Link href="/boutique?q=gimbal" className="promo-tile" aria-label="Gimbals">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1000&q=85&auto=format&fit=crop)" }} />
            </Link>
            <Link href="/boutique?q=audio" className="promo-tile" aria-label="Audio">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000&q=85&auto=format&fit=crop)" }} />
            </Link>
            <Link href="/boutique?q=drone" className="promo-tile" aria-label="Drones">
              <div className="promo-tile__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1000&q=85&auto=format&fit=crop)" }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== WHAT'S NEW ====== */}
      <section className="section" style={{ paddingTop: "var(--s5)" }}>
        <div className="container">
          <ScrollReveal animation="fade-up">
            <div className="section-head">
              <div>
                <span className="section-tag">Nouveau</span>
                <h2>Quoi de neuf</h2>
              </div>
              <Link href="/boutique" className="view-all">
                Voir tout
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100} className="stagger">
            <div className="products products--4">
              {nouveautes.length > 0 ? (
                nouveautes.map((p) => (
                  <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
                ))
              ) : (
                <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--fg-mute)" }}>
                  Aucun produit pour le moment. <Link href="/admin/produits" style={{ color: "var(--indigo)" }}>Ajoutez-en depuis l&apos;admin</Link>
                </p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ====== SERIES: SUGGESTION (admin-managed media + 4 featured products) ====== */}
      {(!suggestion || suggestion.visible) && (
        <section className="series-section">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <h2 className="series-section__label">{suggestion ? "Nos Suggestions" : "Caméras Professionnelles"}</h2>
              <div className="series-banner">
                {suggestion ? (
                  <BannerMedia items={suggestion.media} />
                ) : (
                  <video
                    className="series-banner__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&q=85&auto=format&fit=crop"
                  >
                    <source src="https://videos.pexels.com/video-files/2890196/2890196-hd_1920_1080_30fps.mp4" type="video/mp4" />
                  </video>
                )}
                <div className="series-banner__content">
                  <h3 className="series-banner__name">{suggestion?.title || "Caméra Cinéma Pro"}</h3>
                  <p className="series-banner__tagline">{suggestion?.tagline || "Filmez comme un professionnel"}</p>
                  <Link href={suggestion?.cta_href || "/boutique?q=camera"} className="series-banner__btn">
                    {suggestion?.cta_label || "Acheter"}
                    <svg width="12" height="9" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
            {featured && featured.length > 0 && (
              <ScrollReveal animation="fade-up" delay={100} className="stagger">
                <div className="series-products">
                  {featured.map((p) => (
                    <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
                  ))}
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>
      )}

      {/* ====== RECOMMANDATION — VIDEO SHOWCASE (admin-managed media) ====== */}
      {(!recommandation || recommandation.visible) && (
        <section className="series-section">
          <div className="container">
            <div className="pvid pvid--banner">
              {recommandation ? (
                <BannerMedia items={recommandation.media} />
              ) : (
                <video
                  className="pvid__video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=80&auto=format&fit=crop"
                >
                  <source src="/front/videos/dji-product.mp4" type="video/mp4" />
                </video>
              )}

              <div className="pvid__overlay" />

              <div className="pvid__content">
                <p className="pvid__badge">{recommandation ? "Recommandation" : "Produit en Vedette"}</p>
                {recommandation ? (
                  <h2 className="pvid__title">{recommandation.title}</h2>
                ) : (
                  <h2 className="pvid__title">DJI<br /><span className="pvid__thin">Série Professionnelle</span></h2>
                )}
                <p className="pvid__desc">
                  {recommandation?.tagline || "Précision, autonomie et performance. La référence mondiale de la capture aérienne."}
                </p>
                {!recommandation && (
                  <div className="pvid__specs">
                    <div className="pvid__spec"><strong>4K</strong><span>Ultra HD</span></div>
                    <div className="pvid__sep" />
                    <div className="pvid__spec"><strong>45 min</strong><span>Autonomie</span></div>
                    <div className="pvid__sep" />
                    <div className="pvid__spec"><strong>15 km</strong><span>Portée</span></div>
                    <div className="pvid__sep" />
                    <div className="pvid__spec"><strong>GPS</strong><span>Précision</span></div>
                  </div>
                )}
                <div className="pvid__ctas">
                  <Link href={recommandation?.cta_href || "/boutique"} className="pvid__btn pvid__btn--white">
                    {recommandation?.cta_label || "Acheter maintenant"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====== SERIES: ARTICLES EN SOLDE (admin-managed media, hideable) ====== */}
      {(!solde || solde.visible) && (
        <section className="series-section">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <h2 className="series-section__label">{solde ? "Articles en Solde" : "Prise en Main · Vlogging Quotidien"}</h2>
              <div className="series-banner">
                {soldeSyncMedia.length > 0 ? (
                  <BannerMedia items={soldeSyncMedia} />
                ) : solde ? (
                  <BannerMedia items={solde.media} />
                ) : (
                  <div className="series-banner__bg" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1600&q=85&auto=format&fit=crop)" }} />
                )}
                <div className="series-banner__content">
                  <h3 className="series-banner__name">{solde?.title || "Caméra d'Action 6 Pro"}</h3>
                  <p className="series-banner__tagline">{solde?.tagline || "La caméra d'action à la qualité d'image révolutionnaire"}</p>
                  <Link href={solde?.cta_href || "/boutique?q=action"} className="series-banner__btn">
                    {solde?.cta_label || "Acheter"}
                    <svg width="12" height="9" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
            {solde ? (
              soldeProducts.length > 0 && (
                <ScrollReveal animation="fade-up" delay={100} className="stagger">
                  <div className="series-products">
                    {soldeProducts.map((p) => (
                      <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge="Promo" />
                    ))}
                  </div>
                </ScrollReveal>
              )
            ) : (
              handheld && handheld.length > 0 && (
                <ScrollReveal animation="fade-up" delay={100} className="stagger">
                  <div className="series-products">
                    {handheld.map((p) => (
                      <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
                    ))}
                  </div>
                </ScrollReveal>
              )
            )}
          </div>
        </section>
      )}

      {/* ====== SHOP OUR SELECTIONS (categories) ====== */}
      {categories && categories.length > 0 && (
        <section className="section" style={{ paddingTop: "var(--s5)" }}>
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="section-head">
                <div>
                  <span className="section-tag">Explorer</span>
                  <h2>Nos Sélections</h2>
                </div>
                <Link href="/boutique" className="view-all">
                  Tous les produits
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100} className="stagger">
              <div className="cats-grid">
                {categories.slice(0, 6).map((cat) => (
                  <Link key={cat.id} href={`/boutique?categorie=${cat.id}`} className="cat-tile">
                    <div className="pic">
                      <img src={cat.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80&auto=format&fit=crop"} alt={cat.name} />
                    </div>
                    <div className="name">{cat.name}</div>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

    </>
  );
}
