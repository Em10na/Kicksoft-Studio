-- ============================================================
-- KICKSOFT STUDIO — Donnees de test (Seed Data)
-- Executez ce fichier dans Supabase SQL Editor apres fix-description-column.sql
-- ============================================================

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
INSERT INTO public.categories (id, name, description) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Ordinateurs portables', 'Laptops performants pour le travail et le gaming'),
  ('c1000000-0000-0000-0000-000000000002', 'Peripheriques', 'Claviers, souris, casques et accessoires'),
  ('c1000000-0000-0000-0000-000000000003', 'Reseaux & Connectivite', 'Routeurs, switches, cables et solutions Wi-Fi'),
  ('c1000000-0000-0000-0000-000000000004', 'Stockage', 'Disques durs, SSD, cles USB et NAS'),
  ('c1000000-0000-0000-0000-000000000005', 'Ecrans & Affichage', 'Moniteurs, ecrans tactiles et videoprojecteurs'),
  ('c1000000-0000-0000-0000-000000000006', 'Smartphones & Tablettes', 'Telephones et tablettes pour tous les usages')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. COLLECTIONS
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections') THEN
    INSERT INTO public.collections (id, name, description) VALUES
      ('d1000000-0000-0000-0000-000000000001', 'Meilleures ventes', 'Les produits les plus populaires'),
      ('d1000000-0000-0000-0000-000000000002', 'Nouveautes 2026', 'Les derniers arrivages'),
      ('d1000000-0000-0000-0000-000000000003', 'Selection Pro', 'Pour les professionnels et entreprises')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 3. PRODUITS
