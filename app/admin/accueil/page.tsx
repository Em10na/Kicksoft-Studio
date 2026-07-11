"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Categorie = { id: string; name: string };

type Produit = {
  id: string;
  title: string;
  price: number;
  featured: boolean;
  status: string;
  compare_price: number | null;
  solde_hero: boolean;
  image_url: string | null;
};

type SectionMedia = {
  id: string;
  section_id: string;
  media_type: "image" | "video";
  url: string;
  poster_url: string | null;
  display_order: number;
};

type HomeSection = {
  id: string;
  section: "suggestion" | "recommandation" | "solde";
  title: string;
  tagline: string | null;
  cta_label: string | null;
  cta_href: string | null;
  visible: boolean;
  home_section_media: SectionMedia[];
};

type SectionForm = { title: string; tagline: string; cta_label: string; cta_href: string };

const SECTION_META: Record<HomeSection["section"], { label: string; desc: string; icon: string }> = {
  suggestion: { label: "Suggestions", desc: "Bannière au-dessus des produits vedettes", icon: "ti-bulb" },
  recommandation: { label: "Recommandation", desc: "Grande vidéo pleine largeur", icon: "ti-thumb-up" },
  solde: { label: "Articles en solde", desc: "Bannière + produits en promotion", icon: "ti-discount-2" },
};
const SECTION_ORDER: HomeSection["section"][] = ["suggestion", "recommandation", "solde"];

const BUCKET = "media";

function estVideo(nomOuUrl: string, mime?: string): boolean {
  if (mime) return mime.startsWith("video/");
  return /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(nomOuUrl);
}

