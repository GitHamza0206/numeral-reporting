import type { ReportLine, ReportModel } from "../schemas/report.ts";

export type ReportDomainDiffRow = {
  kind: "change" | "add" | "remove";
  section: string;
  label: string;
  oldValue: string;
  newValue: string;
};

type FlatEntry = { section: string; label: string; value: string };

const moneyFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function dash(v: string): string {
  return v === "" ? "—" : v;
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return moneyFmt.format(n);
}

function fmtText(s: string | undefined | null): string {
  if (s == null || s === "") return "—";
  return s;
}

function fmtNum(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return String(n);
}

function fmtVariant(v: string | undefined): string {
  if (!v) return "—";
  return v === "adjusted" ? "Ajusté" : "Normal";
}

function set(map: Map<string, FlatEntry>, key: string, section: string, label: string, value: string): void {
  map.set(key, { section, label, value });
}

function walkLine(
  map: Map<string, FlatEntry>,
  section: string,
  blockFr: string,
  keyBase: string,
  line: ReportLine,
  index: number,
): void {
  const i = index + 1;
  set(map, `${keyBase}.label`, section, `${blockFr} › Ligne ${i} › Libellé`, line.label);
  set(map, `${keyBase}.n`, section, `${blockFr} › Ligne ${i} › Montant (N)`, fmtMoney(line.n));
  set(map, `${keyBase}.n1`, section, `${blockFr} › Ligne ${i} › Montant (N-1)`, fmtMoney(line.n1));
  set(map, `${keyBase}.variant`, section, `${blockFr} › Ligne ${i} › Variante`, fmtVariant(line.variant));

  const details = line.details ?? [];
  details.forEach((d, j) => {
    const dj = j + 1;
    const dk = `${keyBase}.detail.${j}`;
    set(map, `${dk}.label`, section, `${blockFr} › Ligne ${i} › Détail ${dj} › Libellé`, d.label);
    set(map, `${dk}.account`, section, `${blockFr} › Ligne ${i} › Détail ${dj} › Compte`, fmtText(d.account));
    set(map, `${dk}.n`, section, `${blockFr} › Ligne ${i} › Détail ${dj} › Montant (N)`, fmtMoney(d.n));
    set(map, `${dk}.n1`, section, `${blockFr} › Ligne ${i} › Détail ${dj} › Montant (N-1)`, fmtMoney(d.n1));
    set(map, `${dk}.variant`, section, `${blockFr} › Ligne ${i} › Détail ${dj} › Variante`, fmtVariant(d.variant));
  });
}

const SIG_LABELS: Record<string, string> = {
  margeBruteN: "Marge brute (N)",
  margeBruteN1: "Marge brute (N-1)",
  valeurAjouteeN: "Valeur ajoutée (N)",
  valeurAjouteeN1: "Valeur ajoutée (N-1)",
  ebeN: "EBE (N)",
  ebeN1: "EBE (N-1)",
  reN: "Résultat d'exploitation (N)",
  reN1: "Résultat d'exploitation (N-1)",
  rcaiN: "RCAI (N)",
  rcaiN1: "RCAI (N-1)",
  rnN: "Résultat net (N)",
  rnN1: "Résultat net (N-1)",
  resultatNetN: "Résultat net (N) [alias]",
  resultatNetN1: "Résultat net (N-1) [alias]",
};

