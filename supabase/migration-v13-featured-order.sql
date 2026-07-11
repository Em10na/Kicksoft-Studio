-- Ordre d'affichage des produits mis en avant sur l'accueil (section Suggestions).
-- 0 = non défini ; les produits sont triés ASC par cette valeur.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_order integer DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_products_featured_order ON public.products (featured_order) WHERE featured = true;
