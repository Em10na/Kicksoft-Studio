"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type FormProfil = { full_name: string; phone: string; adresse: string; ville: string; code_postal: string };

const FORM_VIDE: FormProfil = { full_name: "", phone: "", adresse: "", ville: "", code_postal: "" };

export default function ProfilPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormProfil>(FORM_VIDE);
  const [initial, setInitial] = useState<FormProfil>(FORM_VIDE);
  const [email, setEmail] = useState("");
  const [verifie, setVerifie] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadAvatar, setUploadAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function notifier(message: string, type: "success" | "danger" = "success") {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3500);
  }

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      setVerifie(!!user.email_confirmed_at);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        const f: FormProfil = {
          full_name: data.full_name || "", phone: data.phone || "",
          adresse: data.adresse || "", ville: data.ville || "", code_postal: data.code_postal || "",
        };
        setForm(f);
        setInitial(f);
        setAvatar((data as { avatar_url?: string | null }).avatar_url ?? null);
      }
      setLoading(false);
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function valider(): boolean {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Le nom est obligatoire.";
    else if (form.full_name.trim().length < 2) e.full_name = "Minimum 2 caractères.";
    if (form.phone && !/^[+\d\s()-]{6,20}$/.test(form.phone)) e.phone = "Numéro invalide.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function sauvegarder() {
    if (!valider()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(), phone: form.phone.trim() || null,
      adresse: form.adresse.trim() || null, ville: form.ville.trim() || null, code_postal: form.code_postal.trim() || null,
    }).eq("id", user.id);
    if (error) notifier("Erreur : " + error.message, "danger");
    else {
      setInitial(form);
      notifier("Profil mis à jour avec succès !");
    }
  }

  function annuler() {
    setForm(initial);
    setErreurs({});
  }

  async function changerAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadAvatar(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadAvatar(false); return; }
    const ext = file.name.split(".").pop() || "jpg";
    const chemin = `avatars/${user.id}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("media").upload(chemin, file, { upsert: false });
    if (upErr) {
      notifier("Upload échoué : " + upErr.message, "danger");
      setUploadAvatar(false);
      return;
    }
    const { data: pub } = supabase.storage.from("media").getPublicUrl(chemin);
    const { error } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
    if (error) {
      notifier("Photo uploadée mais profil non mis à jour (exécutez migration-v6-avatar.sql) : " + error.message, "danger");
    } else {
      setAvatar(pub.publicUrl);
      notifier("Photo de profil mise à jour !");
    }
    setUploadAvatar(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (loading) return <p style={{ color: "var(--fg-mute)" }}>Chargement...</p>;

  const initiales = (form.full_name || email || "?")
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();
  const modifie = JSON.stringify(form) !== JSON.stringify(initial);

  return (
    <div>
      {alert.message && (
        <div className={`profile-alert profile-alert--${alert.type}`}>{alert.message}</div>
      )}

      <div className="profile-grid">
        {/* Carte identité */}
        <div className="profile-side account-animate">
          <div className="profile-avatar">
            {avatar ? <img src={avatar} alt={form.full_name} /> : initiales}
            <button
              type="button"
              className="profile-avatar__edit"
              onClick={() => fileRef.current?.click()}
              disabled={uploadAvatar}
              aria-label="Changer la photo de profil"
              title="Changer la photo"
            >
              {uploadAvatar ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={changerAvatar} />
          </div>
          <div className="profile-side__name">{form.full_name || "Mon profil"}</div>
          <div className="profile-side__role">Client DJI Store TN</div>

          <nav className="profile-side__nav">
            <span className="account-nav__link is-active">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
              </svg>
              Informations personnelles
            </span>
            <Link href="/compte/parametres" className="account-nav__link">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Mot de passe & sécurité
            </Link>
            <a href="/api/auth/signout" className="account-nav__link account-nav__link--logout">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </a>
          </nav>
        </div>

        {/* Formulaire */}
        <div className="profile-form account-animate account-animate--2">
          <h3>Informations personnelles</h3>

          <div className="profile-row">
            <div className="profile-field">
              <label className="profile-label" htmlFor="p-nom">Nom complet <span style={{ color: "var(--rose)" }}>*</span></label>
              <input
                id="p-nom"
                className={`profile-input${erreurs.full_name ? " profile-input--error" : ""}`}
                type="text"
                placeholder="Prénom Nom"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              {erreurs.full_name && <p className="profile-error">{erreurs.full_name}</p>}
            </div>
            <div className="profile-field">
              <label className="profile-label" htmlFor="p-tel">Téléphone</label>
              <input
                id="p-tel"
                className={`profile-input${erreurs.phone ? " profile-input--error" : ""}`}
                type="tel"
                placeholder="+216 XX XXX XXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {erreurs.phone && <p className="profile-error">{erreurs.phone}</p>}
            </div>
          </div>

          <div className="profile-field">
            <label className="profile-label" htmlFor="p-email">Email</label>
            <div className="profile-email-wrap">
              <input id="p-email" className="profile-input" type="email" value={email} disabled />
              {verifie && (
                <span className="profile-verified">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Vérifié
                </span>
              )}
            </div>
          </div>

          <div className="profile-field">
            <label className="profile-label" htmlFor="p-adresse">Adresse</label>
            <input
              id="p-adresse"
              className="profile-input"
              type="text"
              placeholder="Rue, numéro, immeuble..."
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            />
          </div>

          <div className="profile-row">
            <div className="profile-field">
              <label className="profile-label" htmlFor="p-ville">Ville</label>
              <input
                id="p-ville"
                className="profile-input"
                type="text"
                placeholder="Tunis"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
              />
            </div>
            <div className="profile-field">
              <label className="profile-label" htmlFor="p-cp">Code postal</label>
              <input
                id="p-cp"
                className="profile-input"
                type="text"
                placeholder="1000"
                value={form.code_postal}
                onChange={(e) => setForm({ ...form, code_postal: e.target.value })}
              />
            </div>
          </div>

          <div className="profile-actions">
            <button type="button" className="btn btn--outline" onClick={annuler} disabled={!modifie}>
              Annuler
            </button>
            <button type="button" className="btn btn--ink" onClick={sauvegarder}>
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
