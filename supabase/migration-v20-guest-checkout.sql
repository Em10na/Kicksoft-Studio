-- ================================================================
-- Migration v20 — Guest Checkout (rattrapage complet)
-- Rend la table orders compatible avec les commandes sans compte.
-- Idempotent : sûr à exécuter plusieurs fois.
-- ================================================================

-- 1. Autoriser user_id = NULL (commandes invité)
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Colonnes invité
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name    TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone   TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email   TEXT;  -- optionnel, pour récapitulatif

-- 3. Policies RLS pour les commandes invité
--    Les commandes guest (user_id IS NULL) sont insérées via service_role
--    (route API /api/orders/guest) qui bypass RLS.
--    La policy de lecture reste inchangée : owner ou admin.

-- S'assurer que la policy de lecture couvre les deux cas
DROP POLICY IF EXISTS "orders_owner_read"   ON public.orders;
DROP POLICY IF EXISTS "orders_read"         ON public.orders;
CREATE POLICY "orders_owner_read" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin()
    -- Les commandes invité (user_id IS NULL) ne sont visibles que par l'admin
  );

-- Policy insert pour les utilisateurs authentifiés (inchangée)
DROP POLICY IF EXISTS "orders_owner_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_insert"       ON public.orders;
CREATE POLICY "orders_owner_insert" ON public.orders
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    -- Note : les commandes guest sont insérées via service_role (bypass RLS)
  );

-- 4. Policy order_items : autoriser les inserts liés à une commande du même user
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
    -- Idem : les order_items guest sont insérés via service_role
  );

-- 5. Recharger le cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- ================================================================
-- Résumé
-- ================================================================
-- TABLE orders :
--   user_id      → nullable (NULL pour les commandes invité)
--   guest_name   → TEXT (prénom + nom du client invité)
--   guest_phone  → TEXT (téléphone pour la livraison)
--   guest_address→ TEXT (adresse de livraison)
--   guest_email  → TEXT (optionnel — récapitulatif par e-mail)
--
-- FLUX invité :
--   Navigateur → POST /api/orders/guest (service_role) → DB
--   Le service_role bypass RLS → user_id peut être NULL
--
-- FLUX connecté :
--   Navigateur → supabase.from("orders").insert({user_id: auth.uid(), ...})
--   RLS orders_owner_insert vérifie user_id = auth.uid() ✓
-- ================================================================
