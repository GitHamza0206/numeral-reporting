import { chromium, type Browser } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export const VISUAL_DIFF_VIEWPORT = { width: 1280, height: 720 } as const;

function padPng(src: PNG, W: number, H: number): PNG {
  const dst = new PNG({ width: W, height: H });
  for (let i = 0; i < dst.data.length; i += 4) {
    dst.data[i] = 255;
    dst.data[i + 1] = 255;
    dst.data[i + 2] = 255;
    dst.data[i + 3] = 255;
  }
  PNG.bitblt(src, dst, 0, 0, src.width, src.height, 0, 0);
  return dst;
}

export type VisualDiffResult = {
  diffPng: Buffer;
  mismatch: number;
  width: number;
  height: number;
};

/** Compare deux PNG (buffers) déjà capturés — pad + pixelmatch. */
export function runPixelDiffOnScreenshotBuffers(aBuf: Buffer, bBuf: Buffer): VisualDiffResult {
  const a = PNG.sync.read(aBuf);
  const b = PNG.sync.read(bBuf);
  const W = Math.max(a.width, b.width);
  const H = Math.max(a.height, b.height);
  const aPad = padPng(a, W, H);
  const bPad = padPng(b, W, H);

  const diff = new PNG({ width: W, height: H });
  const mismatch = pixelmatch(aPad.data, bPad.data, diff.data, W, H, {
    threshold: 0.1,
    diffColor: [255, 0, 0],
    alpha: 0.35,
    includeAA: false,
  });

  return {
    diffPng: Buffer.from(PNG.sync.write(diff)),
    mismatch,
    width: W,
    height: H,
  };
}

/**
 * Deux captures pleine page + pixelmatch (rouge = différence).
 * À utiliser depuis la route API ou le CLI (après `playwright install chromium`).
 */
export async function runVisualDiffBuffers(urlA: string, urlB: string): Promise<VisualDiffResult> {
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize(VISUAL_DIFF_VIEWPORT);

    await page.goto(urlA, { waitUntil: "load", timeout: 60_000 });
    const aBuf = await page.screenshot({ fullPage: true });
    await page.goto(urlB, { waitUntil: "load", timeout: 60_000 });
    const bBuf = await page.screenshot({ fullPage: true });

    await browser.close();
    browser = undefined;

    return runPixelDiffOnScreenshotBuffers(aBuf, bBuf);
  } finally {
    if (browser) await browser.close();
  }
}
