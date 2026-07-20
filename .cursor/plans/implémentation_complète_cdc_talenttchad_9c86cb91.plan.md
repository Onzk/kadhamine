---
name: Implémentation complète CDC TalentTchad
overview: "Plan d'exécution du `docs/CDC.md` : mise en conformité backend Convex, refonte du design system (tokens couleur issus du logo + patterns de `docs/design.png`), migration Lucide → Phosphor, logo vectoriel redessiné à la main, jeu de données `mock_data` avec images vérifiées, puis refonte écran par écran — avec des garde-fous explicites contre les hallucinations d'API et les designs pauvres."
todos:
  - id: backend-settings
    content: Créer convex/settings.ts (commission paramétrable) + écran admin settings
    status: completed
  - id: backend-orders-4states
    content: Réduire orderStatus à 4 valeurs dans schema.ts + orders.ts + orders.tsx
    status: completed
  - id: backend-fedapay-premium
    content: Brancher FedaPay sur le flux premium (subscriptions + webhook + signature stricte)
    status: completed
  - id: backend-admin-premium-toggle
    content: Ajouter mutation admin.setPremium + UI dans admin/users.tsx
    status: completed
  - id: backend-chat-images
    content: Support storageId/image dans messages.send + UI upload dans le chat
    status: completed
  - id: backend-push
    content: Implémenter envoi push réel (action sendPush) + déclencheurs commandes/messages
    status: completed
  - id: backend-cities-i18n
    content: Ajouter MVP_CITIES, compléter ar/sara.json, catégories multilingues
    status: completed
  - id: backend-cleanup
    content: Nettoyer imports morts + créer écran settings.tsx manquant
    status: completed
  - id: design-tokens
    content: Réécrire tokens.ts/tailwind/global.css avec palette issue du logo + radius arrondis
    status: completed
  - id: design-icons
    content: Installer phosphor-react-native, migrer tous les usages Lucide, retirer lucide-react-native
    status: completed
  - id: design-logo
    content: Recréer logo.svg à la main + composant Logo.tsx
    status: completed
  - id: mock-data
    content: Écrire src/data/mock_data.ts avec images vérifiées
    status: completed
  - id: ui-base-components
    content: Refondre les composants de base (Button, Card, Input, ServiceCard, EmptyState, etc.)
    status: completed
  - id: ui-screens
    content: Refondre chaque écran selon la checklist design.png (auth, tabs, service, orders, checkout, chat, premium, vérification, settings, admin)
    status: completed
  - id: qa-final
    content: Lint/typecheck, parcours E2E manuel, vérif critères CDC §13, build APK interne
    status: completed
isProject: false
---

# Plan d'implémentation — CDC TalentTchad v2.0

Décisions confirmées avant ce plan :
- **Commandes** : on réduit à **4 statuts** (`pending → accepted → completed | cancelled`). Le code actuel utilise `in_progress` et `rejected` avec UI/mutations dédiées — à retirer.
- **Logo** : reconstruction **manuelle** d'un SVG plat fidèle (silhouette bleue, check doré, étoile rouge), pas de vectorisation automatique du PNG.

