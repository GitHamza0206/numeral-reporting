import { createNewVersion } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { from?: number; name?: string } = {};

  try {
    body = (await request.json()) as { from?: number; name?: string };
  } catch {
    body = {};
  }

  const result = await createNewVersion(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ version: result.version, parent: result.parent });
}
