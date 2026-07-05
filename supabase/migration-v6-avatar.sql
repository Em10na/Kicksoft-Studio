-- ================================================================
-- Migration v6 — Photo de profil
-- Ajoute la colonne avatar_url aux profils (upload depuis /compte/profil)
-- Run this in the Supabase SQL Editor
-- ================================================================

alter table public.profiles add column if not exists avatar_url text;
