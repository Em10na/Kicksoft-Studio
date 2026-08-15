-- ============================================================
-- MIGRATION V17 — MASTER (catch-all idempotent)
-- ============================================================
-- Applique TOUTES les modifications manquantes en une seule passe.
-- Safe à exécuter même si certaines migrations ont déjà été jouées :
-- chaque instruction utilise IF NOT EXISTS / IF NOT EXISTS.
--
-- Ordre d'exécution attendu :
--   1. create-all-tables.sql      (schéma de base)
--   2. CE FICHIER                 (toutes les colonnes / tables ajoutées v2→v16)
--
-- Si tout est déjà en place, le script se termine sans erreur.
-- ============================================================


-- ============================================================
-- 0. FONCTIONS UTILITAIRES (re-créées en REPLACE pour la sécurité)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT r.name
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('admin', 'manager')
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 1. TABLE PROFILES — colonnes supplémentaires
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adresse    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ville      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS code_postal TEXT;


-- ============================================================
-- 2. TABLE PRODUCTS — toutes les colonnes ajoutées v2→v16
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS loyalty_points    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_order    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS solde_hero        BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS solde_hero_order  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS whats_new         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS whats_new_order   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url         TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Index utiles
CREATE INDEX IF NOT EXISTS products_solde_hero_idx  ON public.products (solde_hero)  WHERE solde_hero  = true;
CREATE INDEX IF NOT EXISTS products_whats_new_idx   ON public.products (whats_new)   WHERE whats_new   = true;
CREATE INDEX IF NOT EXISTS products_featured_idx    ON public.products (featured)    WHERE featured     = true;


-- ============================================================
-- 3. TABLE CATEGORIES — colonnes supplémentaires
-- ============================================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url   TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug        TEXT NOT NULL DEFAULT '';


-- ============================================================
-- 4. TABLE ORDERS — guest checkout (v2)
-- ============================================================
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name    TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone   TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_address TEXT;


-- ============================================================
-- 5. TABLE PRODUCT_MEDIA (v3)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_media (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url        TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'image',
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_public_read"   ON public.product_media;
CREATE POLICY "media_public_read" ON public.product_media FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_media.product_id
      AND (products.status = 'published' OR public.is_admin())
  )
);
DROP POLICY IF EXISTS "media_admin_insert"  ON public.product_media;
CREATE POLICY "media_admin_insert"  ON public.product_media FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "media_admin_update"  ON public.product_media;
CREATE POLICY "media_admin_update"  ON public.product_media FOR UPDATE USING  (public.is_admin());
DROP POLICY IF EXISTS "media_admin_delete"  ON public.product_media;
CREATE POLICY "media_admin_delete"  ON public.product_media FOR DELETE USING  (public.is_admin());


-- ============================================================
-- 6. TABLE REVIEWS (v4)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_name     TEXT NOT NULL,
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT NOT NULL,
  sentiment       TEXT NOT NULL DEFAULT 'neutre',
  sentiment_score NUMERIC NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews (product_id, created_at DESC);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);


-- ============================================================
-- 7. TABLES HOME SECTIONS (v5 + v16-section-order)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.home_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section       TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL DEFAULT '',
  tagline       TEXT DEFAULT '',
  cta_label     TEXT DEFAULT 'Acheter',
  cta_href      TEXT DEFAULT '/boutique',
  visible       BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contrainte CHECK élargie pour inclure quoi_de_neuf (v16)
ALTER TABLE public.home_sections DROP CONSTRAINT IF EXISTS home_sections_section_check;
ALTER TABLE public.home_sections
  ADD CONSTRAINT home_sections_section_check
  CHECK (section IN ('suggestion', 'recommandation', 'solde', 'quoi_de_neuf'));

ALTER TABLE public.home_sections ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.home_section_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES public.home_sections(id) ON DELETE CASCADE,
  media_type    TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url           TEXT NOT NULL,
  poster_url    TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_section_media_idx
  ON public.home_section_media (section_id, display_order);

