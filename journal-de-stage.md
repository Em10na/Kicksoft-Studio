# JOURNAL DE STAGE
## DJI Store TN — Kicksoft
## Période : 15 juin 2026 — 31 juillet 2026

**Stagiaire :** *(Prénom NOM)*
**Maître de stage :** *(Nom du responsable)*
**Établissement :** *(Nom de l'université / école)*

---

## SEMAINE 1 — 15 au 19 juin 2026

### Lundi 15 juin — *Accueil et prise en main*

**Durée :** 8h

Première journée de stage. Accueil par le maître de stage, présentation de l'équipe et des locaux. Explication du contexte du projet : la société Kicksoft souhaite se doter d'une boutique en ligne complète pour commercialiser ses produits DJI en Tunisie.

Récupération du projet existant depuis le dépôt Git (branche `develop`). Installation de l'environnement de développement : Node.js 20, npm, VS Code. Configuration du fichier `.env.local` avec les clés Supabase (URL, anon key, service role key).

Premier `npm run dev` — la page d'accueil s'affiche. Exploration de la structure du projet : identification de l'App Router Next.js, des dossiers `app/(front)`, `app/admin`, `app/api`, `lib/supabase`.

**Activités :**
- Installation de l'environnement
- Clonage du dépôt, configuration `.env.local`
- Lecture de la documentation du projet
- Exploration de la structure des dossiers et des composants existants

**Difficultés :** Prise en main de Next.js App Router (différence Server / Client Components) — nouveau pour moi.

---

### Mardi 16 juin — *Découverte de la base de données*

**Durée :** 8h

Connexion à Supabase Studio. Exploration des tables existantes : `products`, `categories`, `orders`, `profiles`, `home_sections`, etc. Lecture des migrations SQL (v1 à v12) pour comprendre l'évolution du schéma.

Exécution des migrations manquantes sur la base de dev. Test des politiques RLS : vérification que les requêtes anon retournent les bonnes données et que les routes admin sont protégées.

**Activités :**
- Exploration du schéma Supabase (20+ tables)
- Lecture et exécution des migrations SQL
- Tests de politiques Row Level Security
- Lecture des API Routes existantes (`/api/push/notify`, `/api/reviews`)

---

### Mercredi 17 juin — *Analyse du dashboard admin existant*

**Durée :** 8h

Navigation dans le dashboard admin (`/admin/*`). Identification des fonctionnalités existantes : gestion des produits, catégories, commandes, stock. Test de chaque section pour identifier les bugs et améliorations à apporter.

Réunion avec le maître de stage pour définir les priorités. Liste des tâches établie :
1. Améliorer la gestion de la page d'accueil (sections, médias, produits vedettes)
2. Créer une page dédiée aux articles en solde
3. Renforcer la synchronisation admin ↔ front-end

**Activités :**
- Tests fonctionnels du dashboard existant
- Rédaction de la liste des bugs et améliorations
- Réunion de cadrage avec le maître de stage
- Définition des priorités de développement

---

### Jeudi 18 juin — *Carrousel Hero — Analyse et préparation*

**Durée :** 8h

Analyse du composant `DroneHeroSlider.tsx` pour comprendre comment les slides sont affichés côté front. Lecture du code existant dans `app/admin/accueil/page.tsx` pour le formulaire de création de slide.

Identification du problème : les champs image et vidéo du slide hero sont de simples inputs texte pour URL — pas d'upload direct. Le maître de stage souhaite pouvoir parcourir ses fichiers locaux.

Création de la migration `v15-hero-slides.sql` pour créer la table `hero_slides` en base.

**Activités :**
- Analyse du composant `DroneHeroSlider.tsx`
- Lecture du formulaire d'ajout de slides existant
- Identification des améliorations : upload de fichier, sélecteur de lien
- Rédaction de la migration SQL v15

---

### Vendredi 19 juin — *Upload de fichiers pour les slides hero*

**Durée :** 8h

Implémentation du picker de fichiers pour les slides hero. Remplacement de l'input texte par :
- Un `<input type="file">` caché déclenché par un bouton
- Une fonction `uploaderFichierHero()` qui upload le fichier dans le bucket Supabase Storage (`media/hero/`) et récupère l'URL publique
- Support simultané des images (jpg, png, webp) et vidéos (mp4, webm, mov)
- Barre de progression pendant l'upload avec indicateur visuel

Test de l'upload de plusieurs fichiers. Vérification de l'apparition dans le carrousel front.

**Activités :**
- Implémentation des inputs de type fichier pour image et vidéo
- Intégration avec Supabase Storage
- Gestion de la progression d'upload
- Tests end-to-end (upload → affichage front)

**Résultat :** Upload fonctionnel pour images et vidéos depuis l'admin.

---

## SEMAINE 2 — 22 au 26 juin 2026

### Lundi 22 juin — *Sélecteur de lien par catégorie/produit*

**Durée :** 8h

Le maître de stage souhaite un menu déroulant pour les liens des slides (champs "Bouton Acheter" et "En savoir plus") plutôt qu'une saisie manuelle d'URL. Implémentation d'un `<select>` natif avec `<optgroup>` :

```
Boutique
├── /boutique (lien général)
Catégories
├── Drones (lien vers catégorie ID)
├── Caméras (...)
└── ...
Produits — Drones
├── DJI Mini 4 Pro (lien vers /produit/ID)
└── ...
```

Chargement des catégories et produits depuis Supabase pour peupler le sélecteur. Gestion des produits sans catégorie dans un optgroup "Autres".

**Activités :**
- Développement du sélecteur de lien `<select>` + `<optgroup>`
- Chargement dynamique catégories + produits depuis Supabase
- Intégration dans le formulaire de slide hero
- Tests avec différentes catégories et produits

---

### Mardi 23 juin — *Réordonnancement des slides par sélecteur de position*

**Durée :** 8h

Le maître de stage souhaite pouvoir choisir directement la position d'un slide (ex. : passer le slide 3 en position 1) sans avoir à cliquer plusieurs fois sur les flèches ▲/▼.

Implémentation de la fonction `deplacerSlideVers(id, newIdx)` :
1. Récupération de la liste ordonnée des slides
2. Extraction du slide à déplacer
3. Insertion à la nouvelle position
4. `Promise.all` pour mettre à jour `display_order` de tous les slides en base

Ajout d'un `<select>` affichant `#1`, `#2`, `#3`… sur chaque slide. Changement de valeur = déplacement immédiat.

**Activités :**
- Algorithme de réordonnancement complet (full reorder)
- Composant `<select>` de position sur chaque slide
- Tests de réordonnancement avec 4 slides
- Correction d'un bug de valeur dupliquée (deux slides à display_order=0)

---

### Mercredi 24 juin — *Section Suggestions — Étagère de produits vedettes*

**Durée :** 8h

Le maître de stage demande une section "Suggestions" dans l'admin permettant d'épingler des produits qui s'affichent sous la bannière "Nos Suggestions" sur le front.

Conception d'une **étagère horizontale scrollable** (inspirée de la UX des apps mobiles) affichant les produits vedettes sélectionnés. Chaque carte produit comprend : image, titre, prix, sélecteur de position, bouton "Retirer".

**Activités :**
- Développement de l'étagère horizontale scrollable
- Composant carte produit admin (image, titre, prix, position, retirer)
- CSS pour overflow-x: auto sur mobile et desktop
- Tests de scroll sur mobile (émulateur Chrome DevTools)

---

### Jeudi 25 juin — *Sélecteur de produit par catégorie (Suggestions)*

**Durée :** 8h

Ajout du sélecteur pour épingler un nouveau produit dans la section Suggestions. Découverte d'un bug : la liste déroulante est vide — la fonction `chargerProduits()` retourne un tableau vide sans afficher d'erreur.

**Diagnostic :** La requête Supabase échouait silencieusement car les colonnes `featured_order` et `solde_hero_order` n'existaient pas encore en base (migrations v13/v14 non exécutées). L'erreur était avalée et `data = null`.

**Correction :** Ajout d'un fallback avec une requête réduite (sans les colonnes de migration) :
```ts
if (error) {
  setFeaturedOrderDispo(false);
  const { data: fallback } = await supabase.from("products")
    .select("id, title, price, featured, status, compare_price, solde_hero, image_url, category_id")
    ...
  setProduits((fallback ?? []).map(p => ({ ...p, featured_order: 0, solde_hero_order: 0 })));
}
```

**Activités :**
- Développement du sélecteur produit avec optgroups
- Diagnostic du bug liste vide (requête Supabase silencieuse)
- Implémentation du fallback query
- Tests avec et sans migrations

**Résultat :** Produits affichés correctement dans le sélecteur.

---

### Vendredi 26 juin — *Réordonnancement des produits vedettes*

**Durée :** 8h

Ajout du sélecteur de position `#1`, `#2`… sur chaque carte produit vedette de l'étagère. Même algorithme que pour les slides hero : `deplacerFeaturedVers(produitId, newIdx)`.

Migration `v13-featured-order.sql` exécutée. Test complet du workflow : ajouter → réordonner → retirer un produit vedette depuis l'admin, puis vérifier l'ordre sur le front.

**Activités :**
- Implémentation de `deplacerFeaturedVers`
- Tests du workflow complet add/reorder/remove
- Exécution de la migration v13
- Vérification de l'affichage front (ordre respecté)

---

## SEMAINE 3 — 29 juin au 3 juillet 2026

### Lundi 29 juin — *Page Articles soldés — Conception*

**Durée :** 8h

Réunion avec le maître de stage : besoin d'une page dédiée `/admin/soldes` pour gérer les promotions (différente de la gestion des produits). Cette page doit permettre d'associer un prix barré à un produit et d'envoyer une notification à tous les clients.

Conception de la table de données : Ordre | Image | Nom | Prix | Prix barré | Catégorie | Statut | Actions.

Rédaction de la migration `v10-soldes.sql` (colonnes `solde_hero`, `compare_price`) et de la logique de calcul automatique du % de remise.

**Activités :**
- Réunion de conception avec le maître de stage
- Définition du modèle de données pour les soldes
- Rédaction de la migration SQL
- Maquette de la page dans VS Code

---

### Mardi 30 juin — *Page Articles soldés — Développement de la table*

**Durée :** 8h

Développement de la page `app/admin/soldes/page.tsx`. Construction de la table des articles soldés avec :
- Miniature image produit
- Affichage du prix actuel et du prix barré (strikethrough)
- Badge % de remise calculé automatiquement
- Bouton statut notification (envoyée / renvoyer)
- Boutons d'édition et suppression

**Activités :**
- Développement du composant table des soldes
- Calcul automatique `pct = Math.round((1 - price / compare_price) * 100)`
- Gestion des états : chargement, liste vide, erreur
- Style avec les classes `ak-*` du thème admin

---

### Mercredi 1er juillet — *Modal d'ajout d'article soldé*

**Durée :** 8h

Développement du modal de création d'article soldé. Le formulaire comprend :
- `<select>` à optgroups pour choisir le produit (Boutique → Catégories → Produits)
- Champ prix barré avec validation (doit être > prix actuel)
- Calcul en temps réel du % de remise et du prix soldé résultant
- Lien direct vers la page du produit pour vérification

Test complet : sélection d'un produit, saisie du prix barré, validation, enregistrement en base.

**Activités :**
- Développement du modal de création
- Sélecteur produit avec optgroups catégorisés
- Calcul dynamique remise / prix soldé
- Validation côté client

---

### Jeudi 2 juillet — *Notification automatique à l'ajout d'un article soldé*

**Durée :** 8h

Intégration des notifications push lors de l'ajout d'un article soldé. Appel automatique à `/api/push/notify` après création en base :

```ts
await fetch("/api/push/notify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: `Solde : ${produit.title}`,
    body: `Maintenant à ${prix} DT (-${pct}%)`,
    tag: "solde",
    url: `/produit/${produit.id}`
  })
});
```

Ajout de la colonne `solde_notified_at` pour tracker l'envoi. Bouton "Renvoyer la notification" pour les articles déjà notifiés.

**Activités :**
- Intégration de l'appel à l'API push depuis le modal
- Ajout de la colonne `solde_notified_at`
- Développement du bouton "Renvoyer"
- Tests d'envoi de notification sur navigateur Chrome

---

### Vendredi 3 juillet — *Sidebar — Renommage et navigation*

**Durée :** 8h

Mise à jour du menu latéral de l'admin. L'entrée "Notifs soldes" est renommée en "Articles soldés" avec l'icône `ti-discount-2`. Ajout de la route dans `PAGE_TITLES` pour le header dynamique.

Tests de navigation entre toutes les pages admin. Vérification de l'état actif (classe `active`) sur chaque lien de sidebar.

Nettoyage du code : suppression de la colonne `compare_price` du formulaire et de la table `/admin/produits` (déplacée vers `/admin/soldes`).

**Activités :**
- Mise à jour de la sidebar (`app/admin/layout.tsx`)
- Renommage "Notifs soldes" → "Articles soldés"
- Suppression de `compare_price` dans la page produits
- Tests de navigation complète du dashboard

---

## SEMAINE 4 — 6 au 10 juillet 2026

### Lundi 6 juillet — *Section "Articles en solde" dans l'accueil admin — Sélecteur natif*

**Durée :** 8h

Le maître de stage veut ajouter des articles en solde directement depuis la page d'accueil admin (sans passer par `/admin/soldes`). La combobox de recherche existante est remplacée par un `<select>` natif avec optgroups.

Le sélecteur affiche uniquement les produits avec `compare_price > price` (articles effectivement en solde), groupés par catégorie, en excluant ceux déjà dans le slider (`solde_hero = true`).

**Activités :**
- Remplacement de la combobox par `<select>` natif
- Filtrage : articles en solde non encore sélectionnés
- Groupement par catégorie avec optgroup
- Gestion des produits sans catégorie valide (orphelins)

---

### Mardi 7 juillet — *Réordonnancement des articles en solde*

**Durée :** 8h

Ajout du sélecteur de position `#1`, `#2`… sur chaque article soldé dans l'accueil admin. Suppression des boutons ▲/▼ au profit du sélecteur direct (cohérence UX avec les slides et les produits vedettes).

Implémentation de `deplacerSoldeVers(produitId, newIdx)` — même algorithme de réordonnancement complet.

**Activités :**
- Suppression des boutons ▲/▼
- Ajout du `<select>` de position
- Implémentation de `deplacerSoldeVers`
- Tests de réordonnancement

---

### Mercredi 8 juillet — *Section "Quoi de neuf" — Ajout de l'ordre*

**Durée :** 8h

La section "Quoi de neuf" affichait les produits épinglés sous forme de chips (petites pastilles) sans ordre défini. Le maître de stage souhaite pouvoir contrôler l'ordre d'affichage.

Travail important :
1. Création de la migration `v16-whats-new-order.sql` (colonne `whats_new_order`)
2. Ajout de `whats_new: boolean` et `whats_new_order: number` dans le type `Produit`
3. Mise à jour de `chargerProduits()` pour inclure ces champs
4. Suppression de l'état `whatsnewIds` (Set) remplacé par `produits.filter(p => p.whats_new)`
5. Transformation des chips en lignes ordonnées avec sélecteur de position

**Activités :**
- Création et exécution de la migration v16
- Refactoring de l'état `whatsnewIds` → données dérivées
- Développement de `deplacerWhatsNewVers`
- Transformation chips → liste ordonnée

**Résultat :** L'ordre des produits dans "Quoi de neuf" est désormais contrôlable depuis l'admin.

---

### Jeudi 9 juillet — *Synchronisation front-end / back-end — Diagnostic*

**Durée :** 8h

Problème signalé par le maître de stage : les modifications faites dans l'admin (articles en solde, produits vedettes) n'apparaissent pas sur le site public après enregistrement.

**Diagnostic :**
- La page d'accueil front est un Server Component Next.js
- Netlify (via `@netlify/plugin-nextjs`) met la page en cache CDN
- Les requêtes `featured`, `promoPool` et `pinnedNew` ne respectaient pas l'ordre défini par l'admin

**Corrections identifiées :**
1. `featured` : OK (utilise `featured_order`), limite à augmenter
2. `promoPool` : cherchait TOUS les produits avec `compare_price` au lieu des `solde_hero = true` → mauvais résultats et ordre aléatoire
3. `pinnedNew` : trié par `created_at` au lieu de `whats_new_order`

**Activités :**
- Analyse du comportement de cache Netlify/Next.js
- Lecture du code de la page front (`app/(front)/page.tsx`)
- Identification des 3 problèmes de requête
- Rédaction du plan de correction

---

### Vendredi 10 juillet — *Synchronisation front-end / back-end — Corrections*

**Durée :** 8h

Mise en œuvre des corrections identifiées la veille.

**Correction 1 — Articles en Solde :** Changement de la requête `promoPool` pour cibler uniquement `solde_hero = true`, ordonnée par `solde_hero_order`. Mise à jour de `soldeProducts` pour utiliser directement ce résultat.

**Correction 2 — Quoi de neuf :** Changement du tri de `created_at` vers `whats_new_order` dans la requête `pinnedNew`.

**Correction 3 — Cache :** Ajout de `export const dynamic = "force-dynamic"` sur la page front. Création de la route `/api/revalidate` (appel de `revalidatePath('/')`) appelée automatiquement depuis l'admin après chaque mutation.

**Activités :**
- Modification des 3 requêtes Supabase dans `app/(front)/page.tsx`
- Création de `app/api/revalidate/route.ts`
- Ajout des appels `fetch('/api/revalidate')` dans `chargerProduits`, `chargerSections`, `chargerHeroSlides`
- Tests end-to-end : modification admin → vérification front

---

## SEMAINE 5 — 13 au 17 juillet 2026

### Lundi 13 juillet — *Bannière "Articles en Solde" — Gestion des médias*

**Durée :** 8h

Problème signalé : la bannière "Articles en Solde" affichait une image statique (drone sur fond vert) que l'admin ne pouvait pas modifier depuis le dashboard.

**Analyse :** La logique de priorité dans `app/(front)/page.tsx` donnait la priorité aux images synchronisées depuis les produits `solde_hero` (`soldeSyncMedia`), reléguant les médias uploadés manuellement en fallback.

**Correction :** Inversion de la priorité — les médias uploadés manuellement dans la section admin prennent désormais la priorité. La bannière affiche en ordre :
1. Médias uploadés dans Admin → Page accueil → Articles en Solde (prioritaire)
2. Images des produits `solde_hero` (fallback)
3. Image placeholder (dernier recours)

Mise à jour du label admin : "image ou vidéo de la bannière (prioritaire sur les images produits)".

**Activités :**
- Analyse de la logique de priorité dans la page front
- Inversion de l'ordre priorité dans le JSX
- Mise à jour du label admin
- Tests : upload d'une image → apparition sur la bannière front

---

### Mardi 14 juillet — *Tests de régression et corrections mineures*

**Durée :** 8h

Journée dédiée aux tests de régression sur l'ensemble du dashboard :

- Test de la navigation sidebar sur mobile (overlay)
- Test du formulaire de création de produit (upload media multiple)
- Test de la gestion des commandes (changement de statut)
- Test du système de notifications push (envoi + réception)
- Test du système de fidélité (calcul des points, tiers)

**Bugs identifiés et corrigés :**
- Lien de la sidebar "Articles soldés" pointait vers `\admin\soldes` (backslash) au lieu de `/admin/soldes` (forward slash) — corrigé dans la page accueil admin
- Le bouton "Réinitialiser (auto)" de la section "Quoi de neuf" appelait encore `chargerWhatsNew()` (fonction supprimée) — corrigé pour appeler `chargerProduits()`

**Activités :**
- Tests fonctionnels complets du dashboard
- Correction de 2 bugs mineurs
- Documentation des corrections dans le journal

---

### Mercredi 15 juillet — *Revue de code et optimisations TypeScript*

**Durée :** 8h

Revue du code avec le maître de stage. Points discutés :
- Pertinence des types TypeScript (type `Produit`, `HomeSection`, `HeroSlideRow`)
- Gestion des erreurs Supabase (silencieuses vs affichées)
- Performance des `Promise.all` pour les mises à jour en parallèle

**Optimisations réalisées :**
- Vérification `npx tsc --noEmit --skipLibCheck` : 0 erreur TypeScript
- Remplacement de `(p as any).whats_new` par une inférence de type correcte dans le fallback query
- Ajout de commentaires explicatifs sur les algorithmes de réordonnancement

**Activités :**
- Revue de code avec le maître de stage
- Audit TypeScript (0 erreur confirmé)
- Ajout de commentaires sur les sections complexes
- Documentation des patterns utilisés (fallback query, full reorder)

---

### Jeudi 16 juillet — *Dashboard admin — Rapports et analytics*

**Durée :** 8h

Travail sur la page `/admin/rapports`. Développement de vues analytiques :
- Nombre de commandes par statut (en attente, expédiées, livrées, annulées)
- Chiffre d'affaires par période (jour, semaine, mois)
- Produits les plus vendus (top 10 par quantité)
- Évolution du stock (mouvements entrants/sortants)

Requêtes SQL agrégées via Supabase : `COUNT`, `SUM`, `GROUP BY`, `ORDER BY`.

**Activités :**
- Développement des composants de statistiques
- Rédaction des requêtes SQL agrégées
- Affichage en tableaux (pas encore de graphiques)
- Tests avec des données de démonstration

---

### Vendredi 17 juillet — *Gestion du stock — Mouvements et audit*

**Durée :** 8h

Amélioration de la page `/admin/stock`. Visualisation des mouvements de stock avec la table `stock_movements` :
- Type de mouvement : vente, annulation, ajustement manuel, réception
- Lien avec la commande associée
- Historique filtrable par produit et par période

Ajout d'un formulaire d'ajustement manuel du stock (réception de marchandise, correction d'inventaire) avec saisie de la raison.

**Activités :**
- Amélioration de l'interface de gestion du stock
- Formulaire d'ajustement manuel
- Filtres par produit et période
- Tests avec création d'ajustements manuels

---

## SEMAINE 6 — 20 au 24 juillet 2026

### Lundi 20 juillet — *Système de fidélité — Interface admin*

**Durée :** 8h

Travail sur la page `/admin/fidelite`. Interface permettant de visualiser :
- Les membres par niveau (Bronze, Argent, Or, Platine)
- L'historique des transactions de points
- Les récompenses disponibles et leur stock

Ajout d'un formulaire pour créer de nouvelles récompenses (type : réduction ou cadeau, points requis, description).

**Activités :**
- Développement de la vue membres par niveau
- Tableau des transactions de points (earn/redeem)
- Formulaire de création de récompense
- Tests avec des comptes de test

---

### Mardi 21 juillet — *Gestion des avis produits*

**Durée :** 8h

La modération des avis se fait automatiquement via l'API `/api/reviews` (filtre de profanité + analyse de sentiment). Amélioration de la visualisation côté admin : les avis apparaissent maintenant dans les fiches produits avec :
- Note moyenne et distribution (étoiles)
- Sentiment affiché (badge positif/neutre/négatif)
- Possibilité de supprimer un avis

**Activités :**
- Intégration des avis dans la vue produit admin
- Affichage de la note moyenne et distribution
- Badge de sentiment
- Test du filtre de modération (soumission d'avis avec mots filtrés)

---

### Mercredi 22 juillet — *Interface client — Page compte*

**Durée :** 8h

Travail sur la page `/compte` (espace client). Amélioration de :
- L'affichage des points de fidélité et du niveau actuel
- La barre de progression vers le niveau suivant
- L'historique des commandes avec lien vers le détail
- La liste des produits favoris (wishlist)

Tests de l'authentification : connexion, déconnexion, redirection selon le rôle (admin → `/admin`, client → `/compte`).

**Activités :**
- Amélioration de la page compte client
- Barre de progression fidélité
- Tests d'authentification et de redirection
- Vérification du middleware Next.js

---

### Jeudi 23 juillet — *Optimisations performance et SEO*

**Durée :** 8h

Optimisations diverses pour améliorer les performances de chargement :
- Ajout de `priority` sur les images hero (LCP optimization)
- Vérification des balises `<title>` et `<meta description>` sur chaque page
- Audit Lighthouse : score performance, accessibilité, SEO
- Optimisation des requêtes Supabase (réduction des colonnes sélectionnées avec `select(*)` → colonnes explicites)

**Activités :**
- Audit Lighthouse (performance, SEO, accessibilité)
- Optimisation des images (balise priority)
- Ajout des métadonnées SEO manquantes
- Optimisation des requêtes Supabase (moins de `select *`)

---

### Vendredi 24 juillet — *Tests e2e et préparation déploiement*

**Durée :** 8h

Journée de tests end-to-end du parcours client complet :
1. Arrivée sur la page d'accueil → hero slider s'affiche
2. Navigation vers /boutique → filtres fonctionnels
3. Fiche produit → galerie images, ajouter au panier
4. Panier → quantités, totaux, suppression
5. Commande invité → formulaire, confirmation
6. Connexion client → espace compte, points de fidélité
7. Notifications push → abonnement, réception

Préparation du déploiement : merge de `develop` vers `main` → déclenchement automatique du build Netlify.

**Activités :**
- Tests e2e du parcours client complet
- Correction de 3 bugs mineurs détectés
- Merge develop → main
- Suivi du build Netlify et vérification production

---

## SEMAINE 7 (partielle) — 27 au 31 juillet 2026

### Lundi 27 juillet — *Corrections post-déploiement*

**Durée :** 8h

Suite au déploiement en production vendredi, quelques comportements inattendus en production (vs dev local) :
- La bannière "Articles en Solde" affichait toujours l'ancienne image (cache CDN) → résolu par l'invalidation via `/api/revalidate`
- Une notification push en doublon était envoyée lors de certains ajouts d'articles → correction du double-appel à l'API

**Activités :**
- Diagnostic des comportements différents prod vs dev
- Correction du doublon de notification push
- Vérification du bon fonctionnement du cache revalidation
- Tests complets en production

---

### Mardi 28 juillet — *Documentation technique*

**Durée :** 8h

Rédaction de la documentation technique du projet :
- `README.md` : instructions d'installation, variables d'environnement requises, commandes de démarrage
- Commentaires dans le code sur les algorithmes complexes (réordonnancement, fallback query)
- Liste des migrations SQL et leur ordre d'exécution

Transfert de connaissance avec l'équipe : présentation du dashboard admin et des nouvelles fonctionnalités.

**Activités :**
- Rédaction de la documentation
- Commentaires dans le code
- Présentation à l'équipe (30 min)
- Questions/réponses et ajustements

---

### Mercredi 29 juillet — *Bilan et préparation de la soutenance*

**Durée :** 8h

Réunion de bilan avec le maître de stage. Points positifs : toutes les fonctionnalités prévues ont été livrées, le site est en production. Points d'amélioration : ajouter des tests automatisés, améliorer les performances des requêtes agrégées.

Début de la rédaction du rapport de stage. Préparation des captures d'écran pour la soutenance.

**Activités :**
- Réunion de bilan avec le maître de stage
- Début de rédaction du rapport de stage
- Collecte des captures d'écran
- Préparation du plan de la soutenance

---

### Jeudi 30 juillet — *Rapport de stage — Rédaction*

**Durée :** 8h

Rédaction du rapport de stage : sections architecture, environnement technique, réalisations, difficultés rencontrées. Mise en forme selon les normes de l'établissement.

**Activités :**
- Rédaction des sections techniques du rapport
- Création des schémas d'architecture
- Tableau des migrations SQL
- Relecture et correction

---

### Vendredi 31 juillet — *Clôture du stage*

**Durée :** 8h

Dernière journée de stage. Finalisation du rapport et du journal. Restitution des accès et des équipements. Entretien de fin de stage avec le maître de stage.

Le maître de stage confirme que la plateforme DJI Store TN est opérationnelle en production sur [djistoretn.netlify.app](https://djistoretn.netlify.app) et que toutes les fonctionnalités demandées ont été livrées.

**Activités :**
- Finalisation du rapport de stage
- Entretien de bilan final
- Restitution des accès
- Signature du certificat de stage

---

## BILAN GLOBAL DU STAGE

### Récapitulatif des heures

| Semaine | Période | Jours | Heures |
|---|---|---|---|
| Semaine 1 | 15–19 juin | 5 | 40 h |
| Semaine 2 | 22–26 juin | 5 | 40 h |
| Semaine 3 | 29 juin – 3 juillet | 5 | 40 h |
| Semaine 4 | 6–10 juillet | 5 | 40 h |
| Semaine 5 | 13–17 juillet | 5 | 40 h |
| Semaine 6 | 20–24 juillet | 5 | 40 h |
| Semaine 7 | 27–31 juillet | 5 | 40 h |
| **TOTAL** | **6,5 semaines** | **35 jours** | **280 h** |

### Fonctionnalités livrées

| Fonctionnalité | Statut |
|---|---|
| Upload fichiers (image/vidéo) pour slides hero | ✅ Livré |
| Sélecteur de lien par catégorie/produit | ✅ Livré |
| Réordonnancement slides hero par position | ✅ Livré |
| Section Suggestions — étagère scrollable | ✅ Livré |
| Sélecteur produit avec optgroups | ✅ Livré |
| Réordonnancement produits vedettes | ✅ Livré |
| Page Articles soldés complète | ✅ Livré |
| Notification push auto à l'ajout solde | ✅ Livré |
| Section "Quoi de neuf" avec ordre | ✅ Livré |
| Synchronisation admin ↔ front (cache) | ✅ Livré |
| Gestion médias bannière soldes | ✅ Livré |
| Migration v16 (whats_new_order) | ✅ Livré |
| Route `/api/revalidate` | ✅ Livré |
| Tests e2e et déploiement production | ✅ Livré |

### Technologies maîtrisées

- **Next.js 16 App Router** (Server Components, API Routes, Middleware, ISR)
- **React 19** (Hooks, Context, composants contrôlés)
- **TypeScript 5** (typage strict, interfaces, inférence)
- **Supabase** (PostgreSQL, Storage, Auth SSR, RLS, migrations)
- **Web Push API** (VAPID, Service Workers)
- **Tailwind CSS v4**
- **Netlify** (déploiement, CDN, plugin Next.js)

---

*Journal rédigé par *(Prénom NOM)* — Stage Kicksoft / DJI Store TN — Juin–Juillet 2026*
