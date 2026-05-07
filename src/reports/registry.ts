import type { ComponentType } from "react";
import type { ReportVersionComponentProps } from "@/schemas/report";

export type ReportModule = { default: ComponentType<ReportVersionComponentProps> };

export const reportRegistry = {
  v0: () => import("./v0/report"),
  v1: () => import("./v1/report"),
  v2: () => import("./v2/report"),
} satisfies Record<string, () => Promise<ReportModule>>;
