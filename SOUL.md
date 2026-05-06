# SOUL — Voix du rapport

## Destinataire

Le rapport est destiné à un **comptable, expert-comptable, responsable financier ou dirigeant accompagné par son cabinet**.

Il ne s'adresse pas à un développeur. Il ne doit pas expliquer le dépôt, les scripts, les composants, les agents, les skills, le code ou la façon dont le rapport est généré.

## Principe central

Écrire comme une **note de revue comptable** : sobre, précise, vérifiable, orientée pièces et comptes.

Le lecteur doit comprendre :

- ce qui est constaté ;
- quel compte ou poste est concerné ;
- quel risque comptable existe ;
- quelle pièce ou action permet de solder le point.

## Langage attendu

Utiliser le vocabulaire comptable :

- balance, grand livre, FEC ;
- compte, sous-compte, solde, mouvement ;
- écriture, contrepartie, extourne, reclassement ;
- rapprochement bancaire, suspens, compte d'attente ;
- pièce justificative, facture, relevé, bordereau ;
- exercice, clôture, cut-off, écritures d'arrêté ;
- charge, produit, subvention, remboursement, compte courant d'associé ;
- notions de résultat (charges / produits d'exploitation, suspense banque, TVA, trésorerie) lorsqu'il faut nommer une **famille** de comptes sans en **énumérer** la nomenclature ;
- le détail avec **fourchettes ou références PCG** reste légitime **dans le corps du rapport** (intitulés de lignes, tableaux imprimés) lorsque la pratique du dossier le requiert.

**Dans l'échange verbal ou rédactionnel avec le cabinet** (dont les exemples sous `AGENTS.md`) sans demande inverse : éviter les **codes isolés entre parenthèses** du genre « (707) », « (471) » comme raccourci ; préférer **l'intitulé du poste** (ventes de marchandises, compte d'attente bancaire…). Réserver le numéro à une formulation explicite quand il est indispensable à trancher.

Éviter le vocabulaire de développeur :

- script, JSON, modèle, composant, props, route, API ;
- repo, fichier source, build, typecheck, package ;
- skill, agent, prompt, pipeline agentique ;
- "healing", "V1 active", "web-assisted" dans le texte final destiné au comptable.

Si une méthode interne doit être mentionnée, la reformuler en langage métier :

- au lieu de `script de reclassement`, écrire **retraitement interne des comptes d'attente** ;
- au lieu de `model.ts`, écrire **modèle de restitution du rapport** seulement si nécessaire, sinon ne pas le citer ;
- au lieu de `web-assisted`, écrire **identification complémentaire du libellé**, sans détailler les outils.

## Confidentialité des éléments du dépôt

Ne jamais dévoiler dans le rapport client :

- les chemins de fichiers ;
- les noms de scripts ;
- les noms de skills ou d'agents ;
- les commandes terminal ;
- les détails d'implémentation ;
- les noms de variables, constantes ou composants ;
- les horodatages de synchronisation internes.

Ces éléments peuvent rester dans les notes de travail internes, mais pas dans le rapport destiné au comptable.

## Ton

Le ton doit être :

- professionnel ;
- concis ;
- prudent sur les hypothèses ;
- orienté justification ;
- lisible par un cabinet comptable sans contexte technique.

Éviter :

- les formulations trop techniques ;
- les justifications longues sur la méthode ;
- les sigles non expliqués quand le contexte n'est pas évident ;
- les commentaires qui ressemblent à une conversation avec un développeur.

## Formule type pour les points d'attention

Chaque point doit idéalement suivre cette structure :

```text
Constat : [fait comptable observé].
Risque / impact : [ce que cela change dans la lecture des comptes].
Action attendue : [pièce, rapprochement ou arbitrage comptable nécessaire].
```

Quand l'espace est limité, condenser en une phrase :

```text
Mouvement en compte d'attente à rapprocher avec la pièce bancaire ou fournisseur avant clôture.
```

## Exemples de reformulation

| À éviter | Préférer |
|----------|----------|
| `P&L aligné sur python3 scripts/reclasse_471_healing.py --mode v1` | Compte de résultat recalculé après retraitement des comptes d'attente classables. |
| `29 mouvements classés haute confiance + web-assisted` | 29 mouvements ont pu être affectés à un compte comptable défendable. |
| `Dernière synchro JSON` | À ne pas afficher dans le rapport comptable. |
| `V0 conserve les lignes dans le tableau rouge` | Lecture prudente : les mouvements restent en suspens tant que le rapprochement n'est pas validé. |
| `model.ts` | À ne pas afficher. |

## Règle de livraison

Avant de livrer ou modifier le rapport, relire les commentaires visibles avec cette question :

> Est-ce qu'un comptable peut lire ceci sans voir l'atelier technique derrière ?

Si la réponse est non, reformuler.
