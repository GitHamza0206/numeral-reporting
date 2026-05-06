import { z } from "zod";

const money = z.number().finite();
const nullableMoney = money.nullable();

const lineDetailSchema = z.object({
  label: z.string().min(1),
  account: z.string().optional(),
  n: nullableMoney,
  n1: nullableMoney.optional(),
  variant: z.enum(["adjusted", "normal"]).optional(),
});

export const scoreSchema = z.object({
  global: z.number().min(0).max(100),
  level: z.enum(["fiable", "acceptable", "douteux"]),
  levelLabel: z.string().min(1),
  traitement: z.number().min(0).max(100),
  nonTraite: z.number().min(0).max(100),
  ajustement: z.number().min(0).max(100),
  montantTraite: z.string().min(1),
  montantNonTraite: z.string().min(1),
  montantAjuste: z.string().min(1),
});

export const lineSchema = z.object({
  label: z.string().min(1),
  n: nullableMoney,
  n1: nullableMoney.optional(),
  variant: z.enum(["adjusted", "normal"]).optional(),
  details: z.array(lineDetailSchema).optional(),
});

export const pnlSchema = z.object({
  subtitle: z.string().optional(),
  footnote: z.string().optional(),
  score: scoreSchema,
  produits: z.array(lineSchema),
  charges: z.array(lineSchema),
  totals: z.object({
    produitsN: money,
    produitsN1: money.optional(),
    chargesN: money,
    chargesN1: money.optional(),
    resultatExploitationN: nullableMoney.optional(),
    resultatExploitationN1: nullableMoney.optional(),
    resultatNetN: nullableMoney.optional(),
    resultatNetN1: nullableMoney.optional(),
  }),
});

export const alertSchema = z.object({
  label: z.string().min(1),
  severity: z.enum(["erreur", "alerte", "info"]).optional(),
  account: z.string().optional(),
  amount: nullableMoney.optional(),
  comment: z.string().optional(),
});

export const monthlySchema = z.object({
  headers: z.array(z.string().min(1)),
  produits: z.object({ cells: z.array(money), total: money }),
  charges: z.array(
    z.object({
      label: z.string().min(1),
      cells: z.array(money),
      total: money,
    }),
  ),
  chargesTotal: z.object({ cells: z.array(money), total: money }),
  result: z.object({ cells: z.array(money), total: money }),
});

export const balanceSchema = z.object({
  actif: z.array(z.object({ label: z.string().min(1), amount: money, bold: z.boolean().optional() })),
  passif: z.array(z.object({ label: z.string().min(1), amount: money, bold: z.boolean().optional() })),
  totalActif: money,
  totalPassif: money,
});

export const reportModelSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    client: z.string().min(1),
    period: z.string().min(1),
    year: z.number().int(),
    priorYear: z.number().int(),
    source: z.string().min(1),
    generatedAt: z.string().min(1),
    periodDescription: z.string().optional(),
    currentPeriodLabel: z.string().optional(),
    priorPeriodLabel: z.string().optional(),
  }),
  pnl: pnlSchema,
  alerts: z.object({
    blocking: z.array(alertSchema),
    blockingTotal: money.optional(),
    points: z.array(alertSchema),
  }),
  sig: z
    .object({
      margeBruteN: nullableMoney.optional(),
      margeBruteN1: nullableMoney.optional(),
      valeurAjouteeN: nullableMoney.optional(),
      valeurAjouteeN1: nullableMoney.optional(),
      ebeN: nullableMoney.optional(),
      ebeN1: nullableMoney.optional(),
      reN: nullableMoney.optional(),
      reN1: nullableMoney.optional(),
      rcaiN: nullableMoney.optional(),
      rcaiN1: nullableMoney.optional(),
      rnN: nullableMoney.optional(),
      rnN1: nullableMoney.optional(),
      /** @deprecated prefer rnN — kept for older models */
      resultatNetN: nullableMoney.optional(),
      resultatNetN1: nullableMoney.optional(),
    })
    .optional(),
  monthly: monthlySchema.optional(),
  structure: z
    .object({
      balance: balanceSchema.optional(),
      ratios: z.array(z.object({ label: z.string().min(1), value: z.string().min(1), hint: z.string().optional() })),
      dsoAlert: z.string().optional(),
      charts: z
        .object({
          comparison: z.boolean().optional(),
          donut: z
            .object({
              categories: z.array(z.object({ label: z.string().min(1), value: money })),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  analyse: z.object({
    scoring: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
    penalties: z
      .array(
        z.object({
          label: z.string().optional(),
          description: z.string().optional(),
          weight: z.number().optional(),
          pct: z.number().optional(),
          reason: z.string().optional(),
        }),
      )
      .optional(),
    fiscalite: z
      .array(
        z.object({
          label: z.string().optional(),
          status: z.string().optional(),
          comment: z.string().optional(),
        }),
      )
      .optional(),
    narratives: z.record(z.string(), z.string()).optional(),
    synthese: z
      .array(
        z.object({
          label: z.string().min(1),
          comment: z.string().optional(),
          value: z.string().optional(),
          accent: z.string().optional(),
        }),
      )
      .optional(),
    footerExtra: z.array(z.string()).optional(),
  }),
});

export type ReportModel = z.infer<typeof reportModelSchema>;
export type ReportLine = z.infer<typeof lineSchema>;
export type ReportAlert = z.infer<typeof alertSchema>;
export type ReportVersionComponentProps = {
  activeVersion: number;
  versions: Array<{
    n: number;
    frozen: boolean;
    change_note: string | null;
    parent: number | null;
  }>;
};

export function defineReportModel(input: ReportModel): ReportModel {
  return reportModelSchema.parse(input);
}
