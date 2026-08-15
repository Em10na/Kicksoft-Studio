"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type Categorie = { id: string; name: string };

type HeroSlideRow = {
  id: string;
  title: string;
  tagline: string | null;
  badge: string | null;
  image_url: string | null;
  video_url: string | null;
  buy_href: string;
  more_href: string;
  display_order: number;
  visible: boolean;
};

const HERO_FORM_EMPTY: Omit<HeroSlideRow, "id" | "display_order" | "visible"> = {
  title: "", tagline: "", badge: "", image_url: "", video_url: "", buy_href: "/boutique", more_href: "/boutique",
};

type Produit = {
  id: string;
  title: string;
  price: number;
  featured: boolean;
  featured_order: number;
  status: string;
  compare_price: number | null;
  solde_hero: boolean;
  solde_hero_order: number;
  whats_new: boolean;
  whats_new_order: number;
  image_url: string | null;
  category_id: string | null;
};

type SectionMedia = {
  id: string;
  section_id: string;
  media_type: "image" | "video";
  url: string;
  poster_url: string | null;
  display_order: number;
  banner_label?: string | null;
  banner_title?: string | null;
  banner_sub?: string | null;
  banner_cta?: string | null;
  banner_cta_href?: string | null;
  banner_visible?: boolean;
};

type HomeSection = {
  id: string;
  section: "suggestion" | "solde";
  title: string;
  tagline: string | null;
  cta_label: string | null;
  cta_href: string | null;
  visible: boolean;
  home_section_media: SectionMedia[];
};

type SectionForm = { title: string; tagline: string; cta_label: string; cta_href: string };

const SECTION_META: Record<HomeSection["section"], { label: string; desc: string; icon: string }> = {
  suggestion: { label: "Suggestions",       desc: "Bannière au-dessus des produits vedettes",                      icon: "ti-bulb"       },
  solde:      { label: "Articles en solde", desc: "Carousel flottant — images et vidéos des produits en vedette", icon: "ti-discount-2" },
};

const SECTION_ORDER: HomeSection["section"][] = ["solde", "suggestion"];

const SECTION_DEFAULTS: Record<HomeSection["section"], { title: string; tagline: string; cta_label: string; cta_href: string }> = {
  suggestion: { title: "Caméra Cinéma Pro",        tagline: "Filmez comme un professionnel",                                                        cta_label: "Acheter",            cta_href: "/boutique?q=camera" },
  solde:      { title: "Nos articles en solde",      tagline: "Des offres exclusives sélectionnées pour vous — profitez-en avant la fin des soldes.", cta_label: "Voir les soldes",    cta_href: "/boutique"          },
};

const BUCKET = "media";

const QUICK_HREFS = ["/boutique?soldes=1", "/boutique", "/boutique?nouveautes=1", "/"];

function estVideo(nomOuUrl: string, mime?: string): boolean {
  if (mime) return mime.startsWith("video/");
  return /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(nomOuUrl);
}

