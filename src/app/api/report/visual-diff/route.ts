import { runVisualDiffBuffers } from "@/lib/visual-diff-run";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = { urlA?: string; urlB?: string };

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    /* empty body ok */
  }

  const urlA = typeof body.urlA === "string" && body.urlA.length ? body.urlA : `${origin}/v0`;
  const urlB = typeof body.urlB === "string" && body.urlB.length ? body.urlB : `${origin}/v1`;

  try {
    const { diffPng, mismatch, width, height } = await runVisualDiffBuffers(urlA, urlB);
    return new Response(new Uint8Array(diffPng), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Visual-Diff-Mismatch": String(mismatch),
        "X-Visual-Diff-Width": String(width),
        "X-Visual-Diff-Height": String(height),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json(
      {
        error: "visual_diff_failed",
        detail: msg,
        hint: "Installe Chromium pour Playwright : pnpm exec playwright install chromium",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
