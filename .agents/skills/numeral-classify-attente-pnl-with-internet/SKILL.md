---
name: numeral-classify-attente-pnl-with-internet
description: >-
  Étend la classification 471 banque avec recherche web : quand balance + GL ne
  suffisent pas, identifie le marchand / organisme en ligne et reclasse en V1
  les mouvements plausibles comme "web-assisted" dans le P&L. Laisse bloquant
  seulement si internet ne permet pas d'identifier une nature raisonnable.
  Utiliser quand l’utilisateur demande de classer avec internet, recherche web,
  identifier un libellé bancaire, ou vider le résidu après
  `numeral-classify-attente-pnl`.
---

# Numeral — classification 471 → P&L **avec recherche ouverte**

## Prérequis

1. Charger **`numeral-reclassement-fiabilite`** (garde-fous, V0/V1, `scripts/` scratchpad).
2. Charger **`numeral-classify-attente-pnl`** (listes confiance, `reclasse_471_healing.py`, synchro `model.ts`).
3. Ce skill **assouplit** la baseline : en V1, une ligne peut être classée **web-assisted** si le marchand / organisme et la nature économique deviennent raisonnablement identifiables en ligne.

## Quand passer par le web

- Libellés **tronqués / prestataire** (`CB Nom*FACT`, TID, passerelles type SumUp/PayPal sans métier évident).
- **Virements** dont le bénéficiaire ou l’objet renvoie à une société / association / régime peu identifiable sans recherche (SIREN, site officiel).
- Références **assureurs, plateformes, associations** où le snippet GL seul est ambigu.

**À ne pas exposer brut en requête** : IBAN complet, RIB confidentiels ; préférer **enseigne**, **mot-clé objet**, type de flux, fourchette de montant si utile au tri.

## Méthode (agent)

1. **Isoler** la ou les lignes depuis le résidu `blocking` ou la liste « à confirmer » (`model.ts`, script Python).
2. **Construire une requête** courte : `{enseigne ou fragment libellé} {activité plausible} France` ou `nom {extrait}`, sans données bancaires sensibles.
3. **Recherche ouverte** (outil web du runtime si disponible) ; prioriser sources **officielles** ou clairement identifiées, pas uniquement agrégateurs non sourcés.
4. **Synthétiser** : qui est la contrepartie ; type de bien/service ; lien **faible / moyen / fort** avec le montant/date du mouvement.
5. **Décider** :
   - **Fort / moyen** : classer en V1 via `scripts/reclasse_471_healing.py` avec commentaire **`[Web-assisted]`** ou libellé équivalent ; retirer du `blocking`, recalculer `pnl.*`.
   - **Faible / introuvable** : garder en `blocking`, commenter **`[Hypothèse web non concluante]`**.
   - Le rapport doit rappeler que la vue reste **healed / simulation** jusqu’à saisie FEC, mais l'objectif est bien de classer quand internet suffit raisonnablement.

## Ensuite dans le rapport

- Si l’hypothèse web est exploitable : ajouter les règles dans **`scripts/reclasse_471_healing.py`**, régénérer `pnpm reclasse-471`, synchro **`[Healing 471]`** comme dans **`numeral-classify-attente-pnl`**.
- Sinon : **rester bloquant** tout en rendant la lecture **documentée** pour le dirigeant / comptable.

## Anti-patterns

- Imputer aux classes 6/7 **sans** mise à jour cohérente script Python + `model.ts` + rappel « simulation jusqu’à FEC ».
- Inventer contrepartie **sans** appui recherche vérifiable.
- Coller données **personnelles ou bancaires** dans des requêtes publiques inutiles.

## Skills voisins

- **`numeral-classify-attente-pnl`** : baseline reclasse sans enquête web.
- **`numeral-reclassement-fiabilite`** : politique générale reclassement + score.
