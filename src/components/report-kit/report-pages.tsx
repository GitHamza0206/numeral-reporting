import { SCORING_ROWS, SIG_ROW_DEFS, sommaireItems, type SommaireKind } from "@/components/report-kit/constants";
import {
  donutPercent,
  fmtEuro,
  fmtNumber,
  formatGeneratedAt,
  posNeg,
  scoreCardLevelClass,
  scoreTagClass,
  severityClass,
  severityLabel,
} from "@/components/report-kit/format";
import { PnlSection } from "@/components/report-kit/pnl-section";
import type { ReportModel } from "@/schemas/report";

export {
  DEFAULT_REPORT_LAYOUT,
  TEMPLATE_REPORT_LAYOUT,
  type SommaireKind,
  sommaireItems,
} from "./constants";

function readSigN(sig: NonNullable<ReportModel["sig"]>, key: string): number | null | undefined {
  const v = sig[key as keyof typeof sig];
  if (key === "rnN") return sig.rnN ?? sig.resultatNetN;
  if (key === "rnN1") return sig.rnN1 ?? sig.resultatNetN1;
  return typeof v === "number" || v === null ? v : undefined;
}

function hasPriorSig(sig: ReportModel["sig"]): boolean {
  if (!sig) return false;
  return SIG_ROW_DEFS.some((row) => readSigN(sig, row.n1Key) != null);
}

function balanceRows(balance: NonNullable<ReportModel["structure"]>["balance"]) {
  if (!balance) return [];
  const a = balance.actif ?? [];
  const p = balance.passif ?? [];
  const n = Math.max(a.length, p.length);
  const rows: Array<{ actif: (typeof a)[number] | null; passif: (typeof p)[number] | null }> = [];
  for (let i = 0; i < n; i++) {
    rows.push({ actif: a[i] ?? null, passif: p[i] ?? null });
  }
  return rows;
}

export function CoverPage({ model }: { model: ReportModel }) {
  return (
    <section className="page cover" id="section-cover">
      <div className="cover-client">{model.meta.client}</div>
      <div className="cover-title">{model.meta.title}</div>
      <div className="cover-period">{model.meta.period}</div>
      <div className="cover-brand">
        <div className="cover-brand-rule" />
        <div className="cover-brand-name">NUMERAL</div>
      </div>
    </section>
  );
}

