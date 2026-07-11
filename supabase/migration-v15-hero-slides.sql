-- Slides gérés manuellement par l'admin pour le carrousel hero de l'accueil.
-- Priorité sur les slides générés depuis les produits solde_hero.
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL DEFAULT '',
  tagline       text,
  badge         text,
  image_url     text,
  video_url     text,
  buy_href      text        NOT NULL DEFAULT '/boutique',
  more_href     text        NOT NULL DEFAULT '/boutique',
  display_order integer     NOT NULL DEFAULT 0,
  visible       boolean     NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_slides_public_read"  ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "hero_slides_auth_manage"  ON public.hero_slides FOR ALL    USING (auth.role() = 'authenticated');
