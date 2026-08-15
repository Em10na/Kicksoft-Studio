-- ================================================================
-- Migration v18 — Configuration des bannières du bas (section solde)
-- Ajoute des colonnes par-média pour gérer le texte et le lien
-- de chacun des 3 blocs de la section "Articles en Solde".
-- Idempotent — sûr à relancer plusieurs fois.
-- ================================================================

ALTER TABLE public.home_section_media
  ADD COLUMN IF NOT EXISTS banner_label   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_title   TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_sub     TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_cta     TEXT    DEFAULT 'Voir',
  ADD COLUMN IF NOT EXISTS banner_cta_href TEXT   DEFAULT '/boutique?soldes=1',
  ADD COLUMN IF NOT EXISTS banner_visible BOOLEAN DEFAULT true;

-- Recharger le schema PostgREST
NOTIFY pgrst, 'reload schema';
