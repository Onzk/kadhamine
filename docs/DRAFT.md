
TALENTTCHAD
Marketplace de Compétences pour la Jeunesse Tchadienne
CAHIER DES CHARGES
Spécification Fonctionnelle et TechniqueProjet
TalentTchad
Version
1.0
Date
2025
Statut
En développement
Pays cible
Tchad (N'Djaména et régions)
1. Présentation Générale du Projet1.1 Contexte et Problématique
Au Tchad, des milliers de jeunes possèdent des compétences solides dans des domaines variés : développement web, graphisme, couture, coiffure, photographie, réparation informatique, traduction, tutorat et artisanat. Cependant, ils font face à des obstacles majeurs :

• Manque de visibilité : les talents locaux ne disposent pas de plateforme pour se faire connaître
• Accès limité aux clients : les opportunités restent dans des réseaux fermés
• Chômage élevé : le taux de chômage des jeunes dépasse 30% dans les zones urbaines
• Absence d'outils numériques adaptés au contexte local (langue, paiement mobile, connectivité)

1.2 Solution Proposée
TalentTchad est une application mobile qui met en relation les jeunes prestataires de services avec des clients (particuliers, entreprises, ONG). La plateforme permet de :

• Créer un profil professionnel complet avec portfolio
• Publier et promouvoir ses services
• Recevoir des commandes et encaisser des paiements via mobile money
• Bénéficier d’un système de notation et d’avis
• Accéder à des formations et opportunités d’emploi

1.3 Objectifs du Projet
Type
Objectif
Court terme
Livrer un MVP fonctionnel avec inscription, services, messagerie et notation
Moyen terme
Atteindre 500 prestataires actifs et 1 000 clients en 6 mois
Long terme
Déployer dans d’autres pays d’Afrique centrale
2. Acteurs de la Plateforme2.1 Prestataire
Jeune (18–35 ans) possédant une ou plusieurs compétences monnayables.

• Créer et gérer son profil professionnel
• Ajouter ses compétences et son portfolio (photos, vidéos)
• Publier des offres de services avec tarifs
• Recevoir, accepter ou refuser des commandes
• Communiquer avec les clients via le chat
• Encaisser des paiements via Airtel Money ou Moov Money
• Consulter ses statistiques de performance

2.2 Client
Particulier, entreprise ou ONG cherchant un prestataire de service local.

• Rechercher un talent par catégorie, ville ou mot-clé
• Consulter les profils, portfolios et avis
• Commander un service et suivre son avancement
• Communiquer avec le prestataire via le chat
• Noter et commenter après chaque prestation

2.3 Administrateur
Responsable de la gestion et de la modération de la plateforme.

• Valider et vérifier les comptes prestataires
• Gérer les signalements et litiges
• Contrôler les paiements et commissions
• Générer des rapports et statistiques
• Configurer les catégories et compétences


3. Fonctionnalités — Version 1 (MVP)3.1 Authentification
Fonctionnalité
Priorité
Description
Inscription
Haute
Email, téléphone, nom, rôle (client/prestataire) 
Connexion JWT
Haute
Token d'accès + refresh automatique
Vérification OTP SMS
Haute
Code 6 chiffres envoyé par SMS – par défaut actuellement 000000 en mode non prod
Mot de passe oublié
Moyenne
Réinitialisation par SMS ou email3.2 Gestion des Profils
Fonctionnalité
Priorité
Description
Profil prestataire
Haute
Photo, bio, ville, compétences, tarif horaire
Portfolio
Haute
Upload d’images via Supabase Storage
Vérification identité
Moyenne
CNI, passeport ou carte étudiante
Badge vérifié
Moyenne
Affiché après validation admin3.3 Gestion des Services
Fonctionnalité
Priorité
Description
Publication de service
Haute
Titre, description, prix, délai, catégorie
Recherche et filtres
Haute
Par ville, catégorie, prix min/max, note
Détail du service
Haute
Description complète + portfolio + avis
Gestion des offres
Haute
Activer, mettre en pause, supprimer3.4 Gestion des Commandes
Statut
Description
En attente
Commande envoyée par le client, en attente d’acceptation
Acceptée
Prestataire a accepté la mission
En cours
Travail en cours de réalisation
Terminée
Mission livrée et validée par le client
Annulée
Annulation par l’une des parties
Litige
Contestation en cours, intervention admin3.5 Messagerie (Chat Temps Réel)
• Chat WebSocket entre client et prestataire
• Envoi de texte, images et documents
• Indicateur de message lu / non lu
• Historique des conversations persistent

3.6 Système de Notation
• Note globale de 1 à 5 étoiles
• Sous-critères : ponctualité, qualité, communication
• Commentaire libre
• Affichage de la moyenne sur le profil prestataire


4. Fonctionnalités Avancées — Version 2Fonctionnalité
Phase
Détails
Géolocalisation
V2
Carte des talents par région, distance, disponibilité – laeflet 
Paiement mobile
V2
Airtel Money et Moov Money intégrés
Vérification identité
V2
Scan de CNI/passeport, badge vérifié
Formation en ligne
V2
Cours : info, IA, marketing, entrepreneuriat
Suggestions IA
V2
Missions adaptées, talents recommandés, estimation prix
Mode hors connexion
V2
Profils et messages accessibles sans internet
Langues locales
V2
Arabe tchadien et Sara en plus du français
Abonnement premium
V2
Mise en avant du profil, badge, statistiques avancées

6. Modèle de Données6.1 Principales entités
Table
Champs principaux
Relations
User
email, telephone, role, photo_url, ville, biographie, est_verifie
OneToOne ? ProfilPrestataire
ProfilPrestataire
experience, disponible, tarif_heure
ManyToMany ? Competence
Competence
nom, description, categorie, icone
Indépendante
Service
titre, description, prix, delai_jours, statut, ville
FK ? User, Competence
PortfolioItem
titre, image_url
FK ? Service
Commande
statut, montant, description
FK ? User (client + prestataire), Service
Paiement
methode, statut, montant, reference
OneToOne ? Commande
Avis
note, ponctualite, qualite, communication, commentaire
OneToOne ? Commande
Conversation
created_at
ManyToMany ? User
Message
type, contenu, fichier_url, lu
FK ? Conversation, User
OTPCode
telephone, code, is_used
Indépendante
7. Modèle Économique7.1 Sources de revenus
Source
Phase
Détail
Commission sur prestations
V1
5 à 10% prélevés sur chaque transaction
Abonnement Premium
V2
Mise en avant, badge vérifié, statistiques avancées
Publicités ciblées
V2
Centres de formation, universités, ONG, entreprises7.2 Exemple de transaction
Poste
Montant (FCFA)
Prix du service
20 000
Commission TalentTchad (10%)
2 000
Montant reçu par le prestataire
18 000
8. Plan de DéveloppementPhase
Durée
Livrables
Phase 1
1 mois
Étude de marché, maquettes UI/UX (Figma), cahier des charges
Phase 2
2 mois
Backend Django : API, authentification JWT, OTP, modèles de données
Phase 3
2 mois
Application Flutter : écrans, navigation, chat, recherche
Phase 4
1 mois
Tests, corrections, déploiement sur Google Play et App Store
Phase 5
Continu
Paiement mobile, IA, formations, langues locales
9. Exigences Non Fonctionnelles9.1 Performance
• Temps de réponse API inférieur à 500ms pour 95% des requêtes
• L'application doit supporter 1 000 utilisateurs simultanés au lancement
• Chargement de l’écran d’accueil en moins de 2 secondes

9.2 Disponibilité
• Taux de disponibilité cible : 99,5% (Supabase garantit 99,9%)
• Sauvegardes automatiques quotidiennes de la base de données
• Mode hors connexion partiel pour les données importantes

9.3 Sécurité
• Chiffrement HTTPS de toutes les communications
• Tokens JWT à durée limitée avec rotation automatique
• Validation stricte des entrées utilisateur
• Politique RLS (Row Level Security) sur Supabase

9.4 Compatibilité
• Android 6.0 (API 23) et versions supérieures
• iOS 12.0 et versions supérieures
• Interface adaptée aux écrans de 4.5 pouces et plus


10. Annexes10.1 Catégories de services
Icône
Catégorie
Exemples de services
??
Développement web & mobile
Site vitrine, app Android, e-commerce
??
Design graphique
Logo, affiche, charte graphique
??
Couture
Robes, costumes, retouches
??
Coiffure
Tresses, coupes, soins capillaires
??
Photographie
Mariage, portrait, produit
??
Réparation informatique
PC, téléphone, imprimante
??
Marketing digital
Réseaux sociaux, publicité, SEO
??
Traduction
Français-Arabe, français-anglais
??
Formation & tutorat
Math, informatique, langues
??
Artisanat
Poterie, bijoux, décoration

10.3 Glossaire
Terme
Définition
MVP
Minimum Viable Product : version minimale fonctionnelle du produit
JWT
JSON Web Token : mécanisme d’authentification sécurisé
OTP
One-Time Password : code à usage unique envoyé par SMS
BLoC
Business Logic Component : patron de gestion d’état Flutter
DRF
Django REST Framework : bibliothèque pour créer des APIs avec Django
RLS
Row Level Security : sécurité au niveau des lignes dans Supabase
FCFA
Franc CFA : monnaie utilisée au Tchad
WebSocket
Protocole de communication bidirectionnelle en temps réel
Autres points : 

Si le paiement est effectué par l'application, le demandeur de service peut noter le prestataire.Si non, le prestataire n'aura pas de notation et il aura toujours un mauvais score.

On va rendre paramétrable les commissions. Et pour le système d'abonnement, ce sera uniquement pour les prestataires qui veulent qu'on montre bien leurs profils en premier lors de recherches.
Et ils auront un badge certifié
Fin du document — TalentTchad © 2025
TalentTchad — Cahier des Charges    Version 1.0 — 2025

Confidentiel — TalentTchad	Page 1