Constat de l'exploration (référence, pas d'hypothèse) :
- `phosphor-react-native` **absent** de `package.json` ; `lucide-react-native` est la seule lib d'icônes, utilisée dans ~25 fichiers (41 icônes nommées + types `LucideIcon`/`LucideProps`).
- Commission **hardcodée** à `0.1` dans [convex/lib.ts](convex/lib.ts) et [convex/payments.ts](convex/payments.ts), alors que la table `settings` existe et est seedée mais jamais lue.
- Webhook FedaPay existe ([convex/http.ts](convex/http.ts), [convex/fedapay.ts](convex/fedapay.ts)) pour les **commandes**, mais **aucun** flux FedaPay pour le **premium** ([convex/subscriptions.ts](convex/subscriptions.ts) active directement sans paiement).
- Chat : schema supporte `type: 'image'` mais [convex/messages.ts](convex/messages.ts) `send` n'écrit pas `storageId`, et [src/app/chat/[conversationId].tsx](src/app/chat/[conversationId].tsx) n'a aucun UI d'envoi d'image.
- Vérification identité : flux upload → review admin → badge **fonctionnel de bout en bout** déjà.
- Aucune mutation admin pour `isPremium` ni pour éditer la commission.
- i18n : `ar.json`/`sara.json` manquent 6 clés vs `fr.json` ; catégories seedées sans `nameAr`/`nameSara`.
- Push : `pushToken` stocké mais **jamais envoyé** (pas d'appel à l'API Expo Push).
- Villes MVP (10) non appliquées dans les pickers (liste complète du Tchad utilisée partout).
- Design : deux couches de thème coexistent (`src/theme/tokens.ts` "Cohere-inspired" **à abandonner** selon le CDC, vs `src/lib/theme.ts` + `src/global.css` pour NativeWind). Pas de logo SVG. Pas de `mock_data`.

---

## 0. Garde-fous anti-hallucination & anti-design pauvre

Ces règles s'appliquent à **toutes** les phases suivantes :

1. **Aucune API inventée.** Avant d'appeler une fonction Convex, Expo ou une lib tierce, vérifier son existence réelle (grep dans `convex/_generated/api.d.ts`, lecture du fichier source, ou doc versionnée [docs.expo.dev/versions/v56.0.0](https://docs.expo.dev/versions/v56.0.0/)). Toute fonction Convex **nouvelle** doit être créée avant d'être référencée côté mobile — jamais l'inverse.
2. **Icônes Phosphor vérifiées, pas supposées.** La table de correspondance Lucide→Phosphor ci-dessous (§2.2) est une **proposition** : après `npm install phosphor-react-native`, vérifier les exports réels (`node_modules/phosphor-react-native` typings ou import test) avant de remplacer — un nom incorrect casse le build immédiatement, donc le premier écran migré sert de test de validation du mapping.
3. **Tokens de couleur figés avant tout écran.** Interdiction de choisir une couleur "à la volée" pendant la refonte UI : toutes les couleurs utilisées doivent provenir de la table de tokens définie en §2.1. Si une couleur manque, l'ajouter au token file d'abord, jamais en inline hex dans un composant.
4. **Un seul design system actif.** `src/theme/tokens.ts` redevient la source de vérité ; `src/lib/theme.ts`, `src/global.css`, `tailwind.config.js` et `src/constants/theme.ts` doivent être resynchronisés sur ces valeurs, pas l'inverse. Pas de 3ᵉ système inventé.
5. **Chaque écran refondu doit satisfaire une checklist visuelle explicite** (§4, une liste de patterns obligatoires par écran tirés de `docs/design.png`) avant d'être considéré terminé — pas de jugement esthétique vague.
6. **Images mock vérifiées avant commit.** Chaque URL du fichier `mock_data` doit être testée (requête HEAD/GET → 200 + `content-type: image/*`) au moment de l'écriture du fichier. Toute URL non vérifiable est remplacée, jamais laissée "au cas où".
7. **Pas de statut ou champ non présent dans le schéma.** Le nettoyage des statuts de commande (§1.4) doit être fait dans `schema.ts` **avant** de toucher aux mutations/UI, pour que TypeScript détecte tout usage résiduel de `in_progress`/`rejected`.
8. **Lint + typecheck obligatoires** après chaque phase (`npx expo lint`, `tsc --noEmit`) avant de passer à la phase suivante.

---

## 1. Phase 1 — Conformité backend Convex

### 1.1 Commission paramétrable

- Créer `convex/settings.ts` :
  - `query getCommissionRate()` → lit `settings` (clé `platform.commissionRate`), fallback `0.1`
  - `mutation updateCommissionRate({ rate })` → `requireAdmin`, upsert dans `settings`
