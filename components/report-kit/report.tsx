import type { ReactNode } from "react";
import type { ReportModel, ReportVersionComponentProps } from "@/schemas/report";
import { ReportNavbar } from "./report-navbar";

export { ReportNavbar } from "./report-navbar";
export * from "./report-pages";

export function Report({
  activeVersion,
  versions,
  children,
}: ReportVersionComponentProps & { model: ReportModel; children: ReactNode }) {
  return (
    <>
      <ReportNavbar activeVersion={activeVersion} versions={versions} />
      {children}
    </>
  );
}
