-- migration-v16-section-order.sql
-- Ajoute un ordre d'affichage configurable aux sections de la page d'accueil.
-- À exécuter dans le SQL Editor de Supabase.

-- 1. Ajouter la colonne display_order aux sections existantes
ALTER TABLE home_sections ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- 2. Initialiser l'ordre des sections existantes (selon l'ordre actuel du front)
UPDATE home_sections SET display_order = 1 WHERE section = 'solde';
UPDATE home_sections SET display_order = 2 WHERE section = 'suggestion';

-- 3. Insérer la section "quoi_de_neuf" si elle n'existe pas encore
--    (représente uniquement la position de la section dans le front, pas de médias)
INSERT INTO home_sections (section, title, tagline, cta_label, cta_href, visible, display_order)
SELECT
  'quoi_de_neuf',
  'Quoi de neuf',
  'Découvrez nos dernières nouveautés',
  'Voir tout',
  '/boutique?nouveautes=1',
  true,
  3
WHERE NOT EXISTS (
  SELECT 1 FROM home_sections WHERE section = 'quoi_de_neuf'
);
