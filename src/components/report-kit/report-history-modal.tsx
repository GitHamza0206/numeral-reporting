"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReportFileDiff, ReportHistoryDiff } from "@/lib/report-history";

type ReportHistoryModalProps = {
  activeVersion: number;
  reportVersions: number[];
  open: boolean;
  onClose: () => void;
};

type ViewTab = "restitution" | "sources";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatSnapshotDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function changedRowCount(file: ReportFileDiff): number {
  return file.rows.filter((row) => row.kind !== "equal").length;
}

export function ReportHistoryModal({ activeVersion, reportVersions, open, onClose }: ReportHistoryModalProps) {
  const [history, setHistory] = useState<ReportHistoryDiff | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const [activeFile, setActiveFile] = useState<string>("");
  const [viewTab, setViewTab] = useState<ViewTab>("restitution");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canVisualDiff = useMemo(() => reportVersions.includes(0) && reportVersions.includes(1), [reportVersions]);
  const [visualBlobUrl, setVisualBlobUrl] = useState<string | null>(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [visualMismatch, setVisualMismatch] = useState<number | null>(null);
  const [visualSize, setVisualSize] = useState<string | null>(null);

  const historyFetchGen = useRef(0);
  const selectedSnapshotIdRef = useRef("");
  const visualFetchGen = useRef(0);

  const loadHistory = useCallback(
    async (snapshotId?: string, options?: { background?: boolean }) => {
      const background = options?.background ?? false;
      const gen = ++historyFetchGen.current;
      if (!background) {
        setLoading(true);
        setError(null);
      }
      try {
        const q = new URLSearchParams();
        if (snapshotId) q.set("snapshot", snapshotId);
        q.set("_", String(Date.now()));
        const res = await fetch(`/api/versions/v${activeVersion}/history?${q}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as ReportHistoryDiff | { error?: string } | null;
        if (!res.ok) {
          if (gen === historyFetchGen.current) {
            setError(data && "error" in data && data.error ? data.error : `HTTP ${res.status}`);
          }
          return;
        }
        const nextHistory = data as ReportHistoryDiff;
        if (gen !== historyFetchGen.current) return;
        setHistory(nextHistory);
        setSelectedSnapshotId(nextHistory.selectedSnapshot?.id ?? "");
        setActiveFile((current) => {
          if (current && nextHistory.files.some((file) => file.file === current)) return current;
          return nextHistory.files.find((file) => file.changed)?.file ?? nextHistory.files[0]?.file ?? "";
        });
      } catch (err) {
        if (gen === historyFetchGen.current) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [activeVersion],
  );

  useEffect(() => {
    selectedSnapshotIdRef.current = selectedSnapshotId;
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (!open) {
      visualFetchGen.current += 1;
      setVisualBlobUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
      setVisualLoading(false);
      setVisualError(null);
      setVisualMismatch(null);
      setVisualSize(null);
      return;
    }
    if (!canVisualDiff) {
      setVisualBlobUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
      setVisualLoading(false);
      setVisualError(null);
      setVisualMismatch(null);
      setVisualSize(null);
      return;
    }
    const gen = ++visualFetchGen.current;
    setVisualBlobUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setVisualLoading(true);
    setVisualError(null);
    setVisualMismatch(null);
    setVisualSize(null);

    const origin = window.location.origin;
    void fetch("/api/report/visual-diff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urlA: `${origin}/v0`, urlB: `${origin}/v1` }),
      cache: "no-store",
    })
      .then(async (res) => {
        if (gen !== visualFetchGen.current) return;
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { detail?: string; error?: string } | null;
          const detail =
            j && typeof j.detail === "string" && j.detail.length
              ? j.detail
              : j && typeof j.error === "string"
                ? j.error
                : `HTTP ${res.status}`;
          setVisualError(detail);
          setVisualLoading(false);
          return;
        }
        const blob = await res.blob();
        if (gen !== visualFetchGen.current) return;
        const url = URL.createObjectURL(blob);
        setVisualBlobUrl(url);
        setVisualMismatch(Number(res.headers.get("X-Visual-Diff-Mismatch") ?? "0"));
        const w = res.headers.get("X-Visual-Diff-Width");
        const h = res.headers.get("X-Visual-Diff-Height");
        setVisualSize(w && h ? `${w}×${h}` : null);
        setVisualLoading(false);
      })
      .catch((e) => {
        if (gen !== visualFetchGen.current) return;
        setVisualError(e instanceof Error ? e.message : String(e));
        setVisualLoading(false);
      });
  }, [open, canVisualDiff]);

  useEffect(() => {
    if (!open) {
      historyFetchGen.current += 1;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHistory(null);
    setError(null);
    void loadHistory();
  }, [loadHistory, open]);

  useEffect(() => {
    if (!open) return;
    const refreshBackground = () => {
      const id = selectedSnapshotIdRef.current;
      void loadHistory(id || undefined, { background: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshBackground();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refreshBackground();
    }, 3500);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [open, loadHistory]);

  const selectedFile = useMemo(
    () => history?.files.find((file) => file.file === activeFile) ?? history?.files[0] ?? null,
    [activeFile, history],
  );

  const domainBanner = useMemo(() => {
    if (!history?.selectedSnapshot) return null;
    const d = history.domain;
    if (!d.available) {
      return {
        className: "history-domain-banner is-warn",
        text: "Impossible de charger le modèle courant (fichier vN/model.ts ou dépendances). Le diff restitution n’est pas disponible.",
      };
    }
    if (!d.snapshotModelFileExists) {
      return {
        className: "history-domain-banner is-warn",
        text: "Il manque report-model.json sur cette capture : le diff restitution (données lues au cabinet) n’a pas de photographie du modèle. Ce n’est pas « aucune modification ». Sauvegarde model.ts avec pnpm dev pour enregistrer une nouvelle capture, ou va dans Fichiers sources pour le diff code.",
      };
    }
    if (!d.snapshotModelParsed) {
      return {
        className: "history-domain-banner is-warn",
        text: "Le fichier report-model.json de cette capture est illisible. Enregistrez à nouveau model.ts (pnpm dev) pour créer une capture avec un export valide.",
      };
    }
    if (d.rows.length === 0) {
      return {
        className: "history-domain-banner is-ok",
        text: "Aucune différence sur les données affichées dans le rapport (libellés, montants, textes) entre la capture et l’état actuel du modèle.",
      };
    }
    return null;
  }, [history]);

  const restitutionTabLabel = useMemo(() => {
    if (!history?.selectedSnapshot) return "Restitution";
    const d = history.domain;
    if (!d.available) return "Restitution (modèle indisponible)";
    if (!d.snapshotModelFileExists) return "Restitution (export manquant)";
    const n = d.rows.length;
    if (n === 0) return "Restitution (aucune différence)";
    return `Restitution (${n} changement${n > 1 ? "s" : ""})`;
  }, [history]);

  if (!open) return null;

  return (
    <div className="modal-backdrop print-hidden" role="presentation" onClick={onClose}>
      <div
        className="modal modal-history"
        role="dialog"
        aria-labelledby="history-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header history-header">
          <div>
            <h2 id="history-title" className="modal-title">
              Historique <span>v{activeVersion}</span>
            </h2>
            <p className="history-subtitle">
              Vue <strong>restitution</strong> : ce que voit le lecteur du rapport (chiffres, libellés, textes) — pas le code
              source. L’onglet « Fichiers sources » reste disponible pour le technique.
            </p>
          </div>
          <button type="button" className="modal-close" aria-label="Fermer" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="history-visual-panel print-hidden" aria-live="polite">
          <h3 className="history-visual-title">Diff visuel (v0 vs v1)</h3>
          <p className="history-visual-hint">Screenshots pleine page · Playwright + pixelmatch (rouge = écart).</p>
          {!canVisualDiff ? (
            <p className="history-visual-skip">Ajoutez v0 et v1 au projet pour activer cette comparaison.</p>
          ) : visualLoading ? (
            <p className="history-visual-status">Génération du diff visuel…</p>
          ) : visualError ? (
            <p className="modal-error history-visual-error" role="alert">
              {visualError}
            </p>
          ) : visualBlobUrl ? (
            <>
              <p className="history-visual-meta">
                {visualSize ? `${visualSize} · ` : null}
                {visualMismatch !== null ? `${visualMismatch.toLocaleString("fr-FR")} pixels différents` : null}
              </p>
              <div className="history-visual-frame">
                <img src={visualBlobUrl} alt="Diff visuel entre v0 et v1" className="history-visual-img" />
              </div>
            </>
          ) : null}
        </div>

        {loading ? <p className="modal-body">Chargement de l’historique…</p> : null}
        {error ? <p className="modal-error">{error}</p> : null}

        {!loading && history !== null && history.snapshots.length === 0 ? (
          <div className="history-empty">
            <strong>Aucune capture pour v{activeVersion}.</strong>
            <span>
              Avec <code className="history-inline-code">pnpm dev</code>, une capture est enregistrée automatiquement après chaque sauvegarde de{" "}
              <code className="history-inline-code">model.ts</code>, <code className="history-inline-code">report.tsx</code> ou{" "}
              <code className="history-inline-code">notes.md</code>. Utilisez « Actualiser » si la liste ne bouge pas, ou refermez la modale.
            </span>
          </div>
        ) : null}

        {!loading && history && history.snapshots.length > 0 ? (
          <>
            <div className="history-toolbar">
              <label className="modal-field-label" htmlFor="history-snapshot-select">
                Capture comparée
              </label>
              <select
                id="history-snapshot-select"
                className="modal-select history-select"
                disabled={loading}
                value={selectedSnapshotId}
                onChange={(event) => {
                  const next = event.target.value;
                  setSelectedSnapshotId(next);
                  void loadHistory(next);
                }}
              >
                {history.snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {formatSnapshotDate(snapshot.createdAt)}
                    {snapshot.note ? ` — ${snapshot.note}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {history.selectedSnapshot ? (
              <p className="history-note">
                Ancien état capturé le <strong>{formatSnapshotDate(history.selectedSnapshot.createdAt)}</strong>
                {history.selectedSnapshot.note ? (
                  <>
                    {" "}
                    — <span>{history.selectedSnapshot.note}</span>
                  </>
                ) : null}
              </p>
            ) : null}

            <div className="history-view-tabs" role="tablist" aria-label="Type de comparaison">
              <button
                type="button"
                role="tab"
                aria-selected={viewTab === "restitution"}
                className={`history-view-tab${viewTab === "restitution" ? " is-active" : ""}`}
                onClick={() => setViewTab("restitution")}
              >
                {restitutionTabLabel}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewTab === "sources"}
                className={`history-view-tab${viewTab === "sources" ? " is-active" : ""}`}
                onClick={() => setViewTab("sources")}
              >
                Fichiers sources
              </button>
            </div>

            {viewTab === "restitution" ? (
              <>
                {domainBanner ? (
                  <div className={domainBanner.className} role="status">
                    {domainBanner.text}
                  </div>
                ) : null}
                {history.domain.rows.length > 0 ? (
                  <div className="history-domain-wrap">
                    <div className="history-domain-scroll">
                      <table className="history-domain-table">
                        <thead>
                          <tr>
                            <th>Section</th>
                            <th>Zone</th>
                            <th>Avant (capture)</th>
                            <th>Actuel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.domain.rows.map((row, i) => (
                            <tr className={`is-${row.kind}`} key={`${row.section}-${row.label}-${i}`}>
                              <td className="history-domain-section">{row.section}</td>
                              <td>{row.label}</td>
                              <td className="history-domain-old">{row.oldValue}</td>
                              <td className="history-domain-new">{row.newValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="history-file-tabs" role="tablist" aria-label="Fichiers comparés">
                  {history.files.map((file) => (
                    <button
                      type="button"
                      key={file.file}
                      className={`history-file-tab${file.file === selectedFile?.file ? " is-active" : ""}${file.changed ? " has-changes" : ""}`}
                      onClick={() => setActiveFile(file.file)}
                    >
                      <span>{file.file}</span>
                      <span>{changedRowCount(file)}</span>
                    </button>
                  ))}
                </div>

                {selectedFile ? (
                  <div className="history-diff-shell">
                    <div className="history-diff-heading">
                      <span>Ancien</span>
                      <span>Actuel</span>
                    </div>
                    <div className="history-diff-table" role="table" aria-label={`Diff ${selectedFile.file}`}>
                      {selectedFile.rows.map((row, i) => (
                        <div
                          className={`history-diff-row is-${row.kind}`}
                          role="row"
                          key={`${row.kind}-${row.oldLineNumber ?? "x"}-${row.newLineNumber ?? "x"}-${i}`}
                        >
                          <div className="history-line-number">{row.oldLineNumber ?? ""}</div>
                          <pre className="history-line history-line-old">{row.oldLine}</pre>
                          <div className="history-line-number">{row.newLineNumber ?? ""}</div>
                          <pre className="history-line history-line-new">{row.newLine}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : null}

        <div className="modal-footer history-footer">
          <button
            type="button"
            className="modal-button modal-button-secondary"
            disabled={loading}
            onClick={() => void loadHistory(selectedSnapshotId || undefined)}
          >
            Actualiser
          </button>
          <button type="button" className="modal-button modal-button-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