-- ============================================================
INSERT INTO public.products (id, title, slug, price, compare_price, stock, short_description, status, category_id, featured) VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Laptop ProBook 15', 'laptop-probook-15', 2499.00, 2999.00, 12, 'Ordinateur portable 15 pouces, processeur Intel i7, 16Go RAM, SSD 512Go. Ideal pour les professionnels et le multitache intensif.', 'published', 'c1000000-0000-0000-0000-000000000001', true),
  ('p1000000-0000-0000-0000-000000000002', 'Clavier Mecanique RGB K750', 'clavier-mecanique-rgb-k750', 189.00, NULL, 45, 'Clavier mecanique avec switches Cherry MX Blue, retroeclairage RGB personnalisable, repose-poignet magnetique inclus.', 'published', 'c1000000-0000-0000-0000-000000000002', true),
  ('p1000000-0000-0000-0000-000000000003', 'Souris Gaming UltraX', 'souris-gaming-ultrax', 129.00, 159.00, 30, 'Souris gaming 16000 DPI, capteur optique de precision, 8 boutons programmables, eclairage RGB.', 'published', 'c1000000-0000-0000-0000-000000000002', false),
  ('p1000000-0000-0000-0000-000000000004', 'Routeur Wi-Fi 6 MeshPro', 'routeur-wifi6-meshpro', 349.00, NULL, 18, 'Routeur tri-bande Wi-Fi 6, couverture 300m2, technologie Mesh, controle parental avance, 4 ports Gigabit.', 'published', 'c1000000-0000-0000-0000-000000000003', true),
  ('p1000000-0000-0000-0000-000000000005', 'SSD NVMe 1To UltraSpeed', 'ssd-nvme-1to-ultraspeed', 219.00, 279.00, 55, 'SSD M.2 NVMe PCIe 4.0, vitesse lecture 7000 Mo/s, ecriture 5500 Mo/s. Parfait pour booster votre PC.', 'published', 'c1000000-0000-0000-0000-000000000004', false),
  ('p1000000-0000-0000-0000-000000000006', 'Ecran 27" 4K ProDisplay', 'ecran-27-4k-prodisplay', 899.00, 1099.00, 8, 'Moniteur 27 pouces 4K UHD, dalle IPS, 100% sRGB, USB-C avec charge 65W, pivot et reglage en hauteur.', 'published', 'c1000000-0000-0000-0000-000000000005', true),
  ('p1000000-0000-0000-0000-000000000007', 'Casque Audio NC Pro', 'casque-audio-nc-pro', 299.00, NULL, 22, 'Casque sans fil a reduction de bruit active, autonomie 40h, Bluetooth 5.3, son Hi-Res certifie.', 'published', 'c1000000-0000-0000-0000-000000000002', true),
  ('p1000000-0000-0000-0000-000000000008', 'Webcam 4K StreamCam', 'webcam-4k-streamcam', 159.00, 199.00, 35, 'Webcam 4K 30fps, autofocus, correction automatique de la lumiere, double micro integre, clip universel.', 'published', 'c1000000-0000-0000-0000-000000000002', false),
  ('p1000000-0000-0000-0000-000000000009', 'Hub USB-C 10-en-1', 'hub-usbc-10-en-1', 79.00, NULL, 60, 'Hub multiport USB-C : HDMI 4K, 3x USB 3.0, SD/MicroSD, Ethernet Gigabit, charge PD 100W.', 'published', 'c1000000-0000-0000-0000-000000000003', false),
  ('p1000000-0000-0000-0000-000000000010', 'Tablette TabPro 11', 'tablette-tabpro-11', 599.00, 699.00, 15, 'Tablette 11 pouces AMOLED 120Hz, processeur octa-core, 128Go, stylet inclus, ideale pour la creation.', 'published', 'c1000000-0000-0000-0000-000000000006', false),
  ('p1000000-0000-0000-0000-000000000011', 'Disque Dur Externe 2To', 'disque-dur-externe-2to', 149.00, NULL, 40, 'Disque dur externe USB 3.2, 2To, compact et resistant aux chocs, compatible Mac et PC.', 'published', 'c1000000-0000-0000-0000-000000000004', false),
  ('p1000000-0000-0000-0000-000000000012', 'Station d''accueil Pro Dock', 'station-accueil-pro-dock', 249.00, 299.00, 10, 'Station d''accueil USB-C triple ecran, 2x HDMI, DisplayPort, 5x USB, Ethernet, charge 96W.', 'published', 'c1000000-0000-0000-0000-000000000003', false),
  ('p1000000-0000-0000-0000-000000000013', 'Laptop GamerX RTX', 'laptop-gamerx-rtx', 3499.00, NULL, 5, 'PC portable gaming 17 pouces, RTX 4070, i9-13900H, 32Go DDR5, SSD 1To, ecran 240Hz.', 'published', 'c1000000-0000-0000-0000-000000000001', false),
  ('p1000000-0000-0000-0000-000000000014', 'Imprimante Laser ProPrint', 'imprimante-laser-proprint', 449.00, NULL, 7, 'Imprimante laser couleur A4, recto-verso auto, Wi-Fi, 28 pages/min, capacite 250 feuilles.', 'published', 'c1000000-0000-0000-0000-000000000002', false),
  ('p1000000-0000-0000-0000-000000000015', 'Cle USB 256Go SecureKey', 'cle-usb-256go-securekey', 59.00, 79.00, 100, 'Cle USB 3.2 Gen 2, 256Go, boitier metal, vitesse 400 Mo/s, chiffrement hardware AES 256-bit.', 'published', 'c1000000-0000-0000-0000-000000000004', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. ARTICLES DE BLOG
-- ============================================================
INSERT INTO public.posts (id, title, slug, content, published) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Guide : Bien choisir son laptop en 2026', 'guide-choisir-laptop-2026',
   'Le choix d''un ordinateur portable depend de nombreux criteres : usage (bureautique, creation, gaming), budget, portabilite et autonomie. Voici nos conseils pour faire le bon choix.\n\n## Bureautique et travail\nPour un usage professionnel classique, privilegiez un ecran 14-15 pouces, 16Go de RAM minimum et un SSD de 512Go. La dalle IPS offre de meilleurs angles de vision.\n\n## Creation et design\nLes createurs auront besoin d''un ecran calibre (100% sRGB minimum), d''une carte graphique dediee et d''au moins 32Go de RAM pour le montage video.\n\n## Gaming\nLes joueurs doivent viser une carte graphique RTX 4060 minimum, un ecran 144Hz+ et un bon systeme de refroidissement. L''autonomie sera moindre mais les performances au rendez-vous.\n\n## Notre selection\nDecouvrez notre gamme de laptops dans la boutique, avec des modeles adaptes a chaque besoin et budget.', true),
  ('b1000000-0000-0000-0000-000000000002', 'Wi-Fi 6 vs Wi-Fi 7 : quelles differences ?', 'wifi6-vs-wifi7-differences',
   'La norme Wi-Fi evolue rapidement. Apres le Wi-Fi 6 (802.11ax) qui a democratise les connexions rapides, le Wi-Fi 7 (802.11be) arrive avec des promesses de performances encore superieures.\n\n## Wi-Fi 6 (802.11ax)\n- Debit max theorique : 9.6 Gbps\n- Technologie OFDMA pour gerer plusieurs appareils\n- Target Wake Time pour economiser la batterie\n- Ideal pour la majorite des usages actuels\n\n## Wi-Fi 7 (802.11be)\n- Debit max theorique : 46 Gbps\n- Canaux 320 MHz (double du Wi-Fi 6)\n- Multi-Link Operation (MLO) pour combiner les bandes\n- Latence ultra-faible pour le gaming et la VR\n\n## Conclusion\nLe Wi-Fi 6 reste largement suffisant pour 95% des utilisateurs. Le Wi-Fi 7 sera pertinent pour les environnements tres denses ou les usages exigeants en latence.', true),
  ('b1000000-0000-0000-0000-000000000003', 'SSD NVMe : comprendre les specifications', 'ssd-nvme-comprendre-specifications',
   'Les SSD NVMe offrent des performances impressionnantes, mais les specifications peuvent etre deroutantes. Voici un guide pour y voir plus clair.\n\n## PCIe Gen 3 vs Gen 4 vs Gen 5\nChaque generation double le debit theorique. Un SSD PCIe Gen 4 atteint 7000 Mo/s en lecture, contre 3500 Mo/s pour le Gen 3. Le Gen 5 promet 14000 Mo/s.\n\n## TBW (Terabytes Written)\nIndique l''endurance du SSD. Un TBW de 600 pour un SSD 1To signifie que vous pouvez ecrire 600 To de donnees avant usure theorique — largement suffisant pour 10+ ans d''utilisation normale.\n\n## DRAM Cache\nLes SSD avec cache DRAM offrent des performances plus constantes, surtout pour les ecritures soutenues. Privilegiez-les pour un usage professionnel.\n\n## Notre conseil\nPour la majorite des utilisateurs, un SSD NVMe PCIe Gen 4 de 1To offre le meilleur rapport performance/prix en 2026.', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. FAQ
-- ============================================================
INSERT INTO public.faqs (id, question, answer, position) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'Quels sont les delais de livraison ?', 'La livraison standard est effectuee sous 3 a 5 jours ouvrables sur tout le territoire tunisien. La livraison express (24-48h) est disponible pour Tunis et sa banlieue moyennant un supplement de 10 DT.', 0),
  ('f1000000-0000-0000-0000-000000000002', 'Comment retourner un produit ?', 'Vous disposez de 30 jours apres reception pour retourner un produit dans son emballage d''origine. Contactez notre support pour obtenir un bon de retour. Le remboursement est effectue sous 7 jours apres reception du colis retour.', 1),
  ('f1000000-0000-0000-0000-000000000003', 'La garantie couvre-t-elle les pannes ?', 'Tous nos produits beneficient d''une garantie constructeur de 2 ans minimum. Cette garantie couvre les defauts de fabrication et pannes non liees a une mauvaise utilisation. Les accessoires sont garantis 1 an.', 2),
  ('f1000000-0000-0000-0000-000000000004', 'Proposez-vous des tarifs professionnels ?', 'Oui ! Les entreprises et professionnels beneficient de tarifs degressifs selon les volumes. Rendez-vous sur notre page Devis pour obtenir une offre personnalisee sous 24h.', 3),
  ('f1000000-0000-0000-0000-000000000005', 'Quels moyens de paiement acceptez-vous ?', 'Nous acceptons les cartes bancaires (Visa, Mastercard), les virements bancaires, le paiement a la livraison (Tunis uniquement), et les bons de commande pour les entreprises.', 4),
  ('f1000000-0000-0000-0000-000000000006', 'Puis-je passer commande par telephone ?', 'Absolument ! Notre equipe commerciale est disponible du lundi au vendredi de 8h a 18h et le samedi de 9h a 13h au +216 12 345 678 pour prendre votre commande.', 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. PAGES STATIQUES
-- ============================================================
INSERT INTO public.pages (id, title, slug, content, published) VALUES
  ('g1000000-0000-0000-0000-000000000001', 'Politique de livraison', 'politique-livraison',
   'Kicksoft Studio livre sur tout le territoire tunisien.\n\n## Delais\n- Standard : 3-5 jours ouvrables\n- Express : 24-48h (Tunis et banlieue)\n\n## Tarifs\n- Gratuit pour les commandes de plus de 50 DT\n- 7 DT pour les commandes inferieures\n- Express : +10 DT\n\n## Suivi\nUn email de confirmation avec numero de suivi vous est envoye des l''expedition.', true),
  ('g1000000-0000-0000-0000-000000000002', 'Mentions legales', 'mentions-legales',
   'Kicksoft Studio SARL\nCapital : 10 000 DT\nSiege social : Tunis, Tunisie\nRegistre du commerce : XXXXXXX\nMF : XXXXXXX/A/M/000\n\nDirecteur de la publication : [Nom du gerant]\nHebergeur : Vercel Inc. / Supabase Inc.\n\nConformement a la loi tunisienne sur la protection des donnees personnelles, vous disposez d''un droit d''acces, de modification et de suppression de vos donnees.', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. NEWSLETTER (abonnes test)
-- ============================================================
INSERT INTO public.newsletter_subscribers (id, email, active) VALUES
  ('n1000000-0000-0000-0000-000000000001', 'ahmed.benali@email.com', true),
  ('n1000000-0000-0000-0000-000000000002', 'fatma.trabelsi@email.com', true),
  ('n1000000-0000-0000-0000-000000000003', 'karim.gharbi@email.com', true),
  ('n1000000-0000-0000-0000-000000000004', 'meriem.bouazizi@email.com', false),
  ('n1000000-0000-0000-0000-000000000005', 'youssef.mhamdi@email.com', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE! Vos donnees de test sont prets.
-- Vous pouvez vous connecter avec un compte admin pour tout gerer.
-- ============================================================
