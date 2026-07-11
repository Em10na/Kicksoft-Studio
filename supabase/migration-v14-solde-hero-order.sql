-- Ordre d'affichage des articles soldés mis en avant sur l'accueil (slider hero + bannière).
-- 0 = non défini ; les articles sont triés ASC par cette valeur.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS solde_hero_order integer DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_products_solde_hero_order ON public.products (solde_hero_order) WHERE solde_hero = true;
