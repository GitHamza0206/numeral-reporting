import type { ReactNode } from "react";
import type { ReportModel, ReportVersionComponentProps } from "@/schemas/report";
import { ReportLayoutClient } from "./report-layout-client";

export { ReportNavbar } from "./report-navbar";
export * from "./report-pages";

export function Report({
  activeVersion,
  versions,
  children,
}: ReportVersionComponentProps & { model: ReportModel; children: ReactNode }) {
  return (
    <ReportLayoutClient activeVersion={activeVersion} versions={versions}>
      {children}
    </ReportLayoutClient>
  );
}
