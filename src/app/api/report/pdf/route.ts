import type { NextRequest } from "next/server";
import { urlToPdfBuffer } from "@/lib/html-to-pdf";
import { reportPdfFilename } from "@/lib/report-export-name";
import { parseVid, readMeta } from "@/lib/reports";
import { reportRegistry } from "@/reports/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseVidQuery(raw: string): number | null {
  const t = raw.trim();
  const slug = /^v\d+$/i.test(t) ? t : `v${t}`;
  return parseVid(slug);
}

function resolveOrigin(request: NextRequest): string {
  const configured = process.env.PDF_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host?.includes("localhost") || host?.startsWith("127.")) proto = "http";
  if (host) return `${proto}://${host}`;
  const port = process.env.PORT ?? "5555";
  return `http://127.0.0.1:${port}`;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("vid");
  if (!raw?.trim()) {
    return Response.json({ error: "Paramètre « vid » manquant (ex: ?vid=0 ou ?vid=v0)." }, { status: 400 });
  }
  const version = parseVidQuery(raw);
  if (version === null) {
    return Response.json({ error: "« vid » invalide." }, { status: 400 });
  }

  const meta = await readMeta();
  if (!meta.versions.some((e) => e.n === version)) {
    return Response.json({ error: "Version introuvable." }, { status: 404 });
  }

  const key = `v${version}`;
  if (!(key in reportRegistry)) {
    return Response.json({ error: "Rapport non enregistré pour cette version." }, { status: 404 });
  }

  const origin = resolveOrigin(request);
  const targetUrl = `${origin}/v${version}`;

  let buffer: Buffer;
  try {
    buffer = await urlToPdfBuffer(targetUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[pdf]", targetUrl, e);
    return Response.json(
      {
        error: "Échec de la génération PDF.",
        detail: message,
      },
      { status: 500 },
    );
  }

  const filename = reportPdfFilename(version);
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
