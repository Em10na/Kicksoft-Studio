-- ================================================================
-- Migration v10 — Gestion des articles soldés
-- `solde_hero` : le produit soldé est mis en avant dans le slider
-- (vidéos / images) de la première partie de la page d'accueil.
-- Run this in the Supabase SQL Editor
-- ================================================================

alter table public.products
  add column if not exists solde_hero boolean not null default false;

create index if not exists products_solde_hero_idx
  on public.products (solde_hero)
  where solde_hero = true;
