-- ================================================================
-- MIGRATIONS EN ATTENTE (v8 → v11) — tout-en-un
-- Copiez tout ce fichier dans le Supabase SQL Editor puis « Run ».
-- Idempotent : peut être ré-exécuté sans risque.
-- ================================================================

-- ----------------------------------------------------------------
-- v8 — Notifications push (abonnements web push desktop / mobile)
-- ----------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_admin_read" on public.push_subscriptions;
create policy "push_subscriptions_admin_read" on public.push_subscriptions
  for select using (public.is_admin());

-- ----------------------------------------------------------------
-- v9 — Centre de notifications (cloche du site)
-- ----------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  url text default '/boutique',
  image text,
  tag text not null default 'info' check (tag in ('nouveau', 'solde', 'info')),
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_idx
  on public.notifications (created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_public_read" on public.notifications;
create policy "notifications_public_read" on public.notifications
  for select using (true);

-- ----------------------------------------------------------------
-- v10 — Articles soldés mis en avant dans le slider d'accueil
-- ----------------------------------------------------------------
alter table public.products
  add column if not exists solde_hero boolean not null default false;

create index if not exists products_solde_hero_idx
  on public.products (solde_hero)
  where solde_hero = true;

-- ----------------------------------------------------------------
-- v11 — Statut d'envoi de la notification de solde (admin)
-- ----------------------------------------------------------------
alter table public.products
  add column if not exists solde_notified_at timestamptz;
