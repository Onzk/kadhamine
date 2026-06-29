# TalentTchad — Design System

## Brand Colors (Drapeau du Tchad)

| Token | Light | Usage |
|-------|-------|-------|
| `brand.blue` | `#002664` | Couleur principale, CTA, headers |
| `brand.yellow` | `#FECB00` | Accents importants, badges Premium |
| `brand.red` | `#C60C30` | Alertes, actions critiques, erreurs |

## Semantic Colors

- **Success**: `#16A34A`
- **Warning**: `#FECB00`
- **Error**: `#C60C30`
- **Info**: `#002664`

## Surfaces

| Token | Light | Dark |
|-------|-------|------|
| Canvas | `#F8F9FC` | `#0A0E1A` |
| Surface Card | `#FFFFFF` | `#1A2235` |
| Border | `#E2E8F0` | `#2A3548` |

## Typography

- **Display**: Georgia / serif — titres hero
- **Body**: System sans-serif — contenu
- **Hiérarchie**: 28/24/17/15/13/11px

## Spacing

`2 · 4 · 8 · 12 · 16 · 24 · 32 · 48`

## Border Radius

- Cards: `16px`
- Buttons/Inputs: `12px`
- Chips: `pill (9999px)`

## Principes UX

1. Maximum 3 actions principales par écran
2. CTA toujours visible (sticky bottom)
3. Paiement intégré = avis officiel (affiché partout)
4. Offline-first pour profils, commandes, messages
5. Dark mode natif

## Composants clés

- `ServiceCard`, `CategoryChip`, `StarRating`, `Badge`
- `Button` (primary/secondary/outline/ghost/danger/accent)
- `Skeleton` shimmer loading
- `EmptyState` pour listes vides

## Motion

- Fast: 150ms · Normal: 250ms · Slow: 400ms
- Reanimated pour transitions et bottom sheets
