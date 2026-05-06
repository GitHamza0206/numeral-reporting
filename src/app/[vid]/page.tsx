import { notFound } from "next/navigation";
import { readMeta, parseVid, setActiveVersion } from "@/lib/reports";
import { reportRegistry } from "@/reports/registry";

export const dynamic = "force-dynamic";

export default async function VersionPage({ params }: { params: Promise<{ vid: string }> }) {
  const { vid } = await params;
  const version = parseVid(vid);
  if (version == null) notFound();

  const loader = reportRegistry[vid as keyof typeof reportRegistry];
  if (!loader) notFound();

  const meta = await readMeta();
  if (!meta.versions.some((entry) => entry.n === version)) notFound();
  await setActiveVersion(version);

  const { default: ReportVersion } = await loader();
  return <ReportVersion activeVersion={version} versions={meta.versions} />;
}
