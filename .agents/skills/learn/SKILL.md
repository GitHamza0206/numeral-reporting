---
name: learn
description: >-
  Clôture obligatoire en fin de tâche sur ce dépôt : passe « learn » sur MEMORY.md
  (erreurs agent, préférences, faits durables). Use at the end of every completed
  user request in bande-de-cheffe, and when the user reports a mistake, asks to
  remember something, or says « retiens / apprends ».
disable-model-invocation: false
---

# Learn — clôture mémoire (toujours en fin d’action)

Objectif : **avant d’envoyer la réponse finale** sur une demande utilisateur dans `bande-de-cheffe`, exécuter la passe **Learn** ci-dessous. Les leçons utiles vont dans `MEMORY.md` (lisible, versionnable). Complète **numeral-memory-update** pour les faits métier ; ce skill couvre en plus **erreurs agent**, **préférences stables**, et **rappels procédure** (scripts, synchro `model.ts`).

Ce skill est **distinct** du `/learn` gstack (JSONL sous `~/.gstack/`).

## Règle d’or : Learn à la fin de chaque action

Une **action** = une demande utilisateur traitée jusqu’à réponse (code modifié, fichier créé, réponse d’analyse substantielle, etc.).

**Avant de conclure le tour :**

1. **Scan court** : durant cette action, y a-t-il eu  
   - correction / erreur agent,  
   - préférence utilisateur nouvelle ou renforcée,  
   - fait métier durable (sinon déjà couvert par **numeral-memory-update**),  
   - piège technique (fichier source de vérité, commande de contrôle) à noter ?

2. **Écrire dans `MEMORY.md`** si oui : section **## Learnings agent** (créer si absente), entrée datée selon le gabarit plus bas. Pour le **métier pur** (tiers, reclassement, vigilance dossier), tu peux plutôt enrichir les sections existantes de `MEMORY.md` en suivant **numeral-memory-update** ; dans ce cas, la clôture Learn consiste à **s’assurer** que l’une des deux mises à jour est faite (pas de double empilement inutile).

3. **Si rien à persister** : terminer la réponse à l’utilisateur par une ligne explicite, par ex.  
   `**Learn :** rien de nouveau à écrire dans MEMORY.md (déjà couvert ou pas de fait durable).`  
   Ne pas inventer d’entrée vide dans le fichier pour « cocher une case ».

4. **Ne pas modifier** la section **« Règles utilisateur (immuable) »** sans demande claire de l’utilisateur.

## Quand invoquer en renfort (en plus de la fin systématique)

- Erreur factuelle signalée, post-mortem, « ne refais pas ça ».
- Demande explicite : « retiens », « apprends », « ajoute à la mémoire ».

## Gabarit d’entrée dans `MEMORY.md` (Learnings agent)

```markdown
### YYYY-MM-DD — [titre court]

- **Contexte** : [fichier, skill, ou demande]
- **Erreur** : [si applicable ; sinon « — »]
- **Correction / à retenir** : [comportement ou fait testable]
- **Vérif** : [commande, balance, critère objectif si applicable]
```

Si plusieurs points dans le même tour : une sous-section par point ou une entrée unique avec plusieurs puces **Correction**.

**Préférences produit fréquentes (bande de cheffe)** — à refléter sous **Learnings agent** ou section dédiée sans doublon : textes visibles **SOUL** (comptable), **points d’attention** **brefs** (voir skill **numeral**).

## Ce qui doit souvent être rappelé après une action technique

- Chiffres dans `model.ts` : traçabilité balance / FEC / script (voir règles immuables dans `MEMORY.md`).
- Pipeline 471 : `scripts/reclasse_471_healing.py`, synchro avec `pnpm exec tsc --noEmit` si TS touché.

## Anti-patterns

- Oublier la ligne **Learn :** en fin de réponse quand aucune Écriture fichier n’a eu lieu (l’utilisateur veut voir que la passe a été faite).
- Remplacer toute la mémoire par un résumé sans accord.
- Entrées vagues sans critère vérifiable.
- Doublons : consolider avec une entrée plus récente si même contenu.

## Réponse à l’utilisateur

Toujours **une phrase finale** qui dit si `MEMORY.md` a été mis à jour (quoi / quelle section / quelle date) **ou** la ligne **Learn :** « rien de nouveau… ».
