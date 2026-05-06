---
name: numeral-classify-attente-pnl
description: >-
  Focus 471 banque : classifier les « non classifiées » quand c'est défendable,
  produire la vue healed (hors bloquant + P&L). Pour principes, score, garde-fous
  et workflow global, utiliser numeral-reclassement-fiabilite en premier.
---

# Numeral — classification 471 → P&L

## Rôle de ce skill

Complément **ciblé** de **`numeral-reclassement-fiabilite`** : règles de confiance, listes (haute confiance / à confirmer / inclassable), et distinction stricte V0 (blocking exhaustif + P&L balance) vs V1 (résidu + P&L recalculé via `scripts/reclasse_471_healing.py`).

## Cadre données

- Pièces : balance + grand-livre même exercice (`data/`).
- Cible **`471*`** via **N° de compte** (pas recherche brute — piège IBAN).
- Exclure **445800 / 445860** du périmètre « suspens banque » dans `blocking`.

## Confiance

Une ligne passe en **haute confiance** seulement avec signaux solides (administration désignée, remboursement explicite, convention, éléments `MEMORY.md`, etc.). Sinon : **À confirmer** ou **inclassable** — ne pas sortir du bloquant par défaut en V1.

## Trois listes

| Liste | Effet typique |
|-------|----------------|
| Haute confiance | Retirable du `blocking` en V1 ; montant ventilé en 6/7 selon buckets du script |
| À confirmer | Reste bloquant jusqu’à arbitrage dossier |
| Inclassable | Reste erreur bloquante |

## P&L après healing (V1)

- Recalculer **`pnl.produits`**, **`pnl.charges`**, **`pnl.totals`** conformément au JSON `--mode v1`, pas un commentaire isolé.
- Le rapport doit préciser que c’est une **vue healed / simulation** jusqu’à saisie FEC.

## Régression

Après **nouvel export XLSX** : régénérer ou adapter **`reclasse_471_healing.py`** (lignes GL, snippets, montants). Si le matching casse, revenir conservateur jusqu’à correction des règles.

## Réapplication (agent)

1. `pnpm reclasse-471 -- --mode v0` puis `--mode v1` (ou `python3 scripts/reclasse_471_healing.py`).
2. Contrôler counts, `blocking_abs_total`, `healed_pnl` contre les constantes et le `blocking471*` dans `src/reports/v<V>/model.ts`.
3. Mettre à jour `REPORT_471_MODE`, les lignes P&L healed si besoin, et un horodatage / footnote de synchro ; tag **`[Healing 471]`** dans points ou footers pour traçabilité (cf. `numeral`).

## Skill voisin (recherche ouverte)

Lorsque le libellé / la contrepartie reste **opaque** après balance + grand-livre : **`numeral-classify-attente-pnl-with-internet`** — enquête web puis reclassement **web-assisted** en V1 si la nature économique devient raisonnable. Si internet ne permet pas d’identifier le mouvement, il reste en `blocking`.

