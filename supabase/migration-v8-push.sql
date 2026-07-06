-- ================================================================
-- Migration v8 — Notifications push (web push desktop / mobile)
-- Stocke les abonnements des visiteurs ; l'écriture passe par les
-- routes API (service role), donc aucune policy publique n'est
-- nécessaire.
-- Run this in the Supabase SQL Editor
-- ================================================================

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