function flattenReportModel(model: ReportModel): Map<string, FlatEntry> {
  const map = new Map<string, FlatEntry>();
  const S_INFO = "Informations du rapport";
  const m = model.meta;
  set(map, "meta.title", S_INFO, "Titre", m.title);
  set(map, "meta.client", S_INFO, "Client", m.client);
  set(map, "meta.period", S_INFO, "Période", m.period);
  set(map, "meta.year", S_INFO, "Exercice (N)", String(m.year));
  set(map, "meta.priorYear", S_INFO, "Exercice (N-1)", String(m.priorYear));
  set(map, "meta.source", S_INFO, "Source des données", m.source);
  set(map, "meta.generatedAt", S_INFO, "Date d’établissement", m.generatedAt);
  set(map, "meta.periodDescription", S_INFO, "Description période", fmtText(m.periodDescription));
  set(map, "meta.currentPeriodLabel", S_INFO, "Libellé période courante", fmtText(m.currentPeriodLabel));
  set(map, "meta.priorPeriodLabel", S_INFO, "Libellé période N-1", fmtText(m.priorPeriodLabel));

  const S_PNL = "Compte de résultat";
  const pnl = model.pnl;
  set(map, "pnl.subtitle", S_PNL, "Sous-titre", fmtText(pnl.subtitle));
  set(map, "pnl.footnote", S_PNL, "Note de bas de tableau", fmtText(pnl.footnote));

  const sc = pnl.score;
  set(map, "pnl.score.global", S_PNL, "Score › Global", fmtNum(sc.global));
  set(map, "pnl.score.level", S_PNL, "Score › Niveau (code)", sc.level);
  set(map, "pnl.score.levelLabel", S_PNL, "Score › Niveau (libellé)", sc.levelLabel);
  set(map, "pnl.score.traitement", S_PNL, "Score › Traitement", fmtNum(sc.traitement));
  set(map, "pnl.score.nonTraite", S_PNL, "Score › Non traité", fmtNum(sc.nonTraite));
  set(map, "pnl.score.ajustement", S_PNL, "Score › Ajustement", fmtNum(sc.ajustement));
  set(map, "pnl.score.montantTraite", S_PNL, "Score › Montant traité (texte)", sc.montantTraite);
  set(map, "pnl.score.montantNonTraite", S_PNL, "Score › Montant non traité (texte)", sc.montantNonTraite);
  set(map, "pnl.score.montantAjuste", S_PNL, "Score › Montant ajusté (texte)", sc.montantAjuste);

  pnl.produits.forEach((line, idx) =>
    walkLine(map, S_PNL, "Produits", `pnl.produits.${idx}`, line, idx),
  );
  pnl.charges.forEach((line, idx) => walkLine(map, S_PNL, "Charges", `pnl.charges.${idx}`, line, idx));

  const t = pnl.totals;
  set(map, "pnl.totals.produitsN", S_PNL, "Totaux › Produits (N)", fmtMoney(t.produitsN));
  set(map, "pnl.totals.produitsN1", S_PNL, "Totaux › Produits (N-1)", fmtMoney(t.produitsN1));
  set(map, "pnl.totals.chargesN", S_PNL, "Totaux › Charges (N)", fmtMoney(t.chargesN));
  set(map, "pnl.totals.chargesN1", S_PNL, "Totaux › Charges (N-1)", fmtMoney(t.chargesN1));
  set(map, "pnl.totals.resultatExploitationN", S_PNL, "Totaux › Résultat d’exploitation (N)", fmtMoney(t.resultatExploitationN));
  set(map, "pnl.totals.resultatExploitationN1", S_PNL, "Totaux › Résultat d’exploitation (N-1)", fmtMoney(t.resultatExploitationN1));
  set(map, "pnl.totals.resultatNetN", S_PNL, "Totaux › Résultat net (N)", fmtMoney(t.resultatNetN));
  set(map, "pnl.totals.resultatNetN1", S_PNL, "Totaux › Résultat net (N-1)", fmtMoney(t.resultatNetN1));

  const S_ALT = "Alertes et points d’attention";
  const al = model.alerts;
  set(map, "alerts.blockingTotal", S_ALT, "Erreurs bloquantes › Total (€)", fmtMoney(al.blockingTotal));
  al.blocking.forEach((a, i) => {
    const k = `alerts.blocking.${i}`;
    set(map, `${k}.label`, S_ALT, `Erreur bloquante ${i + 1} › Libellé`, a.label);
    set(map, `${k}.severity`, S_ALT, `Erreur bloquante ${i + 1} › Gravité`, fmtText(a.severity));
    set(map, `${k}.account`, S_ALT, `Erreur bloquante ${i + 1} › Compte`, fmtText(a.account));
    set(map, `${k}.amount`, S_ALT, `Erreur bloquante ${i + 1} › Montant`, fmtMoney(a.amount));
    set(map, `${k}.comment`, S_ALT, `Erreur bloquante ${i + 1} › Commentaire`, fmtText(a.comment));
  });
  al.points.forEach((a, i) => {
    const k = `alerts.points.${i}`;
    set(map, `${k}.label`, S_ALT, `Point d’attention ${i + 1} › Libellé`, a.label);
    set(map, `${k}.severity`, S_ALT, `Point d’attention ${i + 1} › Gravité`, fmtText(a.severity));
    set(map, `${k}.account`, S_ALT, `Point d’attention ${i + 1} › Compte`, fmtText(a.account));
    set(map, `${k}.amount`, S_ALT, `Point d’attention ${i + 1} › Montant`, fmtMoney(a.amount));
    set(map, `${k}.comment`, S_ALT, `Point d’attention ${i + 1} › Commentaire`, fmtText(a.comment));
  });

  const S_SIG = "SIG";
  if (model.sig) {
    for (const [field, human] of Object.entries(SIG_LABELS)) {
      const v = model.sig[field as keyof typeof model.sig];
      set(map, `sig.${field}`, S_SIG, human, fmtMoney(v as number | null | undefined));
    }
  }

  const S_MONTH = "Mensuel";
  if (model.monthly) {
    const mo = model.monthly;
    mo.headers.forEach((h, i) => set(map, `monthly.header.${i}`, S_MONTH, `Colonne ${i + 1} › En-tête`, h));
    mo.produits.cells.forEach((c, i) =>
      set(map, `monthly.produits.cell.${i}`, S_MONTH, `Produits — colonne ${i + 1}`, fmtMoney(c)),
    );
    set(map, "monthly.produits.total", S_MONTH, "Produits — total", fmtMoney(mo.produits.total));
    mo.charges.forEach((row, ri) => {
      const r = ri + 1;
      set(map, `monthly.charges.${ri}.label`, S_MONTH, `Charges ligne ${r} › Libellé`, row.label);
      row.cells.forEach((c, ci) =>
        set(map, `monthly.charges.${ri}.cell.${ci}`, S_MONTH, `Charges ligne ${r} — col. ${ci + 1}`, fmtMoney(c)),
      );
      set(map, `monthly.charges.${ri}.total`, S_MONTH, `Charges ligne ${r} › Total`, fmtMoney(row.total));
    });
    mo.chargesTotal.cells.forEach((c, i) =>
      set(map, `monthly.chargesTotal.cell.${i}`, S_MONTH, `Total charges — col. ${i + 1}`, fmtMoney(c)),
    );
    set(map, "monthly.chargesTotal.total", S_MONTH, "Total charges — total", fmtMoney(mo.chargesTotal.total));
    mo.result.cells.forEach((c, i) =>
      set(map, `monthly.result.cell.${i}`, S_MONTH, `Résultat — col. ${i + 1}`, fmtMoney(c)),
    );
    set(map, "monthly.result.total", S_MONTH, "Résultat — total", fmtMoney(mo.result.total));
  }

  const S_STR = "Structure et bilan";
  if (model.structure) {
    const st = model.structure;
    if (st.balance) {
      const bal = st.balance;
      bal.actif.forEach((row, i) => {
        const r = i + 1;
        set(map, `structure.balance.actif.${i}.label`, S_STR, `Bilan actif ligne ${r} › Libellé`, row.label);
        set(map, `structure.balance.actif.${i}.amount`, S_STR, `Bilan actif ligne ${r} › Montant`, fmtMoney(row.amount));
        set(map, `structure.balance.actif.${i}.bold`, S_STR, `Bilan actif ligne ${r} › Mis en avant`, row.bold ? "Oui" : "Non");
      });
      bal.passif.forEach((row, i) => {
        const r = i + 1;
        set(map, `structure.balance.passif.${i}.label`, S_STR, `Bilan passif ligne ${r} › Libellé`, row.label);
        set(map, `structure.balance.passif.${i}.amount`, S_STR, `Bilan passif ligne ${r} › Montant`, fmtMoney(row.amount));
        set(map, `structure.balance.passif.${i}.bold`, S_STR, `Bilan passif ligne ${r} › Mis en avant`, row.bold ? "Oui" : "Non");
      });
      set(map, "structure.balance.totalActif", S_STR, "Bilan › Total actif", fmtMoney(bal.totalActif));
      set(map, "structure.balance.totalPassif", S_STR, "Bilan › Total passif", fmtMoney(bal.totalPassif));
    }
    st.ratios.forEach((row, i) => {
      const r = i + 1;
      set(map, `structure.ratios.${i}.label`, S_STR, `Ratio ${r} › Libellé`, row.label);
      set(map, `structure.ratios.${i}.value`, S_STR, `Ratio ${r} › Valeur`, row.value);
      set(map, `structure.ratios.${i}.hint`, S_STR, `Ratio ${r} › Indication`, fmtText(row.hint));
    });
    set(map, "structure.dsoAlert", S_STR, "Alerte DSO", fmtText(st.dsoAlert));
    if (st.charts) {
      set(map, "structure.charts.comparison", S_STR, "Graphiques › Comparaison", st.charts.comparison ? "Oui" : "Non");
      st.charts.donut?.categories.forEach((c, i) => {
        set(map, `structure.charts.donut.${i}.label`, S_STR, `Donut catégorie ${i + 1} › Libellé`, c.label);
        set(map, `structure.charts.donut.${i}.value`, S_STR, `Donut catégorie ${i + 1} › Valeur`, fmtMoney(c.value));
      });
    }
  }

  const S_ANA = "Analyse et narratifs";
  const an = model.analyse;
  if (an.scoring) {
    for (const key of Object.keys(an.scoring).sort()) {
      const v = an.scoring[key];
      set(map, `analyse.scoring.${key}`, S_ANA, `Scoring › ${key}`, typeof v === "number" ? String(v) : String(v));
    }
  }
  an.penalties?.forEach((p, i) => {
    const k = `analyse.penalties.${i}`;
    set(map, `${k}.label`, S_ANA, `Pénalité ${i + 1} › Libellé`, fmtText(p.label));
    set(map, `${k}.description`, S_ANA, `Pénalité ${i + 1} › Description`, fmtText(p.description));
    set(map, `${k}.weight`, S_ANA, `Pénalité ${i + 1} › Pondération`, fmtNum(p.weight));
    set(map, `${k}.pct`, S_ANA, `Pénalité ${i + 1} › %`, fmtNum(p.pct));
    set(map, `${k}.reason`, S_ANA, `Pénalité ${i + 1} › Motif`, fmtText(p.reason));
  });
  an.fiscalite?.forEach((p, i) => {
    const k = `analyse.fiscalite.${i}`;
    set(map, `${k}.label`, S_ANA, `Fiscalité ${i + 1} › Libellé`, fmtText(p.label));
    set(map, `${k}.status`, S_ANA, `Fiscalité ${i + 1} › Statut`, fmtText(p.status));
    set(map, `${k}.comment`, S_ANA, `Fiscalité ${i + 1} › Commentaire`, fmtText(p.comment));
  });
  if (an.narratives) {
    for (const key of Object.keys(an.narratives).sort()) {
      set(map, `analyse.narratives.${key}`, S_ANA, `Texte › ${key}`, an.narratives[key] ?? "—");
    }
  }
  an.synthese?.forEach((p, i) => {
    const k = `analyse.synthese.${i}`;
    set(map, `${k}.label`, S_ANA, `Synthèse ${i + 1} › Libellé`, p.label);
    set(map, `${k}.comment`, S_ANA, `Synthèse ${i + 1} › Commentaire`, fmtText(p.comment));
    set(map, `${k}.value`, S_ANA, `Synthèse ${i + 1} › Valeur`, fmtText(p.value));
    set(map, `${k}.accent`, S_ANA, `Synthèse ${i + 1} › Accent`, fmtText(p.accent));
  });
  an.footerExtra?.forEach((line, i) => {
    set(map, `analyse.footerExtra.${i}`, S_ANA, `Pied — ligne ${i + 1}`, line);
  });

  return map;
}

