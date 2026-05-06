---
name: numeral-reclassement-fiabilite
description: >-
  Référence pour reclassements prudents des comptes d'attente (471 banque,
  etc.), healing des données dans le modèle Numeral (pas seulement du texte),
  et cohérence du score de fiabilité. Déclencheurs : « corriger erreurs
  bloquantes », « reclasser les 471 », « arranger la compta », « mettre à jour
  le score », « provisoire balance + grand-livre ». Pair avec
  numeral-classify-attente-pnl pour le détail 471 → P&L.
---

# Numeral — reclassement & fiabilité

## Principe

- Corriger **uniquement** ce qui est défendable à partir des pièces (balance, grand-livre, contexte dossier).
- **Soigner les données** dans le rapport : imputation 6/7 pour les lignes haute confiance, retrait du tableau bloquant, **P&L et totaux recalculés**. Pas de bloc narratif en bas de page à la place du healing.
- Dans ce template Bande de Cheffe : le **moteur de règles** vit en **Python** (`scripts/reclasse_471_healing.py`). On ne duplique pas un moteur de reclassement en TypeScript sous `src/reports/`. Le livrable TS est `src/reports/v<V>/model.ts` (validé par `src/schemas/report.ts`).
- **`scripts/` (racine projet)** : **carnet de brouillon pour l’agent** — scripts d’exploration, extractions ad hoc, recalculs et pipelines Python avant **reprise manuelle** des chiffres et règles dans `model.ts`. Rien n’y est garanti « API produit » ; la **vérité affichée** reste le modèle de rapport + les pièces sous `data/`.

## Versions d’affichage (V0 / V1)

| Mode | `REPORT_471_MODE` dans `model.ts` | Commande de vérité | `alerts.blocking` | `pnl.*` (N) |
|------|-----------------------------------|--------------------|-------------------|-------------|
| **V0** | `"v0" as "v0" \| "v1"` | `pnpm reclasse-471 -- --mode v0` | **Toutes** les lignes 471 de l’extrait | Identique **balance export** (pas de healing dans les totaux) |
| **V1** | `"v1" as "v0" \| "v1"` | `pnpm reclasse-471 -- --mode v1` | **Résidu** seulement (hors lignes haute confiance du script) | **Aligné** sur le JSON healed (lignes marquées « ajusté », détails sous postes) |

Le cast `as "v0" \| "v1"` évite que TypeScript réduise le type à un seul littéral quand les deux branches existent dans le fichier.

## Grand-livre & suspens (règles communes)

- Filtrer **`471*`** sur la colonne **N° de compte**, pas sur une recherche texte globale (un **IBAN peut contenir « 471 »**).
- **`445800` / `445860`** : TVA en attente ≠ suspens banque ; ne pas les confondre avec les 471 dans `blocking`.
- Comptes d’attente typiques : **`4716` / `4717`**, autres passages ; produits à recevoir / charges à payer déjà en balance ; virements lisibles (ASP, assureur, remboursement, trop-perçu, erreur, etc.).

## Quand retirer une ligne du bloquant

Une ligne peut sortir de `blocking` (V1) si **au moins** un signal solide : même montant (ou quasi), libellé explicite, contrepartie déjà en balance, ou cohérence métier évidente. Sinon : **rester en bloquant** ou **point d’attention** — ne pas « nettoyer » pour l’esthétique.

## Workflow (ordre)

1. **Cibler la version** : lire `src/reports/meta.json`, éditer uniquement `src/reports/v<V>/` (pas une autre version).
2. **Lire** `model.ts` : `alerts.blocking`, `pnl.*`, `pnl.score`, `analyse.scoring`, `analyse.penalties`, `analyse.synthese`, `analyse.narratives`.
3. **Lire les pièces** : balance + grand-livre exercice sous `data/` ; détail ligne à ligne des 471 pour `blocking`.
4. **Mettre à jour le script Python** si l’export GL change : `GL_471`, règles `HIGH_CONFIDENCE`, buckets P&L ; pas de logique parallèle uniquement en TS.
5. **Exécuter** `pnpm reclasse-471 -- --mode v0` puis `--mode v1` ; vérifier counts, totaux bloquants, `healed_pnl` (JSON).
6. **Reporter dans `model.ts`** :
   - régler `REPORT_471_MODE` ;
   - synchroniser `blocking` / `blockingTotal` avec la sortie du mode choisi ;
   - en V1 : `pnl.produits`, `pnl.charges`, `pnl.totals` + `variant` / `details` sur les postes touchés ;
   - ajuster score, pénalités, synthèses pour refléter résidu + traçabilité (simulation hors FEC si applicable).
7. **Typecheck** : `pnpm typecheck`. **Conservateur sur le score** : ne monter que si le montant non traité baisse réellement et les reclassements sont justifiés.

## Score (`pnl.score` + `analyse.scoring`)

- Gros suspens ouverts → plutôt **`douteux`**.
- Partie matérielle des suspens rattachée mais TVA / OD clôture encore floues → souvent **`acceptable`**.
- **`fiable`** seulement si résidu d’attente faible et autres irritants majeurs traités.

Champs à garder cohérents ensemble : `global`, `level`, `levelLabel`, `traitement`, **`nonTraite`**, `ajustement`, `montantTraite`, `montantNonTraite`, `montantAjuste` (noms tels que dans le schéma Zod / `model.ts`).

## Cas typiques (souvent défendables si le contexte colle)

- Virement **ASP** nominal → subvention / aide d’exploitation.
- Encaissement assureur / organisme recoupant un produit à recevoir déjà au bilan.
- Remboursement collaborateur en miroir d’une sortie déjà vue.

## Garde-fous

- **Ne pas modifier le P&L** si la pièce ne permet pas d’identifier la vraie nature comptable.
- **Ne pas supprimer** un bloquant sur un libellé « qui semble bon » sans imputation haute confiance.
- **Ne pas compenser** TVA ou amortissements « pour le score ».
- **V0** : ne pas présenter un tableau rouge allégé ni des totaux P&L healed comme s’ils sortaient de l’ERP.
- **Traçabilité** : commentaires bloquants **courts et actionnables**. Pour `alerts.points` et footnotes **visibles** : ton **cabinet** (`SOUL.md`), **sans** exposer scripts ou commandes ; **une à deux phrases max** par point quand l’espace UI est limité — voir skill **`numeral`**.

## Sortie quand tu réponds à l’utilisateur

- Liste claire des reclassements effectués (ou « aucun »).
- Effet chiffré sur les bloquants (avant / après, ou nombre de lignes et montant absolu résiduel).
- Pourquoi le score monte ou stable.
- Ce qui reste à traiter ou à confirmer.

## Skills voisins

- **`numeral-classify-attente-pnl`** : mécanique fine 471 → listes haute confiance / à confirmer / P&L healed (évite de dupliquer ici).
- **`numeral-classify-attente-pnl-with-internet`** : libellés encore opaques après GL — recherche ouverte ; si la nature devient raisonnable, reclassement V1 **web-assisted**. Si introuvable, la ligne reste bloquante.
- **`numeral`** : structure du rapport, `blocking` détail, review schéma.
- **`numeral-memory-update`** : faits durables dossier dans `MEMORY.md`.
