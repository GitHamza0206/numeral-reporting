"use client";

import { useMemo, useState } from "react";
import {
  flattenLineItem,
  fmtEuro,
  hasAdjustmentsPnl,
  type FlatRow,
} from "@/components/report-kit/format";
import type { ReportModel } from "@/schemas/report";
import { RESULT_ROW_DEFS } from "./constants";

export function PnlSection({
  pnl,
  meta,
  narrative,
}: {
  pnl: ReportModel["pnl"];
  meta: ReportModel["meta"];
  narrative?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hasPrior =
    pnl.totals.produitsN1 != null || pnl.totals.chargesN1 != null;

  const produitRows = useMemo(() => {
    const rows: FlatRow[] = [];
    pnl.produits.forEach((item, i) => {
      rows.push(...flattenLineItem(item, `p${i}`));
    });
    return rows;
  }, [pnl.produits]);

  const chargeRows = useMemo(() => {
    const rows: FlatRow[] = [];
    pnl.charges.forEach((item, i) => {
      rows.push(...flattenLineItem(item, `c${i}`));
    });
    return rows;
  }, [pnl.charges]);

  const resultRows = useMemo(
    () =>
      RESULT_ROW_DEFS.map((r) => ({
        label: r.label,
        cls: r.cls,
        n: fmtEuro(pnl.totals[r.nKey] as number | null | undefined),
        n1: fmtEuro(pnl.totals[r.n1Key] as number | null | undefined),
      })),
    [pnl.totals],
  );

  const periodN = meta.currentPeriodLabel ?? String(meta.year ?? "N");
  const periodN1 = meta.priorPeriodLabel ?? String(meta.priorYear ?? "N-1");
  const subtitle = pnl.subtitle ?? meta.periodDescription ?? meta.period ?? "";

  return (
    <section className="page" id="section-pnl">
      <div className="page-header">
        <div>
          <h1>Compte de Résultat</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          justifyContent: "flex-end",
          marginTop: 24,
        }}
      >
        <button
          type="button"
          className={`toggle-detail${detailsOpen ? " is-expanded" : ""}`}
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <span className="toggle-icon">&#9660;</span>
          <span>{detailsOpen ? "Masquer" : "Détail"}</span>
        </button>
        {hasAdjustmentsPnl(pnl) ? <span className="adjusted-label">Ajustement automatique</span> : null}
      </div>

      <div className="table-scroll">
        <table className={`report-table${detailsOpen ? " show-detail" : ""}`}>
          <colgroup>
            <col />
            <col style={{ width: 130 }} />
            {hasPrior ? <col style={{ width: 130 }} /> : null}
          </colgroup>
          <thead>
            <tr>
              <th>Libellé</th>
              <th className="num">{periodN}</th>
              {hasPrior ? <th className="num">{periodN1}</th> : null}
            </tr>
          </thead>
          <tbody>
            <tr className="section-header">
              <td colSpan={hasPrior ? 3 : 2}>Produits d&apos;exploitation</td>
            </tr>
            {produitRows.map((row) => (
              <tr className={row.rowClass} key={row.key}>
                <td>{row.label}</td>
                <td className="num">{row.n}</td>
                {hasPrior ? <td className="num">{row.n1}</td> : null}
              </tr>
            ))}
            <tr className="total-row">
              <td>Total produits d&apos;exploitation</td>
              <td className="num">{fmtEuro(pnl.totals.produitsN)}</td>
              {hasPrior ? <td className="num">{fmtEuro(pnl.totals.produitsN1 ?? null)}</td> : null}
            </tr>

            <tr className="section-header">
              <td colSpan={hasPrior ? 3 : 2}>Charges d&apos;exploitation</td>
            </tr>
            {chargeRows.map((row) => (
              <tr className={row.rowClass} key={row.key}>
                <td>{row.label}</td>
                <td className="num">{row.n}</td>
                {hasPrior ? <td className="num">{row.n1}</td> : null}
              </tr>
            ))}
            <tr className="total-row">
              <td>Total charges d&apos;exploitation</td>
              <td className="num">{fmtEuro(pnl.totals.chargesN)}</td>
              {hasPrior ? <td className="num">{fmtEuro(pnl.totals.chargesN1 ?? null)}</td> : null}
            </tr>

            <tr className="result-separator">
              <td colSpan={hasPrior ? 3 : 2} />
            </tr>
            {resultRows.map((row) => (
              <tr className={row.cls} key={row.label}>
                <td>{row.label}</td>
                <td className="num">{row.n}</td>
                {hasPrior ? <td className="num">{row.n1}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
        {pnl.footnote ? <p className="table-footnote">{pnl.footnote}</p> : null}
      </div>
      {narrative ? <p className="section-copy">{narrative}</p> : null}
    </section>
  );
}
