"use client";

import type { ReactNode } from "react";
import type { ReportVersionComponentProps } from "@/schemas/report";
import { ReportNavbar } from "./report-navbar";

export function ReportLayoutClient({
  activeVersion,
  versions,
  children,
}: Pick<ReportVersionComponentProps, "activeVersion" | "versions"> & { children: ReactNode }) {
  return (
    <>
      <ReportNavbar activeVersion={activeVersion} versions={versions} />
      {children}
    </>
  );
}
