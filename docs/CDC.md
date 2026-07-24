# TalentTchad — Cahier des Charges (CDC)

| Champ | Valeur |
|--------|--------|
| Projet | TalentTchad |
| Document | Cahier des charges fonctionnel, technique et UI |
| Version | 2.0 |
| Date | 2026-07-19 |
| Statut | Validé (cadrage produit) |
| Pays cible | Tchad |
| Remplace / complète | `docs/DRAFT.md` (intentions métier) — **ce CDC fait foi** |

---

## 1. Présentation

### 1.1 Contexte

Au Tchad, de nombreux jeunes ont des compétences monnayables (dev, design, couture, coiffure, photo, réparation, traduction, tutorat, artisanat…) mais manquent de visibilité, d’accès clients et d’outils numériques adaptés (langue, mobile money, connectivité).

### 1.2 Solution

**TalentTchad** est une application mobile qui met en relation :

- des **prestataires** (jeunes talents) ;
- des **clients** (particuliers, entreprises, ONG) ;
- un **administrateur** (modération et configuration).

### 1.3 Objectifs

| Horizon | Objectif |
|---------|----------|
| Court terme | MVP conforme à ce CDC : auth, profils, services, commandes, chat, notation, admin, FedaPay prêt, UI brandée |
| Moyen terme | Croissance utilisateurs, paiement live, premium payant, vérifications à l’échelle |
| Long terme | Extension Afrique centrale |

### 1.4 Stack retenue (fait foi)

> La stack Django / Flutter mentionnée dans `DRAFT.md` est **abandonnée**.

| Couche | Technologie |
|--------|-------------|
| Mobile | **Expo SDK 54** + React Native + Expo Router |
| UI | NativeWind / Tailwind, composants RN, **Phosphor** (`phosphor-react-native`) |
| Backend | **Convex** (DB, functions, realtime, storage, auth) |
| Auth | `@convex-dev/auth` — provider **Password** (email + mot de passe) |
| Paiements | **FedaPay** (sandbox/prod) + option **hors plateforme** |
| i18n | `i18next` / `react-i18next` — **fr**, **arabe tchadien**, **Sara** |
| Notifications | `expo-notifications` (push basiques) |

