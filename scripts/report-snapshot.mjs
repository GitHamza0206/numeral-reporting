#!/usr/bin/env node

import { createReportSnapshot, parseReportVersion } from "../src/lib/report-history.ts";

const [rawVersion, ...noteParts] = process.argv.slice(2);

if (!rawVersion) {
  console.error('Usage: pnpm report:snapshot v1 "note courte"');
  process.exit(1);
}

const version = parseReportVersion(rawVersion);
if (version === null) {
  console.error(`Version invalide : ${rawVersion}`);
  process.exit(1);
}

try {
  const snapshot = await createReportSnapshot(version, noteParts.join(" "));
  console.log(`Snapshot créé pour v${snapshot.version}: ${snapshot.id}`);
  if (snapshot.note) console.log(`Note: ${snapshot.note}`);
  console.log(`Fichiers: ${snapshot.files.join(", ")}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
