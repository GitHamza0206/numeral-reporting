import {
  AnalysePage,
  CoverPage,
  Report,
  ScoresAndAlertsPage,
  SommairePage,
  TEMPLATE_REPORT_LAYOUT,
} from "@/components/report-kit/report";
import { PnlSection } from "@/components/report-kit/pnl-section";
import type { ReportVersionComponentProps } from "@/schemas/report";
import { model } from "./model";

export default function TemplateReport({ activeVersion, versions }: ReportVersionComponentProps) {
  return (
    <Report activeVersion={activeVersion} model={model} versions={versions}>
      <CoverPage model={model} />
      <SommairePage layout={TEMPLATE_REPORT_LAYOUT} />
      <ScoresAndAlertsPage model={model} />
      <PnlSection meta={model.meta} narrative={model.analyse.narratives?.pnl} pnl={model.pnl} />
      <AnalysePage model={model} />
    </Report>
  );
}