export default function AccueilPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [whatsnewDispo, setWhatsnewDispo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  // Hero slides
  const [heroSlides, setHeroSlides] = useState<HeroSlideRow[]>([]);
  const [heroSlidesDispo, setHeroSlidesDispo] = useState(true);
  const [heroForm, setHeroForm] = useState<typeof HERO_FORM_EMPTY>({ ...HERO_FORM_EMPTY });
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [showHeroForm, setShowHeroForm] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroVideoUploading, setHeroVideoUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const heroVideoRef = useRef<HTMLInputElement | null>(null);

  const [searchWhatsNew, setSearchWhatsNew] = useState("");
  const [showDropWhatsNew, setShowDropWhatsNew] = useState(false);

  // Sections média (suggestion / solde)
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [sectionsDispo, setSectionsDispo] = useState(true);
  const [sectionForms, setSectionForms] = useState<Record<string, SectionForm>>({});
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [showHeroModal, setShowHeroModal] = useState(false);
  // Monté côté client (nécessaire pour createPortal en Next.js)
  const [mounted, setMounted] = useState(false);
  // Articles en solde chargés SANS filtre de statut (comme la page /admin/soldes)
  const [articulesEnSolde, setArticulesEnSolde] = useState<Produit[]>([]);
  const [searchSolde, setSearchSolde] = useState("");
  const [showDropSolde, setShowDropSolde] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; detail?: string; confirmLabel?: string; confirmIcon?: string; onConfirm: () => void } | null>(null);
  // Modal de configuration par bannière (solde section)
  const [bannerEdit, setBannerEdit] = useState<{
    media: SectionMedia;
    label: string; title: string; sub: string; cta: string; cta_href: string; visible: boolean;
  } | null>(null);

  function notifier(message: string, type: "success" | "danger" | "warning" = "success") {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  // Nécessaire pour que createPortal fonctionne côté serveur (Next.js)
  useEffect(() => { setMounted(true); }, []);

  // Charge les articles en solde SANS filtre de statut, comme la page /admin/soldes.
  // chargerProduits() filtre par status="published" (nécessaire pour featured/whats_new).
  // Pour les soldes hero on veut TOUS les produits avec compare_price > price.
  async function chargerSoldes() {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, featured, featured_order, status, compare_price, solde_hero, solde_hero_order, whats_new, whats_new_order, image_url, category_id")
      .order("title", { ascending: true });
    if (error) return;
    setArticulesEnSolde(
      (data ?? [])
        .map((p: any) => ({
          ...p,
          featured_order: p.featured_order ?? 0,
          solde_hero_order: p.solde_hero_order ?? 0,
          whats_new_order: p.whats_new_order ?? 0,
        }))
    );
  }

  async function chargerHeroSlides() {
    const { data, error } = await supabase.from("hero_slides").select("*").order("display_order", { ascending: true });
    if (error) { setHeroSlidesDispo(false); return; }
    setHeroSlidesDispo(true);
    setHeroSlides(data ?? []);
  }

  async function sauvegarderSlide() {
    if (!heroForm.title.trim()) { notifier("Le titre est obligatoire.", "danger"); return; }
    if (editingSlideId) {
      const { error } = await supabase.from("hero_slides").update({ ...heroForm }).eq("id", editingSlideId);
      if (error) { notifier("Erreur : " + error.message, "danger"); return; }
      notifier("Slide mis à jour !");
    } else {
      const maxOrder = Math.max(0, ...heroSlides.map((s) => s.display_order));
      const { error } = await supabase.from("hero_slides").insert({ ...heroForm, display_order: maxOrder + 1, visible: true });
      if (error) { notifier("Erreur : " + error.message, "danger"); return; }
      notifier("Slide ajouté !");
    }
    setHeroForm({ ...HERO_FORM_EMPTY });
    setEditingSlideId(null);
    setShowHeroForm(false);
    chargerHeroSlides();
  }

  async function supprimerSlideConfirme(id: string) {
    await supabase.from("hero_slides").delete().eq("id", id);
    setConfirmAction(null);
    notifier("Slide supprimé.");
    chargerHeroSlides();
  }

  function supprimerSlide(id: string, title: string) {
    setConfirmAction({
      title: "Supprimer le slide",
      message: `Voulez-vous supprimer le slide "${title}" du carrousel hero ?`,
      confirmLabel: "Supprimer",
      confirmIcon: "ti-trash",
      onConfirm: () => supprimerSlideConfirme(id),
    });
  }

  async function toggleSlideVisible(s: HeroSlideRow) {
    await supabase.from("hero_slides").update({ visible: !s.visible }).eq("id", s.id);
    chargerHeroSlides();
  }

  async function deplacerSlideVers(id: string, newIdx: number) {
    const liste = [...heroSlides];
    const fromIdx = liste.findIndex((s) => s.id === id);
    if (fromIdx === newIdx) return;
    const [moved] = liste.splice(fromIdx, 1);
    liste.splice(newIdx, 0, moved);
    await Promise.all(liste.map((s, i) => supabase.from("hero_slides").update({ display_order: i + 1 }).eq("id", s.id)));
    chargerHeroSlides();
  }

  async function uploaderImageHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    const nom = `hero/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(nom, file, { upsert: false });
    if (error) { notifier("Upload échoué : " + error.message, "danger"); setHeroUploading(false); return; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(nom);
    setHeroForm((f) => ({ ...f, image_url: data.publicUrl }));
    setHeroUploading(false);
    if (heroFileRef.current) heroFileRef.current.value = "";
  }

  async function uploaderVideoHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroVideoUploading(true);
    const nom = `hero/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(nom, file, { upsert: false });
    if (error) { notifier("Upload échoué : " + error.message, "danger"); setHeroVideoUploading(false); return; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(nom);
    setHeroForm((f) => ({ ...f, video_url: data.publicUrl }));
    setHeroVideoUploading(false);
    if (heroVideoRef.current) heroVideoRef.current.value = "";
  }

  async function chargerProduits() {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, featured, featured_order, status, compare_price, solde_hero, solde_hero_order, whats_new, whats_new_order, image_url, category_id")
      .eq("status", "published")
      .order("title", { ascending: true });

    if (error) {
      const { data: fallback, error: e2 } = await supabase
        .from("products")
        .select("id, title, price, featured, status, compare_price, solde_hero, whats_new, image_url, category_id")
        .eq("status", "published")
        .order("title", { ascending: true });
      if (e2) setWhatsnewDispo(false);
      setProduits((fallback ?? []).map((p: any) => ({ ...p, featured_order: 0, solde_hero_order: 0, whats_new: p.whats_new ?? false, whats_new_order: 0 })));
      return;
    }
    setProduits((data ?? []).map((p) => ({ ...p, featured_order: p.featured_order ?? 0, solde_hero_order: p.solde_hero_order ?? 0, whats_new_order: p.whats_new_order ?? 0 })));
  }

  async function chargerSections() {
    const { data, error } = await supabase.from("home_sections").select("*, home_section_media(*)");
    if (error) {
      setSectionsDispo(false);
      return;
    }
    setSectionsDispo(true);

    // Auto-créer les sections manquantes (solde / suggestion)
    const existingKeys = new Set((data ?? []).map((s: HomeSection) => s.section));
    const manquantes = SECTION_ORDER.filter((k) => !existingKeys.has(k));
    if (manquantes.length > 0) {
      await Promise.all(
        manquantes.map((k) =>
          supabase.from("home_sections").insert({ section: k, ...SECTION_DEFAULTS[k], visible: true })
        )
      );
      const { data: data2 } = await supabase.from("home_sections").select("*, home_section_media(*)");
      return chargerSectionsDepuisData(data2 ?? []);
    }
    chargerSectionsDepuisData(data ?? []);
  }

  function chargerSectionsDepuisData(data: HomeSection[]) {
    const tri = data
      .filter((s) => s.section in SECTION_META)
      .map((s) => ({
        ...s,
        home_section_media: [...(s.home_section_media ?? [])].sort((a, b) => a.display_order - b.display_order),
      }));
    tri.sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section));
    setSections(tri);
    setSectionForms((prev) => {
      const next = { ...prev };
      for (const s of tri) {
        if (!next[s.id]) {
          next[s.id] = {
            title: s.title ?? "",
            tagline: s.tagline ?? "",
            cta_label: s.cta_label ?? "",
            cta_href: s.cta_href ?? "",
          };
        }
      }
      return next;
    });
    setEditingSection((prev) => prev ? (tri.find((s) => s.id === prev.id) ?? prev) : null);
  }

  async function chargerCategories() {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data ?? []);
  }

  async function toggleWhatsNew(p: Produit) {
    const nextOrder = p.whats_new ? 0 : Math.max(0, ...produits.filter((x) => x.whats_new).map((x) => x.whats_new_order)) + 1;
    const { error } = await supabase.from("products").update({ whats_new: !p.whats_new, whats_new_order: nextOrder }).eq("id", p.id);
    if (error) { notifier("Erreur : " + error.message, "danger"); return; }
    notifier(!p.whats_new ? `Produit épinglé dans « Quoi de neuf » !` : `Produit retiré de « Quoi de neuf ».`);
    chargerProduits();
  }

  async function deplacerWhatsNewVers(produitId: string, newIdx: number) {
    const ordered = [...produits.filter((p) => p.whats_new)].sort((a, b) => a.whats_new_order - b.whats_new_order);
    const fromIdx = ordered.findIndex((p) => p.id === produitId);
    if (fromIdx === newIdx) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(newIdx, 0, moved);
    await Promise.all(ordered.map((p, i) => supabase.from("products").update({ whats_new_order: i + 1 }).eq("id", p.id)));
    chargerProduits();
  }

  useEffect(() => {
    Promise.all([chargerHeroSlides(), chargerProduits(), chargerSoldes(), chargerSections(), chargerCategories()])
      .then(() => setLoading(false))
      .catch(() => setLoading(false)); // réseau instable → débloquer le loading
  }, []);

  async function toggleFeatured(produitId: string, actuel: boolean) {
    const nextOrder = actuel ? 0 : Math.max(0, ...produits.filter((p) => p.featured).map((p) => p.featured_order)) + 1;
    const { error } = await supabase.from("products").update({ featured: !actuel, featured_order: nextOrder }).eq("id", produitId);
    if (error) { notifier("Erreur : " + error.message, "danger"); return; }
    notifier(!actuel ? "Produit mis en avant !" : "Produit retiré de la mise en avant.");
    chargerProduits();
  }

  async function deplacerFeaturedVers(produitId: string, newIdx: number) {
    const ordered = [...produits.filter((p) => p.featured)].sort((a, b) => a.featured_order - b.featured_order);
    const fromIdx = ordered.findIndex((p) => p.id === produitId);
    if (fromIdx === newIdx) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(newIdx, 0, moved);
    await Promise.all(ordered.map((p, i) => supabase.from("products").update({ featured_order: i + 1 }).eq("id", p.id)));
    chargerProduits();
  }

  async function toggleSoldeAffiche(p: Produit) {
    const isAdding = !p.solde_hero;
    const nextOrder = isAdding
      ? Math.max(0, ...articulesEnSolde.filter((x) => x.solde_hero).map((x) => x.solde_hero_order)) + 1
      : 0;
    const { error } = await supabase.from("products").update({ solde_hero: isAdding, solde_hero_order: nextOrder }).eq("id", p.id);
    if (error) { notifier("Erreur : " + error.message, "danger"); return; }
    // Auto-alimenter la section "Médias" avec l'image du produit ajouté
    if (isAdding && p.image_url) {
      const soldeSection = sections.find((sec) => sec.section === "solde");
      if (soldeSection && !soldeSection.home_section_media.some((m) => m.url === p.image_url)) {
        const ordre = (soldeSection.home_section_media.at(-1)?.display_order ?? -1) + 1;
        await supabase.from("home_section_media").insert({
          section_id: soldeSection.id,
          media_type: "image",
          url: p.image_url,
          display_order: ordre,
          banner_visible: true,
        });
      }
    }
    notifier(isAdding ? `« ${p.title} » ajouté au slider soldes.` : `« ${p.title} » retiré du slider soldes.`);
    chargerSoldes();
    chargerSections();
  }

  async function deplacerSoldeVers(produitId: string, newIdx: number) {
    const ordered = [...articulesEnSolde.filter((p) => p.solde_hero)].sort((a, b) => a.solde_hero_order - b.solde_hero_order);
    const fromIdx = ordered.findIndex((p) => p.id === produitId);
    if (fromIdx === newIdx) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(newIdx, 0, moved);
    await Promise.all(ordered.map((p, i) => supabase.from("products").update({ solde_hero_order: i + 1 }).eq("id", p.id)));
    chargerSoldes();
  }

  // ---------- Sections média ----------

  async function sauvegarderSection(s: HomeSection) {
    const f = sectionForms[s.id];
    if (!f) return;
    const { error } = await supabase
      .from("home_sections")
      .update({
        title: f.title.trim(),
        tagline: f.tagline.trim() || null,
        cta_label: f.cta_label.trim() || null,
        cta_href: f.cta_href.trim() || null,
      })
      .eq("id", s.id);
    if (error) notifier("Erreur : " + error.message, "danger");
    else {
      notifier(`Section « ${SECTION_META[s.section].label} » enregistrée !`);
      chargerSections();
    }
  }

  async function toggleVisible(s: HomeSection) {
    const { error } = await supabase.from("home_sections").update({ visible: !s.visible }).eq("id", s.id);
    if (error) notifier("Erreur : " + error.message, "danger");
    else {
      notifier(!s.visible ? "Section visible sur la boutique." : "Section masquée.");
      chargerSections();
    }
  }

  async function ajouterMedia(s: HomeSection, url: string, type: "image" | "video") {
    const ordre = (s.home_section_media.at(-1)?.display_order ?? -1) + 1;
    const { error } = await supabase.from("home_section_media").insert({
      section_id: s.id,
      media_type: type,
      url,
      display_order: ordre,
      banner_visible: true,
    });
    if (error) notifier("Erreur : " + error.message, "danger");
    else {
      notifier(type === "video" ? "Vidéo ajoutée !" : "Image ajoutée !");
      chargerSections();
    }
  }

  async function uploaderMedia(s: HomeSection, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingId(s.id);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nom = `home/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage.from(BUCKET).upload(nom, file, { upsert: false });
      if (error) { notifier("Upload échoué : " + error.message, "danger"); continue; }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(nom);
      await ajouterMedia(s, data.publicUrl, estVideo(file.name, file.type) ? "video" : "image");
    }
    setUploadingId(null);
    event.target.value = "";
  }

  async function ajouterParUrl(s: HomeSection) {
    const url = (urlInputs[s.id] ?? "").trim();
    if (!url) return;
    await ajouterMedia(s, url, estVideo(url) ? "video" : "image");
    setUrlInputs((prev) => ({ ...prev, [s.id]: "" }));
  }

  async function supprimerMediaConfirme(m: SectionMedia) {
    const { error } = await supabase.from("home_section_media").delete().eq("id", m.id);
    setConfirmAction(null);
    if (error) notifier("Erreur : " + error.message, "danger");
    else { notifier("Média supprimé."); chargerSections(); }
  }

  function supprimerMedia(m: SectionMedia) {
    setConfirmAction({
      title: "Supprimer ce média",
      message: "Voulez-vous retirer ce média de la section ?",
      detail: m.media_type === "video" ? "🎬 Fichier vidéo de la section" : "🖼️ Image de la section",
      confirmLabel: "Supprimer",
      confirmIcon: "ti-trash",
      onConfirm: () => supprimerMediaConfirme(m),
    });
  }

  // Remet banner_visible = true pour TOUS les médias d'une section
  async function reinitialiserBannersVisibles(s: HomeSection) {
    const ids = s.home_section_media.map((m) => m.id);
    if (ids.length === 0) return;
    await Promise.all(
      ids.map((id) => supabase.from("home_section_media").update({ banner_visible: true }).eq("id", id))
    );
    notifier("Tous les médias sont maintenant visibles !");
    chargerSections();
  }

  async function sauvegarderBanner() {
    if (!bannerEdit) return;
    await supabase.from("home_section_media").update({
      banner_label:   bannerEdit.label,
      banner_title:   bannerEdit.title,
      banner_sub:     bannerEdit.sub,
      banner_cta:     bannerEdit.cta,
      banner_cta_href: bannerEdit.cta_href,
      banner_visible: bannerEdit.visible,
    }).eq("id", bannerEdit.media.id);
    setBannerEdit(null);
    notifier("Bannière configurée !");
    chargerSections();
  }

  async function deplacerMedia(s: HomeSection, m: SectionMedia, dir: -1 | 1) {
    const liste = s.home_section_media;
    const idx = liste.findIndex((x) => x.id === m.id);
    const voisin = liste[idx + dir];
    if (!voisin) return;
    const [r1, r2] = await Promise.all([
      supabase.from("home_section_media").update({ display_order: voisin.display_order }).eq("id", m.id),
      supabase.from("home_section_media").update({ display_order: m.display_order }).eq("id", voisin.id),
    ]);
    if (r1.error || r2.error) notifier("Erreur lors du déplacement.", "danger");
    chargerSections();
  }

  function ouvrirSectionModal(s: HomeSection) {
    setSectionForms((prev) => ({
      ...prev,
      [s.id]: prev[s.id] ?? { title: s.title ?? "", tagline: s.tagline ?? "", cta_label: s.cta_label ?? "", cta_href: s.cta_href ?? "" },
    }));
    setEditingSection(s);
    setShowSectionModal(true);
  }

  if (loading) {
    return <p style={{ color: "#94a3b8", padding: 24 }}>Chargement...</p>;
  }

  const pinnedCount = produits.filter((p) => p.whats_new).length;

  return (
    <div className="ak-animate">
      {alert.message && (
        <div className={`ak-alert ak-alert--${alert.type}`}>
          <i className={`ti ${alert.type === "success" ? "ti-check" : "ti-alert-circle"}`}></i> {alert.message}
        </div>
      )}

      <div className="ak-page-header">
        <div>
          <h1 className="ak-page-title">Page d&apos;accueil</h1>
          <p className="ak-page-sub">Personnalisez le hero, les sections média, « Quoi de neuf » et les produits vedettes</p>
        </div>
      </div>

      {/* ---------- Slides Hero ---------- */}
      <div className="ak-card" style={{ marginBottom: 20 }}>
        <div className="ak-card__header" style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: "#f0f0ff", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <i className="ti ti-photo-film" style={{ color: "#6366f1", fontSize: 20 }}></i>
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 className="ak-card__title" style={{ margin: 0 }}>Slides du Hero</h3>
                {heroSlidesDispo && heroSlides.length > 0 && (
                  <span className="ak-badge ak-badge--dot" style={{ fontSize: 11 }}>
                    {heroSlides.length} slide{heroSlides.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="ak-card__subtitle" style={{ margin: 0, fontSize: 12 }}>Carrousel principal affiché en haut de la boutique — image ou vidéo par slide</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {heroSlidesDispo && (
              <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={() => setShowHeroModal(true)}>
                <i className="ti ti-pencil"></i> Modifier
              </button>
            )}
          </div>
        </div>
        {!heroSlidesDispo && (
          <div className="ak-card__body">
            <div className="ak-alert ak-alert--warning" style={{ margin: 0 }}>
              <i className="ti ti-alert-circle"></i> Exécutez <code>supabase/migration-v15-hero-slides.sql</code> dans le SQL Editor de Supabase puis rechargez.
            </div>
          </div>
        )}
      </div>

      {/* ---------- Sections média (solde / suggestion) ---------- */}
      {!sectionsDispo ? (
        <div className="ak-alert ak-alert--warning" style={{ marginBottom: 20 }}>
          <i className="ti ti-alert-circle"></i> Les tables des sections média n&apos;existent pas encore —
          exécutez <code>supabase/migration-v5-home-sections.sql</code> dans le SQL Editor de Supabase puis rechargez.
        </div>
      ) : (
        sections.map((s) => {
          // Ignorer les sections inconnues (ex: quoi_de_neuf si la migration v16 a été exécutée)
          const meta = SECTION_META[s.section as HomeSection["section"]];
          if (!meta) return null;
          return (
            <div key={s.id} className="ak-card" style={{ marginBottom: 12 }}>
              <div className="ak-card__header" style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 10, background: "#f0f0ff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <i className={`ti ${meta.icon}`} style={{ color: "#6366f1", fontSize: 20 }}></i>
                  </span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h3 className="ak-card__title" style={{ margin: 0 }}>{meta.label}</h3>
                      {s.home_section_media.length > 0 && (
                        <span className="ak-badge ak-badge--dot" style={{ fontSize: 11 }}>
                          {s.home_section_media.length} média{s.home_section_media.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {!s.visible && (
                        <span className="ak-badge ak-badge--muted" style={{ fontSize: 11 }}>Masquée</span>
                      )}
                    </div>
                    <p className="ak-card__subtitle" style={{ margin: 0, fontSize: 12 }}>{meta.desc}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    className={`ak-btn ak-btn--sm ${s.visible ? "ak-btn--ghost" : "ak-btn--danger"}`}
                    onClick={() => toggleVisible(s)}
                    title={s.visible ? "Masquer sur la boutique" : "Afficher sur la boutique"}
                  >
                    <i className={`ti ${s.visible ? "ti-eye" : "ti-eye-off"}`}></i>
                    {s.visible ? "Visible" : "Masquée"}
                  </button>
                  <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={() => ouvrirSectionModal(s)}>
                    <i className="ti ti-pencil"></i> Modifier
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* ---------- Quoi de neuf ---------- */}
      <div className="ak-card" style={{ marginBottom: 12 }}>
        <div className="ak-card__header" style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf4", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <i className="ti ti-sparkles" style={{ color: "#10b981", fontSize: 20 }}></i>
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 className="ak-card__title" style={{ margin: 0 }}>Quoi de neuf</h3>
                <span className="ak-count-badge">
                  {pinnedCount > 0 ? `${pinnedCount} épinglé${pinnedCount > 1 ? "s" : ""}` : "auto"}
                </span>
              </div>
              <p className="ak-card__subtitle" style={{ margin: 0, fontSize: 12 }}>
                Épinglez des produits prioritaires. Si aucun n&apos;est épinglé, le dernier article de chaque catégorie s&apos;affiche automatiquement.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {produits.some((p) => p.whats_new) && (
              <button
                className="ak-btn ak-btn--ghost ak-btn--sm"
                onClick={async () => {
                  await Promise.all(produits.filter((p) => p.whats_new).map((p) => supabase.from("products").update({ whats_new: false, whats_new_order: 0 }).eq("id", p.id)));
                  notifier("Sélection effacée — mode automatique activé.");
                  chargerProduits();
                }}
              >
                <i className="ti ti-refresh"></i> Réinitialiser
              </button>
            )}
            {whatsnewDispo && produits.length > 0 && (
              <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={() => setShowWhatsNewModal(true)}>
                <i className="ti ti-pencil"></i> Modifier
              </button>
            )}
          </div>
        </div>
        {!whatsnewDispo && (
          <div className="ak-card__body">
            <div className="ak-alert ak-alert--warning" style={{ margin: 0 }}>
              <i className="ti ti-alert-circle"></i> La colonne <code>whats_new</code> n&apos;existe pas encore — exécutez <code>supabase/migration-v12-whats-new.sql</code> dans le SQL Editor de Supabase puis rechargez.
            </div>
          </div>
        )}
        {whatsnewDispo && produits.length === 0 && (
          <div className="ak-card__body">
            <p style={{ color: "#94a3b8", margin: 0 }}>Aucun produit publié. <a href="/admin/produits" style={{ color: "#6366f1", fontWeight: 600 }}>Ajouter des produits</a></p>
          </div>
        )}
      </div>

      {/* ---------- Modal Slides Hero ---------- */}
      {mounted && showHeroModal && createPortal(
        <div className="ak-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setShowHeroModal(false); setShowHeroForm(false); setEditingSlideId(null); setHeroForm({ ...HERO_FORM_EMPTY }); } }}>
          <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">
                <i className="ti ti-photo-film" style={{ marginRight: 8, color: "#6366f1" }}></i>
                {showHeroForm ? (editingSlideId ? "Modifier le slide" : "Nouveau slide") : "Slides du Hero"}
              </h2>
              <button className="ak-modal__close" onClick={() => { setShowHeroModal(false); setShowHeroForm(false); setEditingSlideId(null); setHeroForm({ ...HERO_FORM_EMPTY }); }}>
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div className="ak-modal__body" style={{ overflowY: "auto", maxHeight: "70vh" }}>
              {!showHeroForm ? (
                <>
                  {heroSlides.length === 0 ? (
                    <p style={{ color: "var(--a-ink-mute)", fontSize: 13, marginBottom: 0 }}>
                      Aucun slide — le carrousel affiche les slides de démonstration. Ajoutez-en un pour les remplacer.
                    </p>
                  ) : (
                    heroSlides.map((s, idx) => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: s.visible ? "var(--a-paper)" : "var(--a-bg)", border: `1.5px solid ${s.visible ? "var(--a-rule)" : "#e2e8f0"}`, borderRadius: 12, marginBottom: 8, opacity: s.visible ? 1 : 0.6 }}>
                        <select value={idx} onChange={(e) => deplacerSlideVers(s.id, parseInt(e.target.value))} title="Changer la position" style={{ width: 58, padding: "5px 4px", borderRadius: 8, border: "1.5px solid var(--a-rule)", fontSize: 13, fontWeight: 800, color: "#6366f1", background: "var(--a-paper)", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                          {heroSlides.map((_, i) => <option key={i} value={i}>#{i + 1}</option>)}
                        </select>
                        {s.image_url
                          ? <img src={s.image_url} alt="" style={{ width: 72, height: 46, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                          : <span style={{ width: 72, height: 46, borderRadius: 8, background: "var(--a-bg)", display: "grid", placeItems: "center", flexShrink: 0, border: "1px dashed var(--a-rule)" }}><i className="ti ti-photo" style={{ color: "#94a3b8", fontSize: 18 }}></i></span>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                            {s.badge && <span className="ak-badge ak-badge--accent" style={{ fontSize: 10, flexShrink: 0 }}>{s.badge}</span>}
                            {s.video_url && <span className="ak-badge ak-badge--muted" style={{ fontSize: 10, flexShrink: 0 }}><i className="ti ti-video"></i> Vidéo</span>}
                          </div>
                          {s.tagline && <div style={{ fontSize: 12, color: "var(--a-ink-mute)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.tagline}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                          <button className={`ak-btn ak-btn--sm ${s.visible ? "ak-btn--ghost" : "ak-btn--muted"}`} onClick={() => toggleSlideVisible(s)} title={s.visible ? "Masquer" : "Afficher"}>
                            <i className={`ti ${s.visible ? "ti-eye" : "ti-eye-off"}`}></i>
                          </button>
                          <button className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon" onClick={() => { setHeroForm({ title: s.title, tagline: s.tagline ?? "", badge: s.badge ?? "", image_url: s.image_url ?? "", video_url: s.video_url ?? "", buy_href: s.buy_href, more_href: s.more_href }); setEditingSlideId(s.id); setShowHeroForm(true); }} title="Modifier"><i className="ti ti-pencil"></i></button>
                          <button className="ak-btn ak-btn--danger-ghost ak-btn--sm ak-btn--icon" onClick={() => supprimerSlide(s.id, s.title)} title="Supprimer"><i className="ti ti-trash"></i></button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <>
                  <div className="ak-form-row" style={{ marginBottom: 12 }}>
                    <div className="ak-field">
                      <label className="ak-label">Titre <span style={{ color: "#f43f5e" }}>*</span></label>
                      <input className="ak-input" placeholder="ex : DJI Mini 4 Pro" value={heroForm.title} onChange={(e) => setHeroForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="ak-field">
                      <label className="ak-label">Badge</label>
                      <input className="ak-input" placeholder="ex : Nouveau 2025, Soldes" value={heroForm.badge ?? ""} onChange={(e) => setHeroForm((f) => ({ ...f, badge: e.target.value }))} />
                    </div>
                  </div>
                  <div className="ak-field" style={{ marginBottom: 12 }}>
                    <label className="ak-label">Accroche (sous le titre)</label>
                    <input className="ak-input" placeholder="ex : Capturez l'instant depuis les airs" value={heroForm.tagline ?? ""} onChange={(e) => setHeroForm((f) => ({ ...f, tagline: e.target.value }))} />
                  </div>
                  <div className="ak-form-row" style={{ marginBottom: 12 }}>
                    <div className="ak-field">
                      <label className="ak-label">Image de fond</label>
                      <input ref={heroFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploaderImageHero} />
                      {heroForm.image_url ? (
                        <>
                          <img src={heroForm.image_url} alt="" style={{ width: "100%", height: 84, objectFit: "cover", borderRadius: 10, marginBottom: 7 }} />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="ak-btn ak-btn--ghost ak-btn--sm" disabled={heroUploading} onClick={() => heroFileRef.current?.click()}><i className="ti ti-replace"></i> {heroUploading ? "Upload…" : "Changer"}</button>
                            <button className="ak-btn ak-btn--danger-ghost ak-btn--sm ak-btn--icon" onClick={() => setHeroForm((f) => ({ ...f, image_url: "" }))} title="Retirer"><i className="ti ti-x"></i></button>
                          </div>
                        </>
                      ) : (
                        <>
                          <button className="ak-btn ak-btn--ghost" style={{ width: "100%", justifyContent: "center", flexDirection: "column", gap: 4, padding: "20px 0", border: "2px dashed var(--a-rule)", borderRadius: 10, marginBottom: 7, fontSize: 13 }} disabled={heroUploading} onClick={() => heroFileRef.current?.click()}>
                            <i className="ti ti-photo-up" style={{ fontSize: 22, color: "#94a3b8" }}></i>
                            <span>{heroUploading ? "Upload en cours…" : "Parcourir depuis le PC"}</span>
                          </button>
                          <input className="ak-input ak-input--sm" placeholder="ou coller une URL https://…" value={heroForm.image_url ?? ""} onChange={(e) => setHeroForm((f) => ({ ...f, image_url: e.target.value }))} />
                        </>
                      )}
                    </div>
                    <div className="ak-field">
                      <label className="ak-label">Vidéo <span style={{ color: "var(--a-ink-mute)", fontWeight: 400 }}>(optionnel)</span></label>
                      <input ref={heroVideoRef} type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: "none" }} onChange={uploaderVideoHero} />
                      {heroForm.video_url ? (
                        <>
                          <div style={{ width: "100%", height: 84, borderRadius: 10, overflow: "hidden", background: "#0f172a", marginBottom: 7, position: "relative" }}>
                            <video src={heroForm.video_url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 6, fontSize: 10, padding: "2px 8px" }}><i className="ti ti-video" style={{ marginRight: 4 }}></i>Vidéo</span>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="ak-btn ak-btn--ghost ak-btn--sm" disabled={heroVideoUploading} onClick={() => heroVideoRef.current?.click()}><i className="ti ti-replace"></i> {heroVideoUploading ? "Upload…" : "Changer"}</button>
                            <button className="ak-btn ak-btn--danger-ghost ak-btn--sm ak-btn--icon" onClick={() => setHeroForm((f) => ({ ...f, video_url: "" }))} title="Retirer"><i className="ti ti-x"></i></button>
                          </div>
                        </>
                      ) : (
                        <>
                          <button className="ak-btn ak-btn--ghost" style={{ width: "100%", justifyContent: "center", flexDirection: "column", gap: 4, padding: "20px 0", border: "2px dashed var(--a-rule)", borderRadius: 10, marginBottom: 7, fontSize: 13 }} disabled={heroVideoUploading} onClick={() => heroVideoRef.current?.click()}>
                            <i className="ti ti-video-plus" style={{ fontSize: 22, color: "#94a3b8" }}></i>
                            <span>{heroVideoUploading ? "Upload en cours…" : "Parcourir depuis le PC"}</span>
                          </button>
                          <input className="ak-input ak-input--sm" placeholder="ou coller une URL .mp4/.webm…" value={heroForm.video_url ?? ""} onChange={(e) => setHeroForm((f) => ({ ...f, video_url: e.target.value }))} />
                        </>
                      )}
                      <p style={{ fontSize: 11.5, color: "var(--a-ink-mute)", marginTop: 6 }}>Joue en boucle sur l&apos;image. Si non supportée, l&apos;image reste visible.</p>
                    </div>
                  </div>
                  <div className="ak-form-row">
                    {(["buy_href", "more_href"] as const).map((field) => (
                      <div key={field} className="ak-field">
                        <label className="ak-label">Lien bouton &quot;{field === "buy_href" ? "Acheter" : "En savoir plus"}&quot;</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input className="ak-input" placeholder="/boutique" value={heroForm[field]} onChange={(e) => setHeroForm((f) => ({ ...f, [field]: e.target.value }))} />
                          <select className="ak-input" style={{ maxWidth: 150, flexShrink: 0, cursor: "pointer", fontSize: 12 }} value="" onChange={(e) => { if (e.target.value) setHeroForm((f) => ({ ...f, [field]: e.target.value })); }}>
                            <option value="">Choisir…</option>
                            <optgroup label="Boutique"><option value="/boutique">Tous les produits</option></optgroup>
                            {categories.length > 0 && (<optgroup label="Catégories">{categories.map((c) => <option key={c.id} value={`/boutique?categorie=${c.id}`}>{c.name}</option>)}</optgroup>)}
                            {produits.length > 0 && (<optgroup label="Produits">{produits.map((p) => <option key={p.id} value={`/produit/${p.id}`}>{p.title}</option>)}</optgroup>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="ak-modal__footer">
              {!showHeroForm ? (
                <>
                  <button className="ak-btn ak-btn--ghost" onClick={() => { setShowHeroModal(false); }}>Fermer</button>
                  <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={() => { setHeroForm({ ...HERO_FORM_EMPTY }); setEditingSlideId(null); setShowHeroForm(true); }}>
                    <i className="ti ti-plus"></i> Ajouter un slide
                  </button>
                </>
              ) : (
                <>
                  <button className="ak-btn ak-btn--ghost" onClick={() => { setShowHeroForm(false); setEditingSlideId(null); setHeroForm({ ...HERO_FORM_EMPTY }); }}>← Retour</button>
                  <button className="ak-btn ak-btn--primary" onClick={async () => { await sauvegarderSlide(); setShowHeroForm(false); }}>
                    <i className="ti ti-device-floppy"></i> {editingSlideId ? "Enregistrer" : "Ajouter"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------- Modal Quoi de neuf ---------- */}
      {mounted && showWhatsNewModal && createPortal(
        <div className="ak-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowWhatsNewModal(false); }}>
          <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="ak-modal__header">
              <h2 className="ak-modal__title">
                <i className="ti ti-sparkles" style={{ marginRight: 8, color: "#10b981" }}></i>
                Quoi de neuf
              </h2>
              <button className="ak-modal__close" onClick={() => setShowWhatsNewModal(false)}>
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div className="ak-modal__body" style={{ overflowY: "auto", maxHeight: "70vh" }}>
              {(() => {
                const orderedWN = [...produits.filter((p) => p.whats_new)].sort((a, b) => a.whats_new_order - b.whats_new_order);
                if (orderedWN.length === 0) return (
                  <p style={{ color: "var(--a-ink-mute)", fontSize: 13, marginBottom: 14 }}>
                    Aucun produit épinglé — le dernier article de chaque catégorie s&apos;affiche automatiquement.
                  </p>
                );
                return (
                  <div style={{ marginBottom: 14 }}>
                    {orderedWN.map((p, idx) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--a-paper)", border: "1.5px solid #86efac", borderRadius: 11, marginBottom: 6 }}>
                        <select value={idx} onChange={(e) => deplacerWhatsNewVers(p.id, parseInt(e.target.value))} title="Changer la position" style={{ width: 58, padding: "5px 4px", borderRadius: 8, border: "1.5px solid #86efac", fontSize: 13, fontWeight: 800, color: "#10b981", background: "#f0fdf4", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                          {orderedWN.map((_, i) => <option key={i} value={i}>#{i + 1}</option>)}
                        </select>
                        {p.image_url
                          ? <img src={p.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                          : <span style={{ width: 44, height: 44, borderRadius: 9, background: "var(--a-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></span>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 2 }}>{p.price} DT</div>
                        </div>
                        <button className="ak-btn ak-btn--danger-ghost ak-btn--sm ak-btn--icon" onClick={() => toggleWhatsNew(p)} title="Retirer" style={{ flexShrink: 0 }}><i className="ti ti-trash"></i></button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <label className="ak-label" style={{ marginBottom: 8 }}>Ajouter un produit à épingler</label>
              <div style={{ position: "relative", maxWidth: 420 }}>
                <div style={{ position: "relative" }}>
                  <i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--a-ink-mute)", fontSize: 15, pointerEvents: "none" }}></i>
                  <input className="ak-input" style={{ paddingLeft: 34 }} placeholder="Rechercher un produit à épingler…" value={searchWhatsNew} onChange={(e) => { setSearchWhatsNew(e.target.value); setShowDropWhatsNew(true); }} onFocus={() => setShowDropWhatsNew(true)} onBlur={() => setTimeout(() => setShowDropWhatsNew(false), 180)} />
                </div>
                {showDropWhatsNew && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--a-paper)", border: "1.5px solid var(--a-rule)", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 240, overflowY: "auto" }}>
                    {produits.filter((p) => !searchWhatsNew || p.title.toLowerCase().includes(searchWhatsNew.toLowerCase())).map((p) => {
                      const pinned = p.whats_new;
                      return (
                        <button key={p.id} onMouseDown={(e) => { e.preventDefault(); toggleWhatsNew(p); setSearchWhatsNew(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", width: "100%", background: pinned ? "#f0fdf4" : "transparent", border: "none", borderBottom: "1px solid var(--a-rule)", cursor: "pointer", textAlign: "left" }}>
                          {p.image_url
                            ? <img src={p.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                            : <span style={{ width: 36, height: 36, borderRadius: 8, background: "var(--a-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></span>}
                          <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "var(--a-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                          <span style={{ fontSize: 12, color: "var(--a-ink-mute)", flexShrink: 0 }}>{p.price} DT</span>
                          {pinned && <i className="ti ti-check" style={{ color: "#10b981", fontSize: 15, flexShrink: 0 }}></i>}
                        </button>
                      );
                    })}
                    {produits.filter((p) => !searchWhatsNew || p.title.toLowerCase().includes(searchWhatsNew.toLowerCase())).length === 0 && (
                      <p style={{ textAlign: "center", color: "var(--a-ink-mute)", padding: "16px 0", fontSize: 13 }}>Aucun produit trouvé</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setShowWhatsNewModal(false)}>Fermer</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------- Modal édition section ---------- */}
      {mounted && showSectionModal && editingSection && (() => {
        const s = editingSection;
        const meta = SECTION_META[s.section];
        const f = sectionForms[s.id] ?? { title: "", tagline: "", cta_label: "", cta_href: "" };
        const _modal = (<div className="ak-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowSectionModal(false); }}>
            <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()}>
              <div className="ak-modal__header">
                <h2 className="ak-modal__title">
                  <i className={`ti ${meta.icon}`} style={{ marginRight: 8, color: "#6366f1" }}></i>
                  {meta.label}
                </h2>
                <button className="ak-modal__close" onClick={() => setShowSectionModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
              </div>

              <div className="ak-modal__body" style={{ overflowY: "auto", maxHeight: "70vh" }}>
                {/* Textes */}
                <div className="ak-form-row">
                  <div className="ak-field">
                    <label className="ak-label">Titre</label>
                    <input className="ak-input" value={f.title} onChange={(e) => setSectionForms({ ...sectionForms, [s.id]: { ...f, title: e.target.value } })} />
                  </div>
                  <div className="ak-field">
                    <label className="ak-label">Phrase d&apos;accroche</label>
                    <input className="ak-input" value={f.tagline} onChange={(e) => setSectionForms({ ...sectionForms, [s.id]: { ...f, tagline: e.target.value } })} />
                  </div>
                </div>
                <div className="ak-form-row" style={{ marginBottom: 18 }}>
                  <div className="ak-field">
                    <label className="ak-label">Texte du bouton</label>
                    <input className="ak-input" value={f.cta_label} onChange={(e) => setSectionForms({ ...sectionForms, [s.id]: { ...f, cta_label: e.target.value } })} />
                  </div>
                  <div className="ak-field">
                    <label className="ak-label">Lien du bouton (catégorie cible)</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="ak-input" placeholder="/boutique" value={f.cta_href} onChange={(e) => setSectionForms({ ...sectionForms, [s.id]: { ...f, cta_href: e.target.value } })} />
                      {categories.length > 0 && (
                        <select className="ak-input" style={{ maxWidth: 160, flexShrink: 0, cursor: "pointer" }} value="" onChange={(e) => { if (e.target.value) setSectionForms({ ...sectionForms, [s.id]: { ...f, cta_href: `/boutique?categorie=${e.target.value}` } }); }}>
                          <option value="">Catégorie…</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Articles soldés — section solde uniquement */}
                {s.section === "solde" && (() => {
                  const soldes = articulesEnSolde;
                  const orderedSoldes = [...articulesEnSolde.filter((p) => p.solde_hero)].sort((a, b) => a.solde_hero_order - b.solde_hero_order);
                  return (
                    <div style={{ marginBottom: 18, padding: "14px 16px", background: "#fff1f2", borderRadius: 12, border: "1px solid #fecdd3" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        <span className="ak-label" style={{ margin: 0 }}>
                          <i className="ti ti-discount-2" style={{ marginRight: 5, color: "#f43f5e" }}></i>
                          Articles soldés dans le slider{" "}
                          <span style={{ color: "#94a3b8", fontWeight: 500 }}>({orderedSoldes.length} sélectionné{orderedSoldes.length > 1 ? "s" : ""}) — leur image/vidéo alimente le slider</span>
                        </span>
                        <a href="/admin/soldes" style={{ color: "#6366f1", fontWeight: 600, fontSize: 12 }}>Gérer les remises →</a>
                      </div>
                      {orderedSoldes.length === 0 ? (
                        <p style={{ color: "#9f1239", fontSize: 13, margin: "0 0 10px" }}>Aucun article sélectionné — utilisez la liste ci-dessous.</p>
                      ) : (
                        <div style={{ marginBottom: 12 }}>
                          {orderedSoldes.map((p, idx) => {
                            const pct = p.compare_price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
                            return (
                              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#fff", border: "1.5px solid #fca5a5", borderRadius: 11, marginBottom: 6 }}>
                                <select value={idx} onChange={(e) => deplacerSoldeVers(p.id, parseInt(e.target.value))} title="Changer la position" style={{ width: 58, padding: "5px 4px", borderRadius: 8, border: "1.5px solid #fecdd3", fontSize: 13, fontWeight: 800, color: "#f43f5e", background: "#fff1f2", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                                  {orderedSoldes.map((_, i) => <option key={i} value={i}>#{i + 1}</option>)}
                                </select>
                                {p.image_url
                                  ? <img src={p.image_url} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                                  : <span style={{ width: 44, height: 44, borderRadius: 9, background: "#fef2f2", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#fca5a5" }}></i></span>}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                                  <div style={{ fontSize: 12, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, color: "#f43f5e" }}>{p.price} DT</span>
                                    <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>{p.compare_price} DT</span>
                                    <span className="ak-badge ak-badge--danger" style={{ fontSize: 10 }}>-{pct}%</span>
                                  </div>
                                </div>
                                <button className="ak-btn ak-btn--danger-ghost ak-btn--sm ak-btn--icon" onClick={() => toggleSoldeAffiche(p)} title="Retirer" style={{ flexShrink: 0 }}><i className="ti ti-trash"></i></button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {produits.length === 0 ? (
                        <p style={{ color: "#9f1239", fontSize: 13, margin: 0 }}>Aucun produit publié — <a href="/admin/produits" style={{ color: "#6366f1", fontWeight: 600 }}>créer des produits</a>.</p>
                      ) : (
                        <div style={{ position: "relative", maxWidth: 440 }}>
                          <div style={{ position: "relative" }}>
                            <i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--a-ink-mute)", fontSize: 15, pointerEvents: "none" }}></i>
                            <input
                              className="ak-input"
                              style={{ paddingLeft: 34, borderColor: "#fecdd3" }}
                              placeholder="Rechercher un produit à ajouter…"
                              value={searchSolde}
                              onChange={(e) => { setSearchSolde(e.target.value); setShowDropSolde(true); }}
                              onFocus={() => setShowDropSolde(true)}
                              onBlur={() => setTimeout(() => setShowDropSolde(false), 180)}
                            />
                          </div>
                          {showDropSolde && (
                            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--a-paper)", border: "1.5px solid var(--a-rule)", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.14)", zIndex: 60, maxHeight: 260, overflowY: "auto" }}>
                              {produits
                                .filter((p) => !searchSolde || p.title.toLowerCase().includes(searchSolde.toLowerCase()))
                                .map((p) => {
                                  const dejaDedans = articulesEnSolde.some((s) => s.id === p.id && s.solde_hero);
                                  const pct = p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
                                  return (
                                    <button
                                      key={p.id}
                                      onMouseDown={(e) => { e.preventDefault(); if (!dejaDedans) { toggleSoldeAffiche(p); setSearchSolde(""); setShowDropSolde(false); } }}
                                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", width: "100%", background: dejaDedans ? "#fff1f2" : "transparent", border: "none", borderBottom: "1px solid var(--a-rule)", cursor: dejaDedans ? "default" : "pointer", textAlign: "left" }}
                                    >
                                      {p.image_url
                                        ? <img src={p.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                                        : <span style={{ width: 36, height: 36, borderRadius: 8, background: "var(--a-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></span>}
                                      <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "var(--a-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                                      <span style={{ fontSize: 12, color: "var(--a-ink-mute)", flexShrink: 0 }}>{p.price} DT</span>
                                      {pct > 0 && <span className="ak-badge ak-badge--danger" style={{ fontSize: 10, flexShrink: 0 }}>-{pct}%</span>}
                                      {dejaDedans && <i className="ti ti-check" style={{ color: "#f43f5e", fontSize: 15, flexShrink: 0 }}></i>}
                                    </button>
                                  );
                                })}
                              {produits.filter((p) => !searchSolde || p.title.toLowerCase().includes(searchSolde.toLowerCase())).length === 0 && (
                                <p style={{ textAlign: "center", color: "var(--a-ink-mute)", padding: "16px 0", fontSize: 13 }}>Aucun produit trouvé</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Médias */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <label className="ak-label" style={{ margin: 0, flex: 1 }}>
                    Médias <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                      ({s.home_section_media.length}) — {s.section === "solde" ? "image ou vidéo de la bannière (prioritaire sur les images produits)" : "images ou vidéos, affichés en carrousel"}
                    </span>
                  </label>
                  {s.section === "solde" && s.home_section_media.some((m) => m.banner_visible === false) && (
                    <button
                      className="ak-btn ak-btn--ghost ak-btn--sm"
                      onClick={() => reinitialiserBannersVisibles(s)}
                      title="Remettre tous les médias en visible"
                      style={{ color: "#22c55e", borderColor: "#22c55e", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      <i className="ti ti-eye"></i> Tout afficher
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {s.home_section_media.map((m, idx) => (
                    <div key={m.id} style={{ width: s.section === "solde" ? 200 : 150, border: "1px solid #e2e8f0", borderRadius: 10, padding: 5, background: "#fff" }}>
                      <div style={{ height: 84, borderRadius: 7, overflow: "hidden", background: "#f1f5f9", position: "relative" }}>
                        {m.media_type === "video"
                          ? <video src={m.url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        <span className="ak-badge ak-badge--dot" style={{ position: "absolute", top: 5, left: 5, background: m.media_type === "video" ? "#1e293b" : "#e2e8f0", color: m.media_type === "video" ? "#fff" : "#334155", fontSize: 10, padding: "2px 8px" }}>
                          {m.media_type === "video" ? "Vidéo" : "Image"}
                        </span>
                        {/* Badge visible/masquée pour section solde */}
                        {s.section === "solde" && m.banner_visible === false && (
                          <span style={{ position: "absolute", bottom: 5, right: 5, background: "#f43f5e", color: "#fff", fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 700 }}>
                            MASQUÉE
                          </span>
                        )}
                      </div>
                      {/* Titre de la bannière si configuré */}
                      {s.section === "solde" && (m.banner_title || m.banner_label) && (
                        <div style={{ padding: "4px 6px", fontSize: 10, color: "#475569", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.banner_title || m.banner_label}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
                        <button className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon" disabled={idx === 0} style={idx === 0 ? { opacity: 0.35, cursor: "default" } : undefined} onClick={() => deplacerMedia(s, m, -1)} title="Avancer">
                          <i className="ti ti-chevron-left" style={{ fontSize: 14 }}></i>
                        </button>
                        <button className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon" disabled={idx === s.home_section_media.length - 1} style={idx === s.home_section_media.length - 1 ? { opacity: 0.35, cursor: "default" } : undefined} onClick={() => deplacerMedia(s, m, 1)} title="Reculer">
                          <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
                        </button>
                        {/* Bouton config bannière — section solde uniquement */}
                        {s.section === "solde" && (
                          <button
                            className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon"
                            onClick={() => setBannerEdit({
                              media: m,
                              label:    m.banner_label    ?? "",
                              title:    m.banner_title    ?? "",
                              sub:      m.banner_sub      ?? "",
                              cta:      m.banner_cta      ?? "Voir",
                              cta_href: m.banner_cta_href ?? "/boutique?soldes=1",
                              visible:  m.banner_visible  !== false,
                            })}
                            title="Configurer la bannière"
                            style={{ color: "#6366f1" }}
                          >
                            <i className="ti ti-settings" style={{ fontSize: 14 }}></i>
                          </button>
                        )}
                        <button className="ak-btn ak-btn--danger ak-btn--sm ak-btn--icon" onClick={() => supprimerMedia(m)} title="Supprimer">
                          <i className="ti ti-trash" style={{ fontSize: 14 }}></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {s.home_section_media.length === 0 && (
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>Aucun média — la bannière affichera un fond vide.</span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <input id={`media-upload-modal-${s.id}`} type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime" style={{ display: "none" }} disabled={uploadingId === s.id} onChange={(e) => uploaderMedia(s, e)} />
                  <label htmlFor={uploadingId === s.id ? undefined : `media-upload-modal-${s.id}`} className="ak-btn ak-btn--ghost ak-btn--sm" style={{ cursor: uploadingId === s.id ? "not-allowed" : "pointer", opacity: uploadingId === s.id ? 0.6 : 1 }}>
                    <i className="ti ti-upload"></i>
                    {uploadingId === s.id ? "Upload en cours..." : "Uploader image / vidéo"}
                  </label>
                  <div style={{ display: "flex", gap: 6, flex: "1 1 280px", maxWidth: 440 }}>
                    <input className="ak-input" style={{ padding: "6px 12px", fontSize: 12.5 }} placeholder="ou coller une URL (mp4, webm, jpg, png...)" value={urlInputs[s.id] ?? ""} onChange={(e) => setUrlInputs({ ...urlInputs, [s.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && ajouterParUrl(s)} />
                    <button className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => ajouterParUrl(s)}>
                      <i className="ti ti-plus"></i> Ajouter
                    </button>
                  </div>
                </div>

                {/* Produits mis en avant — section suggestion uniquement */}
                {s.section === "suggestion" && (() => {
                  const orderedFeatured = [...produits.filter((p) => p.featured)].sort((a, b) => a.featured_order - b.featured_order);
                  return (
                    <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1.5px solid var(--a-rule)" }}>
                      <label className="ak-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <i className="ti ti-sparkles" style={{ color: "#6366f1" }}></i>
                        Produits à afficher sous cette bannière
                        <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                          — {orderedFeatured.length > 0 ? `${orderedFeatured.length} sélectionné${orderedFeatured.length > 1 ? "s" : ""}` : "aucun"}
                        </span>
                      </label>
                      {orderedFeatured.length > 0 && (
                        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10, marginBottom: 14, scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                          {orderedFeatured.map((p, idx) => (
                            <div key={p.id} style={{ minWidth: 130, maxWidth: 130, background: "var(--a-paper)", border: "1.5px solid var(--a-rule)", borderRadius: 12, padding: 8, flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                              <select value={idx} onChange={(e) => deplacerFeaturedVers(p.id, parseInt(e.target.value))} title="Changer la position" style={{ width: "100%", padding: "3px 4px", borderRadius: 6, border: "1.5px solid var(--a-rule)", fontSize: 11, fontWeight: 800, color: "#6366f1", background: "#f5f3ff", cursor: "pointer", textAlign: "center" }}>
                                {orderedFeatured.map((_, i) => <option key={i} value={i}>#{i + 1}</option>)}
                              </select>
                              {p.image_url
                                ? <img src={p.image_url} alt="" style={{ width: "100%", height: 86, objectFit: "cover", borderRadius: 8 }} />
                                : <span style={{ width: "100%", height: 86, background: "var(--a-bg)", borderRadius: 8, display: "grid", placeItems: "center" }}><i className="ti ti-photo" style={{ color: "#94a3b8", fontSize: 22 }}></i></span>}
                              <div style={{ fontWeight: 700, fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                              <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>{p.price} DT</div>
                              <button className="ak-btn ak-btn--danger-ghost ak-btn--sm" style={{ fontSize: 11, padding: "3px 0", width: "100%" }} onClick={() => toggleFeatured(p.id, true)}>
                                <i className="ti ti-x"></i> Retirer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {orderedFeatured.length === 0 && (
                        <p style={{ color: "var(--a-ink-mute)", fontSize: 13, marginBottom: 12 }}>Aucun produit sélectionné — utilisez la liste ci-dessous pour en ajouter.</p>
                      )}
                      <select className="ak-input" style={{ maxWidth: 340, cursor: "pointer" }} value="" onChange={(e) => { const id = e.target.value; if (!id) return; const p = produits.find((pr) => pr.id === id); if (p) toggleFeatured(p.id, false); }}>
                        <option value="">+ Ajouter un produit…</option>
                        {categories.map((cat) => {
                          const opts = produits.filter((p) => p.category_id === cat.id && !p.featured);
                          if (opts.length === 0) return null;
                          return (<optgroup key={cat.id} label={cat.name}>{opts.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.price} DT</option>)}</optgroup>);
                        })}
                        {(() => {
                          const catIds = new Set(categories.map((c) => c.id));
                          const sans = produits.filter((p) => (!p.category_id || !catIds.has(p.category_id)) && !p.featured);
                          if (sans.length === 0) return null;
                          return (<optgroup label="Sans catégorie">{sans.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.price} DT</option>)}</optgroup>);
                        })()}
                      </select>
                    </div>
                  );
                })()}
              </div>

              <div className="ak-modal__footer">
                <button className="ak-btn ak-btn--ghost" onClick={() => setShowSectionModal(false)}>Fermer</button>
                <button className="ak-btn ak-btn--primary" onClick={() => sauvegarderSection(s)}>
                  <i className="ti ti-device-floppy"></i> Enregistrer
                </button>
              </div>
            </div>
          </div>
        );
        return createPortal(_modal, document.body);
      })()}

      {/* ── Modal configuration bannière (section solde) ── */}
      {bannerEdit && mounted && createPortal(
        <div className="ak-modal-backdrop" onClick={() => setBannerEdit(null)}>
          <div className="ak-modal ak-modal--lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">
                <i className="ti ti-layout-bottombar" style={{ marginRight: 8, color: "#6366f1" }}></i>
                Configurer la bannière
              </h3>
              <button className="ak-modal__close" onClick={() => setBannerEdit(null)}>✕</button>
            </div>
            <div className="ak-modal__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Preview live */}
              <div style={{ position: "relative", height: 130, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                {bannerEdit.media.media_type === "video"
                  ? <video src={bannerEdit.media.url} muted loop playsInline autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <img src={bannerEdit.media.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "14px 18px", gap: 2 }}>
                  <span style={{ fontSize: 10, color: "#f43f5e", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>{bannerEdit.label || "ÉTIQUETTE"}</span>
                  <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>{bannerEdit.title || "Titre principal"}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0 }}>{bannerEdit.sub || "Sous-titre"}</p>
                  {bannerEdit.cta && <span style={{ marginTop: 6, display: "inline-flex", width: "fit-content", padding: "5px 14px", background: "#fff", color: "#0f172a", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{bannerEdit.cta}</span>}
                </div>
              </div>

              {/* Toggle visible */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => setBannerEdit({ ...bannerEdit, visible: !bannerEdit.visible })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: bannerEdit.visible ? "#22c55e" : "#e2e8f0", position: "relative", transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, left: bannerEdit.visible ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                  {bannerEdit.visible ? "✅ Bannière visible sur le site" : "🚫 Bannière masquée"}
                </span>
              </div>

              {/* Étiquette + Titre */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <div className="ak-field">
                  <label className="ak-label">Étiquette <span style={{ color: "#94a3b8", fontSize: 10 }}>(petit texte)</span></label>
                  <input className="ak-input" value={bannerEdit.label} placeholder="SOLDES EN COURS"
                    onChange={(e) => setBannerEdit({ ...bannerEdit, label: e.target.value })} />
                </div>
                <div className="ak-field">
                  <label className="ak-label">Titre principal</label>
                  <input className="ak-input" value={bannerEdit.title} placeholder="Jusqu'à -50%"
                    onChange={(e) => setBannerEdit({ ...bannerEdit, title: e.target.value })} />
                </div>
              </div>

              {/* Sous-titre */}
              <div className="ak-field">
                <label className="ak-label">Sous-titre</label>
                <input className="ak-input" value={bannerEdit.sub} placeholder="Sur une sélection d'articles"
                  onChange={(e) => setBannerEdit({ ...bannerEdit, sub: e.target.value })} />
              </div>

              {/* Bouton CTA */}
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12 }}>
                <div className="ak-field">
                  <label className="ak-label">Texte du bouton</label>
                  <input className="ak-input" value={bannerEdit.cta} placeholder="Profiter"
                    onChange={(e) => setBannerEdit({ ...bannerEdit, cta: e.target.value })} />
                </div>
                <div className="ak-field">
                  <label className="ak-label">Lien du bouton</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      className="ak-input"
                      style={{ flex: 1 }}
                      value={QUICK_HREFS.includes(bannerEdit.cta_href) ? bannerEdit.cta_href : "__custom"}
                      onChange={(e) => {
                        if (e.target.value !== "__custom") setBannerEdit({ ...bannerEdit, cta_href: e.target.value });
                        else setBannerEdit({ ...bannerEdit, cta_href: "" });
                      }}
                    >
                      <option value="/boutique?soldes=1">🏷️ Articles en solde</option>
                      <option value="/boutique">🛍️ Toute la boutique</option>
                      <option value="/boutique?nouveautes=1">✨ Quoi de neuf</option>
                      <option value="/">🏠 Page d&apos;accueil</option>
                      {categories.map((c) => (
                        <option key={c.id} value={`/boutique?categorie=${c.id}`}>📂 {c.name}</option>
                      ))}
                      <option value="__custom">✏️ URL personnalisée…</option>
                    </select>
                    {!QUICK_HREFS.includes(bannerEdit.cta_href) && (
                      <input
                        className="ak-input"
                        style={{ maxWidth: 160 }}
                        value={bannerEdit.cta_href}
                        placeholder="/ma-page"
                        onChange={(e) => setBannerEdit({ ...bannerEdit, cta_href: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setBannerEdit(null)}>Annuler</button>
              <button className="ak-btn ak-btn--primary" onClick={sauvegarderBanner}>
                <i className="ti ti-check"></i> Enregistrer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal confirmation universelle (slide / média) ── */}
      {confirmAction && mounted && createPortal(
        <div className="ak-modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="ak-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="ak-modal__header">
              <h3 className="ak-modal__title">
                <i className="ti ti-alert-triangle" style={{ marginRight: 8, color: "#f43f5e" }}></i>
                {confirmAction.title}
              </h3>
              <button className="ak-modal__close" onClick={() => setConfirmAction(null)}>✕</button>
            </div>
            <div className="ak-modal__body">
              <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>{confirmAction.message}</p>
              {confirmAction.detail && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff1f2", borderRadius: 10, borderLeft: "3px solid #f43f5e", fontSize: 13, color: "#9f1239" }}>
                  {confirmAction.detail}
                </div>
              )}
            </div>
            <div className="ak-modal__footer">
              <button className="ak-btn ak-btn--ghost" onClick={() => setConfirmAction(null)}>Annuler</button>
              <button className="ak-btn ak-btn--danger" onClick={confirmAction.onConfirm}>
                <i className={`ti ${confirmAction.confirmIcon ?? "ti-trash"}`}></i>
                {" "}{confirmAction.confirmLabel ?? "Supprimer"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
