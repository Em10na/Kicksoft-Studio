-- ================================================================
-- Migration v19 — Correction de banner_visible pour la section solde
-- Réinitialise banner_visible = true pour tous les médias dont la
-- valeur est NULL ou FALSE (problème de synchronisation front/back).
-- Idempotent — sûr à relancer plusieurs fois.
-- ================================================================

-- 1. S'assurer que la colonne banner_visible existe (idempotent)
ALTER TABLE public.home_section_media
  ADD COLUMN IF NOT EXISTS banner_visible BOOLEAN DEFAULT true;

-- 2. Remettre à TRUE tous les médias qui ont banner_visible = false ou NULL.
--    Cela inclut les médias qui n'avaient jamais été configurés
--    (ils héritent du DEFAULT true mais ici on force le rattrapage).
UPDATE public.home_section_media
SET banner_visible = true
WHERE banner_visible IS NULL OR banner_visible = false;

-- 3. Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';
