"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Template = {
  id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  page: string;
};

type Produit = {
  id: string;
  title: string;
  price: number;
  featured: boolean;
  status: string;
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
  const [template, setTemplate] = useState<Template | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [form, setForm] = useState({ title: "", subtitle: "", body: "" });

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

  async function chargerTemplate() {
    const { data } = await supabase.from("templates").select("*").eq("page", "home").single();
    if (data) {
      setTemplate(data);
      setForm({ title: data.title ?? "", subtitle: data.subtitle ?? "", body: data.body ?? "" });
    }
  }

  async function chargerProduits() {
    const { data } = await supabase
      .from("products")
      .select("id, title, price, featured, status")
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

  useEffect(() => {
    Promise.all([chargerTemplate(), chargerProduits(), chargerSections()]).then(() => setLoading(false));
  }, []);

  async function sauvegarderHero() {
    if (!template) return;
    const { error } = await supabase
      .from("templates")
      .update({ title: form.title, subtitle: form.subtitle, body: form.body })
      .eq("id", template.id);
    if (error) notifier("Erreur : " + error.message, "danger");
    else notifier("Hero mis à jour avec succès !");
  }

  async function toggleFeatured(produitId: string, actuel: boolean) {
    const { error } = await supabase.from("products").update({ featured: !actuel }).eq("id", produitId);
    if (error) {
      notifier("Erreur : " + error.message, "danger");
    } else {
      notifier(!actuel ? "Produit mis en avant !" : "Produit retiré de la mise en avant.");
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
          <p className="ak-page-sub">Personnalisez le hero, les sections média et les produits mis en avant</p>
        </div>
      </div>

      {/* ---------- Section Hero ---------- */}
      <div className="ak-card" style={{ marginBottom: 20 }}>
        <div className="ak-card__header">
          <div>
            <h3 className="ak-card__title"><i className="ti ti-star" style={{ marginRight: 6, color: "#6366f1" }}></i>Section Hero</h3>
            <p className="ak-card__subtitle">Textes affichés en haut de la boutique</p>
          </div>
          {template && (
            <button className="ak-btn ak-btn--primary ak-btn--sm" onClick={sauvegarderHero}>
              <i className="ti ti-device-floppy"></i> Enregistrer
            </button>
          )}
        </div>
        <div className="ak-card__body">
          {!template ? (
            <p style={{ color: "#94a3b8", margin: 0 }}>Aucun template trouvé pour la page d&apos;accueil.</p>
          ) : (
            <>
              <div className="ak-form-row">
                <div className="ak-field">
                  <label className="ak-label">Titre principal</label>
                  <input className="ak-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="ak-field">
                  <label className="ak-label">Sous-titre</label>
                  <input className="ak-input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                </div>
              </div>
              <div className="ak-field" style={{ marginBottom: 0 }}>
                <label className="ak-label">Contenu (body)</label>
                <textarea className="ak-textarea" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}></textarea>
              </div>
            </>
          )}
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
                    <label className="ak-label">Lien du bouton</label>
                    <input className="ak-input" placeholder="/boutique" value={f.cta_href} onChange={(e) => setSectionForms({ ...sectionForms, [s.id]: { ...f, cta_href: e.target.value } })} />
                  </div>
                </div>

                {/* Médias */}
                <label className="ak-label">
                  Médias <span style={{ color: "#94a3b8", fontWeight: 500 }}>({s.home_section_media.length}) — images ou vidéos, affichés en carrousel</span>
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
                {produits.filter((p) => p.featured).length} / {produits.length}
              </span>
            </h3>
            <p className="ak-card__subtitle">Affichés sous la bannière « Suggestions » de l&apos;accueil</p>
          </div>
        </div>
        {produits.length === 0 ? (
          <div className="ak-card__body">
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Aucun produit publié. <a href="/admin/produits" style={{ color: "#6366f1", fontWeight: 600 }}>Ajouter des produits</a>
            </p>
          </div>
        ) : (
          <div className="ak-table-wrap">
            <table className="ak-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Vedette</th>
                  <th>Produit</th>
                  <th style={{ width: 110 }}>Prix</th>
                </tr>
              </thead>
              <tbody>
                {produits.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={p.featured}
                        onChange={() => toggleFeatured(p.id, p.featured)}
                        style={{ width: 17, height: 17, accentColor: "#6366f1", cursor: "pointer" }}
                      />
                    </td>
                    <td><span className="ak-cell-bold">{p.title}</span></td>
                    <td><span className="ak-cell-mono">{p.price} DT</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
