import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = process.cwd();
export const REPORTS_DIR = resolve(ROOT, "reports");
export const TEMPLATE_DIR = resolve(REPORTS_DIR, "template");
export const META_PATH = resolve(REPORTS_DIR, "meta.json");
export const REGISTRY_PATH = resolve(REPORTS_DIR, "registry.ts");

export type VersionEntry = {
  n: number;
  parent: number | null;
  frozen: boolean;
  change_note: string | null;
  created_at: string | null;
};

export type MetaJson = {
  tip: number;
  active_version: number;
  etag: string;
  versions: VersionEntry[];
};

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function readMeta(): Promise<MetaJson> {
  try {
    const raw = await readFile(META_PATH, "utf8");
    const meta = JSON.parse(raw) as Partial<MetaJson>;
    if (Array.isArray(meta.versions)) {
      meta.versions = meta.versions
        .map((v) =>
          typeof v === "object" && v !== null && "n" in v
            ? (v as VersionEntry)
            : {
              n: Number(v),
              parent: null,
              frozen: Number(v) === 0,
              change_note: null,
              created_at: null,
            },
        )
        .filter((v) => Number.isInteger(v.n));
    } else {
      meta.versions = [];
    }
    return {
      tip: meta.tip ?? 0,
      active_version: meta.active_version ?? 0,
      etag: meta.etag ?? "",
      versions: meta.versions as VersionEntry[],
    };
  } catch {
    return initMetaFromCwd();
  }
}

async function initMetaFromCwd(): Promise<MetaJson> {
  const v0Dir = resolve(REPORTS_DIR, "v0");
  if (!(await exists(resolve(v0Dir, "report.tsx")))) {
    await cp(TEMPLATE_DIR, v0Dir, { recursive: true });
  }
  const meta: MetaJson = {
    tip: 0,
    active_version: 0,
    etag: "",
    versions: [
      {
        n: 0,
        parent: null,
        frozen: false,
        change_note: null,
        created_at: new Date().toISOString(),
      },
    ],
  };
  await writeMeta(meta);
  await refreshReportRegistry();
  return meta;
}

export async function writeMeta(meta: MetaJson): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(META_PATH, JSON.stringify(meta, null, 2) + "\n");
}

export async function setActiveVersion(version: number): Promise<void> {
  const meta = await readMeta();
  if (!meta.versions.some((v) => v.n === version)) return;
  if (meta.active_version === version) return;
  meta.active_version = version;
  await writeMeta(meta);
}

export async function createNewVersion(body: {
  from?: number;
  name?: string;
}): Promise<{ ok: true; version: number; parent: number } | { ok: false; status: number; error: string }> {
  const meta = await readMeta();
  const known = meta.versions.map((v) => v.n);
  const nextN = (known.length === 0 ? -1 : Math.max(...known)) + 1;
  const fromN = Number.isInteger(body?.from) ? body.from! : meta.tip;
  if (!known.includes(fromN)) {
    return { ok: false, status: 400, error: `unknown source version v${fromN}` };
  }

  const sourceDir = resolve(REPORTS_DIR, `v${fromN}`);
  const targetDir = resolve(REPORTS_DIR, `v${nextN}`);
  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });

  meta.versions.push({
    n: nextN,
    parent: fromN,
    frozen: false,
    change_note: typeof body?.name === "string" && body.name.trim() ? body.name.trim() : null,
    created_at: new Date().toISOString(),
  });
  meta.tip = nextN;
  meta.active_version = nextN;
  await writeMeta(meta);
  await refreshReportRegistry();
  return { ok: true, version: nextN, parent: fromN };
}

export async function freezeVersion(
  version: number,
): Promise<{ ok: true; frozen: boolean } | { ok: false; status: number; error: string }> {
  const meta = await readMeta();
  const entry = meta.versions.find((v) => v.n === version);
  if (!entry) return { ok: false, status: 404, error: `v${version} not found` };
  if (entry.frozen) return { ok: true, frozen: true };
  entry.frozen = true;
  await writeMeta(meta);
  return { ok: true, frozen: true };
}

export async function deleteVersion(
  version: number,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (version === 0) return { ok: false, status: 409, error: "v0 is the immutable baseline" };
  const meta = await readMeta();
  const entry = meta.versions.find((v) => v.n === version);
  if (!entry) return { ok: false, status: 404, error: `v${version} not found` };
  if (entry.frozen) return { ok: false, status: 409, error: `v${version} is frozen` };

  await rm(resolve(REPORTS_DIR, `v${version}`), { recursive: true, force: true });
  meta.versions = meta.versions.filter((v) => v.n !== version);
  if (meta.tip === version) {
    const remaining = meta.versions.map((v) => v.n);
    meta.tip = remaining.length === 0 ? 0 : Math.max(...remaining);
  }
  if (meta.active_version === version) {
    meta.active_version = meta.tip;
  }
  await writeMeta(meta);
  await refreshReportRegistry();
  return { ok: true };
}

export function parseVid(seg: string): number | null {
  const m = /^v(\d+)$/.exec(seg);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) ? n : null;
}

export async function refreshReportRegistry(): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true });
  const entries = await readdir(REPORTS_DIR, { withFileTypes: true }).catch(() => []);
  const versions: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !/^v\d+$/.test(entry.name)) continue;
    if (await exists(resolve(REPORTS_DIR, entry.name, "report.tsx"))) {
      versions.push(entry.name);
    }
  }

  versions.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

  const lines = [
    'import type { ComponentType } from "react";',
    'import type { ReportVersionComponentProps } from "@/schemas/report";',
    "",
    "export type ReportModule = { default: ComponentType<ReportVersionComponentProps> };",
    "",
    "export const reportRegistry = {",
    ...versions.map((version) => `  ${version}: () => import("./${version}/report"),`),
    "} satisfies Record<string, () => Promise<ReportModule>>;",
    "",
  ];

  await writeFile(REGISTRY_PATH, lines.join("\n"));
}