export default function AccueilPage() {
  const supabase = createClient();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [whatsnewIds, setWhatsnewIds] = useState<Set<string>>(new Set());
  const [whatsnewDispo, setWhatsnewDispo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [searchFeatured, setSearchFeatured] = useState("");
  const [showDropFeatured, setShowDropFeatured] = useState(false);
  const [searchWhatsNew, setSearchWhatsNew] = useState("");
  const [showDropWhatsNew, setShowDropWhatsNew] = useState(false);

  // Sections média (suggestion / recommandation / solde)
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [sectionsDispo, setSectionsDispo] = useState(true);
  const [sectionForms, setSectionForms] = useState<Record<string, SectionForm>>({});
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  function notifier(message: string, type: "success" | "danger" | "warning" = "success") {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function chargerProduits() {
    const { data } = await supabase
      .from("products")
      .select("id, title, price, featured, status, compare_price, solde_hero, image_url")
      .eq("status", "published")
      .order("title", { ascending: true });
    setProduits(data ?? []);
  }

  async function chargerSections() {
    const { data, error } = await supabase.from("home_sections").select("*, home_section_media(*)");
    if (error) {
      // Table absente tant que la migration v5 n'a pas été exécutée
      setSectionsDispo(false);
      return;
    }
    setSectionsDispo(true);
    const tri = (data ?? []).map((s: HomeSection) => ({
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
  }

  async function chargerCategories() {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data ?? []);
  }

  async function chargerWhatsNew() {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("status", "published")
      .eq("whats_new", true);
    if (error) { setWhatsnewDispo(false); return; }
    setWhatsnewDispo(true);
    setWhatsnewIds(new Set((data ?? []).map((p: { id: string }) => p.id)));
  }

  async function toggleWhatsNew(produitId: string) {
    const actuel = whatsnewIds.has(produitId);
    const { error } = await supabase.from("products").update({ whats_new: !actuel }).eq("id", produitId);
    if (error) { notifier("Erreur : " + error.message, "danger"); return; }
    notifier(!actuel ? `Produit épinglé dans « Quoi de neuf » !` : `Produit retiré de « Quoi de neuf ».`);
    chargerWhatsNew();
  }

  useEffect(() => {
    Promise.all([chargerProduits(), chargerSections(), chargerCategories(), chargerWhatsNew()]).then(() => setLoading(false));
  }, []);

  async function toggleFeatured(produitId: string, actuel: boolean) {
    const { error } = await supabase.from("products").update({ featured: !actuel }).eq("id", produitId);
    if (error) {
      notifier("Erreur : " + error.message, "danger");
    } else {
      notifier(!actuel ? "Produit mis en avant !" : "Produit retiré de la mise en avant.");
      chargerProduits();
    }
  }

  // Articles soldés affichés sur l'accueil (bannière solde + slider du haut)
  async function toggleSoldeAffiche(p: Produit) {
    const { error } = await supabase.from("products").update({ solde_hero: !p.solde_hero }).eq("id", p.id);
    if (error) {
      notifier("Erreur : " + error.message, "danger");
    } else {
      notifier(!p.solde_hero
        ? `« ${p.title} » affiché sur l'accueil (sa vidéo ou son image alimente la bannière et le slider).`
        : `« ${p.title} » retiré de l'accueil.`);
      chargerProduits();
    }
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
      if (error) {
        notifier("Upload échoué : " + error.message, "danger");
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(nom);
      await ajouterMedia(s, data.publicUrl, estVideo(file.name, file.type) ? "video" : "image");
    }
    setUploadingId(null);
    const input = fileInputs.current[s.id];
    if (input) input.value = "";
  }

  async function ajouterParUrl(s: HomeSection) {
    const url = (urlInputs[s.id] ?? "").trim();
    if (!url) return;
    await ajouterMedia(s, url, estVideo(url) ? "video" : "image");
    setUrlInputs((prev) => ({ ...prev, [s.id]: "" }));
  }

  async function supprimerMedia(m: SectionMedia) {
    if (!confirm("Supprimer ce média de la section ?")) return;
    const { error } = await supabase.from("home_section_media").delete().eq("id", m.id);
    if (error) notifier("Erreur : " + error.message, "danger");
    else {
      notifier("Média supprimé.");
      chargerSections();
    }
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

  if (loading) {
    return <p style={{ color: "#94a3b8", padding: 24 }}>Chargement...</p>;
  }

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

      {/* ---------- Sections média ---------- */}
      {!sectionsDispo ? (
        <div className="ak-alert ak-alert--warning" style={{ marginBottom: 20 }}>
          <i className="ti ti-alert-circle"></i> Les tables des sections média n&apos;existent pas encore —
          exécutez <code>supabase/migration-v5-home-sections.sql</code> dans le SQL Editor de Supabase puis rechargez.
        </div>
      ) : (
        sections.map((s) => {
          const meta = SECTION_META[s.section];
          const f = sectionForms[s.id] ?? { title: "", tagline: "", cta_label: "", cta_href: "" };
          return (
            <div key={s.id} className="ak-card" style={{ marginBottom: 20 }}>
              <div className="ak-card__header">
                <div>
                  <h3 className="ak-card__title">
                    <i className={`ti ${meta.icon}`} style={{ marginRight: 6, color: "#6366f1" }}></i>
                    {meta.label}{" "}
                    {!s.visible && <span className="ak-badge ak-badge--muted" style={{ marginLeft: 6 }}>Masquée</span>}
                  </h3>
                  <p className="ak-card__subtitle">{meta.desc}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={`ak-btn ak-btn--sm ${s.visible ? "ak-btn--ghost" : "ak-btn--danger"}`}
                    onClick={() => toggleVisible(s)}
                    title={s.visible ? "Cliquer pour masquer la section sur la boutique" : "Cliquer pour afficher la section sur la boutique"}
                  >
                    <i className={`ti ${s.visible ? "ti-eye" : "ti-eye-off"}`}></i>
                    {s.visible ? "Visible" : "Masquée"}
                  </button>
                  <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={() => sauvegarderSection(s)}>
                    <i className="ti ti-device-floppy"></i> Enregistrer
                  </button>
                </div>
              </div>
              <div className="ak-card__body">
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
                <div className="ak-form-row">
                  <div className="ak-field">
                    <label className="ak-label">Texte du bouton</label>
                    <input className="ak-input" value={f.cta_label} onChange={(e) => setSectionForms({ ...sectionForms, [s.id]: { ...f, cta_label: e.target.value } })} />
                  </div>
                  <div className="ak-field">
                    <label className="ak-label">Lien du bouton (catégorie cible)</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="ak-input" placeholder="/boutique" value={f.cta_href} onChange={(e) => setSectionForms({ ...sectionForms, [s.id]: { ...f, cta_href: e.target.value } })} />
                      {categories.length > 0 && (
                        <select
                          className="ak-input"
                          style={{ maxWidth: 170, flexShrink: 0, cursor: "pointer" }}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) setSectionForms({ ...sectionForms, [s.id]: { ...f, cta_href: `/boutique?categorie=${e.target.value}` } });
                          }}
                        >
                          <option value="">Catégorie…</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sélection des articles soldés (section solde uniquement) */}
                {s.section === "solde" && (() => {
                  const soldes = produits.filter((p) => p.compare_price && p.compare_price > p.price);
                  const affiches = soldes.filter((p) => p.solde_hero).length;
                  return (
                    <div style={{ marginBottom: 18, padding: "14px 16px", background: "#fff1f2", borderRadius: 12, border: "1px solid #fecdd3" }}>
                      <label className="ak-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <span>
                          <i className="ti ti-discount-2" style={{ marginRight: 5, color: "#f43f5e" }}></i>
                          Articles soldés affichés sur l&apos;accueil
                          <span style={{ color: "#94a3b8", fontWeight: 500 }}> ({affiches} sélectionné{affiches > 1 ? "s" : ""}) — leur vidéo ou image alimente la bannière et le slider du haut</span>
                        </span>
                        <a href="/admin/soldes" style={{ color: "#6366f1", fontWeight: 600, fontSize: 12 }}>Gérer les remises & notifications →</a>
                      </label>
                      {soldes.length === 0 ? (
                        <p style={{ color: "#9f1239", fontSize: 13, margin: "6px 0 0" }}>
                          Aucun article en solde pour le moment — créez une remise depuis{" "}
                          <a href="/admin/soldes" style={{ color: "#6366f1", fontWeight: 600 }}>la page Soldes</a>.
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                          {soldes.map((p) => {
                            const pct = Math.round((1 - p.price / (p.compare_price as number)) * 100);
                            return (
                              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#fff", borderRadius: 10, border: `1px solid ${p.solde_hero ? "#f43f5e" : "#e2e8f0"}`, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={p.solde_hero}
                                  onChange={() => toggleSoldeAffiche(p)}
                                  style={{ width: 17, height: 17, accentColor: "#f43f5e", cursor: "pointer", flexShrink: 0 }}
                                />
                                {p.image_url
                                  ? <img src={p.image_url} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                                  : <span style={{ width: 34, height: 34, borderRadius: 8, background: "#f1f5f9", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></span>}
                                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {p.title}
                                </span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>{p.price} DT</span>
                                <span style={{ fontSize: 11.5, color: "#94a3b8", textDecoration: "line-through", flexShrink: 0 }}>{p.compare_price} DT</span>
                                <span className="ak-badge ak-badge--danger" style={{ flexShrink: 0 }}>-{pct}%</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Médias */}
                <label className="ak-label">
                  Médias <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                    ({s.home_section_media.length}) — images ou vidéos, affichés en carrousel
                    {s.section === "solde" && " (utilisés seulement si aucun article soldé n'est sélectionné ci-dessus)"}
                  </span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {s.home_section_media.map((m, idx) => (
                    <div key={m.id} style={{ width: 150, border: "1px solid #e2e8f0", borderRadius: 10, padding: 5, background: "#fff" }}>
                      <div style={{ height: 84, borderRadius: 7, overflow: "hidden", background: "#f1f5f9", position: "relative" }}>
                        {m.media_type === "video" ? (
                          <video src={m.url} muted preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                        <span
                          className="ak-badge ak-badge--dot"
                          style={{
                            position: "absolute", top: 5, left: 5,
                            background: m.media_type === "video" ? "#1e293b" : "#e2e8f0",
                            color: m.media_type === "video" ? "#fff" : "#334155",
                            fontSize: 10, padding: "2px 8px",
                          }}
                        >
                          {m.media_type === "video" ? "Vidéo" : "Image"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 6 }}>
                        <button
                          className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon"
                          disabled={idx === 0}
                          style={idx === 0 ? { opacity: 0.35, cursor: "default" } : undefined}
                          onClick={() => deplacerMedia(s, m, -1)}
                          title="Avancer"
                        >
                          <i className="ti ti-chevron-left" style={{ fontSize: 14 }}></i>
                        </button>
                        <button
                          className="ak-btn ak-btn--ghost ak-btn--sm ak-btn--icon"
                          disabled={idx === s.home_section_media.length - 1}
                          style={idx === s.home_section_media.length - 1 ? { opacity: 0.35, cursor: "default" } : undefined}
                          onClick={() => deplacerMedia(s, m, 1)}
                          title="Reculer"
                        >
                          <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
                        </button>
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

                {/* Ajout de médias */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <input
                    ref={(el) => {
                      fileInputs.current[s.id] = el;
                    }}
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    style={{ display: "none" }}
                    onChange={(e) => uploaderMedia(s, e)}
                  />
                  <button
                    className="ak-btn ak-btn--ghost ak-btn--sm"
                    disabled={uploadingId === s.id}
                    onClick={() => fileInputs.current[s.id]?.click()}
                  >
                    <i className="ti ti-upload"></i>
                    {uploadingId === s.id ? "Upload en cours..." : "Uploader image / vidéo"}
                  </button>
                  <div style={{ display: "flex", gap: 6, flex: "1 1 280px", maxWidth: 440 }}>
                    <input
                      className="ak-input"
                      style={{ padding: "6px 12px", fontSize: 12.5 }}
                      placeholder="ou coller une URL (mp4, webm, jpg, png...)"
                      value={urlInputs[s.id] ?? ""}
                      onChange={(e) => setUrlInputs({ ...urlInputs, [s.id]: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && ajouterParUrl(s)}
                    />
                    <button className="ak-btn ak-btn--ghost ak-btn--sm" onClick={() => ajouterParUrl(s)}>
                      <i className="ti ti-plus"></i> Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* ---------- Produits mis en avant ---------- */}
      <div className="ak-card">
        <div className="ak-card__header">
          <div>
            <h3 className="ak-card__title">
              <i className="ti ti-sparkles" style={{ marginRight: 6, color: "#6366f1" }}></i>
              Produits mis en avant{" "}
              <span className="ak-count-badge" style={{ marginLeft: 6 }}>
                {produits.filter((p) => p.featured).length} sélectionné{produits.filter((p) => p.featured).length > 1 ? "s" : ""}
              </span>
            </h3>
            <p className="ak-card__subtitle">Affichés sous la bannière « Suggestions » de l&apos;accueil</p>
          </div>
        </div>
        <div className="ak-card__body">
          {produits.length === 0 ? (
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Aucun produit publié. <a href="/admin/produits" style={{ color: "#6366f1", fontWeight: 600 }}>Ajouter des produits</a>
            </p>
          ) : (
            <>
              {/* Chips produits sélectionnés */}
              {produits.filter((p) => p.featured).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  {produits.filter((p) => p.featured).map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "#ede9fe", border: "1.5px solid #c4b5fd", borderRadius: 10, padding: "5px 8px 5px 6px" }}>
                      {p.image_url && <img src={p.image_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                      <span style={{ fontWeight: 600, fontSize: 12.5, color: "#3730a3", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                      <span style={{ fontSize: 11.5, color: "#7c3aed", flexShrink: 0 }}>{p.price} DT</span>
                      <button onClick={() => toggleFeatured(p.id, true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", padding: "0 0 0 2px", lineHeight: 1, display: "flex", alignItems: "center" }}>
                        <i className="ti ti-x" style={{ fontSize: 13 }}></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Combobox recherche */}
              <div style={{ position: "relative", maxWidth: 420 }}>
                <div style={{ position: "relative" }}>
                  <i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--a-ink-mute)", fontSize: 15, pointerEvents: "none" }}></i>
                  <input
                    className="ak-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Rechercher un produit à mettre en avant…"
                    value={searchFeatured}
                    onChange={(e) => { setSearchFeatured(e.target.value); setShowDropFeatured(true); }}
                    onFocus={() => setShowDropFeatured(true)}
                    onBlur={() => setTimeout(() => setShowDropFeatured(false), 180)}
                  />
                </div>
                {showDropFeatured && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--a-paper)", border: "1.5px solid var(--a-rule)", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 260, overflowY: "auto" }}>
                    {produits
                      .filter((p) => !searchFeatured || p.title.toLowerCase().includes(searchFeatured.toLowerCase()))
                      .map((p) => (
                        <button
                          key={p.id}
                          onMouseDown={(e) => { e.preventDefault(); toggleFeatured(p.id, p.featured); setSearchFeatured(""); }}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", width: "100%", background: p.featured ? "#f5f3ff" : "transparent", border: "none", borderBottom: "1px solid var(--a-rule)", cursor: "pointer", textAlign: "left" }}
                        >
                          {p.image_url
                            ? <img src={p.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                            : <span style={{ width: 36, height: 36, borderRadius: 8, background: "var(--a-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}><i className="ti ti-photo" style={{ color: "#94a3b8" }}></i></span>}
                          <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "var(--a-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                          <span style={{ fontSize: 12, color: "var(--a-ink-mute)", flexShrink: 0 }}>{p.price} DT</span>
                          {p.featured && <i className="ti ti-check" style={{ color: "#6366f1", fontSize: 15, flexShrink: 0 }}></i>}
                        </button>
                      ))}
                    {produits.filter((p) => !searchFeatured || p.title.toLowerCase().includes(searchFeatured.toLowerCase())).length === 0 && (
                      <p style={{ textAlign: "center", color: "var(--a-ink-mute)", padding: "16px 0", fontSize: 13 }}>Aucun produit trouvé</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- Quoi de neuf ---------- */}
      <div className="ak-card" style={{ marginTop: 20 }}>
        <div className="ak-card__header">
          <div>
            <h3 className="ak-card__title">
              <i className="ti ti-sparkles" style={{ marginRight: 6, color: "#10b981" }}></i>
              Quoi de neuf{" "}
              <span className="ak-count-badge" style={{ marginLeft: 6 }}>
                {whatsnewIds.size > 0 ? `${whatsnewIds.size} épinglé${whatsnewIds.size > 1 ? "s" : ""}` : "auto"}
              </span>
            </h3>
            <p className="ak-card__subtitle">
              Épinglez des produits prioritaires. Si aucun n&apos;est épinglé, le dernier article de chaque catégorie s&apos;affiche automatiquement.
            </p>
          </div>
          {whatsnewIds.size > 0 && (
            <button
              className="ak-btn ak-btn--ghost ak-btn--sm"
              onClick={async () => {
                for (const id of Array.from(whatsnewIds)) {
                  await supabase.from("products").update({ whats_new: false }).eq("id", id);
                }
                notifier("Sélection effacée — mode automatique activé.");
                chargerWhatsNew();
              }}
            >
              <i className="ti ti-refresh"></i> Réinitialiser (auto)
            </button>
          )}
        </div>
        <div className="ak-card__body">
          {!whatsnewDispo ? (
            <div className="ak-alert ak-alert--warning" style={{ margin: 0 }}>
              <i className="ti ti-alert-circle"></i> La colonne <code>whats_new</code> n&apos;existe pas encore —
              exécutez <code>supabase/migration-v12-whats-new.sql</code> dans le SQL Editor de Supabase puis rechargez.
            </div>
          ) : produits.length === 0 ? (
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Aucun produit publié. <a href="/admin/produits" style={{ color: "#6366f1", fontWeight: 600 }}>Ajouter des produits</a>
            </p>
          ) : (
            <>
              {/* Chips produits épinglés */}
              {whatsnewIds.size > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  {produits.filter((p) => whatsnewIds.has(p.id)).map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 10, padding: "5px 8px 5px 6px" }}>
                      {p.image_url && <img src={p.image_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                      <span style={{ fontWeight: 600, fontSize: 12.5, color: "#14532d", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                      <span style={{ fontSize: 11.5, color: "#15803d", flexShrink: 0 }}>{p.price} DT</span>
                      <button onClick={() => toggleWhatsNew(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#15803d", padding: "0 0 0 2px", lineHeight: 1, display: "flex", alignItems: "center" }}>
                        <i className="ti ti-x" style={{ fontSize: 13 }}></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Combobox recherche */}
              <div style={{ position: "relative", maxWidth: 420 }}>
                <div style={{ position: "relative" }}>
                  <i className="ti ti-search" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--a-ink-mute)", fontSize: 15, pointerEvents: "none" }}></i>
                  <input
                    className="ak-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Rechercher un produit à épingler…"
                    value={searchWhatsNew}
                    onChange={(e) => { setSearchWhatsNew(e.target.value); setShowDropWhatsNew(true); }}
                    onFocus={() => setShowDropWhatsNew(true)}
                    onBlur={() => setTimeout(() => setShowDropWhatsNew(false), 180)}
                  />
                </div>
                {showDropWhatsNew && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--a-paper)", border: "1.5px solid var(--a-rule)", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 260, overflowY: "auto" }}>
                    {produits
                      .filter((p) => !searchWhatsNew || p.title.toLowerCase().includes(searchWhatsNew.toLowerCase()))
                      .map((p) => {
                        const pinned = whatsnewIds.has(p.id);
                        return (
                          <button
                            key={p.id}
                            onMouseDown={(e) => { e.preventDefault(); toggleWhatsNew(p.id); setSearchWhatsNew(""); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", width: "100%", background: pinned ? "#f0fdf4" : "transparent", border: "none", borderBottom: "1px solid var(--a-rule)", cursor: "pointer", textAlign: "left" }}
                          >
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
