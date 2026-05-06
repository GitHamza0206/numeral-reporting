import { pathToFileURL } from "node:url";
import puppeteer, { type Browser } from "puppeteer";

const SHARED_LAUNCH = {
  headless: true as const,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
};

/** Une seule couche de marges (report.css @page = 0) — évite @page + margin PDF en double */
export const PDF_PAGE_DEFAULTS = {
  format: "A4" as const,
  printBackground: true,
  margin: { top: "20mm", bottom: "22mm", left: "18mm", right: "18mm" },
};

/**
 * Imprime un fichier HTML local vers un PDF (chemin absolu recommandé pour `htmlPath`).
 */
export async function htmlToPdf(htmlPath: string, pdfPath: string): Promise<void> {
  const fileUrl = pathToFileURL(htmlPath).href;
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(fileUrl, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      ...PDF_PAGE_DEFAULTS,
    });
  } finally {
    await browser.close();
  }
}

/** PDF d’une URL HTTP(S) ou file: — utilisé par l’API d’export. */
export async function urlToPdfBuffer(url: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120_000 });
    const pdf = await page.pdf({
      ...PDF_PAGE_DEFAULTS,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function launchBrowser(): Promise<Browser> {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv) {
    return puppeteer.launch({ ...SHARED_LAUNCH, executablePath: fromEnv });
  }

  try {
    return await puppeteer.launch({ ...SHARED_LAUNCH });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const missingBundledChrome = msg.includes("Could not find Chrome") || msg.includes("Could not find browser");
    if (!missingBundledChrome) throw err;

    try {
      return await puppeteer.launch({
        ...SHARED_LAUNCH,
        channel: "chrome",
      });
    } catch {
      throw new Error(
        "Chrome/Chromium introuvable. Installe le navigateur géré par Puppeteer : « pnpm run puppeteer:install-chrome » " +
        "— ou ouvre avec Google Chrome installé ; ou définis PUPPETEER_EXECUTABLE_PATH.",
      );
    }
  }
}
