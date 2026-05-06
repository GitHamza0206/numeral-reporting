---
name: numeral
description: >-
  Produit ou édite le rapport financier versionné dans src/reports/v<V>/.
  Déclenche sur "génère la v0", "refais le rapport", "modifie la v3",
  "rends ce chiffre en gras", "diagnostique le dossier", "score de
  fiabilité". Pour les demandes de reclassement prudent des comptes
  d attente, de correction des 471 ou de mise à jour du score après
  nettoyage comptable, utilise le skill dédié
  `numeral-reclassement-fiabilite`.
  Pour classer uniquement les 471 défendables puis recalcule réel ou
  simulé du P&L, utilise `numeral-classify-attente-pnl`. Pour élucider et
  reclasser les libellés 471 obscurs via recherche web-assisted, utilise
  `numeral-classify-attente-pnl-with-internet`. Pour les demandes ou situations où
  une information durable doit être retenue pour le dossier, utilise le
  skill dédié `numeral-memory-update`. Pour "fork la v1" / "nouvelle
  version", redirige vers le bouton "+" de la navbar du rapport.
---

# Numeral — skill rapport

## Flow (4 étapes)

1. **Bootstrap.** Si `src/reports/v0/` est absent :
   `cp -r src/reports/template/. src/reports/v0/`. L'app Next.js tient
   `src/reports/meta.json` et `src/reports/registry.ts` à jour via les API de versions.
2. **Explore.** Lis `data/`, `client_context.json` (params figés du
   client) et `MEMORY.md`. Identifie l'exercice, les pièces
   (balance / GL / FEC), les entités principales et les salariés. Mets
   à jour `MEMORY.md` avec ce qui sert aux turns suivants.
3. **Build.** Modifie uniquement `src/reports/v<V>/model.ts`,
   `src/reports/v<V>/report.tsx` et, si utile, `src/reports/v<V>/notes.md`.
   Le modèle est validé par `src/schemas/report.ts` (`defineReportModel`).
   Le rendu se compose avec les briques stables de
   `src/components/report-kit/report.tsx`. Score les sections que tu peux,
   alerte sur celles que tu ne peux pas. **Pour tout texte visible du rapport destiné au cabinet comptable, respecter la voix `SOUL.md` (pas de jargon outil ou de détails de dépôt).**
   **Points d’attention** (`model.alerts.points`) : **une à deux phrases maximum** par ligne, **chiffrage clé si utile**, effet concret (FEC, clôture, rapprochement) — pas de blocs longs ; sujets (labels) également **brefs et métier**.
4. **Review.** Relis `model.ts` contre le schéma Zod. Vérifie totaux
   PCG (`Σ produits − Σ charges = résultat`) et reclassements
   obligatoires : TVA (44551 / 4456 / 4457) hors charges, comptes
   457 / 108 / 455 hors P&L, comptes d'attente (4886 / 4718 / 4719)
   non soldés → `model.alerts.blocking`. Fix ou flag.

   ### Erreurs bloquantes — suspens banque (`4716` / `4717`)

   - **Balance d’abord** : repère les comptes `471600…`, `471700…`
     (chez Pennylane souvent sous-comptes « décaissements / encaissements
     en attente ») avec solde significatif → matière à `blocking` tant
     que le dossier n’est pas ventilé.
   - **Grand-livre pour le détail** : la balance ne donne que des soldes ;
     pour chaque 471 banque ouvert, remonte dans `blocking` les **écritures
     ligne à ligne** (date, journal, libellés pièce/ligne si présents,
     débit, crédit). Ne te limite pas à un seul bloc « total 471 » sans
     détail exploitable.
   - **À ne pas mélanger** : `445800` « TVA à régulariser ou en attente »
     et `445860` « sur factures non parvenues » utilisent aussi « attente »
     au libellé mais ce ne sont **pas** des lignes banque « non classifiées »
     au sens fichier d’attente ; garde ces irritants comme entrées séparées
     (ou hors suspens banque) sauf lien explicite avec un 471.
   - **Piège exports XLSX** : filtre les suspens banque sur la colonne
     **« N° de compte »** du grand-livre, pas sur une recherche texte
     globale — un IBAN peut contenir la sous-chaîne `471…` sans que ce soit
     un compte 471.

   **471 — reclassement & healing**
   - Politique, garde-fous, score et workflow : **`numeral-reclassement-fiabilite`**. Listes confiance / P&L healed : **`numeral-classify-attente-pnl`**.
   - En repo : `REPORT_471_MODE` en tête de `model.ts`, `pnpm reclasse-471 -- --mode v0|v1`, scripts Python sous **`scripts/`** (dossier **brouillon agent** : extraits, recalculs ; la vérité affichée = `model.ts`) — pas de moteur reclassement en TS sous `src/reports/` ; la preuve est dans `pnl.*` et `alerts.blocking`, pas uniquement dans un bloc narratif.

   **Contenu minimal par erreur bloquante** (suspens dossier) : compte,
   date si disponible, montant, libellé utile (+ pièce si utile),
   commentaire court **actionnable** pour le comptable (pourquoi bloqué
   ou qu’il manque pour solder).

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

`<V> = src/reports/meta.json.active_version`. Bind une fois pour le turn.
Si `meta.versions[<V>].frozen === true` → stop, redirige vers le bouton
"+" de la navbar. N'écris jamais sous un autre `src/reports/v<other>/`.

## Reclassement des suspens

Pour une demande centrée sur les comptes d attente, les erreurs
bloquantes ou la remontée du score de fiabilité après nettoyage
comptable, bascule vers le skill dédié
`numeral-reclassement-fiabilite` au lieu de traiter cela comme une
simple mise à jour générique du rapport.

Quand des comptes d’attente restent ouverts : applique la section
**Erreurs bloquantes — suspens banque** ci-dessus (balance pour repérer
les soldes 471 banque ; grand-livre pour les lignes ; pas de faux positifs
4458 ≠ banque ; filtre sur N° de compte). Agrégats = résumé secondaire seulement.

## Message final

- Mention de la version (`v<V>`).
- 1 phrase score de fiabilité.
- Jusqu'à 3 points clés (bons signaux + alertes) ; **formulation courte**, alignée SOUL (cabinet, pas atelier technique).
- Liens markdown vers sections : `[Voir → Compte de résultat](#section-pnl)`
  (ancres : `section-cover`, `section-sommaire`, `section-pnl`,
  `section-monthly`, `section-structure`, `section-analyse`).
- Jamais coller `model.ts` ou `MEMORY.md` dans la réponse.
