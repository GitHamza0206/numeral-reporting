import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { diffReportModels } from "./report-model-diff.ts";
import { loadReportModelForVersion } from "./load-report-model.ts";
import type { ReportModel } from "../schemas/report.ts";

const ROOT = process.cwd();
export const REPORTS_DIR = resolve(ROOT, "src/reports");
export const REPORT_HISTORY_DIR = resolve(REPORTS_DIR, ".history");
export const REPORT_HISTORY_FILES = ["model.ts", "report.tsx", "notes.md"] as const;
export const REPORT_MODEL_SNAPSHOT_FILE = "report-model.json";

export type ReportSnapshotManifest = {
  id: string;
  version: number;
  createdAt: string;
  note: string | null;
  files: string[];
};

export type DiffRowKind = "equal" | "change" | "add" | "remove";

export type DiffRow = {
  kind: DiffRowKind;
  oldLine: string;
  oldLineNumber: number | null;
  newLine: string;
  newLineNumber: number | null;
};

export type ReportFileDiff = {
  file: string;
  changed: boolean;
  rows: DiffRow[];
};

export type ReportDomainDiffRow = import("./report-model-diff.ts").ReportDomainDiffRow;

export type ReportHistoryDiff = {
  version: number;
  snapshots: ReportSnapshotManifest[];
  selectedSnapshot: ReportSnapshotManifest | null;
  /** Diff sur la restitution (données du rapport), pas sur le code source. */
  domain: {
    /** Le modèle courant a pu être chargé depuis `vN/model.ts`. */
    available: boolean;
    /** Fichier `report-model.json` présent pour la capture. */
    snapshotModelFileExists: boolean;
    /** JSON `report-model.json` lu et interprété avec succès. */
    snapshotModelParsed: boolean;
    rows: ReportDomainDiffRow[];
  };
  files: ReportFileDiff[];
};

type DiffOp =
  | { kind: "equal"; line: string; oldLineNumber: number; newLineNumber: number }
  | { kind: "remove"; line: string; oldLineNumber: number }
  | { kind: "add"; line: string; newLineNumber: number };

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Écrit `report-model.json` dans le dossier d’une capture (restitution métier).
 * Ne lève pas : retourne false si le dossier est absent, si `vN/model.ts` ne charge pas, ou si l’écriture échoue.
 */
export async function materializeReportModelSnapshot(version: number, snapshotId: string): Promise<boolean> {
  const snapshotDir = resolve(REPORT_HISTORY_DIR, `v${version}`, snapshotId);
  if (!(await exists(snapshotDir))) return false;
  const model = await loadReportModelForVersion(version, { bustCache: true });
  if (!model) return false;
  try {
    await writeFile(
      resolve(snapshotDir, REPORT_MODEL_SNAPSHOT_FILE),
      JSON.stringify(model, null, 2) + "\n",
      "utf8",
    );
    return true;
  } catch {
    return false;
  }
}

function splitLines(text: string): string[] {
  const withoutFinalNewline = text.endsWith("\n") ? text.slice(0, -1) : text;
  return withoutFinalNewline.length === 0 ? [] : withoutFinalNewline.split(/\r?\n/);
}

function toSnapshotId(date = new Date()): string {
  const stamp = date.toISOString().replace(/\D/g, "").slice(0, 17);
  return `${stamp}-${randomUUID().slice(0, 8)}`;
}

export function parseReportVersion(value: string): number | null {
  const match = /^v?(\d+)$/.exec(value.trim());
  if (!match) return null;
  const version = Number(match[1]);
  return Number.isInteger(version) ? version : null;
}

