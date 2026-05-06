# numeral-reporting

Tiny Next.js app for AI-authored Numeral reports.

Each report version is a cloneable TypeScript package:

```txt
reports/
  template/
    model.ts
    report.tsx
    notes.md
  v0/
    model.ts
    report.tsx
    notes.md
```

- Edit `model.ts` for facts, totals, alerts, and narratives.
- Edit `report.tsx` for section order and composition.
- Keep shared UI in `components/report-kit/report.tsx`.
- `schemas/report.ts` validates report models with Zod.
- `/v0`, `/v1`, etc. render the matching `reports/vN/report.tsx`.

Run locally:

```bash
npm install
npm run dev
```

Build:

```bash
npm run typecheck
npm run build
```
