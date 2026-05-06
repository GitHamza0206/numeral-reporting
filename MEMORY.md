# MEMORY — Bande de Cheffe

## Règles utilisateur (immuable)

- **Ne jamais inventer de montants** dans `src/reports/v<V>/model.ts` : tout euro doit être vérifiable contre balance, grand livre ou FEC.
- **Voix du rapport** : le rapport est destiné au comptable / expert-comptable, pas au développeur. Ne pas dévoiler les éléments du dépôt dans les commentaires visibles ; suivre `SOUL.md`.
- **Échange cabinet** : ne pas prendre l’habitude des numéros de compte seuls entre parenthèses (ex. titre de ligne « ainsi qu’annoncé au 707 ») dans le dialogue ; désigner les **postes** par leur sens économique, sauf demande explicite du détail ou texte où la fourchette du plan fait foi.

## Sources chargées localement (`data/`)

- Balances générales PennyLane (voir noms fichier `PENNYLANE_*2024*` et `Provisoire_*2025*`).
- Grands livres xlsx équivalents disponibles sous le même dossier (contrôles fins possibles hors agrégats P&L de ce rapport).
- Export 2025 : colonnes **Solde** = situation provisoire, **Solde N-1** = comparatif relié aux soldes 2024 lorsque renseigné.

## Entités principales

- **Crédit Coopératif — Bande de Cheffes** — trésorerie / rapprochement (voir 4716/4717 dans balance).
- **Pennylane — Compte Pro** — trésorerie secondaire (+ rapprochement 471xxx).
- **Associés — CCA 455** — compte courant (créditeur sur les années vues dans les balances importées).

## Salariés

- *(Synthèse nettes non tirée automatiquement ici ; masse vue via comptes 641–649 sur balance.)*

## Vigilances

- **471 V0 vs V1+** : en **édition rapport V0** (`src/reports/v0/`), toutes les lignes 471 exportées restent dans le tableau « Erreurs bloquantes » ; la cartographie « haute confiance » et le P&L théorique viennent du script `scripts/reclasse_471_healing.py --mode v0`. À partir **V1+**, le même script en `--mode v1` doit produire le **healing** : retrait des lignes haute confiance, rattachement en 6 / 7, recompute du compte de résultat, puis mise à jour de `model.ts`.
- Skill **numeral-reclassement-fiabilite** : ne doit pas seulement ajouter un composant narratif ; en V1+ il soigne la donnée comptable automatiquement. En V0, il prépare sans réduire. Pas de moteur TS dédié dans `src/reports/v*/` : Python script + `model.ts`.
- Les **471** bancaires doivent être rapprochés avant présentation investisseur.
- Balance **2025 provisoire** : re-générer le modèle après arrêt définitif et éventuels reclassements (skill numeral-reclassement-fiabilite si besoin).

## Web-assisted — résidu 471 (V1) — 2026-05-06

Réalisé sous **`numeral-classify-attente-pnl-with-internet`** après assouplissement demandé par l’utilisateur : quand internet identifie raisonnablement la nature économique, la ligne est reclassée en V1 via `scripts/reclasse_471_healing.py`. Si internet ne trouve pas ou reste trop flou, la ligne demeure bloquante.

| Statut V1 | Indices / libellés | Lecture retenue |
|-----------|---------------------|----------------|
| Classé web-assisted | Roulez Jeunesse | Prestataire public **réparation vélo à domicile** → 615 services / maintenance. |
| Classé web-assisted | SUPERVAN* | Société française **livraisons / logistique** pour pros → 624 transport / sous-traitance. |
| Classé web-assisted | ME-QR.COM | SaaS **QR / paiements / marketing** (`me-qr.com`) → 628 service numérique. |
| Classé web-assisted | SumUp *REPAIR | Passerelle **SumUp** + descriptor commerçant « REPAIR » → 615 réparation / maintenance. |
| Classé web-assisted | Tipeee ×2 | Plateforme **soutien créateurs / tips** → 628 service / plateforme. |
| Classé web-assisted | Assal / Chaillot | Libellé interne **REMB ACHATS** → 606 achats. |
| Classé web-assisted | Quentin / La Redoute + erreur vir. | Remboursement achats 606 neutralisé par crédit erreur virement 606. |
| Classé web-assisted | *ESPRIT ASSOCIATION | Offre bancaire **Esprit Associations** (Crédit Coopératif) — **627** frais / services bancaires (pas un fournisseur « Esprit » mode). |
| Classé web-assisted | CB LCL (2 lignes) | Libellé sans commerçant — **627** si le relevé détaillé ne donne pas mieux. |
| Classé web-assisted | RAJEESKA (BQ2) | Commerce **Rajeeska** (épicerie Paris 12e) — **606** achats ; ticket si doute. |
| Reste bloquant | Virements SEPA sans bénéficiaire clair (RIB 28233… / 42559…) | Transferts internes ou tiers : ordre de virement ou rapprochement obligatoire avant écriture. |
| Reste bloquant | Remb. suite règlement double facture | Contrepartie et **contre-passation** avec la facture doublon — pièce nécessaire. |