ALTER TABLE public.home_sections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_section_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "home_sections_public_read"       ON public.home_sections;
CREATE POLICY "home_sections_public_read"       ON public.home_sections      FOR SELECT USING (true);
DROP POLICY IF EXISTS "home_sections_admin_manage"      ON public.home_sections;
CREATE POLICY "home_sections_admin_manage"      ON public.home_sections      FOR ALL    USING (public.is_admin());
DROP POLICY IF EXISTS "home_section_media_public_read"  ON public.home_section_media;
CREATE POLICY "home_section_media_public_read"  ON public.home_section_media FOR SELECT USING (true);
DROP POLICY IF EXISTS "home_section_media_admin_manage" ON public.home_section_media;
CREATE POLICY "home_section_media_admin_manage" ON public.home_section_media FOR ALL    USING (public.is_admin());

-- Seed des 4 sections si absentes
INSERT INTO public.home_sections (section, title, tagline, cta_label, cta_href, visible, display_order) VALUES
  ('solde',          'Nos articles en solde',       'Des offres exclusives pour vous',               'Voir les soldes',   '/boutique', true, 1),
  ('suggestion',     'Caméra Cinéma Pro',           'Filmez comme un professionnel',                 'Acheter',           '/boutique?q=camera', true, 2),
  ('recommandation', 'DJI Série Professionnelle',   'La référence mondiale de la capture aérienne.', 'Acheter maintenant','/boutique', true, 3),
  ('quoi_de_neuf',   'Quoi de neuf',                'Découvrez nos dernières nouveautés',            'Voir tout',         '/boutique?nouveautes=1', true, 4)
ON CONFLICT (section) DO NOTHING;


-- ============================================================
-- 8. TABLE STOCK_MOVEMENTS + TRIGGERS (v7)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta      INT NOT NULL,
  reason     TEXT NOT NULL CHECK (reason IN ('vente', 'annulation', 'ajustement', 'reception')),
  order_id   UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  note       TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_idx
  ON public.stock_movements (product_id, created_at DESC);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_admin_read"   ON public.stock_movements;
CREATE POLICY "stock_movements_admin_read"   ON public.stock_movements FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "stock_movements_admin_insert" ON public.stock_movements;
CREATE POLICY "stock_movements_admin_insert" ON public.stock_movements FOR INSERT WITH CHECK (public.is_admin());