export function buildSideBySideDiff(oldText: string, newText: string): DiffRow[] {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const ops = buildLineOps(oldLines, newLines);
  const rows: DiffRow[] = [];
  let pending: DiffOp[] = [];

  const flushPending = () => {
    if (pending.length === 0) return;
    const removed = pending.filter((op): op is Extract<DiffOp, { kind: "remove" }> => op.kind === "remove");
    const added = pending.filter((op): op is Extract<DiffOp, { kind: "add" }> => op.kind === "add");
    const rowCount = Math.max(removed.length, added.length);

    for (let i = 0; i < rowCount; i++) {
      const oldOp = removed[i];
      const newOp = added[i];
      if (oldOp && newOp) {
        rows.push({
          kind: "change",
          oldLine: oldOp.line,
          oldLineNumber: oldOp.oldLineNumber,
          newLine: newOp.line,
          newLineNumber: newOp.newLineNumber,
        });
      } else if (oldOp) {
        rows.push({
          kind: "remove",
          oldLine: oldOp.line,
          oldLineNumber: oldOp.oldLineNumber,
          newLine: "",
          newLineNumber: null,
        });
      } else if (newOp) {
        rows.push({
          kind: "add",
          oldLine: "",
          oldLineNumber: null,
          newLine: newOp.line,
          newLineNumber: newOp.newLineNumber,
        });
      }
    }

    pending = [];
  };

  for (const op of ops) {
    if (op.kind === "equal") {
      flushPending();
      rows.push({
        kind: "equal",
        oldLine: op.line,
        oldLineNumber: op.oldLineNumber,
        newLine: op.line,
        newLineNumber: op.newLineNumber,
      });
    } else {
      pending.push(op);
    }
  }
  flushPending();

  return rows;
}

function buildLineOps(oldLines: string[], newLines: string[]): DiffOp[] {
  const oldCount = oldLines.length;
  const newCount = newLines.length;
  const lengths = Array.from({ length: oldCount + 1 }, () => Array<number>(newCount + 1).fill(0));

  for (let i = oldCount - 1; i >= 0; i--) {
    for (let j = newCount - 1; j >= 0; j--) {
      lengths[i][j] =
        oldLines[i] === newLines[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldCount && newIndex < newCount) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      ops.push({
        kind: "equal",
        line: oldLines[oldIndex],
        oldLineNumber: oldIndex + 1,
        newLineNumber: newIndex + 1,
      });
      oldIndex++;
      newIndex++;
    } else if (lengths[oldIndex + 1][newIndex] >= lengths[oldIndex][newIndex + 1]) {
      ops.push({ kind: "remove", line: oldLines[oldIndex], oldLineNumber: oldIndex + 1 });
      oldIndex++;
    } else {
      ops.push({ kind: "add", line: newLines[newIndex], newLineNumber: newIndex + 1 });
      newIndex++;
    }
  }

  while (oldIndex < oldCount) {
    ops.push({ kind: "remove", line: oldLines[oldIndex], oldLineNumber: oldIndex + 1 });
    oldIndex++;
  }

  while (newIndex < newCount) {
    ops.push({ kind: "add", line: newLines[newIndex], newLineNumber: newIndex + 1 });
    newIndex++;
  }

  return ops;
}