function rowKind(oldVal: string, newVal: string): ReportDomainDiffRow["kind"] {
  const o = dash(oldVal);
  const n = dash(newVal);
  const oEmpty = o === "—";
  const nEmpty = n === "—";
  if (oEmpty && !nEmpty) return "add";
  if (!oEmpty && nEmpty) return "remove";
  return "change";
}

/** Compare deux modèles « restitution » (libellés et montants tels qu’affichés). */
export function diffReportModels(oldModel: ReportModel, newModel: ReportModel): ReportDomainDiffRow[] {
  const oldMap = flattenReportModel(oldModel);
  const newMap = flattenReportModel(newModel);
  const keys = new Set([...oldMap.keys(), ...newMap.keys()]);
  const rows: ReportDomainDiffRow[] = [];

  for (const key of [...keys].sort()) {
    const oEnt = oldMap.get(key);
    const nEnt = newMap.get(key);
    const o = oEnt?.value ?? "";
    const n = nEnt?.value ?? "";
    if (o === n) continue;
    const section = oEnt?.section ?? nEnt?.section ?? "";
    const label = oEnt?.label ?? nEnt?.label ?? key;
    rows.push({
      kind: rowKind(o, n),
      section,
      label,
      oldValue: dash(o),
      newValue: dash(n),
    });
  }

  return rows;
}
