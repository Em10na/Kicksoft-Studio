# RAPPORT DE STAGE
## Développement d'une Plateforme E-Commerce Full-Stack
### DJI Store TN — Kicksoft

---

**Stagiaire :** *(Prénom NOM)*
**Filière :** Licence / Master en Informatique — Génie Logiciel
**Établissement :** *(Nom de l'université / école)*
**Entreprise d'accueil :** Kicksoft / DJI Store TN
**Maître de stage :** *(Nom du responsable)*
**Période de stage :** 15 juin 2026 — 31 juillet 2026 (6 semaines et demie)

---

## TABLE DES MATIÈRES

1. Remerciements
2. Résumé
3. Introduction
4. Présentation de l'entreprise
5. Environnement technique
6. Architecture du projet
7. Réalisations
   - 7.1 Tableau de bord administrateur
   - 7.2 Gestion de la page d'accueil
   - 7.3 Gestion des articles en solde
   - 7.4 Gestion des produits vedettes (Suggestions)
   - 7.5 Section « Quoi de neuf »
   - 7.6 Carrousel hero (Hero Slider)
   - 7.7 Synchronisation front-end / back-end
   - 7.8 Système de notifications push
   - 7.9 Fonctionnalités transverses
8. Difficultés rencontrées et solutions
9. Compétences acquises
10. Conclusion et perspectives
11. Annexes

---

## 1. REMERCIEMENTS

Je tiens à exprimer ma sincère gratitude à l'ensemble de l'équipe de Kicksoft pour m'avoir accueilli et accompagné tout au long de ce stage. Je remercie particulièrement mon maître de stage pour sa disponibilité, ses conseils avisés et la confiance qu'il m'a accordée en me confiant des missions à forte valeur ajoutée dès les premières semaines.

Je remercie également mon établissement de formation pour avoir rendu ce stage possible et pour la qualité de la formation théorique qui m'a permis d'aborder ce projet avec les bases solides nécessaires.

---

## 2. RÉSUMÉ

Ce rapport présente les travaux réalisés durant mon stage de six semaines et demie au sein de Kicksoft, entreprise tunisienne spécialisée dans la distribution de matériel audiovisuel professionnel (drones, caméras, équipements DJI).

Mon rôle principal a consisté à concevoir et développer une plateforme e-commerce complète appelée **DJI Store TN**, couvrant à la fois l'interface boutique accessible aux clients et un tableau de bord administrateur permettant la gestion intégrale du contenu, des produits, des commandes et des promotions.

Le projet repose sur une stack moderne : **Next.js 16** (App Router), **React 19**, **TypeScript 5**, **Supabase** (PostgreSQL + Storage + Auth) et **Tailwind CSS v4**. Il intègre des fonctionnalités avancées telles qu'un système de fidélité à quatre niveaux, des notifications push web, une recherche visuelle par intelligence artificielle et un chatbot de recommandation produit.

**Mots-clés :** Next.js, React, TypeScript, Supabase, PostgreSQL, E-commerce, Admin Dashboard, PWA, Web Push, Loyalty System.

---

## 3. INTRODUCTION

Le commerce en ligne connaît une croissance soutenue en Tunisie, portée par l'augmentation du taux de pénétration d'Internet et l'évolution des habitudes de consommation. Dans ce contexte, Kicksoft a souhaité se doter d'une vitrine numérique moderne et performante pour commercialiser ses produits DJI (drones, caméras d'action, gimbals, équipements audio).

L'objectif du stage était de réaliser, de bout en bout, une plateforme e-commerce full-stack. Le projet comprend :

- Un **front-end client** (boutique, fiche produit, panier, compte utilisateur, page d'accueil dynamique)
- Un **tableau de bord administrateur** complet (gestion des produits, commandes, catégories, contenu de la page d'accueil, promotions, fidélité, notifications)
- Une **API REST** (Next.js API Routes) gérant les commandes invités, les avis, les notifications push et la revalidation ISR
- Une **base de données relationnelle** (Supabase/PostgreSQL) avec 20+ tables, Row Level Security, et un système de migrations versionnées (v1 → v16)

Ce rapport décrit les choix techniques, l'architecture retenue, les fonctionnalités implémentées et les enseignements tirés de cette expérience.

---

## 4. PRÉSENTATION DE L'ENTREPRISE

### 4.1 Identité

**Kicksoft** est une entreprise tunisienne opérant dans le domaine de la distribution d'équipements audiovisuels professionnels. Elle commercialise sous la marque **DJI Store TN** des produits de la gamme DJI : drones (Mavic, Air, Mini), caméras d'action (Action 4, Osmo), caméras portables (Osmo Pocket), gimbals, équipements audio, systèmes d'éclairage et accessoires.

- **Site web :** djistoretn.netlify.app
- **Contact :** +216 58 688 955 (WhatsApp)
- **Positionnement :** Revendeur spécialisé haut de gamme, ciblant aussi bien les professionnels (cinéastes, photographes, opérateurs de drone) que les amateurs éclairés

### 4.2 Contexte du stage

Face à l'absence d'une solution e-commerce adaptée à leurs besoins spécifiques (gestion avancée des promotions, programme de fidélité personnalisé, notifications push pour les soldes), l'entreprise a décidé de développer une plateforme sur mesure. Le stage s'inscrit dans ce projet de transformation numérique.

---

## 5. ENVIRONNEMENT TECHNIQUE

### 5.1 Stack technologique

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| **Framework** | Next.js | 16.2.9 | App Router, SSR, ISR, API Routes |
| **UI Library** | React | 19.2.4 | Composants réactifs |
| **Typage** | TypeScript | 5 | Sécurité des types |
| **CSS** | Tailwind CSS | 4 | Styles utilitaires |
| **BDD / Auth** | Supabase | 2.108.2 | PostgreSQL + Auth + Storage |
| **SSR Supabase** | @supabase/ssr | 0.12.0 | Client serveur Next.js |
| **Push Notifs** | web-push | 3.6.7 | Notifications VAPID |
| **Déploiement** | Netlify | — | Hébergement + CDN |
| **Emails** | Resend API | — | Notifications email |

### 5.2 Outils de développement

- **IDE :** Visual Studio Code + Claude Code (assistant IA intégré)
- **Versionnement :** Git (branche `develop` → `main` pour la production)
- **Base de données :** Supabase Studio (interface web), SQL Editor pour les migrations
- **Tests :** TypeScript strict mode, ESLint 9

### 5.3 Architecture de déploiement

```
Utilisateur
    │
    ▼
Netlify CDN (Edge Network)
    │
    ▼
Next.js App Router (Netlify Plugin)
    ├── Server Components (SSR / force-dynamic)
    ├── Client Components ("use client")
    └── API Routes
          │
          ▼
      Supabase
      ├── PostgreSQL (20+ tables, RLS)
      ├── Auth (JWT, sessions)
      └── Storage (bucket "media" — images, vidéos)
```

---

## 6. ARCHITECTURE DU PROJET

### 6.1 Structure des dossiers

```
kicksoft-web/
├── app/
│   ├── (front)/            # Pages publiques (boutique)
│   │   ├── page.tsx        # Page d'accueil (Server Component)
│   │   ├── boutique/       # Catalogue produits
│   │   ├── produit/[id]/   # Fiche produit
│   │   ├── panier/         # Panier
│   │   ├── compte/         # Espace client
│   │   └── components/     # 28 composants front-end
│   ├── admin/              # Dashboard administrateur
│   │   ├── accueil/        # Gestion page d'accueil
│   │   ├── produits/       # Gestion produits
│   │   ├── categories/     # Gestion catégories
│   │   ├── soldes/         # Gestion articles en solde
│   │   ├── commandes/      # Gestion commandes
│   │   ├── stock/          # Gestion stock
│   │   ├── utilisateurs/   # Gestion utilisateurs
│   │   ├── fidelite/       # Gestion fidélité
│   │   └── rapports/       # Rapports & analyses
│   ├── api/                # Routes API (9 endpoints)
│   └── auth/               # Pages authentification
├── lib/
│   ├── supabase/           # Clients Supabase (client, server, admin)
│   ├── cart.tsx            # Context panier (localStorage)
│   ├── loyalty-config.ts   # Configuration fidélité
│   ├── moderation.ts       # Filtre de modération des avis
│   └── sentiment.ts        # Analyse de sentiment
├── supabase/               # Migrations SQL (v1 → v16)
└── public/                 # Assets statiques (PWA, images, vidéos)
```

### 6.2 Modèle de données principal

Le schéma de base de données comprend 20+ tables organisées en 5 domaines fonctionnels :

**Catalogue :** `products`, `categories`, `collections`, `product_media`

**Commerce :** `orders`, `order_items`, `stock_movements`, `wishlist`

**Fidélité :** `loyalty_tiers`, `loyalty_transactions`, `loyalty_rewards`

**Contenu :** `home_sections`, `home_section_media`, `hero_slides`, `faq`, `pages`, `posts`

**Utilisateurs & Notifications :** `profiles`, `push_subscriptions`, `notifications`, `newsletter_subscribers`, `tickets_support`

### 6.3 Sécurité des données

Toutes les tables sont protégées par des politiques **Row Level Security (RLS)** PostgreSQL :
- Lecture publique pour les données non sensibles (produits, catégories, sections)
- Lecture privée pour les données utilisateur (commandes, profil, points)
- Écriture réservée aux rôles `admin` / `manager` pour les données sensibles
- Chaque client ne voit que ses propres données (ordres, transactions de fidélité)

---

## 7. RÉALISATIONS

### 7.1 Tableau de bord administrateur

L'ensemble du tableau de bord a été conçu pour être utilisable sans formation technique préalable. Il comprend :

- **Sidebar de navigation** avec 4 sections : Tableau de bord, Boutique, Clients, Contenu
- **Header dynamique** affichant le titre de la page courante et un lien direct vers la boutique
- **Thème cohérent** avec des classes CSS custom préfixées `ak-*` (admin-kicksoft)
- **Responsive mobile** avec sidebar en overlay sur petits écrans
- **Authentification sécurisée** — les routes `/admin/*` sont protégées par le middleware Next.js qui vérifie le rôle Supabase

### 7.2 Gestion de la page d'accueil

La page `/admin/accueil` est la pièce centrale du dashboard. Elle permet de contrôler quatre zones distinctes de la page d'accueil publique :

#### Carrousel Hero (slides manuels)

L'admin peut créer, modifier, supprimer et réordonner des slides hero :
- **Upload de fichiers** (image + vidéo) via Supabase Storage avec barre de progression
- **Sélection de lien** : menu déroulant natif `<select>` avec `<optgroup>` regroupant toutes les catégories et leurs produits — évite la saisie manuelle d'URL
- **Réordonnancement direct** : sélecteur de position `#1`, `#2`, `#3`… par `<select>` — un clic suffit pour déplacer un slide en position souhaitée (algorithme de réarrangement complet via `Promise.all`)
- **Visibilité par slide** : toggle visible/masqué sans suppression

#### Section Suggestions

Gestion des produits "vedettes" affichés sous la bannière Suggestions :
- **Étagère horizontale scrollable** montrant les produits sélectionnés avec leur image, titre et prix — UX identique sur PC et mobile
- **Ajout par liste déroulante** : `<select>` natif avec `<optgroup>` par catégorie, affichant tous les produits publiés
- **Position directe** : sélecteur `#1`, `#2`… sur chaque carte produit (réordonnancement complet en base avec `featured_order`)

#### Section Articles en Solde

Gestion des produits affichés dans la bannière soldes :
- **Liste ordonnée des articles solde_hero** avec image, titre, prix barré et badge % de remise
- **Ajout par `<select>` à optgroups** : uniquement les produits ayant un `compare_price` (en solde), groupés par catégorie, excluant ceux déjà ajoutés
- **Position directe** via sélecteur de position (même algorithme que les slides)
- **Médias de la bannière** : upload d'images/vidéos qui deviennent le fond de la bannière (priorité sur l'image auto-synchronisée depuis les produits)

#### Section « Quoi de neuf »

- **Liste ordonnée des produits épinglés** avec sélecteur de position `#1`, `#2`…
- **Réinitialisation** : retour au mode automatique (dernier article par catégorie)
- **Combobox de recherche** pour épingler de nouveaux produits rapidement

### 7.3 Gestion des articles en solde

Page dédiée `/admin/soldes` permettant de gérer les promotions :

**Table des articles soldés :**

| Colonne | Contenu |
|---|---|
| Ordre | ▲/▼ pour réordonner |
| Image | Miniature produit |
| Nom | Titre tronqué si long |
| Prix | Prix actuel en DT |
| Prix barré | `compare_price` avec mise en forme strikethrough |
| Catégorie | Nom de la catégorie |
| Statut | Badge notification envoyée / bouton renvoyer |
| Actions | Modifier / Supprimer |

**Modal d'ajout :**
- Sélection du produit via `<select>` à optgroups (Boutique → Catégories → Produits)
- Saisie du prix barré (compare_price) avec calcul automatique du % de remise et du prix soldé résultant
- **Notification automatique** : dès qu'un article est ajouté, une notification push + email est envoyée à tous les abonnés via `/api/push/notify`

### 7.4 Gestion des produits

Page `/admin/produits` avec CRUD complet :
- Formulaire de création/édition : titre, catégorie, prix, stock, description courte, statut, points de fidélité, position d'affichage
- Upload media multiple (images + vidéos) avec aperçu
- Table avec colonnes : Image, Nom, Prix, Stock, Catégorie, Statut, Position, Actions
- Filtrage et recherche en temps réel

### 7.5 Système de fidélité

Système à **4 niveaux** implémenté dans `loyalty-config.ts` et la table `loyalty_tiers` :

| Niveau | Points requis | Avantage |
|---|---|---|
| Bronze | 0 pt | — |
| Argent | 500 pts | 5% de réduction |
| Or | 1500 pts | 10% + livraison gratuite |
| Platine | 3000 pts | 15% + livraison gratuite |

**Règles d'acquisition :**
- 1 point par dinar dépensé
- Points bonus par produit (configurable)
- +100 points à la première commande
- Expiration après 365 jours
- Rédemption : 100 pts = 5 DT de réduction ou cadeau

### 7.6 Notifications Push Web

Implémentation complète du standard **Web Push (VAPID)** :
- Abonnement via Service Worker (`sw.js`) + bouton cloche (`NotificationBell.tsx`)
- Table `push_subscriptions` en base pour persister les endpoints
- API `/api/push/notify` : envoi en parallèle à tous les abonnés + archivage en base + email BCC via Resend
- **Déclenchement automatique** à l'ajout d'un article en solde
- Notifications typées : `nouveau` (nouveau produit), `solde` (promotion), `info` (annonce)

### 7.7 Fonctionnalités avancées

#### Recherche visuelle (Visual Search)
- Composant `VisualSearch.tsx` permettant à l'utilisateur de photographier ou uploader une image
- Classification via **TensorFlow.js / MobileNet** (côté client, sans serveur GPU)
- Extraction des mots-clés → recherche dans le catalogue Supabase
- API `/api/visual-search` pour la correspondance terme ↔ produit

#### Chatbot de recommandation
- Composant `ChatBot.tsx` guidant l'utilisateur par cas d'usage (vlog, voyage, sport, événements, professionnel, aérien)
- Recommandation de produits adaptés au budget et à l'usage déclaré

#### Analyse de sentiment des avis
- `sentiment.ts` : analyse lexicale FR/EN avec gestion de la négation et des intensifieurs
- Fusion texte + note (1-5 étoiles) pour score composite
- Modération automatique via `moderation.ts` (filtre de profanités FR/EN, leetspeak, dialectal)

### 7.8 Synchronisation front-end / back-end

**Problème identifié :** Les modifications dans l'admin ne se reflétaient pas immédiatement sur le front-end en production (cache CDN Netlify).

**Solution mise en place :**
1. `export const dynamic = "force-dynamic"` sur la page d'accueil → rendu serveur à chaque requête
2. Route `/api/revalidate` appelée automatiquement après chaque mutation admin → invalidation du cache Next.js
3. Corrections de requêtes : `promoPool` (articles en solde) maintenant filtré sur `solde_hero = true` et trié par `solde_hero_order` ; `pinnedNew` trié par `whats_new_order`

### 7.9 PWA & Mobile

- **Manifest.json** configuré (nom, icônes 192/512px, thème sombre, affichage standalone)
- **Service Worker** (`sw.js`) pour la mise en cache hors-ligne et les notifications push
- **Interface mobile-first** : barre de navigation inférieure, swipe-to-delete sur le panier, overlay pour la sidebar admin

---

## 8. DIFFICULTÉS RENCONTRÉES ET SOLUTIONS

### 8.1 Colonnes de migration manquantes

**Problème :** Les premières requêtes Supabase échouaient silencieusement lorsque certaines colonnes issues de migrations récentes (`featured_order`, `solde_hero_order`, `whats_new_order`) n'étaient pas encore créées en base.

**Solution :** Implémentation d'un système de fallback dans `chargerProduits()` : tentative avec toutes les colonnes, puis repli sur une requête réduite en cas d'erreur, avec valeurs par défaut à 0.

```ts
if (error) {
  // Colonnes de migration absentes — repli
  const { data: fallback } = await supabase
    .from("products")
    .select("id, title, price, featured, status, compare_price, solde_hero, whats_new, image_url, category_id")
    ...
  setProduits((fallback ?? []).map((p) => ({
    ...p, featured_order: 0, solde_hero_order: 0, whats_new_order: 0
  })));
}
```

### 8.2 Race condition combobox (blur/mousedown)

**Problème :** Dans les menus déroulants personnalisés, le clic sur une option déclenchait l'événement `onBlur` de l'input avant `onClick` de l'option, fermant le menu avant l'exécution de l'action.

**Solution :** Remplacement de `onClick` par `onMouseDown` avec `e.preventDefault()` sur les boutons d'options, empêchant l'input de perdre le focus avant l'exécution.

```ts
onMouseDown={(e) => {
  e.preventDefault(); // empêche le blur
  toggleFeatured(p.id);
}}
```

### 8.3 Produits sans catégorie dans les sélecteurs

**Problème :** Les produits dont la catégorie avait été supprimée n'apparaissaient dans aucun `<optgroup>`, les rendant inaccessibles dans les listes déroulantes.

**Solution :** Utilisation d'un `Set<string>` des IDs de catégories valides, avec `<optgroup label="Sans catégorie">` de repli pour les produits orphelins.

```ts
const validCatIds = new Set(categories.map((c) => c.id));
const orphans = produits.filter(
  (p) => !p.category_id || !validCatIds.has(p.category_id)
);
```

### 8.4 Cache CDN en production

**Problème :** Les modifications admin n'étaient pas visibles sur le site public après déploiement sur Netlify — les pages étaient servies depuis le cache CDN.

**Solution :** Double mécanisme : `force-dynamic` pour désactiver le SSG sur la page d'accueil, et une route de revalidation `/api/revalidate` appelée après chaque mutation en base depuis l'admin.

### 8.5 Complexité du réordonnancement

**Problème :** L'algorithme de swap (échange de deux positions) fonctionnait avec des `display_order` uniques mais créait des incohérences si des valeurs étaient dupliquées (ex. : deux produits à `order=0` après ajout).

**Solution :** Passage à un algorithme de **réordonnancement complet** : recomposition du tableau complet et `Promise.all` pour mettre à jour tous les indices en une opération atomique.

```ts
const [moved] = ordered.splice(fromIdx, 1);
ordered.splice(newIdx, 0, moved);
await Promise.all(
  ordered.map((p, i) =>
    supabase.from("products").update({ featured_order: i + 1 }).eq("id", p.id)
  )
);
```

---

## 9. COMPÉTENCES ACQUISES

### Compétences techniques

| Domaine | Compétences développées |
|---|---|
| **Next.js App Router** | Server/Client Components, API Routes, Middleware, ISR, force-dynamic, revalidatePath |
| **React 19** | Hooks (useState, useEffect, useRef), gestion d'état, composants contrôlés |
| **TypeScript** | Typage strict, types utilitaires, interfaces, inférence de types Supabase |
| **Supabase** | Requêtes complexes, RLS, Storage (upload/URL publique), Auth (JWT, sessions SSR), migrations SQL |
| **PostgreSQL** | Conception de schéma relationnel, index, triggers, Row Level Security, politiques par rôle |
| **Web Push / PWA** | VAPID, Service Workers, manifest.json, `push_subscriptions`, envoi multi-destinataires |
| **UI/UX** | Composants natifs HTML (`<select>`, `<optgroup>`), responsive design, accessibilité |
| **Architecture** | Séparation des responsabilités (Server/Client), patterns Repository, fallback queries |

### Compétences transversales

- **Gestion de projet** : Livraison itérative de fonctionnalités en autonomie
- **Communication** : Reformulation des besoins métier en spécifications techniques
- **Documentation** : Rédaction de migrations SQL versionnées avec commentaires
- **Débogage** : Analyse de silences d'erreur Supabase, race conditions, problèmes de cache
- **Adaptabilité** : Prise en main rapide d'une codebase existante et d'un nouveau framework (Next.js 16)

---

## 10. CONCLUSION ET PERSPECTIVES

Ce stage m'a permis de mener un projet e-commerce complet, de la conception de la base de données jusqu'au déploiement en production, en passant par le développement d'une interface d'administration sophistiquée. La plateforme DJI Store TN est aujourd'hui opérationnelle sur [djistoretn.netlify.app](https://djistoretn.netlify.app) et gère l'ensemble du cycle de vie du commerce : catalogue, commandes, fidélité, promotions et notifications.

### Apports personnels

Ce projet m'a confronté à des problématiques réelles de développement web moderne : gestion du cache en production, synchronisation temps réel entre admin et front, sécurité des données (RLS), et expérience utilisateur sur mobile. Ces défis m'ont permis de consolider mes compétences full-stack et de me familiariser avec des technologies de pointe (Next.js App Router, React 19, Supabase).

### Perspectives d'évolution

Plusieurs fonctionnalités sont envisagées pour la suite du développement :

1. **Paiement en ligne** : Intégration d'une passerelle de paiement locale (Konnect, Flouci) ou internationale (Stripe)
2. **Application mobile** : Version React Native ou PWA installable pour iOS/Android
3. **Analytics avancés** : Dashboard de rapports avec graphiques de ventes, taux de conversion, analyse des produits les plus consultés
4. **Internationalisation** : Support complet de l'arabe (RTL) avec `next-intl`
5. **Programme d'affiliation** : Système de codes promo et de parrainage pour les revendeurs
6. **Intelligence artificielle** : Amélioration du chatbot avec un LLM (Claude/GPT) pour des recommandations plus fines

---

## 11. ANNEXES

### Annexe A — Schéma de la base de données (résumé)

```
products ────────────────────────────────────────────────────
  id, title, price, compare_price, stock, status
  featured, featured_order
  solde_hero, solde_hero_order
  whats_new, whats_new_order
  loyalty_points, display_order
  image_url, category_id, created_at
  
categories ──────────────────────────────────────────────────
  id, name, slug, description, image_url

orders / order_items ────────────────────────────────────────
  id, user_id, total, status
  order_items: order_id, product_id, quantity, unit_price

hero_slides ─────────────────────────────────────────────────
  id, title, tagline, badge
  image_url, video_url, buy_href, more_href
  display_order, visible

home_sections / home_section_media ──────────────────────────
  section: "suggestion" | "recommandation" | "solde"
  title, tagline, cta_label, cta_href, visible
  media: section_id, media_type, url, poster_url, display_order
```

### Annexe B — Endpoints API

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/push/subscribe` | POST/DELETE | Gestion des abonnements push |
| `/api/push/notify` | POST | Envoi de notifications (push + email) |
| `/api/reviews` | GET/POST | Avis produits avec modération |
| `/api/visual-search` | POST | Recherche par image (MobileNet) |
| `/api/orders/guest` | POST | Commande sans compte |
| `/api/assistant` | POST | Recommandation produit par IA |
| `/api/auth/signout` | POST | Déconnexion |
| `/api/admin/create-user` | POST | Création d'utilisateur (admin) |
| `/api/revalidate` | POST | Invalidation du cache Next.js |

### Annexe C — Commandes Git

```bash
# Branches
git checkout develop    # branche de développement
git checkout main       # branche de production (déclenchement deploy Netlify)

# Workflow
git add .
git commit -m "feat: description de la fonctionnalité"
git push origin develop

# Merge en production
git checkout main && git merge develop && git push origin main
```

### Annexe D — Migrations SQL (liste complète)

| Version | Fichier | Tables / Colonnes créées |
|---|---|---|
| v1 | `create-all-tables.sql` | 14 tables core |
| v2 | `migration-v2.sql` | Guest checkout, display_order |
| v3 | `migration-v3-product-media.sql` | `product_media` |
| v4 | `migration-v4-reviews.sql` | `reviews`, sentiment |
| v5 | `migration-v5-home-sections.sql` | `home_sections`, `home_section_media` |
| v6 | `migration-v6-avatar.sql` | `profiles.avatar_url` |
| v7 | `migration-v7-stock.sql` | `stock_movements`, triggers |
| v8 | `migration-v8-push.sql` | `push_subscriptions` |
| v9 | `migration-v9-notifications.sql` | `notifications` |
| v10 | `migration-v10-soldes.sql` | `products.solde_hero` |
| v11 | `migration-v11-solde-notif.sql` | Notification solde |
| v12 | `migration-v12-whats-new.sql` | `products.whats_new` |
| v13 | `migration-v13-featured-order.sql` | `products.featured_order` |
| v14 | `migration-v14-solde-hero-order.sql` | `products.solde_hero_order` |
| v15 | `migration-v15-hero-slides.sql` | `hero_slides` |
| v16 | `migration-v16-whats-new-order.sql` | `products.whats_new_order` |

---

*Rapport rédigé par *(Prénom NOM)* — Stage Kicksoft / DJI Store TN — Juin–Juillet 2026*
