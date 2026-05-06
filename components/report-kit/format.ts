import type { ReportLine } from "@/schemas/report";

export function fmtEuro(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

export function fmtNumber(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(Number(v)));
}

export function scoreTagClass(globalScore: number | null | undefined): string {
  if (globalScore == null) return "tag-brand";
  if (globalScore >= 85) return "tag-brand";
  if (globalScore >= 70) return "tag-warning";
  return "tag-danger";
}

export function scoreCardLevelClass(level: string): string {
  switch (level) {
    case "fiable":
      return "score-fiable";
    case "acceptable":
      return "score-acceptable";
    case "douteux":
      return "score-non-fiable";
    default:
      return "score-acceptable";
  }
}

export function severityClass(s: string | undefined): string {
  const k = String(s || "info").toLowerCase();
  if (k === "erreur" || k === "error") return "severity-erreur";
  if (k === "alerte" || k === "warning" || k === "warn") return "severity-alerte";
  return "severity-info";
}

export function severityLabel(s: string | undefined): string {
  const k = String(s || "info").toLowerCase();
  if (k === "erreur" || k === "error") return "ERREUR";
  if (k === "alerte" || k === "warning" || k === "warn") return "ALERTE";
  return "INFO";
}

export function posNeg(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  if (n > 0) return "positive";
  if (n < 0) return "negative";
  return "";
}

export function hasAdjustmentsPnl(pnl: {
  produits: ReportLine[];
  charges: ReportLine[];
}): boolean {
  const walk = (items: ReportLine[]) =>
    (items || []).some((it) => {
      if (it.variant === "adjusted") return true;
      return (it.details || []).some((d) => d.variant === "adjusted");
    });
  return walk(pnl.produits) || walk(pnl.charges);
}

export type FlatRow = { key: string; rowClass: string; label: string; n: string; n1: string };

export function flattenLineItem(item: ReportLine | undefined, prefix: string): FlatRow[] {
  if (!item) return [];
  const rows: FlatRow[] = [];
  const variant = item.variant === "adjusted" ? " adjusted" : "";
  rows.push({
    key: `${prefix}-L`,
    rowClass: `line-item${variant}`,
    label: item.label,
    n: fmtEuro(item.n ?? null),
    n1: fmtEuro(item.n1 ?? null),
  });
  (item.details || []).forEach((d, i) => {
    const dv = d.variant && d.variant !== "normal" ? ` ${d.variant}` : "";
    const lbl = d.account ? `${d.account} — ${d.label || ""}` : d.label;
    rows.push({
      key: `${prefix}-D${i}`,
      rowClass: `detail${dv}`,
      label: lbl,
      n: fmtEuro(d.n ?? null),
      n1: fmtEuro(d.n1 ?? null),
    });
  });
  return rows;
}

export function formatGeneratedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

export function donutPercent(categories: Array<{ value: number }>, cat: { value: number }): string {
  const total = categories.reduce((s, c) => s + (Number(c?.value) || 0), 0);
  const v = Number(cat?.value);
  if (!total || Number.isNaN(v)) return "—";
  return String(Math.round((v / total) * 100));
}
