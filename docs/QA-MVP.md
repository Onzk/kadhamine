# Checklist QA MVP — TalentTchad

Référence : [CDC.md](./CDC.md) §13. À cocher avant build / déploiement interne.

## Environnement

- [ ] Convex déployé (`npx convex dev` ou prod) + `EXPO_PUBLIC_CONVEX_URL` dans `.env`
- [ ] FedaPay **sandbox** : `FEDAPAY_SECRET_KEY` (Convex) configurée — live hors scope MVP code
- [ ] Push : projet Expo + credentials (device physique pour réception)

### Variables FedaPay (hors code)

| Variable | Où | Notes |
|----------|-----|--------|
| `FEDAPAY_SECRET_KEY` | Convex env | Sandbox pour tests ; live pour prod store |
| `FEDAPAY_PUBLIC_KEY` | si utilisé côté client | Sandbox / live selon environnement |
| `EXPO_PUBLIC_CONVEX_SITE_URL` | `.env` | URL site Convex pour webhooks / redirects |

---

## Parcours fonctionnels

1. **Inscription**
   - [ ] Client : email/mdp + profil (ville parmi les 10 MVP)
   - [ ] Prestataire : email/mdp + profil + rôle prestataire

2. **Commande & avis**
   - [ ] Publier un service (prestataire)
   - [ ] Commander (client) → accepter (prestataire)
   - [ ] Terminer (prestataire) → Payer **sandbox FedaPay** → statut `released` → bouton **Laisser un avis** → moyenne visible
   - [ ] Parcours **hors plateforme** : pas de bouton avis

3. **Chat**
   - [ ] Message texte temps réel
   - [ ] Envoi d’image

4. **Vérification**
   - [ ] Upload CNI/passeport + selfie (settings)
   - [ ] Approve admin → badge vérifié

5. **Premium**
   - [ ] Attribution admin `setPremium`
   - [ ] Flux FedaPay sandbox (si clés présentes)

6. **Commission**
   - [ ] Admin modifie le taux → visible au checkout

7. **Push**
   - [ ] Device : ouvrir l’app, déclencher commande ou message, réception notification

8. **i18n**
   - [ ] FR / AR / Sara sur auth, tabs, commandes, checkout (pas de placeholders « Kəla… » orphelins)

9. **Services prestataire**
   - [ ] Créer, mettre en pause, réactiver, modifier titre/description/prix

---

## Build APK preview

```bash
eas build --profile preview --platform android
```

- [ ] Commande EAS lancée avec succès
- [ ] APK installable sur device de test

---

## Statut session (2026-07-20)

| Item | Statut |
|------|--------|
| Checklist documentée | OK — ce fichier |
| Lint (`npx expo lint`) | OK — 0 erreur (2 warnings hors scope) |
| EAS preview Android | **Bloqué permissions** — CLI connecté en `justinkdss` ; projectId `0d56aa6d-0118-446b-b07c-21d65f52c70a` non autorisé (`Entity not authorized`) |

### Débloquer le build

1. Se connecter avec le compte Expo propriétaire du projet : `eas login`
2. Relancer : `eas build --profile preview --platform android`
3. Ou ajouter `justinkdss` / l’équipe au projet Expo `talenttchad` (dashboard expo.dev)