Rappeler : filtres Grand-livre sur **N° de compte**, pas recherche brute sur « 471 » dans le texte ; **445800/445860** hors suspens banque.

## Learnings agent

### 2026-05-06 — Voix comptable et confidentialité du dépôt

- **Contexte** : création de `SOUL.md` pour cadrer le ton du rapport.
- **Erreur** : les commentaires précédents exposaient trop la mécanique interne (scripts, modes, synchro, vocabulaire agent).
- **Correction / à retenir** : les textes visibles doivent parler le langage du comptable : compte, solde, pièce, rapprochement, clôture, impact. Ne pas afficher les chemins de fichiers, commandes, scripts, skills, agents ou détails de dépôt.
- **Vérif** : relire chaque commentaire visible avec la question : « Est-ce qu'un comptable peut lire ceci sans voir l'atelier technique derrière ? »

### 2026-05-06 — Restitution alignée SOUL dans `model.ts` et scores UI

- **Contexte** : demande utilisateur pour des textes de rapport destinés au comptable.
- **Erreur** : — .
- **Correction / à retenir** : formuler points d’attention, pieds de tableau P&L, synthèses et pieds de page sans scripts, synchro technique, modes internes ou noms de skills ; libellés de cartes scores en langage prudent (zones maîtrisées / points ouverts / ajustements proposés).
- **Vérif** : parcourir `src/reports/v0/model.ts` et les cartes scores dans `report-pages.tsx` sans termes produit dev dans la chaîne affichée.

### 2026-05-06 — Clôture utilisateur après livraison (`/learn`)

- **Contexte** : validation (« très bien ») puis demande explicite `/learn`.
- **Erreur** : — .
- **Correction / à retenir** : une **clôture `/learn`** après accord sur un chantier sert à figer en `MEMORY.md` tout ce qui resterait implicite ; si les entrées du jour couvrent déjà le sujet, n’ajouter qu’une ligne de **préférence de flux** (validation → learn) plutôt que de dupliquer les règles techniques.
- **Vérif** : pas de doublon inutile sous **Learnings agent** ; cohérence avec `SOUL.md` et règles immuables.

### 2026-05-06 — Points d’attention : commentaires courts

- **Contexte** : tableau « Points d’attention » trop verbeux.
- **Correction / à retenir** : chaque ligne doit être lisible comme une **micro-note cabinet** — chiffres clés en une phrase + impact concret ; éviter triple structure Constat/Risque/Action si tout tient dans 1–2 phrases percutantes.
- **Vérif** : relecture des `comment` sous `alerts.points` dans `model.ts`.

### 2026-05-06 — Pas de codes comptables « raccourcis » dans le dialogue

- **Contexte** : préférence utilisateur après lecture de `AGENTS.md` ; souhait d’être adressé comme au cabinet, sans abus de numéros type `(707)`.
- **Correction / à retenir** : dans le **chat** et les **exemples de conduite** (`AGENTS.md`), parler en **intitulés de poste** ; réserver les fourchettes / numéros aux **libellés du rapport** ou sur **demande explicite** du lecteur.
- **Vérif** : `SOUL.md` et `AGENTS.md` alignés ; réponses futures sans litanie de codes entre parenthèses.
