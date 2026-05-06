import type { ReportModel } from "@/schemas/report";

export type SommaireKind =
  | "scores"
  | "alerts"
  | "pnl"
  | "sig"
  | "monthly"
  | "structure"
  | "analyse";

export const DEFAULT_REPORT_LAYOUT: SommaireKind[] = [
  "scores",
  "alerts",
  "pnl",
  "sig",
  "monthly",
  "structure",
  "analyse",
];

export const SOMMAIRE_LABELS: Record<
  SommaireKind,
  { label: string; desc: string }
> = {
  scores: {
    label: "Fiabilité des données",
    desc: "Score global, écritures classées, manquantes et ajustées",
  },
  alerts: {
    label: "Erreurs et points d'attention",
    desc: "Encaissements/décaissements non identifiés et alertes de la revue comptable",
  },
  pnl: {
    label: "Compte de résultat",
    desc: "P&L annuel jusqu'au résultat net après IS, détail par compte",
  },
  sig: {
    label: "Soldes intermédiaires de gestion",
    desc: "Marge, valeur ajoutée, EBE, RCAI et CAF",
  },
  monthly: {
    label: "Compte de résultat mensuel",
    desc: "Vue synthétique regroupée mois par mois",
  },
  structure: {
    label: "Structure financière",
    desc: "Bilan synthétique, ratios, pont de marge et comparatif N/N-1",
  },
  analyse: {
    label: "Analyse, fiscalité et fiabilité",
    desc: "Scoring, IS estimé, TVA et synthèse",
  },
};

export const SIG_ROW_DEFS: Array<{ label: string; cls: string; nKey: string; n1Key: string }> = [
  { label: "Marge brute", cls: "line-item", nKey: "margeBruteN", n1Key: "margeBruteN1" },
  { label: "Valeur ajoutée", cls: "line-item", nKey: "valeurAjouteeN", n1Key: "valeurAjouteeN1" },
  { label: "Excédent brut d'exploitation (EBE)", cls: "line-item", nKey: "ebeN", n1Key: "ebeN1" },
  { label: "Résultat d'exploitation", cls: "line-item", nKey: "reN", n1Key: "reN1" },
  { label: "Résultat courant avant impôts (RCAI)", cls: "line-item", nKey: "rcaiN", n1Key: "rcaiN1" },
  { label: "Résultat net", cls: "net-result", nKey: "rnN", n1Key: "rnN1" },
];

export const RESULT_ROW_DEFS: Array<{
  label: string;
  cls: string;
  nKey: keyof ReportModel["pnl"]["totals"];
  n1Key: keyof ReportModel["pnl"]["totals"];
}> = [
    {
      label: "Résultat d'exploitation",
      cls: "result-row",
      nKey: "resultatExploitationN",
      n1Key: "resultatExploitationN1",
    },
    {
      label: "Résultat net",
      cls: "net-result",
      nKey: "resultatNetN",
      n1Key: "resultatNetN1",
    },
  ];

export const SCORING_ROWS: Array<{ key: string; label: string; suffix: string; cls: string }> = [
  { key: "global", label: "Fiabilité globale", suffix: "%", cls: "scoring-total" },
];

export function sommaireItems(layout: SommaireKind[]) {
  return layout.filter((k) => k in SOMMAIRE_LABELS).map((kind) => ({
    kind,
    ...SOMMAIRE_LABELS[kind],
  }));
}
