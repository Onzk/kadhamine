# Kadhamine

Marketplace mobile qui met en relation les talents tchadiens (prestataires) et les clients — commandes, chat, paiements, avis et admin.

## Lancer le projet

1. Installer les dépendances :

```bash
npm install
```

2. Configurer l’environnement :

```bash
cp .env.example .env
```

Le fichier `.env.example` contient déjà l’URL Convex du projet. Vérifiez que `.env` reprend au minimum `EXPO_PUBLIC_CONVEX_URL`.

3. Démarrer l’app :

```bash
npx expo start
```

Puis ouvrez sur un appareil (Expo Go / build de développement), un émulateur Android, ou le web selon les options affichées dans le terminal.

## APK de test

Des APK Android prêts à installer se trouvent dans [`build/`](./build) :

| Fichier | Architectures | Usage |
|---------|---------------|--------|
| `kadhamine-arm64.apk` | `arm64-v8a` | Téléphones 64-bit (recommandé, plus léger) |
| `kadhamine-arm64-v7a.apk` | `arm64-v8a` + `armeabi-v7a` | Compatibilité anciens téléphones 32-bit |

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Client | `client@gmail.com` | `devdevdev` |
| Prestataire | `prestataire@gmail.com` | `devdevdev` |
| Admin | `admin@gmail.com` | `devdevdev` |

## Stack (aperçu)

- **App** — Expo SDK 54, React Native, Expo Router
- **Backend** — Convex
- **Auth** — email + mot de passe
- **i18n** — français, arabe tchadien, Sara

Cahier des charges : [`docs/CDC.md`](./docs/CDC.md).
