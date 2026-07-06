-- ================================================================
-- Migration v9 — Centre de notifications (cloche du site)
-- Chaque notification envoyée (nouveau produit, solde, annonce)
-- est archivée ici et affichée dans la cloche du header, comme
-- sur Temu / Shein. Écriture via service role uniquement.
-- Run this in the Supabase SQL Editor
-- ================================================================

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

-- Lecture publique (ce sont des annonces boutique), écriture service role
drop policy if exists "notifications_public_read" on public.notifications;
create policy "notifications_public_read" on public.notifications
  for select using (true);
