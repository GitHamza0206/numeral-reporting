import { freezeVersion, parseVid } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ vid: string }> },
) {
  const { vid } = await context.params;
  const version = parseVid(vid);
  if (version == null) {
    return Response.json({ error: `not found: POST /api/versions/${vid}/freeze` }, { status: 404 });
  }

  const result = await freezeVersion(version);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ version, frozen: result.frozen });
}