export function SommairePage({ layout }: { layout: SommaireKind[] }) {
  const items = sommaireItems(layout);
  return (
    <section className="page sommaire" id="section-sommaire">
      <div className="sommaire-title">Sommaire</div>
      <ol className="sommaire-list">
        {items.map((item, i) => (
          <li className="sommaire-item" key={item.kind}>
            <span className="sommaire-num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="sommaire-label">{item.label}</div>
              <div className="sommaire-desc">{item.desc}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Fiabilité + alertes dans une seule « page » : évite une coupure forcée imprimée / PDF entre les deux blocs. */
export function ScoresAndAlertsPage({ model }: { model: ReportModel }) {
  const cls = scoreTagClass(
    typeof model.analyse.scoring?.global === "number" ? model.analyse.scoring.global : model.pnl.score.global,
  );
  const blocking = model.alerts.blocking;
  const points = model.alerts.points;

  return (
    <section className="page page-scores-alerts" aria-labelledby="heading-scores">
      <div id="section-scores">
        <div className="page-header">
          <div>
            <h1 id="heading-scores">Fiabilité des données</h1>
            <p className="subtitle">
              Score global et détail par bloc — <span>{model.meta.period}</span>
            </p>
          </div>
          <span className={`tag ${cls}`}>{`Score ${model.pnl.score.global}%`}</span>
        </div>
        <div className="scores-grid">
          <div className={`score-card is-primary ${scoreCardLevelClass(model.pnl.score.level)}`}>
            <div className="score-label">Fiabilité globale</div>
            <div className="score-value">{model.pnl.score.global}%</div>
            <div className="score-badge">{model.pnl.score.levelLabel}</div>
            <div className="score-desc">Confiance dans les chiffres affichés, après revue comptable</div>
          </div>
          <div className="score-card">
            <div className="score-label">Zones maîtrisées</div>
            <div className="score-value" style={{ color: "var(--text)" }}>
              {model.pnl.score.traitement}%
            </div>
            <div className="score-desc">
              <span>{model.pnl.score.montantTraite}</span>
            </div>
          </div>
          <div className="score-card">
            <div className="score-label">Points encore ouverts</div>
            <div className="score-value" style={{ color: "var(--text)" }}>
              {model.pnl.score.nonTraite}%
            </div>
            <div className="score-desc">
              <span>{model.pnl.score.montantNonTraite}</span>
            </div>
          </div>
          <div className="score-card">
            <div className="score-label">Ajustements proposés</div>
            <div className="score-value" style={{ color: "var(--text)" }}>
              {model.pnl.score.ajustement}%
            </div>
            <div className="score-desc">
              <span>{model.pnl.score.montantAjuste}</span>
            </div>
          </div>
        </div>
        {model.analyse.narratives?.score ? <p className="section-copy">{model.analyse.narratives.score}</p> : null}
      </div>

      <div className="page-scores-alerts-second" id="section-alerts" aria-labelledby="heading-alerts">
        <div className="page-header">
          <div>
            <h1 id="heading-alerts">Erreurs et points d&apos;attention</h1>
            <p className="subtitle">
              Ce qui doit être corrigé avant clôture — <span>{model.meta.period}</span>
            </p>
          </div>
          <span className="tag tag-danger">{`${blocking.length} erreurs · ${points.length} alertes`}</span>
        </div>

      <h3>
        Erreurs bloquantes
        <span className="tag tag-danger" style={{ verticalAlign: "middle" }}>
          {blocking.length}
        </span>
      </h3>
      {blocking.length > 0 ? (
        <table className="report-table" style={{ marginTop: 12, marginBottom: 0 }}>
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Poste</th>
              <th>Commentaire</th>
              <th className="num">Montant</th>
            </tr>
          </thead>
          <tbody>
            {blocking.map((row, i) => (
              <tr key={`${row.label}-${i}`}>
                <td>{row.label}</td>
                <td>{row.account ?? ""}</td>
                <td>{row.comment ?? ""}</td>
                <td className="num">{fmtEuro(row.amount ?? null)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={3}>
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>{fmtEuro(model.alerts.blockingTotal ?? null)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="section-copy">
          Aucune erreur bloquante dans cette restitution. Les comptes de passage ou d&apos;attente bancaire restent détaillés sous « Points d&apos;attention » lorsque pertinent.
        </p>
      )}

      <h3 style={{ marginTop: 32 }}>
        Points d&apos;attention
        <span className="tag tag-danger" style={{ verticalAlign: "middle" }}>
          {`${points.length} alertes`}
        </span>
      </h3>
      {points.length > 0 ? (
        <table className="report-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Sévérité</th>
              <th>Sujet</th>
              <th className="num">Montant</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {points.map((row, i) => (
              <tr key={`${row.label}-${i}`}>
                <td>
                  <span className={severityClass(row.severity)}>{severityLabel(row.severity)}</span>
                </td>
                <td>{row.label}</td>
                <td className="num">{fmtEuro(row.amount ?? null)}</td>
                <td>{row.comment ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="section-copy">Aucune alerte — la balance traverse la revue sans signal.</p>
      )}
      </div>
    </section>
  );
}

export function SigPage({ model }: { model: ReportModel }) {
  const sig = model.sig;
  if (!sig) return null;

  const prior = hasPriorSig(sig);
  const year = model.meta.year;
  const priorYear = model.meta.priorYear;

  return (
    <section className="page" id="section-sig">
      <div className="page-header">
        <div>
          <h1>Soldes intermédiaires de gestion</h1>
          <p className="subtitle">
            Marge, valeur ajoutée, EBE, CAF — <span>{model.meta.period}</span>
          </p>
        </div>
        {year ? <span className="tag tag-brand">{year}</span> : null}
      </div>
      <div className="table-scroll">
        <table className="report-table">
          <colgroup>
            <col />
            <col style={{ width: 130 }} />
            {prior ? <col style={{ width: 130 }} /> : null}
          </colgroup>
          <thead>
            <tr>
              <th>Solde</th>
              <th className="num">{year ?? "N"}</th>
              {prior ? <th className="num">{priorYear ?? "N-1"}</th> : null}
            </tr>
          </thead>
          <tbody>
            {SIG_ROW_DEFS.map((row) => (
              <tr className={row.cls} key={row.label}>
                <td>{row.label}</td>
                <td className="num">{fmtEuro(readSigN(sig, row.nKey) ?? null)}</td>
                {prior ? <td className="num">{fmtEuro(readSigN(sig, row.n1Key) ?? null)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {model.analyse.narratives?.sig ? <p className="section-copy">{model.analyse.narratives.sig}</p> : null}
    </section>
  );
}

export function MonthlyPage({ model }: { model: ReportModel }) {
  const m = model.monthly;
  if (!m) return null;

  const colspan = m.headers.length + 2;

  return (
    <section className="page" id="section-monthly">
      <div className="page-header">
        <div>
          <h1>Compte de résultat mensuel</h1>
          <p className="subtitle">
            Vue synthétique regroupée — <span>{model.meta.period}</span>
          </p>
        </div>
        {m.headers.length ? <span className="tag tag-brand">{`${m.headers.length} mois`}</span> : null}
      </div>
      <div className="table-scroll">
        <table className="report-table compact">
          <thead>
            <tr>
              <th>Poste</th>
              {m.headers.map((h, i) => (
                <th className="num" key={`${h}-${i}`}>
                  {h}
                </th>
              ))}
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="total-row">
              <td>
                <strong>Produits</strong>
              </td>
              {m.produits.cells.map((v, i) => (
                <td className="num" key={`p-${i}`}>
                  {fmtNumber(v)}
                </td>
              ))}
              <td className="num">{fmtNumber(m.produits.total)}</td>
            </tr>
            {m.charges.map((row, ri) => (
              <tr key={`${row.label}-${ri}`}>
                <td>{row.label}</td>
                {row.cells.map((v, ci) => (
                  <td className="num" key={`${row.label}-${ci}`}>
                    {fmtNumber(v)}
                  </td>
                ))}
                <td className="num">{fmtNumber(row.total)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>
                <strong>Total charges</strong>
              </td>
              {m.chargesTotal.cells.map((v, i) => (
                <td className="num" key={`ct-${i}`}>
                  {fmtNumber(v)}
                </td>
              ))}
              <td className="num">{fmtNumber(m.chargesTotal.total)}</td>
            </tr>
            <tr className="result-separator">
              <td colSpan={colspan} />
            </tr>
            <tr className="result-row">
              <td>
                <strong>Résultat</strong>
              </td>
              {m.result.cells.map((v, i) => (
                <td className={`num ${posNeg(v)}`} key={`r-${i}`}>
                  {fmtNumber(v)}
                </td>
              ))}
              <td className={`num ${posNeg(m.result.total)}`}>{fmtNumber(m.result.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {model.analyse.narratives?.monthly ? <p className="section-copy">{model.analyse.narratives.monthly}</p> : null}
    </section>
  );
}

export function StructurePage({ model }: { model: ReportModel }) {
  const s = model.structure;
  if (!s) return null;

  const balance = s.balance;
  const rows = balance ? balanceRows(balance) : [];
  const donutCats = s.charts?.donut?.categories ?? [];

  return (
    <section className="page" id="section-structure">
      <div className="page-header">
        <div>
          <h1>Structure financière</h1>
          <p className="subtitle">Pont de marge, répartition des charges et comparatif N/N-1</p>
        </div>
        {model.meta.year ? <span className="tag tag-brand">{model.meta.year}</span> : null}
      </div>

      {balance ? (
        <div>
          <h3 style={{ marginBottom: 12 }}>Bilan synthétique</h3>
          <div className="table-scroll">
            <table className="report-table compact">
              <colgroup>
                <col />
                <col style={{ width: 130 }} />
                <col />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Actif</th>
                  <th className="num">{model.meta.year ?? "N"}</th>
                  <th>Passif</th>
                  <th className="num">{model.meta.year ?? "N"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`bal-${i}`}>
                    <td>{row.actif?.label ?? ""}</td>
                    <td className="num">{fmtEuro(row.actif?.amount ?? null)}</td>
                    <td>{row.passif?.label ?? ""}</td>
                    <td className="num">{fmtEuro(row.passif?.amount ?? null)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>
                    <strong>Total actif</strong>
                  </td>
                  <td className="num">
                    <strong>{fmtEuro(balance.totalActif)}</strong>
                  </td>
                  <td>
                    <strong>Total passif</strong>
                  </td>
                  <td className="num">
                    <strong>{fmtEuro(balance.totalPassif)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {s.ratios?.length ? (
        <div>
          <h3 style={{ marginTop: 24, marginBottom: 12 }}>Ratios</h3>
          <div className="kv-list">
            {s.ratios.map((r) => (
              <div className="kv-row" key={r.label}>
                <span>{r.label}</span>
                <strong>{r.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {s.dsoAlert ? (
        <p className="section-copy" style={{ color: "var(--danger)" }}>
          <strong>Alerte DSO :</strong> <span>{s.dsoAlert}</span>
        </p>
      ) : null}

      {!balance ? (
        <div
          className="callout-soft"
          style={{
            padding: "12px 16px",
            borderLeft: "3px solid var(--muted)",
            background: "var(--surface-alt)",
            marginBottom: 24,
          }}
        >
          <strong>Bilan non disponible.</strong> La balance fournie est partielle ou absente : aucun actif/passif, BFR, DSO, trésorerie nette ou ratio de
          structure n&apos;est affiché. Importer une balance complète clôturée pour activer cette section.
        </div>
      ) : null}

      <section className="chart-grid">
        <div>
          <h3 style={{ marginBottom: 12 }}>Pont de marge</h3>
          <div id="chart-bridge" className="chart-container" />
          {model.analyse.narratives?.bridge ? <p className="section-copy">{model.analyse.narratives.bridge}</p> : null}
        </div>
        <div>
          <h3 style={{ marginBottom: 12 }}>Répartition des charges</h3>
          <div id="chart-charges-donut" className="chart-container" />
          {donutCats.length > 0 ? (
            <div className="kv-list mt-16">
              {donutCats.map((cat, i) => (
                <div className="kv-row" key={`${cat.label}-${i}`}>
                  <span>{cat.label}</span>
                  <strong>{`${donutPercent(donutCats, cat)}%`}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {s.charts?.comparison ? (
        <div className="mt-16">
          <h3 style={{ marginBottom: 12 }}>
            Comparatif {model.meta.year ?? ""} vs {model.meta.priorYear ?? ""}
          </h3>
          <div id="chart-comparison" className="chart-container" />
          {model.analyse.narratives?.comparison ? (
            <p className="section-copy">{model.analyse.narratives.comparison}</p>
          ) : null}
        </div>
      ) : null}

      {model.analyse.narratives?.structure ? <p className="section-copy">{model.analyse.narratives.structure}</p> : null}
    </section>
  );
}

export function AnalysePage({ model }: { model: ReportModel }) {
  const scoring = model.analyse.scoring ?? {};
  const scoringRows = SCORING_ROWS.map((r) => {
    const raw = scoring[r.key];
    let value = "—";
    if (raw != null && raw !== "") {
      value = typeof raw === "number" ? `${raw}${r.suffix}` : String(raw);
    }
    return { label: r.label, value, cls: r.cls };
  });

  const fiab =
    typeof model.analyse.scoring?.global === "number"
      ? model.analyse.scoring.global
      : model.pnl.score.global;
  const fiabTag = scoreTagClass(fiab);

  const penalties = model.analyse.penalties ?? [];
  const fiscalite = model.analyse.fiscalite ?? [];

  return (
    <section className="page" id="section-analyse">
      <div className="page-header">
        <div>
          <h1>Analyse et fiabilité</h1>
          <p className="subtitle">À quel point peut-on faire confiance aux chiffres de ce rapport ?</p>
        </div>
        <span className={`tag ${fiabTag}`}>{`Fiabilité ${fiab}%`}</span>
      </div>

      <div className="scoring-grid">
        <div>
          <h4 className="scoring-heading">Calcul du score</h4>
          <table className="scoring-table">
            <tbody>
              {scoringRows.map((row) => (
                <tr className={row.cls} key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="scoring-heading">Ce qui fait baisser le score</h4>
          <table className="scoring-table">
            <tbody>
              {penalties.map((p, i) => (
                <tr key={`pen-${i}`}>
                  <td>
                    <div>{p.label ?? p.description ?? ""}</div>
                    {p.reason ? <div className="line-detail-text">{p.reason}</div> : null}
                  </td>
                  <td className="num">
                    <span className="tag tag-danger">
                      {(p.weight ?? p.pct ?? 0) + (typeof (p.weight ?? p.pct) === "number" ? "%" : "")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 style={{ marginTop: 32 }}>Fiscalité estimée</h3>
      {fiscalite.length > 0 ? (
        <table className="report-table" style={{ marginTop: 12 }}>
          <colgroup>
            <col />
            <col style={{ width: 160 }} />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>Poste</th>
              <th>Statut</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {fiscalite.map((row, i) => (
              <tr key={`fisc-${i}`}>
                <td>{row.label ?? ""}</td>
                <td>{row.status ?? ""}</td>
                <td>{row.comment ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <h3 style={{ marginTop: 32 }}>Synthèse</h3>
      <div className="kv-list mt-16">
        {(model.analyse.synthese ?? []).map((row, i) => (
          <div className="kv-row" key={`${row.label}-${i}`}>
            <span>{row.label}</span>
            <strong className={row.accent ?? ""}>{row.comment ?? row.value ?? ""}</strong>
          </div>
        ))}
      </div>

      {model.analyse.narratives?.fiscalite ? <p className="mt-16">{model.analyse.narratives.fiscalite}</p> : null}
      {model.analyse.narratives?.synthese ? <p className="mt-16">{model.analyse.narratives.synthese}</p> : null}

      <div className="report-footer">
        <span>
          Rapport généré le <span>{formatGeneratedAt(model.meta.generatedAt)}</span> — Données source : <span>{model.meta.source}</span>
          <br />
        </span>
        {(model.analyse.footerExtra ?? []).map((line, i) => (
          <span key={`foot-${i}`}>
            {line}
            <br />
          </span>
        ))}
        Scoring spec V2 : score_transaction = 0.40 × identité + 0.30 × cohérence + 0.20 × récurrence + 0.10 × montant
        <br />
        Score global = moyenne pondérée par montant des 3 blocs exclusifs (traité / non traité / ajustements)
        <br />
        Ce document est à usage interne. Les données provisoires n&apos;ont pas valeur de bilan définitif.
      </div>
    </section>
  );
}
