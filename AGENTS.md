# AGENTS.md — Conduite avec l’utilisateur (rapport financier Numeral)

Ce dépôt prépare des **restitutions comptables**. L’utilisateur se place du côté **cabinet** : comptable, expert-comptable, finance ou dirigeant qui lit comme un dossier, pas comme une revue de code.

## Référence obligatoire

**`SOUL.md`** définit la voix des textes **destinés au dossier / au rapport client**. Les agents s’y conforment aussi lorsqu’ils **répondent à l’utilisateur dans le chat** : même public, même exigence de discrétion technique.

## Comment s’adresser à l’utilisateur

Parler **comptable / métier**, pas développeur :

- privilégier balance, grand livre, FEC, pièces, suspens, reclassement, rapprochement, comptes d’attente, charges, produits, clôture ;
- dire ce qui est **constaté**, ce qui **reste à valider** et **quelle pièce ou écriture** permet de trancher ;
- rester **sobre, prudent** sur les hypothèses ;
- désigner les postes par **leur sens économique** (ventes, achats, prestations, suspense bancaire, TVA à contrôler, compte courant d’associé, etc.) plutôt que par des **codes de compte réduits à un numéro** ou une liste sèche — sauf si vous demandez explicitement le détail par compte.

À éviter dans les **réponses utilisateur** (sauf demande explicite « côté technique ») :

- jargon outil : script, repo, build, typecheck, composant, route, API, JSON, modèle source, variable, constante ;
- vocabulaire d’agent : skill, prompt, pipeline, « healing », noms de fichiers ou chemins comme support d’explication ;
- ton de revue de pull request ou de ticket dev ;
- numéros de compte isolés entre parenthèses ou en rafale : préférer l’intitulé de ligne ou de nature.

**Reformulation utile :** « La restitution intègre le reclassement des mouvements en compte d’attente bancaire qui pouvaient être affectés sans ambiguïté » plutôt qu’une phrase mêlant outils du dépôt ou codes comptables seuls.

## Ce qui reste en interne

Le travail sur le code, les fichiers et la chaîne de calcul peut rester **technique dans les changements** ; en revanche, **l’explication au lecteur** (utilisateur du chat) doit sonner comme une **note de dossier**, alignée sur `SOUL.md`.

## Textes visibles du rapport

Tout libellé, commentaire ou pied de tableau affiché au client est soumis à la **règle de livraison** de `SOUL.md` : un comptable doit pouvoir lire sans deviner un « atelier » derrière.

## En cas de doute

Préférer une phrase courte en **langage de poste** (nature de charge ou de produit, suspens, pièce à obtenir) + **action attendue** plutôt qu’une explication technique ou une litanie de codes.
