import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildSideBySideDiff } from "./report-history.ts";

test("buildSideBySideDiff pairs removed and added lines for a two-column view", () => {
  const rows = buildSideBySideDiff("produits: 100\ncharges: 40\nresultat: 60\n", "produits: 120\ncharges: 40\nresultat: 80\n");

  assert.deepEqual(rows, [
    {
      kind: "change",
      oldLine: "produits: 100",
      oldLineNumber: 1,
      newLine: "produits: 120",
      newLineNumber: 1,
    },
    {
      kind: "equal",
      oldLine: "charges: 40",
      oldLineNumber: 2,
      newLine: "charges: 40",
      newLineNumber: 2,
    },
    {
      kind: "change",
      oldLine: "resultat: 60",
      oldLineNumber: 3,
      newLine: "resultat: 80",
      newLineNumber: 3,
    },
  ]);
});

test("buildSideBySideDiff keeps additions and deletions on the correct side", () => {
  const rows = buildSideBySideDiff("ligne A\nligne B\nligne C\n", "ligne A\nligne C\nligne D\n");

  assert.deepEqual(rows, [
    {
      kind: "equal",
      oldLine: "ligne A",
      oldLineNumber: 1,
      newLine: "ligne A",
      newLineNumber: 1,
    },
    {
      kind: "remove",
      oldLine: "ligne B",
      oldLineNumber: 2,
      newLine: "",
      newLineNumber: null,
    },
    {
      kind: "equal",
      oldLine: "ligne C",
      oldLineNumber: 3,
      newLine: "ligne C",
      newLineNumber: 2,
    },
    {
      kind: "add",
      oldLine: "",
      oldLineNumber: null,
      newLine: "ligne D",
      newLineNumber: 3,
    },
  ]);
});

test("createReportSnapshot stores a version snapshot that can be compared with the current report", async () => {
  const root = await mkdtemp(join(tmpdir(), "report-history-"));
  const versionDir = join(root, "src/reports/v3");
  const originalCwd = process.cwd();

  await mkdir(versionDir, { recursive: true });
  await writeFile(join(versionDir, "model.ts"), "export const value = 1;\n");
  await writeFile(join(versionDir, "report.tsx"), "export default function Report() { return null; }\n");

  try {
    process.chdir(root);
    const moduleUrl = new URL(`./report-history.ts?snapshot=${Date.now()}`, import.meta.url).href;
    const { createReportSnapshot, getReportHistoryDiff } = (await import(moduleUrl)) as typeof import("./report-history.ts");

    const snapshot = await createReportSnapshot(3, "avant modification");
    await writeFile(join(versionDir, "model.ts"), "export const value = 2;\n");

    const history = await getReportHistoryDiff(3);
    const modelDiff = history.files.find((file) => file.file === "model.ts");

    assert.equal(history.selectedSnapshot?.id, snapshot.id);
    assert.equal(snapshot.note, "avant modification");
    assert.equal(modelDiff?.changed, true);
    assert.deepEqual(modelDiff?.rows, [
      {
        kind: "change",
        oldLine: "export const value = 1;",
        oldLineNumber: 1,
        newLine: "export const value = 2;",
        newLineNumber: 1,
      },
    ]);
    assert.equal(history.domain.available, false);
    assert.equal(history.domain.snapshotModelFileExists, false);
    assert.equal(history.domain.rows.length, 0);
  } finally {
    process.chdir(originalCwd);
  }
});

test("createAutoSnapshotIfChanged creates once then skips until files change", async () => {
  const root = await mkdtemp(join(tmpdir(), "report-history-auto-"));
  const versionDir = join(root, "src/reports/v4");
  const originalCwd = process.cwd();

  await mkdir(versionDir, { recursive: true });
  await writeFile(join(versionDir, "model.ts"), "export const a = 1;\n");

  try {
    process.chdir(root);
    const moduleUrl = new URL(`./report-history.ts?auto=${Date.now()}`, import.meta.url).href;
    const { createAutoSnapshotIfChanged } = (await import(moduleUrl)) as typeof import("./report-history.ts");

    const first = await createAutoSnapshotIfChanged(4);
    assert.ok(first);
    assert.match(first.note ?? "", /^Auto · /);

    const noop = await createAutoSnapshotIfChanged(4);
    assert.equal(noop, null);

    await writeFile(join(versionDir, "model.ts"), "export const a = 2;\n");
    const second = await createAutoSnapshotIfChanged(4);
    assert.ok(second);
    assert.notEqual(second.id, first.id);
  } finally {
    process.chdir(originalCwd);
  }
});
