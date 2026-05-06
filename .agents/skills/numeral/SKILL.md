---
name: numeral
description: >-
  Produit ou édite le rapport financier versionné dans reports/v<V>/.
  Déclenche sur "génère la v0", "refais le rapport", "modifie la v3",
  "rends ce chiffre en gras", "diagnostique le dossier", "score de
  fiabilité". Pour les demandes de reclassement prudent des comptes
  d attente, de correction des 471 ou de mise à jour du score après
  nettoyage comptable, utilise le skill dédié
  `numeral-reclassement-fiabilite`. Pour les demandes ou situations où
  une information durable doit être retenue pour le dossier, utilise le
  skill dédié `numeral-memory-update`. Pour "fork la v1" / "nouvelle
  version", redirige vers le bouton "+" de la navbar du rapport.
---

# Numeral — skill rapport

## Flow (4 étapes)

1. **Bootstrap.** Si `reports/v0/` est absent :
   `cp -r reports/template/. reports/v0/`. L'app Next.js tient
   `meta.json` et `reports/registry.ts` à jour via les API de versions.
2. **Explore.** Lis `data/`, `client_context.json` (params figés du
   client) et `MEMORY.md`. Identifie l'exercice, les pièces
   (balance / GL / FEC), les entités principales et les salariés. Mets
   à jour `MEMORY.md` avec ce qui sert aux turns suivants.
3. **Build.** Modifie uniquement `reports/v<V>/model.ts`,
   `reports/v<V>/report.tsx` et, si utile, `reports/v<V>/notes.md`.
   Le modèle est validé par `schemas/report.ts` (`defineReportModel`).
   Le rendu se compose avec les briques stables de
   `components/report-kit/report.tsx`. Score les sections que tu peux,
   alerte sur celles que tu ne peux pas. Audience narratifs = dirigeant.
4. **Review.** Relis `model.ts` contre le schéma Zod. Vérifie totaux
   PCG (`Σ produits − Σ charges = résultat`) et reclassements
   obligatoires : TVA (44551 / 4456 / 4457) hors charges, comptes
   457 / 108 / 455 hors P&L, comptes d'attente (4886 / 4718 / 4719)
   non soldés → `model.alerts.blocking`. Fix ou flag.
   Pour les suspens bancaires, ne te contente pas d'un agrégat par
   compte : fais apparaître dans les erreurs bloquantes les lignes
   bancaires réellement non classées, avec leur libellé, leur montant
   et une courte raison du non-reclassement.
   Chaque ligne bloquante doit aussi porter un petit commentaire utile
   pour le comptable : pourquoi c est bloqué, ou ce qu il manque pour
   solder la ligne.

## MEMORY.md (allégée)

Lis-la au début si elle existe, mets-la à jour quand tu apprends
quelque chose d'utile aux turns futurs. Format libre, gabarit indicatif :

```markdown
# MEMORY — <client>
## Règles utilisateur (immuable, du questionnaire)
- <règles telles quelles>
## Entités principales
- **<NOM>** — compte <comptable> · <rôle>
## Salariés
- **<NOM>** — net ~<montant>/mois · <statut>
## Vigilances
- <2-3 puces métier>
```

Pas d'algorithme prescrit pour détecter les entités — fais-le au feeling
sur les libellés, IBAN/SIRET, comptes comptables. Ne supprime jamais
une entité connue ; ne touche pas la section "Règles utilisateur".
Si tu apprends une information durable pendant le turn, mets la mémoire
à jour avant de finir. Pour cette discipline de mise à jour, utilise le
skill dédié `numeral-memory-update`.

## Sélection de version

`<V> = reports/meta.json.active_version`. Bind une fois pour le turn.
Si `meta.versions[<V>].frozen === true` → stop, redirige vers le bouton
"+" de la navbar. N'écris jamais sous un autre `reports/v<other>/`.

## Reclassement des suspens

Pour une demande centrée sur les comptes d attente, les erreurs
bloquantes ou la remontée du score de fiabilité après nettoyage
comptable, bascule vers le skill dédié
`numeral-reclassement-fiabilite` au lieu de traiter cela comme une
simple mise à jour générique du rapport.

Quand des comptes d attente restent ouverts dans le rapport :
- affiche en priorité les libellés bancaires non classés ligne par ligne
- garde les agrégats seulement comme résumé secondaire
- mets dans `model.alerts.blocking` ce qui aide réellement à travailler
  le dossier : libellé exact, compte, montant, raison du blocage
- ajoute un commentaire court et actionnable sur chaque ligne bloquante
  quand c est possible

## Message final

- Mention de la version (`v<V>`).
- 1 phrase score de fiabilité.
- Jusqu'à 3 points clés (bons signaux + alertes).
- Liens markdown vers sections : `[Voir → Compte de résultat](#section-pnl)`
  (ancres : `section-cover`, `section-sommaire`, `section-pnl`,
  `section-monthly`, `section-structure`, `section-analyse`).
- Jamais coller `model.ts` ou `MEMORY.md` dans la réponse.