-- Trigger décrément stock à la création d'un order_item
CREATE OR REPLACE FUNCTION public.handle_order_item_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = GREATEST(stock - NEW.quantity, 0) WHERE id = NEW.product_id;
  INSERT INTO public.stock_movements (product_id, delta, reason, order_id)
    VALUES (NEW.product_id, -NEW.quantity, 'vente', NEW.order_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_stock();

-- Trigger restauration stock à l'annulation
CREATE OR REPLACE FUNCTION public.handle_order_cancel_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products p SET stock = p.stock + oi.quantity
    FROM public.order_items oi WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    INSERT INTO public.stock_movements (product_id, delta, reason, order_id)
      SELECT oi.product_id, oi.quantity, 'annulation', NEW.id
      FROM public.order_items oi WHERE oi.order_id = NEW.id;
  ELSIF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
    UPDATE public.products p SET stock = GREATEST(p.stock - oi.quantity, 0)
    FROM public.order_items oi WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    INSERT INTO public.stock_movements (product_id, delta, reason, order_id)
      SELECT oi.product_id, -oi.quantity, 'vente', NEW.id
      FROM public.order_items oi WHERE oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_changed ON public.orders;
CREATE TRIGGER on_order_status_changed
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_cancel_stock();


-- ============================================================
-- 9. TABLE PUSH_SUBSCRIPTIONS (v8)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_admin_read" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_admin_read" ON public.push_subscriptions
  FOR SELECT USING (public.is_admin());


-- ============================================================
-- 10. TABLE NOTIFICATIONS (v9)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  body       TEXT DEFAULT '',
  url        TEXT DEFAULT '/boutique',
  image      TEXT,
  tag        TEXT NOT NULL DEFAULT 'info' CHECK (tag IN ('nouveau', 'solde', 'info')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications (created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_public_read" ON public.notifications;
CREATE POLICY "notifications_public_read" ON public.notifications FOR SELECT USING (true);


-- ============================================================
-- 11. TABLE HERO_SLIDES (v15)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL DEFAULT '',
  tagline       TEXT,
  badge         TEXT,
  image_url     TEXT,
  video_url     TEXT,
  buy_href      TEXT NOT NULL DEFAULT '/boutique',
  more_href     TEXT NOT NULL DEFAULT '/boutique',
  display_order INTEGER NOT NULL DEFAULT 0,
  visible       BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hero_slides_public_read"  ON public.hero_slides;
CREATE POLICY "hero_slides_public_read"  ON public.hero_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "hero_slides_auth_manage"  ON public.hero_slides;
CREATE POLICY "hero_slides_auth_manage"  ON public.hero_slides FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 12. SYSTÈME DE FIDÉLITÉ (loyalty-system.sql — souvent oublié)
-- ============================================================

-- 12a. Colonne loyalty_points sur produits
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- 12b. Table loyalty_rewards
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  points_required  INTEGER NOT NULL,
  reward_type      TEXT NOT NULL DEFAULT 'gift',
  reduction_value  NUMERIC,
  active           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 12c. Table loyalty_transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points      INTEGER NOT NULL,
  type        TEXT NOT NULL,
  description TEXT,
  reward_id   UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loyalty_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 12d. Table loyalty_tiers
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  min_points    INTEGER NOT NULL DEFAULT 0,
  discount_pct  INTEGER NOT NULL DEFAULT 0,
  free_shipping BOOLEAN DEFAULT false,
  description   TEXT,
  color         TEXT,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Seed des 4 niveaux
INSERT INTO public.loyalty_tiers (name, slug, min_points, discount_pct, free_shipping, description, color, position) VALUES
  ('Bronze',  'bronze',  0,    0,  false, 'Niveau de départ. Commencez à cumuler des points !', '#CD7F32', 0),
  ('Argent',  'argent',  500,  5,  false, '5% de réduction sur toutes vos commandes.',           '#9CA3AF', 1),
  ('Or',      'or',      1500, 10, true,  '10% de réduction + livraison gratuite.',              '#F59E0B', 2),
  ('Platine', 'platine', 3000, 15, true,  '15% de réduction + livraison gratuite + exclusivités.','#818CF8',3)
ON CONFLICT (slug) DO UPDATE SET
  min_points    = EXCLUDED.min_points,
  discount_pct  = EXCLUDED.discount_pct,
  free_shipping = EXCLUDED.free_shipping,
  description   = EXCLUDED.description,
  color         = EXCLUDED.color;

-- RLS fidélité
ALTER TABLE public.loyalty_rewards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_tiers_read"          ON public.loyalty_tiers;
CREATE POLICY "loyalty_tiers_read"          ON public.loyalty_tiers        FOR SELECT USING (true);
DROP POLICY IF EXISTS "loyalty_tiers_admin"          ON public.loyalty_tiers;
CREATE POLICY "loyalty_tiers_admin"         ON public.loyalty_tiers        FOR ALL    USING (public.is_admin());

DROP POLICY IF EXISTS "loyalty_rewards_public_read"  ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_public_read" ON public.loyalty_rewards FOR SELECT USING (active = true OR public.is_admin());
DROP POLICY IF EXISTS "loyalty_rewards_admin_insert" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_insert" ON public.loyalty_rewards FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "loyalty_rewards_admin_update" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_update" ON public.loyalty_rewards FOR UPDATE USING  (public.is_admin());
DROP POLICY IF EXISTS "loyalty_rewards_admin_delete" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_delete" ON public.loyalty_rewards FOR DELETE USING  (public.is_admin());

DROP POLICY IF EXISTS "loyalty_tx_read"         ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_read"         ON public.loyalty_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "loyalty_tx_insert"        ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_insert"       ON public.loyalty_transactions FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "loyalty_tx_admin_manage"  ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_admin_manage" ON public.loyalty_transactions FOR ALL    USING (public.is_admin());

-- Seed récompenses par défaut
INSERT INTO public.loyalty_rewards (name, description, points_required, reward_type, reduction_value, active) VALUES
  ('5 DT de réduction',  'Échangez 100 pts contre 5 DT',         100,  'reduction', 5.00,  true),
  ('10 DT de réduction', 'Échangez 200 pts contre 10 DT',        200,  'reduction', 10.00, true),
  ('Livraison gratuite', 'Échangez 500 pts pour la livraison',   500,  'gift',      NULL,  true),
  ('Accessoire offert',  'Échangez 1000 pts pour un accessoire', 1000, 'gift',      NULL,  true)
ON CONFLICT DO NOTHING;

-- Fonctions fidélité
CREATE OR REPLACE FUNCTION public.get_user_lifetime_points(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.loyalty_transactions
  WHERE user_id = p_user_id AND points > 0;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.credit_order_loyalty_points(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID; v_order_total NUMERIC;
  v_product_bonus INT := 0; v_amount_points INT := 0;
  v_first_order_bonus INT := 0; v_total_points INT := 0;
  v_item RECORD; v_delivered_count INT; v_expiry TIMESTAMPTZ;
BEGIN
  SELECT user_id, total INTO v_user_id, v_order_total
  FROM public.orders WHERE id = p_order_id;
  IF v_user_id IS NULL THEN RETURN 0; END IF;
  IF EXISTS (SELECT 1 FROM public.loyalty_transactions WHERE order_id = p_order_id AND type = 'earn')
    THEN RETURN 0; END IF;

  v_amount_points := FLOOR(v_order_total)::INT;

  FOR v_item IN
    SELECT oi.quantity, p.loyalty_points
    FROM public.order_items oi JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id AND p.loyalty_points > 0
  LOOP
    v_product_bonus := v_product_bonus + (v_item.loyalty_points * v_item.quantity);
  END LOOP;

  SELECT COUNT(*) INTO v_delivered_count
  FROM public.orders WHERE user_id = v_user_id AND status = 'delivered' AND id != p_order_id;
  IF v_delivered_count = 0 THEN v_first_order_bonus := 100; END IF;

  v_total_points := v_amount_points + v_product_bonus + v_first_order_bonus;
  v_expiry := now() + INTERVAL '365 days';

  IF v_total_points > 0 THEN
    INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description, expires_at)
    VALUES (v_user_id, p_order_id, v_amount_points + v_product_bonus, 'earn',
      'Commande #' || LEFT(p_order_id::text, 8), v_expiry);
    IF v_first_order_bonus > 0 THEN
      INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description, expires_at)
      VALUES (v_user_id, p_order_id, v_first_order_bonus, 'earn', 'Bonus première commande !', v_expiry);
    END IF;
  END IF;
  RETURN v_total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 13. RLS POLICIES MANQUANTES (fix-all-rls)
-- ============================================================

-- Products : admin peut tout gérer
DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert" ON public.products FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update" ON public.products FOR UPDATE USING  (public.is_admin());
DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete" ON public.products FOR DELETE USING  (public.is_admin());

-- Categories
DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update" ON public.categories FOR UPDATE USING  (public.is_admin());
DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete" ON public.categories FOR DELETE USING  (public.is_admin());

-- Orders : admin peut update
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE USING (public.is_admin());

-- Hero slides : admin manage
DROP POLICY IF EXISTS "hero_slides_admin_manage" ON public.hero_slides;
CREATE POLICY "hero_slides_admin_manage" ON public.hero_slides FOR ALL USING (public.is_admin());


-- ============================================================
-- 14. RECHARGEMENT DU SCHEMA POSTGREST
-- ============================================================
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- RÉSUMÉ DES TABLES CRÉÉES / COLONNES AJOUTÉES
-- ============================================================
-- Tables créées (IF NOT EXISTS) :
--   product_media, reviews, home_sections, home_section_media,
--   stock_movements, push_subscriptions, notifications,
--   hero_slides, loyalty_rewards, loyalty_transactions, loyalty_tiers
--
-- Colonnes ajoutées sur products :
--   display_order, loyalty_points, featured_order, solde_hero,
--   solde_hero_order, whats_new, whats_new_order
--
-- Colonnes ajoutées sur profiles : avatar_url, adresse, ville, code_postal
-- Colonnes ajoutées sur orders   : guest_name, guest_phone, guest_address
-- Colonnes ajoutées sur categories : description, image_url
--
-- Fonctions créées / mises à jour :
--   is_admin, get_user_role, get_user_lifetime_points,
--   credit_order_loyalty_points, handle_order_item_stock,
--   handle_order_cancel_stock
-- ============================================================