export async function createReportSnapshot(version: number, note?: string): Promise<ReportSnapshotManifest> {
  const sourceDir = resolve(REPORTS_DIR, `v${version}`);
  if (!(await exists(sourceDir))) {
    throw new Error(`Version introuvable : v${version}`);
  }

  const id = toSnapshotId();
  const targetDir = resolve(REPORT_HISTORY_DIR, `v${version}`, id);
  const files: string[] = [];
  await mkdir(targetDir, { recursive: true });

  for (const file of REPORT_HISTORY_FILES) {
    const source = resolve(sourceDir, file);
    if (!(await exists(source))) continue;
    await copyFile(source, resolve(targetDir, file));
    files.push(file);
  }

  if (files.length === 0) {
    throw new Error(`Aucun fichier de rapport à capturer pour v${version}`);
  }

  const manifest: ReportSnapshotManifest = {
    id,
    version,
    createdAt: new Date().toISOString(),
    note: note?.trim() ? note.trim() : null,
    files,
  };

  await writeFile(resolve(targetDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await materializeReportModelSnapshot(version, id);
  return manifest;
}

async function readTrackedFilesForVersion(version: number): Promise<Map<string, string>> {
  const sourceDir = resolve(REPORTS_DIR, `v${version}`);
  const map = new Map<string, string>();
  for (const file of REPORT_HISTORY_FILES) {
    const source = resolve(sourceDir, file);
    if (await exists(source)) {
      map.set(file, await readFile(source, "utf8"));
    }
  }
  return map;
}

async function trackedFilesMatchSnapshot(
  manifest: ReportSnapshotManifest,
  current: Map<string, string>,
): Promise<boolean> {
  const snapshotDir = resolve(REPORT_HISTORY_DIR, `v${manifest.version}`, manifest.id);
  for (const file of REPORT_HISTORY_FILES) {
    const cur = current.get(file) ?? "";
    const prev = await readFile(resolve(snapshotDir, file), "utf8").catch(() => "");
    if (cur !== prev) return false;
  }
  return true;
}

/** Crée un instantané seulement si le contenu des fichiers suivis a changé par rapport au dernier instantané. */
export async function createAutoSnapshotIfChanged(version: number): Promise<ReportSnapshotManifest | null> {
  const current = await readTrackedFilesForVersion(version);
  if (current.size === 0) return null;

  const snapshots = await listReportSnapshots(version);
  const latest = snapshots[0];
  if (latest && (await trackedFilesMatchSnapshot(latest, current))) {
    return null;
  }

  const note = `Auto · ${new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" })}`;
  return createReportSnapshot(version, note);
}

export async function listReportSnapshots(version: number): Promise<ReportSnapshotManifest[]> {
  const versionHistoryDir = resolve(REPORT_HISTORY_DIR, `v${version}`);
  const entries = await readdir(versionHistoryDir, { withFileTypes: true }).catch(() => []);
  const manifests = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        try {
          const raw = await readFile(resolve(versionHistoryDir, entry.name, "manifest.json"), "utf8");
          const manifest = JSON.parse(raw) as ReportSnapshotManifest;
          return manifest.version === version && manifest.id === entry.name ? manifest : null;
        } catch {
          return null;
        }
      }),
  );

  return manifests
    .filter((manifest): manifest is ReportSnapshotManifest => manifest !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReportHistoryDiff(version: number, snapshotId?: string | null): Promise<ReportHistoryDiff> {
  const snapshots = await listReportSnapshots(version);
  const selectedSnapshot = snapshotId ? snapshots.find((snapshot) => snapshot.id === snapshotId) ?? null : snapshots[0] ?? null;

  if (!selectedSnapshot) {
    return {
      version,
      snapshots,
      selectedSnapshot: null,
      domain: {
        available: false,
        snapshotModelFileExists: false,
        snapshotModelParsed: false,
        rows: [],
      },
      files: [],
    };
  }

  const snapshotModelPath = resolve(REPORT_HISTORY_DIR, `v${version}`, selectedSnapshot.id, REPORT_MODEL_SNAPSHOT_FILE);
  const snapshotModelFileExists = await exists(snapshotModelPath);
  let snapshotModel: ReportModel | null = null;
  if (snapshotModelFileExists) {
    try {
      snapshotModel = JSON.parse(await readFile(snapshotModelPath, "utf8")) as ReportModel;
    } catch {
      snapshotModel = null;
    }
  }

  // Toujours relire le modèle depuis le disque : sans ça, l’import dynamique
  // garde une copie en mémoire (Next dev / route handler) et le diff restitution
  // est vide ou décalé d’un « tour » jusqu’au prochain rechargement.
  const currentModel = await loadReportModelForVersion(version, { bustCache: true });
  const snapshotModelParsed = snapshotModel !== null;
  const domainRows =
    snapshotModel && currentModel ? diffReportModels(snapshotModel, currentModel) : [];

  const currentDir = resolve(REPORTS_DIR, `v${version}`);
  const snapshotDir = resolve(REPORT_HISTORY_DIR, `v${version}`, selectedSnapshot.id);
  const files = await Promise.all(
    selectedSnapshot.files.map(async (file) => {
      const oldPath = resolve(snapshotDir, file);
      const newPath = resolve(currentDir, file);
      const [oldText, newText] = await Promise.all([
        readFile(oldPath, "utf8").catch(() => ""),
        readFile(newPath, "utf8").catch(() => ""),
      ]);
      return {
        file,
        changed: oldText !== newText,
        rows: buildSideBySideDiff(oldText, newText),
      };
    }),
  );

  return {
    version,
    snapshots,
    selectedSnapshot,
    domain: {
      available: currentModel !== null,
      snapshotModelFileExists,
      snapshotModelParsed,
      rows: domainRows,
    },
    files,
  };
}
