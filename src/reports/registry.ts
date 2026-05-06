import type { ComponentType } from "react";
import type { ReportVersionComponentProps } from "@/schemas/report";

export type ReportModule = { default: ComponentType<ReportVersionComponentProps> };

export const reportRegistry = {
  v0: () => import("./v0/report"),
} satisfies Record<string, () => Promise<ReportModule>>;
