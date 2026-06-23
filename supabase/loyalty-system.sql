-- ============================================================
-- KICKSOFT — Systeme de Fidelite Complet (v2)
-- Niveaux Bronze/Argent/Or/Platine + Points par DT + Bonus
-- Executez dans Supabase SQL Editor
-- ============================================================

-- 1. Colonne loyalty_points sur produits (bonus par produit)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

-- 2. Table des recompenses (paliers admin)
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'gift',
  reduction_value NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des transactions (historique complet)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter expires_at si la table existe deja sans cette colonne
ALTER TABLE public.loyalty_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 4. Table des niveaux de fidelite
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  min_points INTEGER NOT NULL DEFAULT 0,
  discount_pct INTEGER NOT NULL DEFAULT 0,
  free_shipping BOOLEAN DEFAULT false,
  description TEXT,
  color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserer les 4 niveaux
INSERT INTO public.loyalty_tiers (name, slug, min_points, discount_pct, free_shipping, description, color, position) VALUES
  ('Bronze', 'bronze', 0, 0, false, 'Niveau de depart. Commencez a cumuler des points !', '#CD7F32', 0),
  ('Argent', 'argent', 500, 5, false, '5% de reduction sur toutes vos commandes.', '#9CA3AF', 1),
  ('Or', 'or', 1500, 10, true, '10% de reduction + livraison gratuite.', '#F59E0B', 2),
  ('Platine', 'platine', 3000, 15, true, '15% de reduction + livraison gratuite + offres exclusives.', '#818CF8', 3)
ON CONFLICT (slug) DO UPDATE SET
  min_points = EXCLUDED.min_points,
  discount_pct = EXCLUDED.discount_pct,
  free_shipping = EXCLUDED.free_shipping,
  description = EXCLUDED.description,
  color = EXCLUDED.color;

-- 5. RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- Tiers : lecture publique
DROP POLICY IF EXISTS "loyalty_tiers_read" ON public.loyalty_tiers;
CREATE POLICY "loyalty_tiers_read" ON public.loyalty_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "loyalty_tiers_admin" ON public.loyalty_tiers;
CREATE POLICY "loyalty_tiers_admin" ON public.loyalty_tiers FOR ALL USING (public.is_admin());

-- Rewards
DROP POLICY IF EXISTS "loyalty_rewards_public_read" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_public_read" ON public.loyalty_rewards
  FOR SELECT USING (active = true OR public.is_admin());
DROP POLICY IF EXISTS "loyalty_rewards_admin_insert" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_insert" ON public.loyalty_rewards FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "loyalty_rewards_admin_update" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_update" ON public.loyalty_rewards FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS "loyalty_rewards_admin_delete" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_admin_delete" ON public.loyalty_rewards FOR DELETE USING (public.is_admin());

-- Transactions
DROP POLICY IF EXISTS "loyalty_tx_read" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_read" ON public.loyalty_transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "loyalty_tx_insert" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_insert" ON public.loyalty_transactions FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "loyalty_tx_admin_manage" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx_admin_manage" ON public.loyalty_transactions FOR ALL USING (public.is_admin());

-- 6. Fonction : total lifetime points (pour determiner le tier)
CREATE OR REPLACE FUNCTION public.get_user_lifetime_points(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.loyalty_transactions
  WHERE user_id = p_user_id AND points > 0;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. Fonction : crediter points a la livraison (v2)
-- Calcul : (total * 1 pt/DT) + SUM(product.loyalty_points * qty) + bonus 1ere commande
CREATE OR REPLACE FUNCTION public.credit_order_loyalty_points(p_order_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_order_total NUMERIC;
  v_product_bonus INTEGER := 0;
  v_amount_points INTEGER := 0;
  v_first_order_bonus INTEGER := 0;
  v_total_points INTEGER := 0;
  v_item RECORD;
  v_delivered_count INTEGER;
  v_expiry TIMESTAMPTZ;
BEGIN
  SELECT user_id, total INTO v_user_id, v_order_total
  FROM public.orders WHERE id = p_order_id;
  IF v_user_id IS NULL THEN RETURN 0; END IF;

  -- Idempotent : ne crediter qu'une fois
  IF EXISTS (
    SELECT 1 FROM public.loyalty_transactions
    WHERE order_id = p_order_id AND type = 'earn'
  ) THEN RETURN 0; END IF;

  -- Points par montant depense (1 pt / DT)
  v_amount_points := FLOOR(v_order_total)::INTEGER;

  -- Bonus par produit
  FOR v_item IN
    SELECT oi.quantity, p.loyalty_points
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id AND p.loyalty_points > 0
  LOOP
    v_product_bonus := v_product_bonus + (v_item.loyalty_points * v_item.quantity);
  END LOOP;

  -- Bonus premiere commande livree
  SELECT COUNT(*) INTO v_delivered_count
  FROM public.orders
  WHERE user_id = v_user_id AND status = 'delivered' AND id != p_order_id;
  IF v_delivered_count = 0 THEN
    v_first_order_bonus := 100;
  END IF;

  v_total_points := v_amount_points + v_product_bonus + v_first_order_bonus;
  v_expiry := now() + INTERVAL '365 days';

  IF v_total_points > 0 THEN
    INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description, expires_at)
    VALUES (v_user_id, p_order_id, v_amount_points + v_product_bonus, 'earn',
            'Commande #' || LEFT(p_order_id::text, 8) || ' (' || v_amount_points || ' pts achat + ' || v_product_bonus || ' pts bonus produit)',
            v_expiry);

    IF v_first_order_bonus > 0 THEN
      INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description, expires_at)
      VALUES (v_user_id, p_order_id, v_first_order_bonus, 'earn',
              'Bonus premiere commande !', v_expiry);
    END IF;
  END IF;

  RETURN v_total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Donnees de test recompenses
INSERT INTO public.loyalty_rewards (name, description, points_required, reward_type, reduction_value, active) VALUES
  ('5 DT de reduction', 'Echangez 100 points contre 5 DT de remise', 100, 'reduction', 5.00, true),
  ('10 DT de reduction', 'Echangez 200 points contre 10 DT de remise', 200, 'reduction', 10.00, true),
  ('Livraison gratuite', 'Echangez 500 points pour une livraison offerte', 500, 'gift', NULL, true),
  ('Accessoire offert', 'Echangez 1000 points pour un accessoire premium', 1000, 'gift', NULL, true)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
