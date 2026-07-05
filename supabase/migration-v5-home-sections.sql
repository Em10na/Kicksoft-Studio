-- ================================================================
-- Migration v5 — Sections média de la page d'accueil
-- 3 sections gérées depuis l'admin : suggestion / recommandation /
-- solde, chacune avec plusieurs médias (images ou vidéos) et un
-- état visible / masqué.
-- Run this in the Supabase SQL Editor
-- ================================================================

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  section text not null unique check (section in ('suggestion', 'recommandation', 'solde')),
  title text not null default '',
  tagline text default '',
  cta_label text default 'Acheter',
  cta_href text default '/boutique',
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.home_section_media (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.home_sections(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  poster_url text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists home_section_media_idx
  on public.home_section_media (section_id, display_order);

-- RLS : lecture publique, écriture admin (même modèle que categories)
alter table public.home_sections enable row level security;
alter table public.home_section_media enable row level security;

drop policy if exists "home_sections_public_read" on public.home_sections;
create policy "home_sections_public_read" on public.home_sections for select using (true);
drop policy if exists "home_sections_admin_manage" on public.home_sections;
create policy "home_sections_admin_manage" on public.home_sections for all using (public.is_admin());

drop policy if exists "home_section_media_public_read" on public.home_section_media;
create policy "home_section_media_public_read" on public.home_section_media for select using (true);
drop policy if exists "home_section_media_admin_manage" on public.home_section_media;
create policy "home_section_media_admin_manage" on public.home_section_media for all using (public.is_admin());

-- Seed : reprend le contenu actuellement codé en dur sur la home
insert into public.home_sections (section, title, tagline, cta_label, cta_href, visible) values
  ('suggestion',     'Caméra Cinéma Pro',        'Filmez comme un professionnel',                                'Acheter', '/boutique?q=camera', true),
  ('recommandation', 'DJI Série Professionnelle', 'Précision, autonomie et performance. La référence mondiale de la capture aérienne.', 'Acheter maintenant', '/boutique', true),
  ('solde',          'Caméra d''Action 6 Pro',    'La caméra d''action à la qualité d''image révolutionnaire',    'Acheter', '/boutique?q=action', true)
on conflict (section) do nothing;

insert into public.home_section_media (section_id, media_type, url, poster_url, display_order)
select s.id, m.media_type, m.url, m.poster_url, m.display_order
from public.home_sections s
join (values
  ('suggestion',     'video', 'https://videos.pexels.com/video-files/2890196/2890196-hd_1920_1080_30fps.mp4', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600&q=85&auto=format&fit=crop', 0),
  ('recommandation', 'video', '/front/videos/dji-product.mp4', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1920&q=80&auto=format&fit=crop', 0),
  ('solde',          'image', 'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1600&q=85&auto=format&fit=crop', null, 0)
) as m(section, media_type, url, poster_url, display_order)
  on m.section = s.section
where not exists (
  select 1 from public.home_section_media hm where hm.section_id = s.id
);
