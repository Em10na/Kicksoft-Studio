"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FileObject } from "@supabase/storage-js";

const BUCKET = "medias";

function formaterTaille(octets: number): string {
  if (octets < 1024) return octets + " o";
  if (octets < 1024 * 1024) return (octets / 1024).toFixed(1) + " Ko";
  return (octets / (1024 * 1024)).toFixed(1) + " Mo";
}

function estImage(nom: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(nom);
}

export default function MediasPage() {
  const supabase = createClient();
  const [fichiers, setFichiers] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [recherche, setRecherche] = useState("");
  const [vue, setVue] = useState<"grille" | "liste">("grille");
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function chargerFichiers() {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
      setLoading(false);
      return;
    }
    const fichiersValides = (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    setFichiers(fichiersValides);
    setLoading(false);
  }

  useEffect(() => {
    chargerFichiers();
  }, []);

  function getPublicUrl(nom: string): string {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(nom);
    return data.publicUrl;
  }

  async function uploaderFichiers(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let succes = 0;
    let erreurs = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const nomFichier = `${timestamp}_${file.name.replace(/\s+/g, "_")}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(nomFichier, file, { upsert: false });

      if (error) {
        erreurs++;
      } else {
        succes++;
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (erreurs > 0) {
      setAlert({
        message: `${succes} fichier(s) uploade(s), ${erreurs} erreur(s).`,
        type: "warning",
      });
    } else {
      setAlert({
        message: `${succes} fichier(s) uploade(s) avec succes !`,
        type: "success",
      });
    }

    chargerFichiers();
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  async function supprimerFichier(nom: string) {
    if (!confirm("Confirmer la suppression de ce fichier ?")) return;
    const { error } = await supabase.storage.from(BUCKET).remove([nom]);
    if (error) {
      setAlert({ message: "Erreur : " + error.message, type: "danger" });
    } else {
      setAlert({ message: "Fichier supprime.", type: "success" });
      chargerFichiers();
    }
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  function copierUrl(nom: string) {
    const url = getPublicUrl(nom);
    navigator.clipboard.writeText(url);
    setAlert({ message: "URL copiee dans le presse-papier !", type: "success" });
    setTimeout(() => setAlert({ message: "", type: "" }), 3000);
  }

  function ouvrirPreview(nom: string) {
    setPreviewUrl(getPublicUrl(nom));
    setPreviewName(nom);
    setShowPreview(true);
  }

  const fichiersFiltres = fichiers.filter(
    (f) => recherche === "" || f.name.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-semibold mb-1">
            Gestion des medias{" "}
            <span className="badge bg-light-primary text-primary ms-2">
              {fichiers.length}
            </span>
          </h5>
          <p className="mb-0 text-muted">Supabase Storage — bucket &quot;{BUCKET}&quot;</p>
        </div>
        <div className="d-flex gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
            onChange={uploaderFichiers}
            style={{ display: "none" }}
          />
          <button
            className="btn btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <i className="ti ti-upload me-1"></i>
            {uploading ? "Upload en cours..." : "Uploader"}
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert.message && (
        <div className={`alert alert-${alert.type} mb-4`} role="alert">
          {alert.message}
        </div>
      )}

      {/* Barre outils */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rechercher un fichier..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <span className="text-muted">{fichiersFiltres.length} fichier(s)</span>
            </div>
            <div className="col-md-3 text-end">
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${vue === "grille" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setVue("grille")}
                >
                  <i className="ti ti-grid-dots"></i>
                </button>
                <button
                  className={`btn ${vue === "liste" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setVue("liste")}
                >
                  <i className="ti ti-list"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            Chargement...
          </div>
        </div>
      ) : fichiersFiltres.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            Aucun fichier —{" "}
            <button className="btn btn-link p-0" onClick={() => inputRef.current?.click()}>
              Uploader le premier fichier
            </button>
          </div>
        </div>
      ) : vue === "grille" ? (
        /* Vue grille */
        <div className="row g-3">
          {fichiersFiltres.map((f) => (
            <div key={f.id} className="col-6 col-md-4 col-lg-3 col-xl-2">
              <div className="card h-100">
                <div
                  style={{
                    height: "140px",
                    background: "#f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: estImage(f.name) ? "pointer" : "default",
                    borderTopLeftRadius: "inherit",
                    borderTopRightRadius: "inherit",
                  }}
                  onClick={() => estImage(f.name) && ouvrirPreview(f.name)}
                >
                  {estImage(f.name) ? (
                    <img
                      src={getPublicUrl(f.name)}
                      alt={f.name}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <i className="ti ti-file fs-1 text-muted"></i>
                  )}
                </div>
                <div className="card-body p-2">
                  <p
                    className="mb-1 fw-semibold text-truncate"
                    style={{ fontSize: "12px" }}
                    title={f.name}
                  >
                    {f.name}
                  </p>
                  <small className="text-muted">
                    {(f.metadata as Record<string, number> | null)?.size
                      ? formaterTaille((f.metadata as Record<string, number>).size)
                      : "—"}
                  </small>
                </div>
                <div className="card-footer p-2 d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-primary flex-fill"
                    onClick={() => copierUrl(f.name)}
                    title="Copier l'URL"
                  >
                    <i className="ti ti-copy"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger flex-fill"
                    onClick={() => supprimerFichier(f.name)}
                    title="Supprimer"
                  >
                    <i className="ti ti-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vue liste */
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}></th>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Taille</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fichiersFiltres.map((f) => (
                    <tr key={f.id}>
                      <td>
                        {estImage(f.name) ? (
                          <img
                            src={getPublicUrl(f.name)}
                            alt={f.name}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            onClick={() => ouvrirPreview(f.name)}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "6px",
                              background: "#f8f9fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <i className="ti ti-file text-muted"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <h6 className="fw-semibold mb-0 text-truncate" style={{ maxWidth: "250px" }}>
                          {f.name}
                        </h6>
                      </td>
                      <td className="text-muted">
                        {(f.metadata as Record<string, string> | null)?.mimetype ?? "—"}
                      </td>
                      <td className="text-muted">
                        {(f.metadata as Record<string, number> | null)?.size
                          ? formaterTaille((f.metadata as Record<string, number>).size)
                          : "—"}
                      </td>
                      <td className="text-muted">
                        {f.created_at
                          ? new Date(f.created_at).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => copierUrl(f.name)}
                            title="Copier l'URL"
                          >
                            <i className="ti ti-copy"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => supprimerFichier(f.name)}
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview */}
      {showPreview && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold text-truncate">
                  {previewName}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowPreview(false)}
                ></button>
              </div>
              <div className="modal-body text-center p-3">
                <img
                  src={previewUrl}
                  alt={previewName}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => copierUrl(previewName)}
                >
                  <i className="ti ti-copy me-1"></i> Copier l&apos;URL
                </button>
                <button
                  className="btn btn-light"
                  onClick={() => setShowPreview(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