Référence docs Expo : [docs.expo.dev/versions/v54.0.0](https://docs.expo.dev/versions/v54.0.0/).

---

## 2. Acteurs

### 2.1 Prestataire

Jeune (cible 18–35 ans) proposant des services.

- Créer / gérer son profil
- Publier des services (prix, délai, catégorie, ville / position)
- Portfolio **images**
- Recevoir, accepter ou annuler des commandes
- Chatter (texte + images)
- Encaisser via FedaPay (quand live) ou hors plateforme
- **Refuser un paiement déclaré hors plateforme** dans un délai de **24 h** à compter de la date du **dernier paiement enregistré** pour la commande
- **Noter un client** après une commande acceptée puis annulée (note visible au client ; agrégat visible aux prestataires en chat)
- Demander vérification d’identité (CNI / passeport + selfie)
- Souscrire / afficher le **Premium** (mise en avant + badge)

### 2.2 Client

- Rechercher par catégorie, ville, mot-clé, prix, note
- Consulter profil, portfolio, avis
- Commander via un parcours en étapes (métadonnées optionnelles) et suivre le statut sur une fiche détail
- Payer in-app (FedaPay) ou hors app
- **Noter obligatoirement** au paiement in-app (note + tags ; commentaire optionnel) — valide si paiement abouti
- Chatter (texte + images)

### 2.3 Administrateur

Un seul opérateur au démarrage (compte seed).

- Gérer utilisateurs (suspendre, etc.)
- Examiner les demandes de vérification → badge **vérifié**
- Activer Premium manuellement (V1) / suivre abonnements
- Configurer commission et paramètres plateforme
- Traiter signalements
- Consulter paiements / commandes

**Pas de second front web admin en V1** — admin dans l’app mobile.

---

## 3. Périmètre MVP (décisions verrouillées)

### 3.1 Inclus

| Domaine | Contenu |
|---------|---------|
| Auth | Inscription / connexion email + mot de passe ; reset email si disponible, sinon contact support |
| Profils | Client & prestataire ; ville parmi 10 villes ; compétences ; bio ; photo |
| Services | CRUD prestataire ; recherche / filtres ; détail ; position géo (propre ou héritée du profil) |
| Portfolio | Images uniquement |
| Commandes | Cycle V1 + stepper création (sans indicateur) + métadonnées optionnelles + fiche détail selon rôle (voir §4.5) |
| Messagerie | Temps réel Convex ; **texte + images** |
| Notation | Note globale 1–5 + commentaire ; **seulement si paiement in-app** |
| Paiement | Hors plateforme + **intégration FedaPay complète** (sandbox → prod) |
| Commission | 10 % défaut, **paramétrable** (settings + admin) |
| Premium | UI + flag admin en V1 ; paiement FedaPay dès live → badge + boost recherche |
| Vérification | Upload CNI/passeport + selfie **après inscription** (paramètres) ; revue admin → badge vérifié |
| Langues | FR + arabe tchadien + Sara |
| Villes | 10 villes (voir §8) |
| Push | Nouvelles commandes + nouveaux messages |
| Admin | Écrans mobile existants à finaliser |
| UI | Refonte selon `DESIGN.md` (cream/ink) ; **zéro emoji** → Phosphor |
| Données test | `mock_data` avec URLs d’images **vérifiées** |
| Logo | Logo actuel converti en **SVG** et utilisé dans l’app |

### 3.2 Exclu / reporté (hors MVP ou V1.x)

| Élément | Statut |
|---------|--------|
| OTP SMS réel | Exclu (pas de Twilio etc.) |
| Escrow bancaire complexe | Non — libération automatique au succès paiement (ou après 24 h hors plateforme) |
| Litige comme statut dédié | Exclu du cycle V1 |
| Statut “en cours” séparé | Exclu (voir §5) |
| Sous-critères d’avis (ponctualité…) | V1.1 |
| Vidéos portfolio / chat | Reporté |
| PDF / documents dans le chat | Reporté |
| Carte / géolocalisation avancée (clustering, itinéraires, filtres géo riches) | V2 — le MVP stocke déjà lat/lng profil & service pour la carte basique |
| Formations en ligne / IA | V2 |
| Mode hors-ligne riche | V2 |
| iOS Store en premier | Android / APK interne d’abord |
| Rôle dual (client + prestataire) | Exclu — un seul rôle à l’inscription |

### 3.3 Matrice décisions produit

| # | Sujet | Décision |
|---|--------|----------|
| 1 | SMS | Pas de SMS réel |
| 2 | Validation prestataire à l’inscription | Auto-actif |
| 3 | Paiement | Hors app + FedaPay préparé et branché |
| 4 | Ordre FedaPay | Commande d’abord, puis abonnement premium |
| 5 | Libération fonds | Automatique au succès du paiement intégré (FedaPay) → `released` ; hors plateforme : après 24 h sans refus |
| 6 | Choix paiement | FedaPay **et** hors plateforme coexistent |
| 6b | Refus hors plateforme | Prestataire peut refuser un paiement `off_platform` **uniquement dans les 24 h** suivant la date du **dernier paiement enregistré** pour la commande ; au-delà, le refus n’est plus possible |
| 7 | Avis client→prestataire | **Obligatoire** au paiement in-app (note 1–5 + tags ; commentaire libre optionnel). Valide seulement si paiement abouti. Pas de notation depuis la fiche service. |
| 7b | Avis prestataire→client | Après commande **terminée** (`completed`), ou **annulée après acceptation** (`acceptedAt`). Refus immédiat sans acceptation → pas d’avis. Commande annulée / refusée → **paiement interdit**. |
| 8 | Chat | Texte + images (galerie + caméra, JPEG/PNG/WebP, ~5 Mo max) |
| 9 | Premium | Nécessaire (badge + mise en avant) ; flag admin V1 puis paiement |
| 10 | Identité | CNI ou passeport + selfie ; settings post-inscription |
| 11 | Compte non vérifié | Peut publier et recevoir des commandes |
| 12 | Langues | 3 langues |
| 13 | Villes | 10 villes (liste §8) |
| 13b | Position service | Optionnelle : position propre **ou** « utiliser la position du profil » (défaut) |
| 14 | Rôle | Un seul à l’inscription |
| 15 | Admin | Mobile, opérateur unique |
| 16 | Push | Commande + message |
| 17 | Distribution | APK / tests internes avant Play Store |
| 18 | Commission | 10 %, paramétrable, pas d’escrow “banque” |
| 19 | Avis UX | Note via expressions à la saisie ; étoiles à la consultation ; tags + commentaire concaténés |
| 20 | Portfolio | Images seules |
| 21 | Reset mdp | Email si possible, sinon support |

---

## 4. Fonctionnalités détaillées

### 4.1 Authentification

| Fonction | Priorité | Règle |
|----------|----------|--------|
| Inscription | Haute | Email, mot de passe, nom, **rôle** (`client` \| `provider`) |
| Connexion | Haute | Email + mot de passe (Convex Auth Password) |
| OTP SMS | — | **Non implémenté** en prod ; aucun provider SMS |
| Mot de passe oublié | Moyenne | Reset email si le provider le permet ; sinon message support |
| Session | Haute | Session Convex Auth persistée (SecureStore / AsyncStorage selon setup projet) |

Après inscription : redirection vers complétion de profil (ville, téléphone optionnel, etc.).

### 4.2 Profils

| Champ | Client | Prestataire |
|-------|--------|-------------|
| Photo | Oui | Oui |
| Nom / prénom | Oui | Oui |
| Ville (liste fermée) | Oui | Oui |
| Bio | Optionnel | Recommandé |
| Compétences | — | Oui |
| Tarif horaire indicatif | — | Optionnel |
| Disponibilité | — | `available` \| `busy` \| `unavailable` |
| Badges | — | `verified`, `premium` (+ scores dérivés si utiles) |

**Vérification d’identité** (prestataire, depuis Paramètres) :

1. Upload document (`national_id` \| `passport`)
2. Upload selfie
3. Statut `pending` → revue admin → `approved` \| `rejected`
4. Si `approved` : `isVerified = true` + badge vérifié

### 4.3 Services

- Titre, description, catégorie, prix (fixe ou négociable), délai (jours), photos, ville/région, actif/pause
- **Position géo** (lat/lng + ville/région) :
  - par défaut : **utiliser la position du profil** prestataire (copie ville/région/lat/lng) ;
  - sinon : le prestataire définit une position propre au service (là où il s’applique)
- Recherche : texte, catégorie, ville, prix min/max, note, premium/vérifié, distance si lat/lng fournis
- Tri : note, prix, popularité, récence — **Premium en tête** des résultats pertinents
- Carte MVP : pins basés sur la position du **service** (pas uniquement le profil)

### 4.4 Portfolio

- Items liés au profil prestataire
- Media : **image** uniquement (storage Convex)
- Titre + description optionnelle + ordre d’affichage

### 4.5 Commandes — cycle V1

Statuts autorisés :

```
pending → accepted → completed
                  ↘ cancelled
pending → cancelled
```

| Statut | Signification |
|--------|----------------|
| `pending` | Demande client, en attente prestataire |
| `accepted` | Prestataire a accepté (travail en cours implicitement) |
| `completed` | Prestataire a marqué la prestation comme terminée |
| `cancelled` | Annulation / refus : **aucun paiement** possible. Si la commande avait été **acceptée** (`acceptedAt`), le prestataire peut noter le client. Un refus immédiat (sans acceptation) n’ouvre pas la notation. |

**Payée** est un statut **d’affichage** (pas stocké) : commande `completed` dont le paiement est `held` / `released`. Le badge devient « Payée » (vert foncé) sur la liste et la fiche commande ; c’est le dernier état du parcours.

Pas de statut `in_progress`, `rejected` ou `dispute` dans le parcours utilisateur V1 (le schéma technique peut conserver des littéraux inutilisés jusqu’à nettoyage).

#### Parcours de création (demandeur / client)

- Écran multi-étapes **style register** (Continuer / Retour) **sans indicateur de progression** (pas de dots / « étape X sur Y »).
- Point d’entrée : action **Commander** depuis la fiche service (et équivalents).
- Toutes les métadonnées ci-dessous sont **optionnelles** ; le client peut avancer / soumettre sans les remplir.

| Étape (indicatif) | Contenu |
|-------------------|---------|
| Contexte | Récapitulatif du service commandé |
| Description | Texte libre optionnel (besoin, précisions) |
| Emplacement | Choix optionnel via **bottomsheet carte Leaflet** (tap / drag pin → lat/lng ; ville/région dérivées ou saisies) |
| Médias | Jusqu’à **4 photos** + **message vocal** optionnel |
| Confirmation | Revue + envoi de la commande (`pending`) |

#### Métadonnées de commande

Stockées sur `orders` (ou structure équivalente) et exposées en lecture sur la fiche détail :

| Champ | Type | Contraintes |
|-------|------|-------------|
| `description` | texte | Optionnel |
| `latitude` / `longitude` | nombres | Optionnels ; saisie via Leaflet uniquement (pas de saisie libre obligatoire) |
| `city` / `region` | texte | Optionnels (cohérents avec l’emplacement choisi) |
| `photoStorageIds` | storage Convex | Max **4** images |
| `voiceStorageId` | storage Convex | Optionnel ; durée raisonnable (ex. ≤ 60 s) ; lecture sur la fiche détail |

Upload via le flux fichiers existant (`generateUploadUrl` / `useUpload`).

#### Fiche détail commande

- Route dédiée (ex. `/order/[id]`), accessible depuis la liste des commandes (client et prestataire).
- Affiche le **cycle de statut**, le service, les montants / paiement le cas échéant, et **toutes les métadonnées** fournies (description, carte ou coords, galerie photos, lecteur audio).
- **Vue adaptée au profil** qui consulte :
  - **Client (demandeur)** : sa demande, suivi, actions client (annuler si autorisé, payer / checkout si requis, noter si éligible).
  - **Prestataire** : brief client (métadonnées), actions prestataire (accepter, terminer, annuler selon règles de statut).
- UI/UX conforme au design system (thème clair / sombre).

### 4.6 Paiements

#### Modes

| Mode | Commission | Avis officiel | Notes |
|------|------------|---------------|-------|
| `fedapay` / `airtel_money` / `moov_money` | Oui (% settings) | Oui après succès + commande terminée | Via FedaPay |
| `off_platform` | 0 % affichée / pas prélevée | Non (`canReview = false`) | Accord hors app |

#### Paiement hors plateforme — déclaration & refus

1. Après commande `completed`, le client peut enregistrer un paiement `off_platform` → statut paiement `pending` (pas de commission, pas d’avis). L’horodatage `recordedAt` marque la date de cet enregistrement.
2. Le **prestataire** peut **refuser** ce paiement **uniquement dans les 24 heures** suivant la date du **dernier paiement enregistré** pour la commande (`recordedAt`, sinon `createdAt`).
3. Refus → paiement `failed` ; le client peut à nouveau enregistrer un mode de paiement (intégré ou hors plateforme) — un nouvel enregistrement repart un nouveau délai de 24 h.
4. Au-delà de 24 h sans refus : libération automatique `released` (job planifié à l’enregistrement du paiement hors plateforme).
5. Un paiement hors plateforme déjà libéré (`released` avec `releasedAt`) n’est plus refusible.

#### FedaPay (obligatoire à préparer)

- Variables : `FEDAPAY_SECRET_KEY`, `FEDAPAY_ENV` (`sandbox` \| `live`), `FEDAPAY_CALLBACK_URL`
- Création transaction, webhook HTTP Convex, mise à jour `payments`
- Flux métier :
  1. Commande déjà `completed` (prestataire a terminé)
  2. Client paie → statut paiement `released` (libération immédiate vers prestataire ; `held` conservé en schéma pour legacy / filtres admin)
- **Premier flux à finaliser** : paiement de **commande**
- **Second** : paiement **abonnement premium**
- Sans clés : mode sandbox local (référence factice, pas de blocage du reste de l’app)

#### Commission

- Défaut : **10 %**
- Stockée dans `settings` (clé type `commission_rate`)
- Modifiable depuis l’admin mobile
- Affichée au checkout : montant service, commission, net prestataire

### 4.7 Notation

#### Avis client → prestataire / service (paiement in-app)

- **Obligatoire** lors du paiement intégré (FedaPay / mobile money in-app) : le client doit donner une **note 1–5** avant de payer.
- Cases à cocher (constantes app, séries de **6**) :
  - **Prestataire** (`PROVIDER_REVIEW_TAG_IDS`)
  - **Service** (`SERVICE_REVIEW_TAG_IDS`)
- Commentaire libre **optionnel**.
- Les tags choisis + le commentaire sont **concaténés** en un bloc texte stocké dans `reviews.comment`.
- L’avis est lié à la **commande** (`reviews.orderId`) et porté par `isValid` :
  - créé / mis à jour au moment de l’enregistrement du paiement (`isValid = false`)
  - passé à `isValid = true` **uniquement** si le paiement aboutit (`released` / succès)
  - reste invalide si le paiement échoue (n’entre pas dans les moyennes publiques)
- **Interdit** de noter depuis la page détail service — uniquement via le parcours commande / checkout.
- Hors plateforme : **pas** d’avis officiel (`canReview = false`).
- UI saisie : **icônes d’expression** colorées (1–5) ; consultation : **étoiles**.
- Moyenne affichée sur profil / service **uniquement** à partir des avis `isValid`.
- Prestataire peut répondre à un avis valide (si déjà prévu — à conserver).

#### Paiement vs annulation / refus

- **Refus** prestataire (`pending` → `cancelled` sans `acceptedAt`) : **paiement interdit** ; **pas** de notation client.
- **Annulation** après acceptation (`acceptedAt` conservé) : **paiement interdit** ; le **prestataire peut noter** le client.
- **Commande terminée** (`completed`) : le **prestataire peut aussi noter** le client ; le client peut payer.
- **Paiement** autorisé seulement si statut `completed` (prestation terminée).

#### Avis prestataire → client

- Après une commande **terminée** (`completed`), **ou** **annulée** alors qu’elle avait été **acceptée** (`acceptedAt`), le prestataire peut noter le client (note 1–5 + tags `CLIENT_REVIEW_TAG_IDS` + commentaire optionnel, concaténés).
- Une note par commande (`clientReviews`).
- **Visibilité fiche commande** : le **client noté** et le **prestataire auteur** voient cette note dans le bloc **« Notes de la commande »**, qui regroupe la **note du prestataire** (client → prestataire, une fois validée par le paiement) et la **note du client** (prestataire → client). Aucun tiers n’y a accès.
- **Visibilité chat** : tout prestataire en conversation avec ce client voit la **note moyenne** dans le header, et un bouton info ouvre un modal (profil client + note + commentaires **anonymisés** par **catégorie de service** de la commande d’origine).

#### Liste commandes (client)

- Sur une carte commande **terminée non payée**, le client voit une action **Payer** directe (raccourci vers le checkout).
- Checkout in-app en **stepper (3 étapes max, sans indicateur)** : (1) note + options prestataire, (2) options service + commentaire, (3) paiement.
- **Noter le client** : écran dédié `/review/client/[orderId]` (pas de bottomsheet). Après envoi, retour sur le **détail de la commande** puis bottomsheet de confirmation par-dessus.
- **Champs obligatoires** (note, options) : erreur **inline** sous le groupe concerné (bordure rouge + message), jamais de bottomsheet d’erreur.

Règle produit : **pas de paiement in-app abouti ⇒ pas d’avis officiel valide** (évite les faux scores).

### 4.8 Messagerie

- Conversation liée optionnellement à une commande
- Temps réel via Convex subscriptions
- Types : `text`, `image`
- Images : galerie + caméra ; formats JPEG / PNG / WebP ; taille max ~5 Mo
- Lu / non lu via `readBy`
- Pas de documents PDF en V1

### 4.9 Premium

| Élément | V1 |
|---------|-----|
| Avantage | Mise en avant recherche + badge premium |
| Attribution | Flag admin (`isPremium`) + enregistrement `subscriptions` possible |
| Paiement | Brancher FedaPay dès que les clés sandbox sont dispo |
| UI | Écran Premium avec prix affiché (FCFA) |

Badge **vérifié** ≠ badge **premium** :

- Vérifié = identité validée
- Premium = abonnement / mise en avant

### 4.10 Admin mobile

Écrans cibles :

- Tableau de bord
- Utilisateurs
- Vérifications identité
- Signalements
- Avis (modération)
- Paiements / abonnements
- Paramètres (commission, etc.)

### 4.11 Notifications

Push (Expo) pour :

- Nouvelle commande / changement de statut
- Nouveau message

Pas d’emails transactionnels obligatoires en V1 (hors reset mdp).

---

## 5. Modèle de données (conceptuel)

Aligné sur le schéma Convex actuel (`convex/schema.ts`), à ajuster seulement si une règle de ce CDC l’exige.

### Entités principales

| Table | Rôle |
|-------|------|
| `users` | Compte auth, rôle, statut, langue, push token |
| `profiles` | Profil métier, ville, badges, stats, géo optionnelle (lat/lng) |
| `categories` / `skills` | Taxonomie services |
| `services` | Offres publiées + géo (propre ou héritée du profil à la création) |
| `portfolio` | Médias prestataire |
| `orders` | Commandes + flags paiement / review + métadonnées optionnelles (description, géo, photos ≤4, vocal) |
| `payments` | Montants, commission, méthode, statut FedaPay |
| `reviews` | Avis client→prestataire/service ; `isValid` lié au succès paiement ; tags + commentaire concaténé |
| `clientReviews` | Avis prestataire→client (après annulation post-acceptation) |
| `conversations` / `messages` | Chat |
| `notifications` | In-app (+ lien push) |
| `subscriptions` | Premium |
| `verificationRequests` | CNI / passeport + selfie |
| `reports` | Signalements |
| `favorites` | Favoris (si conservé) |
| `settings` | Commission et config |
| `searchHistory` | Optionnel |

### Règles clés

- Un user = un rôle (`client` \| `provider` \| `admin`)
- Prestataire actif sans vérification obligatoire
- `isOfficial` / `canReview` respectent la règle paiement in-app
- Premium influence le score / tri de recherche

---

## 6. Modèle économique

| Source | Phase | Détail |
|--------|-------|--------|
| Commission prestations | V1 | % paramétrable (défaut 10 %) sur paiements in-app |
| Abonnement Premium | V1 (préparé) / live avec FedaPay | Mise en avant + badge |
| Publicités | V2 | — |

Exemple (prix 20 000 FCFA, commission 10 %) :

| Poste | Montant |
|-------|---------|
| Prix service | 20 000 FCFA |
| Commission | 2 000 FCFA |
| Net prestataire | 18 000 FCFA |

---

## 7. Exigences non fonctionnelles

### 7.1 Performance

- API Convex : objectif réponses perçues < 500 ms pour actions courantes
- Accueil : cible < 2 s sur réseau 3G/4G correct
- Listes : FlashList / virtualisation pour services et messages

### 7.2 Disponibilité & données

- Hébergement Convex + backups plateforme
- Secrets FedaPay hors repo (env Convex)

### 7.3 Sécurité

- HTTPS
- Auth Convex ; validation des args côté mutations/actions
- Uploads contrôlés (types / taille)
- Admin : garde `role === 'admin'`
- Pas de secrets dans le client

### 7.4 Compatibilité

- Android prioritaire (API 23+ / politique Expo 56)
- iOS plus tard
- Écrans à partir de ~4.5"

### 7.5 Accessibilité & i18n

- Textes UI via clés i18n (pas de chaînes hardcodées nouvelles)
- RTL à anticiper pour l’arabe (bonnes pratiques layout)
- Icônes Phosphor : labels accessibles sur actions icon-only

---

## 8. Données de référence

### 8.1 Dix villes (MVP)

1. N'Djaména  
2. Moundou  
3. Abéché  
4. Sarh  
5. Bongor  
6. Doba  
7. Kélo  
8. Pala  
9. Ati  
10. Mongo  

(Les régions/villes élargies du code peuvent rester en seed, mais l’UX inscription / filtres MVP se concentre sur ces 10.)

### 8.2 Catégories de services

| Catégorie | Exemples |
|-----------|----------|
| Développement web & mobile | Site, app, e-commerce |
| Design graphique | Logo, affiche, charte |
| Couture | Robes, retouches |
| Coiffure | Tresses, coupes |
| Photographie | Mariage, portrait |
| Réparation informatique | PC, téléphone |
| Marketing digital | Réseaux, pubs |
| Traduction | FR–AR, FR–EN |
| Formation & tutorat | Maths, langues, info |
| Artisanat | Bijoux, déco |

**Icônes** : Phosphor uniquement (pas d’emoji catégorie).

### 8.3 Langues

| Code | Libellé |
|------|---------|
| `fr` | Français (défaut) |
| `ar` | Arabe tchadien |
| `sara` | Sara |

### 8.4 Monnaie

**XAF (FCFA)** exclusivement en V1.

---

## 9. Design system & UI

### 9.1 Référence visuelle

Fichier source de vérité : **`DESIGN.md`** (langage editorial Mastercard adapté à TalentTchad).

Tokens d'implémentation : `src/theme/tokens.ts`, `src/theme/typography.ts`, `src/global.css`.

| Pattern DESIGN.md | Application TalentTchad |
|-------------------|-------------------------|
| Canvas Cream `#F3F0EE` | Fond app par défaut (jamais blanc page) |
| Ink Black `#141413` pills CTA (radius 20) | Boutons primaires, pills actives, tab active |
| Secondary white outlined pill | Actions secondaires |
| Signal Orange `#CF4500` | Consent / légal uniquement — **pas** CTA marketing |
| Portraits circulaires + satellite CTA | Cartes services / talents |
| Hero / banners stadium radius 40 | Premium, promo, media frames |
| Floating pill nav / tab bar | Navigation bas + headers flottants |
| Eyebrow (dot orange + uppercase) | Labels de section |
| Sofia Sans (fallback MarkForMC) | Une seule famille — contraste par poids / tracking |
| Radii 6 / 20 / 24 / 40 / 999 | Pas de coins « medium » 8–16 |

### 9.2 Identité couleur

| Token | Hex | Usage |
|-------|-----|--------|
| Canvas | `#F3F0EE` | Fond app |
| Lifted / cards | `#FCFBFA` | Surfaces relevées |
| Ink / primary | `#141413` | Texte, CTA primaires, footer dark |
| On primary | `#F3F0EE` | Texte sur ink |
| Signal | `#CF4500` | Consent / légal |
| Orbit | `#F37338` | Arcs décoratifs, indicateurs, accent dot eyebrow |
| Link | `#3860BE` | Liens inline |
| Muted | `#696969` | Meta / secondaire |
| Dust | `#D1CDC7` | Placeholders / whisper |
| Logo blue / gold / crimson | `#0B3D91` / `#F5C400` / `#E11D48` | **Assets logo + badges sémantiques uniquement** (pas CTA marketing) |

> Objectif : look editorial cream/ink de `DESIGN.md` ; logo TalentTchad reste l'identité marque, sans conduire la palette UI.

### 9.3 Logo

- Source : `assets/images/logo.png`
- Livrable : **SVG vectoriel** du logo
- Usage : splash, auth, headers, about
- Sur cream : version couleur ; sur ink : version claire / inversée

### 9.4 Iconographie

| Règle | Détail |
|-------|--------|
| Librairie | **`phosphor-react-native`** |
| Emojis | **Interdits** dans l'UI |
| Style | Regular / bold ; formes nettes |
| Exemples | `House`, `MagnifyingGlass`, `Receipt`, `ChatCircle`, `User`, `Star`, `MapPin`, `Camera`, `SealCheck`, `Crown`, `ArrowRight` (satellite) |

### 9.5 Motion

- Transitions légères (tabs, listes)
- Press feedback (scale léger sur CTA)
- Satellite / portraits : présence, pas de bruit décoratif excessif

### 9.6 Écrans cibles (conformité CDC)

Auth, complétion profil, tabs principales, recherche, détail service, portfolio, dashboard prestataire, **création commande (stepper sans indicateur)**, **détail commande (vue selon rôle)**, liste commandes, checkout, chat, notifications, premium, vérification, paramètres, admin (*).

(*) Admin : même langage visuel, densité un peu plus élevée.

---

## 10. Données de test (`mock_data`)

### 10.1 Objectif

Fichier dédié (ex. `src/data/mock_data.ts` ou `src/constants/mock_data.ts`) pour :

- story / preview UI ;
- seed local ;
- démonstrations hors backend si besoin.

### 10.2 Contenu minimal

- Utilisateurs / profils (clients + prestataires des 10 villes)
- Catégories + services avec **URLs d’images HTTPS vérifiées** (HTTP 200, CDN stables type Unsplash / Pexels / images projet)
- Portfolio items
- Commandes dans chaque statut V1
- Messages texte + image
- Avis, paiements, abonnements, demandes de vérification
- Textes FR (et clés i18n si affichées)

### 10.3 Règle qualité images

Avant commit : chaque URL mock doit être **testée** (fetch / HEAD) et remplacée si morte.

---

## 11. Architecture technique

```
src/app/          # Expo Router (auth, tabs, admin, service, chat…)
src/components/   # UI + rn-ui
src/providers/    # Auth, Theme, Fonts, I18n
src/locales/      # fr / ar / sara
convex/           # schema, auth, orders, payments, fedapay, admin…
assets/           # images, logo SVG
docs/             # CDC.md, DESIGN.md (UI), design.png (historique), DRAFT.md
```

### Principes

- Une source de vérité backend : Convex
- Pas de logique métier critique uniquement côté client
- Actions FedaPay isolées (`convex/fedapay.ts` + `http` webhook)
- Thème tokens centralisés ; UI conforme §9

---

## 12. Plan de livraison (après validation de ce CDC)

Ordre recommandé :

1. **Gel documentaire** — ce CDC validé  
2. **Parité fonctionnelle** — combler les gaps vs §3–4 (auth, CNI settings, chat images, FedaPay commande→premium, admin commission, 10 villes, i18n)  
3. **Design system** — tokens, logo SVG, Phosphor, composants de base alignés `DESIGN.md`  
4. **`mock_data`** — jeux de données + images vérifiées  
5. **Refonte UI écran par écran**  
6. **QA manuelle** — parcours client / prestataire / admin  
7. **Build APK interne**

> À la validation de ce document, le product owner indiquera l’ordre d’exécution détaillé suivant.

---

## 13. Critères d’acceptation MVP

Le MVP est **conforme** si :

1. Un client et un prestataire peuvent s’inscrire (email/mdp), compléter un profil (ville parmi les 10), et publier / commander un service.  
2. Le chat texte + image fonctionne en temps réel.  
3. Le cycle de commande V1 (`pending` → `accepted` → `completed` \| `cancelled`) fonctionne.  
3bis. Le client peut créer une commande via un stepper **sans indicateur d’étape**, avec métadonnées optionnelles (description, Leaflet, ≤4 photos, vocal) ; la fiche détail affiche ces infos selon le rôle (client / prestataire).  

4. Paiement hors plateforme : pas d’avis ; le prestataire peut le refuser sous 24 h (depuis le dernier paiement enregistré) ; paiement FedaPay (sandbox ou live) : avis **obligatoire** au checkout, valide seulement si paiement abouti.  
5. Commission paramétrable visible au checkout.  
6. Prestataire peut uploader CNI/passeport + selfie ; admin peut approuver → badge vérifié.  
7. Premium : badge + boost ; attribution admin et/ou FedaPay selon disponibilité clés.  
8. UI sans emoji ; icônes Phosphor ; look aligné `DESIGN.md` (cream/ink/Sofia Sans) ; logo SVG en place.  
9. App utilisable en **fr**, **ar**, **sara**.  
10. Push basiques commande + message.  
11. `mock_data` fourni avec images valides.  
12. Admin mobile opérationnel pour users, vérifs, settings commission, signalements.

---

## 14. Glossaire

| Terme | Définition |
|-------|------------|
| MVP | Version minimale livrable conforme à ce CDC |
| CDC | Cahier des charges |
| Convex | Backend BaaS (DB + functions + realtime) |
| FedaPay | Agrégateur de paiement (mobile money, etc.) |
| Premium | Abonnement prestataire : mise en avant + badge |
| Vérifié | Identité validée par admin |
| Hors plateforme | Paiement convenu hors TalentTchad |
| Phosphor | Librairie d’icônes `phosphor-react-native` |
| XAF / FCFA | Franc CFA |

---

## 15. Documents liés

| Fichier | Rôle |
|---------|------|
| `docs/CDC.md` | **Fait foi** |
| `docs/QA-MVP.md` | Checklist QA + build APK preview |
| `docs/DRAFT.md` | Intention initiale (stack obsolète) |
| `DESIGN.md` | **Source de vérité design UI** |
| `docs/design.png` | Ancienne référence patterns (historique) |
| `assets/images/logo.png` | Source logo → à vectoriser en SVG |

---

## 16. Historique

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2025 | DRAFT initial (Django/Flutter) |
| 2.0 | 2026-07-19 | CDC aligné stack Expo+Convex + décisions produit/UI verrouillées |
| 2.1 | 2026-07-22 | Bascule UI vers DESIGN.md (Mastercard cream/ink) — remplace design.png + palette logo UI |
| 2.2 | 2026-07-24 | Commandes : stepper sans indicateur, métadonnées optionnelles (description, Leaflet, photos ≤4, vocal), fiche détail adaptée au rôle |
| 2.3 | 2026-07-24 | Paiement hors plateforme : refus prestataire possible uniquement dans les 24 h suivant la date du dernier paiement enregistré pour la commande |
| 2.4 | 2026-07-24 | Notation : avis obligatoire au paiement in-app (tags + isValid) ; notes prestataire→client ; expressions à la saisie |
| 2.5 | 2026-07-24 | Annulation/refus : paiement interdit ; avis prestataire→client si terminée ou acceptée puis annulée ; CTA Payer sur card client |
| 2.6 | 2026-07-24 | Libération fonds automatique : succès FedaPay → `released` ; hors plateforme auto-`released` après 24 h ; suppression validation client (`orders.validate`) |

---

**TalentTchad © 2026 — Document confidentiel — Version 2.6**
