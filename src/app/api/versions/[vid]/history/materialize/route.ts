import { stat } from "node:fs/promises";
import { resolve } from "node:path";

import { materializeReportModelSnapshot, REPORT_HISTORY_DIR } from "@/lib/report-history";
import { parseVid, readMeta } from "@/lib/reports";

export const dynamic = "force-dynamic";

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request, context: { params: Promise<{ vid: string }> }) {
  const { vid } = await context.params;
  const version = parseVid(vid);
  if (version == null) {
    return Response.json({ error: `not found: POST /api/versions/${vid}/history/materialize` }, { status: 404 });
  }

  const meta = await readMeta();
  if (!meta.versions.some((entry) => entry.n === version)) {
    return Response.json({ error: `v${version} introuvable` }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { snapshotId?: string } | null;
  const snapshotId = body?.snapshotId?.trim();
  if (!snapshotId) {
    return Response.json({ error: "snapshotId requis" }, { status: 400 });
  }

  const snapshotDir = resolve(REPORT_HISTORY_DIR, `v${version}`, snapshotId);
  if (!(await exists(snapshotDir))) {
    return Response.json({ error: `capture introuvable: ${snapshotId}` }, { status: 404 });
  }

  const ok = await materializeReportModelSnapshot(version, snapshotId);
  if (!ok) {
    return Response.json(
      { error: "impossible d’écrire report-model.json (modèle introuvable ou erreur disque)" },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, path: "report-model.json" }, {
    headers: { "cache-control": "no-store" },
  });
}
