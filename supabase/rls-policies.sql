-- ============================================================
-- KICKSOFT STUDIO — RLS Policies & Tables complementaires
-- Executez ce fichier dans Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. FONCTIONS UTILITAIRES
-- ============================================================

-- Retourne le role de l'utilisateur connecte
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifie si l'utilisateur est admin ou manager
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('admin', 'manager')
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 2. TABLES COMPLEMENTAIRES
-- ============================================================

-- Wishlist / Favoris
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Colonnes profil etendues
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS code_postal TEXT;

-- S'assurer que la table roles existe
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Inserer les roles de base s'ils n'existent pas
INSERT INTO public.roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.roles (name) VALUES ('manager') ON CONFLICT (name) DO NOTHING;
INSERT INTO public.roles (name) VALUES ('client') ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 3. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. POLICIES — PRODUITS (products)
--    Lecture publique (published) / CRUD admin
-- ============================================================

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- 5. POLICIES — CATEGORIES
--    Lecture publique / CRUD admin
-- ============================================================

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update" ON public.categories
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete" ON public.categories
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- 6. POLICIES — COMMANDES (orders)
--    Proprietaire lit ses commandes / Admin voit tout
-- ============================================================

DROP POLICY IF EXISTS "orders_owner_read" ON public.orders;
CREATE POLICY "orders_owner_read" ON public.orders
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_owner_insert" ON public.orders;
CREATE POLICY "orders_owner_insert" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete" ON public.orders
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- 7. POLICIES — ORDER ITEMS
--    Proprietaire via commande / Admin
-- ============================================================

DROP POLICY IF EXISTS "order_items_owner_read" ON public.order_items;
CREATE POLICY "order_items_owner_read" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );


-- ============================================================
-- 8. POLICIES — PROFILS (profiles)
--    Chacun voit/modifie le sien / Admin voit tout
-- ============================================================

DROP POLICY IF EXISTS "profiles_owner_read" ON public.profiles;
CREATE POLICY "profiles_owner_read" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin());


-- ============================================================
-- 9. POLICIES — ROLES
--    Lecture publique / Modification admin uniquement
-- ============================================================

DROP POLICY IF EXISTS "roles_public_read" ON public.roles;
CREATE POLICY "roles_public_read" ON public.roles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "roles_admin_manage" ON public.roles;
CREATE POLICY "roles_admin_manage" ON public.roles
  FOR ALL USING (public.is_admin());


-- ============================================================
-- 10. POLICIES — WISHLIST (favoris)
--     Proprietaire uniquement
-- ============================================================

DROP POLICY IF EXISTS "wishlist_owner" ON public.wishlist;
CREATE POLICY "wishlist_owner" ON public.wishlist
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- 11. POLICIES — TEMPLATES
--     Lecture publique / CRUD admin
-- ============================================================

DROP POLICY IF EXISTS "templates_public_read" ON public.templates;
CREATE POLICY "templates_public_read" ON public.templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "templates_admin_manage" ON public.templates;
CREATE POLICY "templates_admin_manage" ON public.templates
  FOR ALL USING (public.is_admin());


-- ============================================================
-- 12. POLICIES — PAGES STATIQUES
--     Publies lisibles par tous / CRUD admin
-- ============================================================

DROP POLICY IF EXISTS "pages_public_read" ON public.pages;
CREATE POLICY "pages_public_read" ON public.pages
  FOR SELECT USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "pages_admin_manage" ON public.pages;
CREATE POLICY "pages_admin_manage" ON public.pages
  FOR ALL USING (public.is_admin());


-- ============================================================
-- 13. POLICIES — BLOG (posts)
--     Publies lisibles par tous / CRUD admin
-- ============================================================

DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
CREATE POLICY "posts_public_read" ON public.posts
  FOR SELECT USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "posts_admin_manage" ON public.posts;
CREATE POLICY "posts_admin_manage" ON public.posts
  FOR ALL USING (public.is_admin());


-- ============================================================
-- 14. POLICIES — FAQ
--     Lecture publique / CRUD admin
-- ============================================================

DROP POLICY IF EXISTS "faqs_public_read" ON public.faqs;
CREATE POLICY "faqs_public_read" ON public.faqs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "faqs_admin_manage" ON public.faqs;
CREATE POLICY "faqs_admin_manage" ON public.faqs
  FOR ALL USING (public.is_admin());


-- ============================================================
-- 15. POLICIES — TICKETS SUPPORT
--     Proprietaire lit/cree les siens / Admin voit tout
-- ============================================================

DROP POLICY IF EXISTS "tickets_owner_read" ON public.tickets_support;
CREATE POLICY "tickets_owner_read" ON public.tickets_support
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "tickets_owner_insert" ON public.tickets_support;
CREATE POLICY "tickets_owner_insert" ON public.tickets_support
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "tickets_admin_update" ON public.tickets_support;
CREATE POLICY "tickets_admin_update" ON public.tickets_support
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "tickets_admin_delete" ON public.tickets_support;
CREATE POLICY "tickets_admin_delete" ON public.tickets_support
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- 16. POLICIES — NEWSLETTER
--     Admin lit tout / Insertion publique (formulaire)
-- ============================================================

DROP POLICY IF EXISTS "newsletter_admin_read" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_read" ON public.newsletter_subscribers
  FOR SELECT USING (public.is_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_admin_update" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_update" ON public.newsletter_subscribers
  FOR UPDATE USING (public.is_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));


-- ============================================================
-- 17. POLICIES — COLLECTIONS (si la table existe)
-- ============================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') THEN
    ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "collections_public_read" ON public.collections;
    CREATE POLICY "collections_public_read" ON public.collections FOR SELECT USING (true);

    DROP POLICY IF EXISTS "collections_admin_manage" ON public.collections;
    CREATE POLICY "collections_admin_manage" ON public.collections FOR ALL USING (public.is_admin());
  END IF;
END $$;


-- ============================================================
-- 18. STORAGE — Bucket medias (lecture publique, upload admin)
-- ============================================================

-- Ces policies sont a configurer dans Supabase Dashboard > Storage > Policies
-- Bucket : medias
-- SELECT : public (allow all)
-- INSERT : authenticated + is_admin()
-- DELETE : authenticated + is_admin()


-- ============================================================
-- RESUME DES ACCES
-- ============================================================
--
-- VISITEUR (non connecte):
--   LIRE: produits publies, categories, FAQ, pages publiees,
--         posts publies, templates
--   ECRIRE: newsletter (inscription), tickets (formulaire contact)
--
-- CLIENT (connecte, role client):
--   LIRE: + ses commandes, ses order_items, son profil, ses favoris,
--           ses tickets, son statut newsletter
--   ECRIRE: + commandes, favoris, tickets, profil, newsletter toggle
--
-- ADMIN / MANAGER (connecte, role admin/manager):
--   LIRE: tout
--   ECRIRE: tout (CRUD complet sur toutes les tables)
--
-- SECURITE PAIEMENT:
--   Les webhooks de paiement doivent utiliser la service_role key
--   (cote serveur uniquement, jamais exposee au frontend)
-- ============================================================
