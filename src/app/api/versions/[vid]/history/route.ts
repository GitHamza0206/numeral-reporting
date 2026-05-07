import { getReportHistoryDiff } from "@/lib/report-history";
import { parseVid, readMeta } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ vid: string }> },
) {
  const { vid } = await context.params;
  const version = parseVid(vid);
  if (version == null) {
    return Response.json({ error: `not found: GET /api/versions/${vid}/history` }, { status: 404 });
  }

  const meta = await readMeta();
  if (!meta.versions.some((entry) => entry.n === version)) {
    return Response.json({ error: `v${version} introuvable` }, { status: 404 });
  }

  const snapshot = new URL(request.url).searchParams.get("snapshot");
  const history = await getReportHistoryDiff(version, snapshot);
  if (snapshot && !history.selectedSnapshot) {
    return Response.json({ error: `snapshot introuvable: ${snapshot}`, snapshots: history.snapshots }, { status: 404 });
  }

  return Response.json(history, {
    headers: { "cache-control": "no-store" },
  });
}
