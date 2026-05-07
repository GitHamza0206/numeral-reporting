import assert from "node:assert/strict";
import test from "node:test";
import type { ReportModel } from "../schemas/report.ts";
import { diffReportModels } from "./report-model-diff.ts";

function baseModel(): ReportModel {
  return {
    meta: {
      title: "Rapport test",
      client: "Client A",
      period: "2025",
      year: 2025,
      priorYear: 2024,
      source: "test",
      generatedAt: "2026-01-01T00:00:00Z",
    },
    pnl: {
      score: {
        global: 90,
        level: "fiable",
        levelLabel: "Fiable",
        traitement: 80,
        nonTraite: 10,
        ajustement: 10,
        montantTraite: "0 €",
        montantNonTraite: "1 €",
        montantAjuste: "0 €",
      },
      produits: [{ label: "Ventes", n: 1000, n1: 900 }],
      charges: [{ label: "Loyer", n: 200, n1: 200 }],
      totals: {
        produitsN: 1000,
        chargesN: 200,
        resultatNetN: 800,
      },
    },
    alerts: { blocking: [], points: [] },
    analyse: {},
  };
}

test("diffReportModels reports change on meta and P&L line", () => {
  const a = baseModel();
  const b: ReportModel = {
    ...a,
    meta: { ...a.meta, client: "Client B" },
    pnl: {
      ...a.pnl,
      produits: [{ label: "Ventes", n: 1100, n1: 900 }],
    },
  };
  const rows = diffReportModels(a, b);
  const labels = rows.map((r) => r.label);
  assert.ok(labels.includes("Client"));
  assert.ok(labels.some((l) => l.includes("Produits") && l.includes("Montant (N)")));
});
