-- ================================================================
-- Migration v11 — Statut d'envoi de la notification de solde
-- L'admin contrôle l'envoi : la notification (cloche + push +
-- email) ne part que lorsqu'il clique « Envoyer » sur la page
-- Admin → Soldes. La date d'envoi sert de statut.
-- Run this in the Supabase SQL Editor
-- ================================================================

alter table public.products
  add column if not exists solde_notified_at timestamptz;
