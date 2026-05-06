import { readMeta } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = await readMeta();
  return Response.json(meta, {
    headers: { "cache-control": "no-store" },
  });
}
