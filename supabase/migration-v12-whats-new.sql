-- Produits épinglés manuellement dans la section « Quoi de neuf » de l'accueil.
-- Si aucun produit n'est épinglé (whats_new = true), la page affiche automatiquement
-- le dernier article publié de chaque catégorie.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS whats_new boolean DEFAULT false;

-- Index pour accélérer le filtre sur l'accueil
CREATE INDEX IF NOT EXISTS idx_products_whats_new ON public.products (whats_new) WHERE whats_new = true;
