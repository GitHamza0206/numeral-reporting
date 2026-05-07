#!/usr/bin/env node

import { watch } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const REPORTS = path.join(ROOT, "src", "reports");
const TRACKED_FILES = new Set(["model.ts", "report.tsx", "notes.md"]);
const debounceMs = Number.parseInt(process.env.REPORT_HISTORY_DEBOUNCE_MS ?? "1200", 10);

if (process.env.REPORT_HISTORY_AUTO === "0") {
  console.log("[report-history] Auto-snapshot désactivé (REPORT_HISTORY_AUTO=0).");
  process.exit(0);
}

const moduleUrl = new URL("../src/lib/report-history.ts", import.meta.url).href;
const { createAutoSnapshotIfChanged } = await import(moduleUrl);

const pending = new Map();
const attachedVersions = new Set();

function schedule(version) {
  const previous = pending.get(version);
  if (previous) clearTimeout(previous);
  const timer = setTimeout(async () => {
    pending.delete(version);
    try {
      const snap = await createAutoSnapshotIfChanged(version);
      if (snap) {
        const note = snap.note ? ` — ${snap.note}` : "";
        console.log(`[report-history] v${version} → ${snap.id}${note}`);
      }
    } catch (error) {
      console.error(`[report-history] v${version}:`, error instanceof Error ? error.message : error);
    }
  }, debounceMs);
  pending.set(version, timer);
}

function isVersionDirName(name) {
  return /^v\d+$/.test(name);
}

function versionFromDirName(name) {
  return Number(name.slice(1));
}

function attachVersionWatcher(versionPath, version) {
  if (attachedVersions.has(version)) return;
  attachedVersions.add(version);
  watch(versionPath, (_eventType, filename) => {
    if (!filename || !TRACKED_FILES.has(filename)) return;
    schedule(version);
  });
}

async function startPerVersionWatch() {
  const entries = await readdir(REPORTS, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".history" || !isVersionDirName(entry.name)) {
      continue;
    }
    const version = versionFromDirName(entry.name);
    attachVersionWatcher(path.join(REPORTS, entry.name), version);
  }

  watch(REPORTS, (_eventType, filename) => {
    if (!filename || !isVersionDirName(filename)) return;
    const version = versionFromDirName(filename);
    attachVersionWatcher(path.join(REPORTS, filename), version);
  });
}

function main() {
  try {
    watch(
      REPORTS,
      { recursive: true },
      (_eventType, filename) => {
        if (!filename) return;
        const norm = filename.split(path.sep).join("/");
        if (norm.startsWith(".history/") || norm.includes("/.history/")) return;
        const match = /^v(\d+)\/(model\.ts|report\.tsx|notes\.md)$/.exec(norm);
        if (!match) return;
        schedule(Number(match[1]));
      },
    );
    console.log(`[report-history] Surveillance (récursive) de ${REPORTS} — debounce ${debounceMs} ms.`);
  } catch {
    void startPerVersionWatch().then(() => {
      console.log(
        `[report-history] Surveillance par dossier vN sous ${REPORTS} — debounce ${debounceMs} ms (récursion fs indisponible). ` +
          `Après création d’une nouvelle version, redémarrer le serveur de dev pour l’ajouter à la surveillance.`,
      );
    });
  }
}

main();