- [convex/payments.ts](convex/payments.ts) `initiate` : remplacer `amount * 0.1` par une lecture de la table `settings` (db.query direct, pas de hardcode)
- [convex/lib.ts](convex/lib.ts) : supprimer la constante figée utilisée pour le calcul commission ; centraliser sur `settings`
- Nouvel écran admin `src/app/admin/settings.tsx` : afficher/éditer le taux (%), appeler `updateCommissionRate`
- Ajouter l'entrée dans le menu `src/app/admin/index.tsx`

### 1.2 Cycle de commande — 4 statuts

- `convex/schema.ts` : `orderStatus` → `pending | accepted | completed | cancelled` (retirer `in_progress`, `rejected`)
- `convex/orders.ts` :
  - `respond({ orderId, accept })` → `accepted` ou `cancelled` (fusion de l'ancien `reject`)
  - **supprimer** `startProgress`
  - `complete` : appelable directement depuis `accepted` (plus besoin de passer par `in_progress`)
  - `validate` : inchangé (release paiement + `canReview`)
- [src/app/(tabs)/orders.tsx](src/app/(tabs)/orders.tsx) : retirer le bouton "démarrer" et toute UI liée à `in_progress`/`rejected`
- Vérifier `admin/index.tsx`, `admin/payments.tsx`, `mock_data` (à venir) : aucune référence résiduelle

### 1.3 FedaPay — flux Premium

- [convex/fedapay.ts](convex/fedapay.ts) : étendre `createTransaction` (ou créer une action dédiée) pour accepter un `purpose: 'order' | 'premium'` et un identifiant cible (`paymentId` ou `subscriptionId`) dans les métadonnées FedaPay
- `convex/subscriptions.ts` : `subscribe` ne doit plus activer `isPremium` directement ; il crée une souscription `pending` + déclenche `createTransaction` (purpose `premium`)
- [convex/http.ts](convex/http.ts) webhook : router selon `purpose` → `orders`/`payments` (existant) ou nouvelle mutation `subscriptions.activateFromPayment` (à créer)
- Rendre la vérification de signature **obligatoire** dès que `FEDAPAY_WEBHOOK_SECRET` est défini (actuellement elle peut être contournée si l'en-tête est absent — corriger la condition dans `http.ts`)
- Ajouter un index Convex sur `payments.fedapayReference` pour remplacer le scan `.collect()` dans `handleWebhook`
- [src/app/premium.tsx](src/app/premium.tsx) : bouton "S'abonner" déclenche le nouveau flux (comme `checkout/[orderId].tsx` : `useAction` + ouverture `paymentUrl`)

### 1.4 Admin — toggle Premium manuel

- `convex/admin.ts` : mutation `setPremium({ userId, isPremium })` (garde admin) — utile tant que le paiement premium n'est pas testé en prod
- UI : ajouter l'action dans `src/app/admin/users.tsx` (bouton/switch sur la fiche utilisateur)

### 1.5 Chat — messages image

- `convex/messages.ts` `send` : accepter `storageId?`, résoudre `mediaUrl` via le pattern déjà utilisé dans `convex/files.ts`/`convex/portfolio.ts`, persister les deux
- [src/app/chat/[conversationId].tsx](src/app/chat/[conversationId].tsx) :
  - Bouton caméra/galerie (réutiliser `useUpload` comme dans `portfolio.tsx`/`verification.tsx`)
  - Limite taille (~5 Mo) et types (jpeg/png/webp) vérifiés côté client avant upload
  - Rendu bulle image (composant dédié, pas de `<Image>` brut sans skeleton/erreur)

### 1.6 Notifications push réelles

- `convex/notifications.ts` : ajouter une **action interne** `sendPush({ userId, title, body, data })` qui `fetch('https://exp.host/--/api/v2/push/send', ...)` avec le `pushToken` du user (lu en base)
- Déclencher via `ctx.scheduler.runAfter(0, internal.notifications.sendPush, {...})` depuis :
  - `orders.ts` (création commande → notif prestataire ; changement de statut → notif client)
  - `messages.ts` `send` (notif destinataire si absent de la conversation)
- Vérifier que `users.updatePushToken` est bien appelé côté client au démarrage (actuellement jamais appelé selon l'exploration) — l'ajouter dans `AuthProvider` ou `_layout.tsx` avec `expo-notifications` (`getExpoPushTokenAsync`)

### 1.7 Villes MVP (10) et i18n

- `src/constants/chad.ts` : ajouter `MVP_CITIES` (les 10 villes du CDC §8.1), garder les listes complètes pour l'admin/carte si besoin
- Utiliser `MVP_CITIES` dans les pickers de : `(auth)/register.tsx`, `(auth)/complete-profile.tsx`, `profiles.update` (UI), `provider/services.tsx` (création service)
- `convex/seed.ts` `seedCategories` : ajouter `nameAr`/`nameSara` pour les 10 catégories (traductions simples, pas de placeholders visibles en prod)
- `src/locales/ar.json` et `sara.json` : compléter les 6 clés manquantes identifiées (`auth.loginSubtitle`, `rememberMe`, `continueWithoutAccount`, `forgotPasswordSoon`, `guestTitle`, `guestSubtitle`) + remplacer les chaînes encore en FR/placeholder dans `sara.json`

### 1.8 Nettoyage

- Supprimer l'import mort `PLATFORM_COMMISSION_RATE` dans `orders.ts` (remplacé par la lecture `settings`)
- Supprimer l'import `Globe` inutilisé dans `profile.tsx`
- Créer l'écran manquant `src/app/settings.tsx` (lien existant depuis `profile.tsx` mais aucun écran) : sections Compte, Vérification identité (lien `/verification`), Langue, Notifications, Abonnement (lien `/premium`), Déconnexion

**Definition of done Phase 1** : `tsc --noEmit` propre, plus aucune référence à `in_progress`/`rejected`/commission hardcodée, webhook FedaPay signature stricte, push envoyés en conditions réelles (log de test), `/settings` navigable.

---

## 2. Phase 2 — Design system (fondations, avant tout écran)

### 2.1 Tokens couleur — remplacement du système "Cohere"

Le CDC §9.2 est explicite : abandonner `DESIGN.md` (Cohere) pour une palette dérivée du **logo TalentTchad** + patterns de `docs/design.png`. Réécrire `src/theme/tokens.ts` :

| Token | Valeur | Usage |
|-------|--------|-------|
| `brand.ink` | `#0B3D91` (bleu logo) | CTA primaires, tabs actifs, titres accentués |
| `brand.gold` | `#F5C400` (check logo) | Badge vérifié, succès, accents "confiance" |
| `brand.crimson` | `#E11D48` (étoile logo) | Ratings, alertes, badges promo |
| `surface.canvas` | `#FFFFFF` | Fond écran |
| `surface.muted` | `#F2F4F7` | Inputs, chips inactifs, fonds de section |
| `surface.card` | `#FFFFFF` avec ombre légère | Cards |
| `surface.iconWash` | `#EAF0FB` (bleu très pâle) | Cercle derrière icônes de liste (pattern Screen 2 de la référence) |
| `text.ink` | `#101828` | Titres |
| `text.muted` | `#667085` | Sous-titres, meta |
| `border.hairline` | `#E5E7EB` | Séparateurs |
| `state.success` / `warning` / `error` | vert / gold / rouge cohérents | Statuts commandes/paiements |

Radius : relever `Radius` vers 16–24px (cards, boutons, inputs) pour matcher le pattern "très arrondi" de la référence.

- Répercuter dans `tailwind.config.js` (`brand.*`), `src/global.css` (CSS vars), `src/lib/theme.ts` (`NAV_THEME`) — un seul jeu de valeurs, pas de doublon divergent
- Garder `src/theme/typography.ts` (Inter/Space Grotesk conviennent au style "titres bold, sans-serif" de la référence) ; ajuster seulement les tailles si besoin de rapprocher les proportions de `design.png`
- Retirer ou clairement marquer comme "legacy non utilisé" : `src/constants/theme.ts`, `src/hooks/use-theme.ts`, `themed-text.tsx`/`themed-view.tsx` si plus consommés après migration (à vérifier au cas par cas, ne pas supprimer sans grep des usages restants)
- `DESIGN.md` : ajouter une note en tête indiquant qu'il est **superseded by** `docs/CDC.md` §9 pour ce projet

### 2.2 Icônes — migration Lucide → Phosphor

1. `npm install phosphor-react-native`
2. Mettre à jour le wrapper central `src/components/rn-ui/icon.tsx` : remplacer le typage `LucideIcon`/`LucideProps` par le type d'icône Phosphor (`Icon` exporté par le package — vérifier le nom exact du type à l'installation)
3. Mettre à jour les props typées `icon: LucideIcon` dans `src/components/rn-ui/alert.tsx`, `src/components/ui/EmptyState.tsx`, et le tableau `PAYMENT_METHODS` de `checkout/[orderId].tsx`
4. Remplacer les imports fichier par fichier (liste exhaustive tirée de l'exploration) — mapping proposé, **à valider contre les exports réels du package** (garde-fou §0.2) :

| Lucide | Phosphor (proposé) | Fichiers concernés |
|--------|--------------------|---------------------|
| `Home` | `House` | `(tabs)/_layout.tsx` |
| `Search` | `MagnifyingGlass` | `_layout.tsx`, `index.tsx`, `search.tsx` |
| `ClipboardList` | `ClipboardText` | `_layout.tsx`, `orders.tsx` |
| `MessageCircle` | `ChatCircleDots` | `_layout.tsx`, `messages.tsx`, `service/[id].tsx` |
| `User` / `Users` | `User` / `UsersThree` | `_layout.tsx`, `register.tsx`, `admin/index.tsx` |
| `Bell` | `Bell` | `index.tsx`, `notifications.tsx` |
| `Moon` / `Sun` | `Moon` / `Sun` | `index.tsx`, `profile.tsx` |
| `MapPin` | `MapPin` | `index.tsx`, `map.tsx` |
| `Hand` | `HandWaving` | `index.tsx` |
| `Wrench` | `Wrench` | `index.tsx`, `provider/services.tsx`, `CategoryPlaceholder.tsx` |
| `Lock` | `Lock` | `orders.tsx`, `messages.tsx` |
| `Settings` | `Gear` | `profile.tsx` |
| `Shield` | `Shield` / `ShieldCheck` | `profile.tsx`, `admin/index.tsx` |
| `Crown` | `Crown` | `profile.tsx`, `premium.tsx`, `ServiceCard.tsx` |
| `LogOut` | `SignOut` | `profile.tsx` |
| `ChevronRight` / `ChevronLeft` | `CaretRight` / `CaretLeft` | `profile.tsx`, `admin/index.tsx`, `ScreenHeader.tsx` |
| `BarChart3` | `ChartBar` | `profile.tsx` |
| `LayoutDashboard` | `SquaresFour` | `profile.tsx` |
| `Images` / `Image` | `Images` / `Image` | `profile.tsx`, `portfolio.tsx` |
| `ArrowLeft` | `ArrowLeft` | `login.tsx`, `register.tsx` |
| `Briefcase` | `Briefcase` | `register.tsx` |
| `AlertTriangle` | `Warning` | `admin/index.tsx`, `checkout.tsx` |
| `CreditCard` | `CreditCard` | `admin/index.tsx`, `checkout.tsx` |
| `Star` | `Star` | `admin/index.tsx`, `StarRating.tsx`, `ServiceCard.tsx`, `service/[id].tsx` |
| `Smartphone` | `DeviceMobile` | `checkout.tsx` |
| `Navigation` | `NavigationArrow` | `map.tsx` |
| `Plus` | `Plus` | `portfolio.tsx` |
| `Trash2` | `Trash` | `portfolio.tsx` |
| `Check` | `Check` | `premium.tsx` |
| `Cloud` | `Cloud` | `setup.tsx` |
| `BadgeCheck` | `SealCheck` | `service/[id].tsx`, `ServiceCard.tsx` |
| `Inbox` | `Tray` | `EmptyState.tsx` (défaut) |
| `Eye` / `EyeOff` | `Eye` / `EyeSlash` | `AuthField.tsx` |
| `X` | `X` | `rn-ui/dialog.tsx` |
| `Globe` | (supprimé, import mort) | `profile.tsx` |

5. Choisir un **poids par défaut cohérent** (`weight="regular"` pour l'UI générale, `weight="bold"`/`fill` réservé aux états actifs — tabs sélectionnés, badges) pour matcher l'épaisseur du logo (formes pleines, arrondies)
6. Désinstaller `lucide-react-native` une fois tous les usages migrés (grep final = 0 résultat)

### 2.3 Logo — reconstruction vectorielle manuelle

- Créer `assets/brand/logo.svg` : silhouette bleue (`#0B3D91`), check doré (`#F5C400`) formant le bras, étoile rouge (`#E11D48`) à 5 branches arrondies + 3 éclats — formes plates, sans essayer de reproduire les ombres/dégradés du PNG (fidélité de composition, pas de trace pixel-perfect)
- Créer `src/components/brand/Logo.tsx` : wrapper `react-native-svg` (déjà en dépendance) avec prop `size`, utilisable dans headers, écrans auth, splash in-app, écran "à propos"
- Garder `assets/images/logo.png`/`icon.png`/`splash-icon.png` tels quels pour `app.json` (icônes natives — Expo exige des rasters ; hors scope de ce plan de les régénérer, sauf demande explicite ultérieure)
- Remplacer les usages runtime du PNG par le nouveau composant SVG là où c'est pertinent (`animated-icon.tsx`/`.web.tsx`, écrans auth) sans casser le splash natif

**Definition of done Phase 2** : 0 référence à `lucide-react-native`, palette unique dans tous les fichiers de thème, `logo.svg` + composant `Logo` intégrés, build sans erreur de type.

---

## 3. Phase 3 — `mock_data` (données de test vérifiées)

- Créer `src/data/mock_data.ts` (ou `.ts` par domaine : `mock_data/users.ts`, `services.ts`, etc. si le volume le justifie)
- Contenu (aligné CDC §10.2) : profils client/prestataire répartis sur les 10 villes MVP, catégories, services avec **URLs d'images HTTPS vérifiées** (source stable type Unsplash `images.unsplash.com`), portfolio, commandes couvrant les **4 statuts** (post-nettoyage §1.2), messages texte + image, avis, paiements (fedapay + off_platform), abonnements premium, demandes de vérification
- **Vérification obligatoire** : avant d'écrire l'URL finale, tester chaque image (ex. requête `HEAD`) et documenter dans un commentaire de tête de fichier la date de vérification ; toute image indisponible est remplacée immédiatement
- Usage : données pour prévisualisation UI / démonstration, ne remplace pas le seed Convex réel (`convex/seed.ts` reste pour bootstrap catégories/settings/admin)

**Definition of done Phase 3** : fichier exporté typé (réutilise les types de `src/types/index.ts`), toutes les images chargent réellement dans l'app (test visuel sur au moins un écran consommateur).

---

## 4. Phase 4 — Refonte UI écran par écran

Chaque écran doit respecter cette checklist de patterns (dérivés de `docs/design.png`, adaptés au contexte) **avant** d'être marqué terminé :

- Fond blanc dominant, espacements généreux, coins très arrondis (16–24px) sur cards/boutons/inputs
- Pas d'emoji nulle part (déjà vérifié : aucun dans le code actuel — à ne jamais réintroduire)
- Icônes exclusivement Phosphor, cercle "wash" bleu pâle derrière les icônes de liste
- Titres gras (Space Grotesk), meta en `text.muted`
- Badge étoile (rating) en overlay sur les cards image, comme la référence
- CTA principal = pill sombre (`brand.ink`) ou plein ; actions secondaires = texte souligné/lien

### Ordre d'exécution

1. **Composants de base** (impactent tous les écrans) : `Button`, `Input`, `Badge`, `Card`, `CategoryChip`, `EmptyState`, `ScreenHeader`, `StarRating`, `Skeleton`, `ServiceCard`, `AuthField` — recoloration + icônes Phosphor + radius
2. **Navigation** : `(tabs)/_layout.tsx` (icônes + style actif façon référence Screen 1)
3. **Auth** : `login.tsx`, `register.tsx`, `complete-profile.tsx` — cards de sélection de rôle arrondies, champs `surface.muted`
4. **Accueil** (`(tabs)/index.tsx`) : pills catégories (actif = pill sombre), section "services populaires" en cards image+badge note, bannières promo (vérification / premium) façon référence
5. **Recherche** (`search.tsx`) : filtres chips + résultats en cards
6. **Détail service** (`service/[id].tsx`) : portfolio en grille, badges vérifié/premium, CTA commander/chat
7. **Commandes** (`orders.tsx`) : segmented control par statut (4 valeurs), lignes façon référence Screen 2 (icône en cercle pâle, statut, date)
8. **Checkout** (`checkout/[orderId].tsx`) : cards méthode de paiement, ligne commission dynamique (lue depuis `settings`), bouton FedaPay vs hors-plateforme
9. **Messages** (`messages.tsx` + `chat/[conversationId].tsx`) : liste conversations avec avatar/preview, bulles + envoi image
10. **Portfolio / Provider dashboard / services** : galerie images, stats simples
11. **Premium** : hero + pricing card + liste de features, CTA FedaPay
12. **Vérification** : stepper upload avec états (en attente/approuvé/rejeté)
13. **Paramètres** (`settings.tsx`, nouvel écran) : sections listées en §1.8
14. **Admin** (dashboard, users, verifications, reports, reviews, payments, settings) : même langage visuel, densité plus élevée, filtres chips façon référence Screen 3

**Definition of done Phase 4** : chaque écran listé passe la checklist ci-dessus, aucune couleur hors tokens, navigation testée manuellement (auth → accueil → service → commande → chat → checkout → avis, + parcours admin).

---

## 5. Phase 5 — QA finale & build

- `npx expo lint` + `tsc --noEmit` sans erreur
- Parcours de bout en bout : inscription client + prestataire, publication service, commande, paiement (sandbox FedaPay + hors plateforme), avis conditionné, chat texte+image, vérification identité → badge, premium (flag admin + flux FedaPay sandbox), notifications push (log), changement de langue (fr/ar/sara)
- Vérifier les 13 critères d'acceptation du CDC §13 un par un
- Build APK interne (`eas build --profile preview --platform android` ou équivalent déjà configuré via `EAS projectId` dans `app.json`)

---

## Récapitulatif fichiers clés touchés

| Zone | Fichiers principaux |
|------|----------------------|
| Backend | `convex/settings.ts` (nouveau), `convex/orders.ts`, `convex/schema.ts`, `convex/fedapay.ts`, `convex/http.ts`, `convex/subscriptions.ts`, `convex/messages.ts`, `convex/notifications.ts`, `convex/admin.ts`, `convex/seed.ts` |
| Constantes/i18n | `src/constants/chad.ts`, `src/locales/ar.json`, `src/locales/sara.json` |
| Thème | `src/theme/tokens.ts`, `src/theme/typography.ts`, `tailwind.config.js`, `src/global.css`, `src/lib/theme.ts` |
| Icônes | `src/components/rn-ui/icon.tsx`, `src/components/rn-ui/alert.tsx`, `src/components/ui/EmptyState.tsx`, + ~20 écrans/composants listés §2.2 |
| Brand | `assets/brand/logo.svg` (nouveau), `src/components/brand/Logo.tsx` (nouveau) |
| Données | `src/data/mock_data.ts` (nouveau) |
| Nouvel écran | `src/app/settings.tsx`, `src/app/admin/settings.tsx` |
| UI écrans | tous les fichiers `src/app/**` et composants listés en Phase 4 |
