# Numeral — template rapport financier (`numeral-financial-report`)

Application Next.js minimale pour **éditer et versionner** un rapport financier typé (schéma Zod commun aux dossiers Numeral). Le dossier `reports/template/` est un **gabarit vide** (sans montants préremplis) ; `reports/v0/` conserve une **démo chiffrée factice** ; chaque dossier client duplique une version ou en crée une nouvelle depuis l’UI.

**Référence conservée —** ancien dossier client (snapshots Bande de Cheffe, `v1`/`v2`, `.history`, script Python reclasse avec données réelles…) : voir [**`_archive/`**](_archive/README.md) (export figé au commit Git `c07a81f`).

## Arborescence utile (`src/`)

```txt
src/
  app/              # App Router + API versions + export PDF
  components/       # report-kit (UI partagée)
  lib/              # versionnement (meta.json, registry), PDF, etc.
  schemas/          # Zod ReportModel
  reports/
    template/       # gabarit sans montants préremplis (structure + champs vides)
    v0/             # version de démo / point de départ du clone
```

- Faits et montants : [`src/reports/v<V>/model.ts`](src/reports/v0/model.ts) (validé Zod).
- Ordre des sections : [`src/reports/v<V>/report.tsx`](src/reports/v0/report.tsx).
- Mémo dossier optionnelle : [`MEMORY.md`](MEMORY.md) (ne pas committer de secrets clients).
- Exports comptables : [`data/`](data/) via [`data/README.md`](data/README.md) (gitignore par défaut).
- Contexte textuel dossier : `client_context.json` (voir [`client_context.example.json`](client_context.example.json)).
- Scripts optionnels hors runtime : [`scripts/`](scripts/README.md).

### Personnaliser le slug d’export PDF

Variable d’environnement : `NEXT_PUBLIC_REPORT_EXPORT_BASENAME` (voir [`src/lib/report-export-name.ts`](src/lib/report-export-name.ts)). Par défaut : `numeral-financial-report`.

## Prérequis données

Sans balance, grand livre ou FEC dans `data/`, le rapport peut rester **sans chiffres réels** dans `model.ts`. Ne pas inventer de montants.

## Développement

```bash
npm install
npm run dev
```

Port **5555** (`package.json`). La racine `/` redirige vers la version « tip » (`/v0`, …).

## Vérification

```bash
npm run typecheck
npm run build
```

## Versionnement

Les routes `src/app/api/versions/*` maintiennent [`src/reports/meta.json`](src/reports/meta.json) et régénèrent [`src/reports/registry.ts`](src/reports/registry.ts). Le bouton « + » du rapport copie une version source vers une nouvelle `v<N>`.
