# Scripts (hors runtime Next.js)

Les commandes NPM pointent vers des utilitaires **optionnels**. Ils ne font pas partie de l’API du rapport livré au client ; la vérité affichée reste `src/reports/v<V>/model.ts` + les pièces sous `data/`.

| Script | Rôle |
|--------|------|
| `report-snapshot.mjs` | Instantanés locaux du rapport |
| `report-history-watch.mjs` | Surveillance historique |
| `visual-diff.mjs` | Différences visuelles UI |
| `extract_pnl_from_balance.py` | Exemple : agrégats P&L depuis balance XLSX (convention fichier documentée dans le script). |
| `reclasse_471_healing.py` | **Stub** : remplir `GL_471` / règles depuis le dossier ; sortie JSON pour recaler `model.ts`. |

Voir les `npm run …` dans le `package.json` racine.
