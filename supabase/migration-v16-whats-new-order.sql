-- Migration v16 : colonne whats_new_order pour le classement "Quoi de neuf"
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS whats_new_order integer NOT NULL DEFAULT 0;
