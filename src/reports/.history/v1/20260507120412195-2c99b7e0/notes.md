# Bande de Cheffe — surface d’édition (v0)

## Fichiers à modifier

| Fichier       | Rôle |
|---------------|------|
| `model.ts`    | Montants, alertes, score de fiabilité, textes d’analyse — **uniquement** à partir de `data/`, `MEMORY.md` ou `client_context.json`. |
| `report.tsx`  | Ordre et composition des pages (préférer les exports de `src/components/report-kit/report.tsx`). |
| `notes.md`    | Rappels pour l’agent (ce fichier). |

## Règle absolue

Ne pas inventer de montants. Tant que les exports comptables manquent, laisser les lignes P&L et totaux à `null` et documenter le blocage dans `alerts.blocking`.

## Après import des pièces

1. Mettre à jour `MEMORY.md` (entités, salariés si visibles, vigilances).
2. Renseigner `meta.period`, `meta.year` / `priorYear`, `meta.source` avec la référence exacte des fichiers utilisés.
3. Ventiler classes 6 / 7 dans `pnl.produits` et `pnl.charges`, puis cohérence PCG : Σ produits − Σ charges = résultat d’exploitation (avant impôts et hors lignes hors P&L).
4. Revoir TVA (445xx), 457 / 108 / 455, comptes d’attente (471, 488x) — voir skill `.agents/skills/numeral`.

## Liens utiles

- Ancres de navigation usuelles : `#section-cover`, `#section-sommaire`, `#section-pnl`, `#section-monthly`, `#section-structure`, `#section-analyse`.
