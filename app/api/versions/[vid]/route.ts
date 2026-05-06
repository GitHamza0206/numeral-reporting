import { deleteVersion, parseVid } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ vid: string }> },
) {
  const { vid } = await context.params;
  const version = parseVid(vid);
  if (version == null) {
    return Response.json({ error: `not found: DELETE /api/versions/${vid}` }, { status: 404 });
  }

  const result = await deleteVersion(version);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
