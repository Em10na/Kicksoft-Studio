-- ============================================================
-- FIX: Ajouter la colonne 'description' aux tables categories et collections
-- Executez ce fichier dans Supabase SQL Editor
-- ============================================================

-- Ajouter la colonne description a la table categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Ajouter la colonne description a la table collections (si elle existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections') THEN
    ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS description TEXT;
  END IF;
END $$;

-- Ajouter la colonne image_url a la table categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ajouter la colonne image_url a la table collections (si elle existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections') THEN
    ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS image_url TEXT;
  END IF;
END $$;

-- S'assurer que la colonne image_url existe sur products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Recharger le schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
