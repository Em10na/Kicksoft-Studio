-- ================================================================
-- Migration v7 — Gestion du stock
-- 1. Historique des mouvements de stock (stock_movements)
-- 2. Décrément automatique du stock à la création d'une commande
-- 3. Restauration du stock quand une commande passe en "cancelled"
-- Run this in the Supabase SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Table d'historique des mouvements de stock
-- ----------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  delta int not null,               -- négatif = sortie, positif = entrée
  reason text not null check (reason in ('vente', 'annulation', 'ajustement', 'reception')),
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_idx
  on public.stock_movements (product_id, created_at desc);

alter table public.stock_movements enable row level security;

drop policy if exists "stock_movements_admin_read" on public.stock_movements;
create policy "stock_movements_admin_read" on public.stock_movements
  for select using (public.is_admin());
drop policy if exists "stock_movements_admin_insert" on public.stock_movements;
create policy "stock_movements_admin_insert" on public.stock_movements
  for insert with check (public.is_admin());

-- ----------------------------------------------------------------
-- 2. Décrément automatique du stock à l'insertion d'un order_item
--    (security definer pour passer outre le RLS côté client/invité)
-- ----------------------------------------------------------------
create or replace function public.handle_order_item_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
    set stock = greatest(stock - new.quantity, 0)
    where id = new.product_id;

  insert into public.stock_movements (product_id, delta, reason, order_id)
    values (new.product_id, -new.quantity, 'vente', new.order_id);

  return new;
end;
$$;

drop trigger if exists on_order_item_created on public.order_items;
create trigger on_order_item_created
  after insert on public.order_items
  for each row execute function public.handle_order_item_stock();

-- ----------------------------------------------------------------
-- 3. Restauration du stock quand une commande est annulée
--    (et re-décrément si elle est réactivée)
-- ----------------------------------------------------------------
create or replace function public.handle_order_cancel_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Passage vers "cancelled" : on restitue le stock
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.products p
      set stock = p.stock + oi.quantity
      from public.order_items oi
      where oi.order_id = new.id and oi.product_id = p.id;

    insert into public.stock_movements (product_id, delta, reason, order_id)
      select oi.product_id, oi.quantity, 'annulation', new.id
      from public.order_items oi where oi.order_id = new.id;

  -- Sortie de "cancelled" : on re-décrémente
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.products p
      set stock = greatest(p.stock - oi.quantity, 0)
      from public.order_items oi
      where oi.order_id = new.id and oi.product_id = p.id;

    insert into public.stock_movements (product_id, delta, reason, order_id)
      select oi.product_id, -oi.quantity, 'vente', new.id
      from public.order_items oi where oi.order_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_status_changed on public.orders;
create trigger on_order_status_changed
  after update of status on public.orders
  for each row execute function public.handle_order_cancel_stock();
