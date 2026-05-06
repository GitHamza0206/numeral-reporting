import {
  AlertsPage,
  AnalysePage,
  CoverPage,
  DEFAULT_REPORT_LAYOUT,
  MonthlyPage,
  Report,
  ScoresPage,
  SigPage,
  SommairePage,
  StructurePage,
} from "@/components/report-kit/report";
import { PnlSection } from "@/components/report-kit/pnl-section";
import type { ReportVersionComponentProps } from "@/schemas/report";
import { model } from "./model";

export default function TemplateReport({ activeVersion, versions }: ReportVersionComponentProps) {
  return (
    <Report activeVersion={activeVersion} model={model} versions={versions}>
      <CoverPage model={model} />
      <SommairePage layout={DEFAULT_REPORT_LAYOUT} />
      <ScoresPage model={model} />
      <AlertsPage model={model} />
      <PnlSection meta={model.meta} narrative={model.analyse.narratives?.pnl} pnl={model.pnl} />
      {model.sig ? <SigPage model={model} /> : null}
      {model.monthly ? <MonthlyPage model={model} /> : null}
      {model.structure ? <StructurePage model={model} /> : null}
      <AnalysePage model={model} />
    </Report>
  );
}
