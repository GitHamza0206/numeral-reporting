import type { ReportModel } from "../schemas/report.ts";
import { reportRegistry } from "../reports/registry.ts";
import { pathToFileURL } from "node:url";
import { resolve as pathResolve } from "node:path";

export type LoadReportModelOptions = {
  /** Import fichier absolu + query pour éviter le cache ESM du watcher Node après édition de model.ts. */
  bustCache?: boolean;
};

/** Charge le `model` exporté pour une version enregistrée dans le registry (Next / Node avec résolution des imports). */
export async function loadReportModelForVersion(
  version: number,
  options: LoadReportModelOptions = {},
): Promise<ReportModel | null> {
  const vid = `v${version}`;
  if (!(vid in reportRegistry)) return null;
  try {
    if (options.bustCache) {
      const abs = pathResolve(process.cwd(), "src", "reports", vid, "model.ts");
      const href = `${pathToFileURL(abs).href}?t=${Date.now()}`;
      // URLs absolues file: — le bundler ne peut pas les résoudre ; laisser l’import au runtime Node.
      const mod = (await import(
        /* webpackIgnore: true */
        /* turbopackIgnore: true */
        href
      )) as { model?: ReportModel };
      return mod.model ?? null;
    }
    const mod = (await import(`../reports/${vid}/model.ts`)) as { model?: ReportModel };
    return mod.model ?? null;
  } catch {
    return null;
  }
}
