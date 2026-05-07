const DEFAULT_BASENAME = "numeral-financial-report";

/**
 * Base du nom de fichier d’export (PDF, etc.). À surcharger par fork avec
 * `NEXT_PUBLIC_REPORT_EXPORT_BASENAME` sans toucher aux composants.
 */
export function getReportExportBasename(): string {
  const fromEnv = typeof process.env.NEXT_PUBLIC_REPORT_EXPORT_BASENAME === "string"
    ? process.env.NEXT_PUBLIC_REPORT_EXPORT_BASENAME.trim()
    : "";
  return fromEnv || DEFAULT_BASENAME;
}

export function reportPdfFilename(version: number): string {
  return `${getReportExportBasename()}-v${version}.pdf`;
}
