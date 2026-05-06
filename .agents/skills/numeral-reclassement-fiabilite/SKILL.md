---
name: numeral-reclassement-fiabilite
description: >-
  Reclasse prudemment les comptes d attente et met a jour le score de
  fiabilite dans un rapport Numeral. Utilise ce skill quand on te
  demande de "corriger les erreurs bloquantes", "reclasser les 471",
  "arranger la compta", "mettre a jour le score de fiabilite" ou de
  nettoyer un provisoire a partir de la balance et du grand livre.
---

# Numeral Reclassement Fiabilite

Corrige seulement les reclassements defendables a partir des pieces.
Le but n est pas de faire disparaitre un suspens, mais de reduire les
comptes d attente sans inventer de contrepartie.

## Workflow

1. **Bind la version active.** Lis `reports/meta.json`, cible
   `reports/v<V>/` et n ecris jamais dans une autre version.
2. **Lis le rapport courant.** Ouvre au minimum `reports/v<V>/model.ts`
   puis repere :
   - `alerts.blocking`
   - `pnl.score`
   - `analyse.scoring`
   - `analyse.penalties`
   - `analyse.synthese`
3. **Lis les pieces comptables.** Pars de la balance et surtout du grand
   livre de l exercice cible. Cherche les comptes d attente et les
   contreparties explicites, en pratique :
   - `4716`, `4717`, et autres comptes de passage si presents
   - produits a recevoir ou charges a payer deja comptabilises
   - virements nommes clairement (`ASP`, assureur, remboursement,
     trop-percu, correction, etc.)
4. **Reclasse seulement si le lien est defendable.** Tu peux reduire un
   bloquant si au moins un de ces signaux est present :
   - meme montant ou montant quasi identique
   - libelle explicite sur la nature du flux
   - contrepartie deja visible dans la balance
   - coherence metier evidente
5. **Laisse le reste en suspens.** Si la contrepartie n est pas assez
   claire, ne "nettoie" pas le compte pour faire joli. Garde le montant
   en bloquant ou en point d attention.
6. **Mets a jour le rapport.** Ajuste les sections utiles dans
   `reports/v<V>/model.ts` :
   - `alerts.blocking` et `alerts.blockingTotal`
   - `alerts.points` pour documenter ce qui a ete reclassé
   - `pnl.score` et les narratives/syntheses utiles
   - `analyse.narratives` et `analyse.synthese`
7. **Reste conservateur sur le score.** Monte le score seulement si le
   montant non traite baisse reellement et si les reclassements sont
   justifies par les pieces.

## Heuristiques de score

- Si les gros suspens restent ouverts, garde `douteux`.
- Si une partie materialle des suspens est rattachee proprement mais que
  la TVA ou les OD de cloture restent ouvertes, passe plutot en
  `acceptable`.
- Ne passe en `fiable` que si les comptes d attente residuels sont
  faibles et que les autres irritants majeurs sont traites.

Mets a jour ces champs ensemble pour rester coherent :
- `score.global`
- `score.level`
- `score.levelLabel`
- `score.traitement`
- `score.non_traite`
- `score.ajustement`
- `score.montantTraite`
- `score.montantNonTraite`

## Cas typiques a reclasser

- Virement `ASP` clairement nomme : souvent defensible en subvention
  d exploitation si le contexte colle.
- Encaissement d assureur ou d organisme qui recoupe un `produit a
  recevoir` deja au bilan : reclassement souvent defensible.
- Remboursement collaborateur avec montant miroir d une sortie deja
  visible : reclassement souvent defensible.

## Garde-fous

- Ne modifie pas le P&L si la piece ne permet pas d identifier la vraie
  nature comptable.
- Ne supprime pas un bloquant juste parce qu un libelle "semble" bon.
- Ne compense pas manuellement des comptes TVA ou amortissements pour
  embellir le score.
- Explique dans les commentaires du rapport ce qui a ete reclassé et ce
  qui reste ouvert.

## Sortie attendue

Quand tu reponds :
- dis clairement ce qui a ete reclassé
- chiffre la baisse des bloquants
- dis pourquoi le score monte ou ne monte pas
- dis ce qui reste encore a traiter
