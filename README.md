# Bande de Cheffe — rapport financier (Numeral)

Application Next.js minimale pour éditer et versionner le rapport financier **Bande de Cheffe SAS**, avec le même schéma typé que les autres dossiers Numeral.

## Contenu (`src/` = code applicatif)

```txt
src/
  app/              # routes Next.js (App Router)
  components/       # UI partagée (report-kit)
  lib/              # versionnement rapport (meta.json, registry)
  schemas/          # Zod ReportModel
  reports/
    template/       # gabarit exemples chiffrés
    v0/             # modèle dossier Bande de Cheffe
```

- Les faits et montants : `src/reports/v<V>/model.ts` (validé par Zod).
- L’ordre des sections : `src/reports/v<V>/report.tsx`.
- La mémoire durable du dossier : `MEMORY.md` (racine).
- Les exports comptables : `data/` (voir `data/README.md`).
- Paramètres figés optionnels : `client_context.json` à la racine (exemple : `client_context.example.json`).
- Scripts hors app : `scripts/` (ex. extraction P&amp;L).

## Prérequis données

Sans balance, grand livre ou **FEC** dans `data/`, le rapport peut rester **non chiffré** (`null`). Ne pas substituer des zéros fictifs sans pièces.

## Développement

```bash
npm install
npm run dev
```

L’app écoute le port **5555** (voir `package.json`). La racine `/` redirige vers la version active (`/v0`, `/v1`, …).

## Vérification

```bash
npm run typecheck
npm run build
```

## Versionnement

Les routes `src/app/api/versions/*` maintiennent `src/reports/meta.json` et `src/reports/registry.ts`. Le bouton « + » dans la barre du rapport crée une nouvelle version en copiant la source choisie.
