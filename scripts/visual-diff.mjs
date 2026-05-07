#!/usr/bin/env node
/**
 * Screenshots pleine page (Playwright) + diff pixel à pixel (pixelmatch).
 * Logique partagée avec l’API /api/report/visual-diff (bouton Historique).
 *
 * Usage:
 *   pnpm visual:diff -- <urlA> <urlB> [dossier_sortie]
 *
 * Une fois après l’installation des paquets :
 *   pnpm exec playwright install chromium
 *
 * Sans code : https://www.diffchecker.com/image-diff/
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { runPixelDiffOnScreenshotBuffers, VISUAL_DIFF_VIEWPORT } from "../src/lib/visual-diff-run.ts";

function usage() {
  console.error(`Usage: pnpm visual:diff -- <urlA> <urlB> [outDir]

Default outDir: ./visual-diff-output

First-time setup: pnpm exec playwright install chromium

No-code option: https://www.diffchecker.com/image-diff/`);
}

const [_node, _script, urlA, urlB, outDirArg] = process.argv;
if (!urlA || !urlB) {
  usage();
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), outDirArg ?? "visual-diff-output");
mkdirSync(outDir, { recursive: true });
const aPath = path.join(outDir, "a.png");
const bPath = path.join(outDir, "b.png");
const diffPath = path.join(outDir, "diff.png");

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setViewportSize(VISUAL_DIFF_VIEWPORT);
  await page.goto(urlA, { waitUntil: "load", timeout: 60_000 });
  const aBuf = await page.screenshot({ fullPage: true });
  writeFileSync(aPath, aBuf);
  await page.goto(urlB, { waitUntil: "load", timeout: 60_000 });
  const bBuf = await page.screenshot({ fullPage: true });
  writeFileSync(bPath, bBuf);

  const { diffPng, mismatch, width, height } = runPixelDiffOnScreenshotBuffers(aBuf, bBuf);
  writeFileSync(diffPath, diffPng);
  console.log(`Wrote ${aPath}`);
  console.log(`Wrote ${bPath}`);
  console.log(`Wrote ${diffPath}`);
  console.log(`Mismatched pixels: ${mismatch} (${((mismatch / (width * height)) * 100).toFixed(4)}% of ${width}×${height})`);
} finally {
  await browser.close();
}
