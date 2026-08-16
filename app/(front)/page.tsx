import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";
import ProductCard from "./components/ProductCard";
import DroneHeroSlider, { type HeroSlide } from "./components/DroneHeroSlider";
import ScrollReveal from "./components/ScrollReveal";
import BannerMedia, { type BannerMediaItem } from "./components/BannerMedia";
import SoldeArrivalsSection from "./components/SoldeArrivalsSection";
import CategoryStrip from "./components/CategoryStrip";
import SuggestionsScroll from "./components/SuggestionsScroll";
import QuoiDeNeufScroll from "./components/QuoiDeNeufScroll";

type HomeSectionMedia = BannerMediaItem & {
  section_id: string;
  display_order: number;
  banner_label?: string | null;
  banner_title?: string | null;
  banner_sub?: string | null;
  banner_cta?: string | null;
  banner_cta_href?: string | null;
  banner_visible?: boolean | null;
};
type HomeSectionRow = {
  id: string;
  section: "suggestion" | "recommandation" | "solde" | "quoi_de_neuf";
  title: string;
  tagline: string | null;
  cta_label: string | null;
  cta_href: string | null;
  visible: boolean;
  display_order?: number;
  home_section_media?: HomeSectionMedia[] | null;
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

  // Le client admin (service role) est utilisé pour lire la configuration des
  // sections (home_sections, home_section_media) afin de contourner les
  // politiques RLS qui pourraient bloquer les lectures anonymes.
  // Ces tables contiennent uniquement des données de configuration publique
  // (visibilité, titres, médias) — aucune donnée sensible utilisateur.
  // Le service role key n'est jamais exposé au navigateur (RSC server-only).
  const adminClient = createAdminClient();

  const [{ data: featured }, { data: categories }, { data: whatsNew }, { data: homeSections }, { data: homeMedia }, { data: heroSoldes }, { data: pinnedNew }, { data: heroSlidesAdmin }] = await Promise.all([
    // Suggestions : produits featured ordonnés par featured_order (admin-managed)
    supabase.from("products").select("*").eq("status", "published").eq("featured", true).order("featured_order", { ascending: true }).limit(8),
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(60),
    // Sections & médias : via adminClient pour bypasser RLS et lire le flag
    // `visible` correctement (le client anon peut être bloqué par RLS).
    adminClient.from("home_sections").select("id, section, title, tagline, cta_label, cta_href, visible, display_order").order("display_order", { ascending: true }),
    adminClient.from("home_section_media").select("id, section_id, url, media_type, display_order, banner_label, banner_title, banner_sub, banner_cta, banner_cta_href, banner_visible").order("display_order", { ascending: true }),
    // Articles en Solde : uniquement les produits cochés par l'admin dans le slider (solde_hero=true),
    // dans l'ordre défini par l'admin (solde_hero_order).
    supabase.from("products").select("id, title, price, compare_price, stock, short_description, image_url, product_media(url, type, position)").eq("status", "published").eq("solde_hero", true).not("compare_price", "is", null).order("solde_hero_order", { ascending: true, nullsFirst: false }).limit(48), // short_description utilisé dans le modal quick-view
    // Quoi de neuf : ordonnés par whats_new_order (admin-managed)
    supabase.from("products").select("*").eq("status", "published").eq("whats_new", true).order("whats_new_order", { ascending: true }).limit(8),
    // Slides hero gérés manuellement depuis l'admin (priorité sur solde_hero)
    supabase.from("hero_slides").select("*").eq("visible", true).order("display_order", { ascending: true }),
  ]);

  // Admin-managed media sections.
  // Les médias sont joints manuellement (requête séparée) pour éviter
  // les problèmes de cache PostgREST avec la syntaxe d'embed imbriquée.
  const allMedia = (homeMedia ?? []) as HomeSectionMedia[];
  const sectionMap = new Map(
    ((homeSections ?? []) as HomeSectionRow[]).map((s) => {
      const sectionMedia = allMedia
        .filter((m) => m.section_id === s.id)
        .sort((a, b) => a.display_order - b.display_order);
      return [
        s.section,
        { ...s, home_section_media: sectionMedia, media: sectionMedia },
      ];
    })
  );
  const suggestion = sectionMap.get("suggestion");
  const solde = sectionMap.get("solde");

  // Ordre d'affichage des sections sur la page — respecte display_order depuis la DB.
  // Repli si la colonne n'existe pas encore (avant migration v16).
  const FALLBACK_PAGE_ORDER = ["solde", "quoi_de_neuf", "suggestion"] as const;
  const pageOrder: string[] = (() => {
    const withOrder = ((homeSections ?? []) as HomeSectionRow[])
      .filter((s) => ["suggestion", "solde", "quoi_de_neuf"].includes(s.section))
      .sort((a, b) => {
        const ao = a.display_order ?? (FALLBACK_PAGE_ORDER.indexOf(a.section as typeof FALLBACK_PAGE_ORDER[number]) + 1) * 10;
        const bo = b.display_order ?? (FALLBACK_PAGE_ORDER.indexOf(b.section as typeof FALLBACK_PAGE_ORDER[number]) + 1) * 10;
        return ao - bo;
      })
      .map((s) => s.section as string);
    // S'assurer que les 3 sections sont présentes même si absentes de la DB
    for (const k of FALLBACK_PAGE_ORDER) {
      if (!withOrder.includes(k)) withOrder.push(k);
    }
    return withOrder;
  })();

  // « Quoi de neuf » : épinglés par l'admin ou (si aucun) dernier article par catégorie
  const nouveautes = (pinnedNew && pinnedNew.length > 0)
    ? pinnedNew.slice(0, 8)
    : (() => {
        const vuCategories = new Set<string>();
        return (whatsNew ?? []).filter((p) => {
          const cle = p.category_id ?? "sans-categorie";
          if (vuCategories.has(cle)) return false;
          vuCategories.add(cle);
          return true;
        }).slice(0, 8);
      })();

  // Slides du hero : articles soldés « à la une » avec leur vidéo
  // (fichier direct) ou image ; sinon le slider garde ses slides démo.
  type HeroSoldeRow = {
    id: string; title: string; price: number; compare_price: number; stock: number;
    short_description: string | null; image_url: string | null;
    product_media: { url: string; type: string; position: number }[] | null;
  };
  const heroSoldesActifs = ((heroSoldes ?? []) as HeroSoldeRow[]).filter((p) => p.compare_price > p.price);


  // Slides hero : priorité admin → produits solde_hero → slides démo (undefined)
  const heroSlides: HeroSlide[] = (() => {
    if (heroSlidesAdmin && heroSlidesAdmin.length > 0) {
      return heroSlidesAdmin.map((s: { title: string; tagline: string | null; badge: string | null; image_url: string | null; video_url: string | null; buy_href: string; more_href: string }) => ({
        bg: s.image_url ?? "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=95&auto=format&fit=crop",
        video: s.video_url ?? null,
        badge: s.badge ?? "",
        name: s.title,
        tagline: s.tagline ?? "",
        buy: s.buy_href,
        more: s.more_href,
      }));
    }
    return heroSoldesActifs.map((p) => {
      const media = [...(p.product_media ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
      const video = media.find((m: { type: string; url: string }) => m.type === "video" && /\.(mp4|webm|mov)(\?|$)/i.test(m.url));
      const image = p.image_url || media.find((m: { type: string; url: string }) => m.type === "image")?.url;
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
  })();

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

      {/* ====== SECTIONS DYNAMIQUES — ordre géré depuis Admin → Page d'accueil ====== */}
      {pageOrder.map((sectionKey) => {

        /* ── Articles en solde (SoldeArrivalsSection) ── */
        if (sectionKey === "solde") {
          if (solde?.visible === false) return null;
          return (
            <SoldeArrivalsSection
              key="solde"
              products={heroSoldesActifs}
              media={solde?.media ?? []}
              title={solde?.title ?? "Articles en Solde"}
              ctaLabel={solde?.cta_label ?? "Voir tout"}
              ctaHref={solde?.cta_href ?? "/boutique?soldes=1"}
            />
          );
        }

        /* ── Quoi de neuf (scroll horizontal) ── */
        if (sectionKey === "quoi_de_neuf") {
          const qdn = sectionMap.get("quoi_de_neuf");
          if (qdn?.visible === false) return null;
          return (
            <QuoiDeNeufScroll
              key="quoi_de_neuf"
              products={nouveautes}
              title={qdn?.title ?? "Quoi de neuf"}
              ctaLabel={qdn?.cta_label ?? "Voir tout"}
              ctaHref={qdn?.cta_href ?? "/boutique?nouveautes=1"}
            />
          );
        }

        /* ── Suggestions (bannière + produits vedettes) ── */
        if (sectionKey === "suggestion") {
          if (suggestion?.visible === false) return null;
          return (
            <section key="suggestion" className="series-section">
              <div className="container">
                <ScrollReveal animation="fade-up">
                  <h2 className="series-section__label">{suggestion ? "Nos Suggestions" : "Caméras Professionnelles"}</h2>
                  <div className="series-banner">
                    {suggestion && suggestion.media.length > 0 ? (
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
                      <h3 className="series-banner__name">{suggestion?.title ?? "Caméra Cinéma Pro"}</h3>
                      <p className="series-banner__tagline">{suggestion?.tagline ?? "Filmez comme un professionnel"}</p>
                      <Link href={suggestion?.cta_href ?? "/boutique?q=camera"} className="series-banner__btn">
                        {suggestion?.cta_label ?? "Acheter"}
                        <svg width="12" height="9" viewBox="0 0 14 10" fill="none"><path d="M1 5h12m0 0L9 1m4 4L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
                {featured && featured.length > 0 && (
                  <ScrollReveal animation="fade-up" delay={100} className="stagger">
                    <SuggestionsScroll>
                      {featured.map((p) => (
                        <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} compare_price={p.compare_price} stock={p.stock} image_url={p.image_url} loyalty_points={p.loyalty_points} badge={p.compare_price && p.compare_price > p.price ? "Promo" : undefined} />
                      ))}
                    </SuggestionsScroll>
                  </ScrollReveal>
                )}
              </div>
            </section>
          );
        }

        return null;
      })}


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
