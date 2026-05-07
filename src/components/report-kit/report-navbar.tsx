"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReportVersionComponentProps } from "@/schemas/report";
import { ReportHistoryModal } from "./report-history-modal";

type VersionTab = ReportVersionComponentProps["versions"][number];

export function ReportNavbar({
  activeVersion,
  versions,
}: Pick<ReportVersionComponentProps, "activeVersion" | "versions">) {
  const router = useRouter();
  const sortedVersions = useMemo(() => [...versions].sort((a, b) => a.n - b.n), [versions]);
  const maxVersion = sortedVersions.length === 0 ? -1 : Math.max(...sortedVersions.map((v) => v.n));
  const nextVersionLabel = maxVersion + 1;

  const [publishOpen, setPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createBaseVersion, setCreateBaseVersion] = useState(activeVersion);
  const [creatingVersion, setCreatingVersion] = useState(false);

  const [pendingDeleteVersion, setPendingDeleteVersion] = useState<number | null>(null);
  const [deletingVersion, setDeletingVersion] = useState<number | null>(null);

  const [versionError, setVersionError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!createOpen) return;
    setCreateBaseVersion(activeVersion);
  }, [createOpen, activeVersion]);

  const noteByVersion = useMemo(() => {
    const m = new Map<number, string | null>();
    for (const v of sortedVersions) m.set(v.n, v.change_note);
    return m;
  }, [sortedVersions]);

  const parentByVersion = useMemo(() => {
    const m = new Map<number, number | null>();
    for (const v of sortedVersions) m.set(v.n, v.parent);
    return m;
  }, [sortedVersions]);

  const isFrozen = useCallback((v: number) => sortedVersions.find((x) => x.n === v)?.frozen ?? false, [sortedVersions]);

  const canDelete = useCallback(
    (v: number) => v !== 0 && v !== activeVersion && !isFrozen(v),
    [activeVersion, isFrozen],
  );

  const versionTitle = useCallback(
    (v: number) => {
      const note = noteByVersion.get(v);
      const parent = parentByVersion.get(v);
      const parts = [`v${v}`];
      if (note) parts.push(note);
      if (typeof parent === "number" && parent !== v - 1) {
        parts.push(`forkée de v${parent}`);
      }
      if (v === 0) parts.push("baseline immuable");
      else if (isFrozen(v)) parts.push("figée");
      return parts.length === 1 ? parts[0] : `${parts[0]} — ${parts.slice(1).join(" · ")}`;
    },
    [isFrozen, noteByVersion, parentByVersion],
  );

  const versionOptionLabel = useCallback(
    (v: number) => {
      const note = noteByVersion.get(v);
      const suffix: string[] = [];
      if (note) suffix.push(note);
      if (isFrozen(v)) suffix.push("figée");
      if (v === activeVersion) suffix.push("version active");
      return suffix.length === 0 ? `v${v}` : `v${v} — ${suffix.join(" · ")}`;
    },
    [activeVersion, isFrozen, noteByVersion],
  );

  const openCreateModal = () => {
    setVersionError(null);
    setCreateOpen(true);
  };

  const cancelCreate = () => {
    if (creatingVersion) return;
    setCreateOpen(false);
    setVersionError(null);
  };

  const confirmCreate = async () => {
    setCreatingVersion(true);
    setVersionError(null);
    try {
      const res = await fetch("/api/versions/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: createBaseVersion,
          name: createName.trim() ? createName.trim() : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { version?: number; error?: string };
      if (!res.ok) {
        setVersionError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (typeof data.version !== "number") {
        setVersionError("Réponse invalide du serveur");
        return;
      }
      setCreateOpen(false);
      setCreateName("");
      router.push(`/v${data.version}`);
      router.refresh();
    } catch (e) {
      setVersionError(String(e && e instanceof Error ? e.message : e));
    } finally {
      setCreatingVersion(false);
    }
  };

  const cancelDelete = () => {
    if (deletingVersion !== null) return;
    setPendingDeleteVersion(null);
    setVersionError(null);
  };

  const confirmDelete = async () => {
    const v = pendingDeleteVersion;
    if (v === null || deletingVersion !== null) return;
    setDeletingVersion(v);
    setVersionError(null);
    try {
      const res = await fetch(`/api/versions/v${v}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      setPendingDeleteVersion(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      setVersionError(String(err && err instanceof Error ? err.message : err));
    } finally {
      setDeletingVersion(null);
    }
  };

  useEffect(() => {
    const open = publishOpen || historyOpen || createOpen || pendingDeleteVersion !== null;
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        if (publishOpen) setPublishOpen(false);
        else if (historyOpen) setHistoryOpen(false);
        else if (createOpen) cancelCreate();
        else if (pendingDeleteVersion !== null) cancelDelete();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [publishOpen, historyOpen, createOpen, pendingDeleteVersion]);

  return (
    <>
      <nav className="numeral-navbar print-hidden" aria-label="Versions du rapport">
        <div className="numeral-navbar-inner">
          <div className="navbar-tabs" role="tablist">
            {sortedVersions.map((tab: VersionTab) => {
              const v = tab.n;
              return (
                <div className={`version-tab${v === activeVersion ? " is-active" : ""}`} key={v} title={versionTitle(v)}>
                  <Link className="version-tab-label" href={`/v${v}`} role="tab" aria-selected={v === activeVersion ? "true" : "false"}>
                    <span>{`v${v}`}</span>
                    {isFrozen(v) ? (
                      <span className="version-tab-frozen" aria-label={v === 0 ? "baseline immuable" : "figée"}>
                        🔒
                      </span>
                    ) : null}
                  </Link>
                  {canDelete(v) ? (
                    <button
                      type="button"
                      className="version-tab-delete"
                      aria-label={`Supprimer la v${v}`}
                      title={`Supprimer la v${v}`}
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        setVersionError(null);
                        setPendingDeleteVersion(v);
                      }}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              );
            })}
            <button
              type="button"
              className="version-add"
              disabled={creatingVersion}
              title={creatingVersion ? "Création…" : "Nouvelle version"}
              aria-label="Nouvelle version"
              onClick={openCreateModal}
            >
              +
            </button>
          </div>
        <div className="navbar-actions">
          <button type="button" className="version-print-pdf version-history" onClick={() => setHistoryOpen(true)}>
            <span className="version-print-pdf-label">Historique</span>
          </button>
          <button
            type="button"
            className="version-print-pdf"
            disabled={pdfLoading}
            title="Génère un PDF avec Puppeteer (Chromium)."
            aria-label="Télécharger le rapport en PDF"
            onClick={async () => {
              setVersionError(null);
              setPdfLoading(true);
              try {
                const res = await fetch(`/api/report/pdf?vid=${activeVersion}`, { cache: "no-store" });
                if (!res.ok) {
                  const data = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
                  const msg =
                    data?.detail && data.detail.length ? `${data?.error ?? "Erreur"} — ${data.detail}` : data?.error ?? `HTTP ${res.status}`;
                  setVersionError(msg);
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `bande-de-cheffe-v${activeVersion}.pdf`;
                a.rel = "noopener";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                setVersionError(String(e && e instanceof Error ? e.message : e));
              } finally {
                setPdfLoading(false);
              }
            }}
          >
            <span className="version-print-pdf-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" rx="1" />
              </svg>
            </span>
            <span className="version-print-pdf-label">{pdfLoading ? "PDF…" : "Exporter PDF"}</span>
          </button>
          <button type="button" className="version-publish" onClick={() => setPublishOpen(true)}>
            Publier
          </button>
        </div>
        </div>
      </nav>

      {versionError && !publishOpen && !historyOpen && !createOpen && pendingDeleteVersion === null ? (
        <div className="navbar-error print-hidden" role="alert" onClick={() => setVersionError(null)}>
          {versionError}
        </div>
      ) : null}

      <ReportHistoryModal
        activeVersion={activeVersion}
        reportVersions={sortedVersions.map((tab) => tab.n)}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

      <div className="modal-backdrop print-hidden" role="presentation" style={{ display: publishOpen ? "flex" : "none" }} onClick={() => setPublishOpen(false)}>
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Publier la version client</h2>
            <button type="button" className="modal-close" aria-label="Fermer" onClick={() => setPublishOpen(false)}>
              ×
            </button>
          </div>
          <p className="modal-body">
            Cette action publiera <strong>{activeVersion == null ? "—" : `v${activeVersion}`}</strong> auprès du client. Le rapport publié sera figé et
            accessible via un lien partageable.
          </p>
          <p className="modal-body" style={{ fontStyle: "italic", color: "#94A3B8" }}>
            Fonctionnalité à venir — cette modale est un placeholder.
          </p>
          <div className="modal-footer">
            <button type="button" className="modal-button modal-button-secondary" onClick={() => setPublishOpen(false)}>
              Annuler
            </button>
            <button type="button" className="modal-button modal-button-primary" disabled>
              Publier
            </button>
          </div>
        </div>
      </div>

      <div className="modal-backdrop print-hidden" role="presentation" style={{ display: createOpen ? "flex" : "none" }} onClick={cancelCreate}>
        <div className="modal" role="dialog" aria-labelledby="create-version-title" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 id="create-version-title" className="modal-title">
              Nouvelle version <span>v{nextVersionLabel}</span>
            </h2>
            <button type="button" className="modal-close" aria-label="Fermer" onClick={cancelCreate}>
              ×
            </button>
          </div>
          <p className="modal-body">
            Crée une copie modifiable d&apos;une version existante. La nouvelle version reprend ses chiffres, son layout et ses narratifs — à toi ensuite
            de l&apos;éditer indépendamment.
          </p>
          <div className="modal-field">
            <label className="modal-field-label" htmlFor="create-name-input">
              Nom (optionnel)
            </label>
            <input
              id="create-name-input"
              type="text"
              className="modal-input"
              value={createName}
              disabled={creatingVersion}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={createBaseVersion != null ? `Variante de v${createBaseVersion}` : "Nom de la version"}
              maxLength={200}
            />
          </div>
          <div className="modal-field">
            <label className="modal-field-label" htmlFor="create-from-select">
              Basée sur
            </label>
            <select
              id="create-from-select"
              className="modal-select"
              disabled={creatingVersion}
              value={createBaseVersion}
              onChange={(e) => setCreateBaseVersion(Number(e.target.value))}
            >
              {[...sortedVersions]
                .sort((a, b) => b.n - a.n)
                .map((tab) => (
                  <option key={tab.n} value={tab.n}>
                    {versionOptionLabel(tab.n)}
                  </option>
                ))}
            </select>
          </div>
          {versionError && createOpen ? <p className="modal-error">{versionError}</p> : null}
          <div className="modal-footer">
            <button type="button" className="modal-button modal-button-secondary" disabled={creatingVersion} onClick={cancelCreate}>
              Annuler
            </button>
            <button
              type="button"
              className="modal-button modal-button-primary"
              disabled={creatingVersion || createBaseVersion === null}
              onClick={() => void confirmCreate()}
            >
              {!creatingVersion ? (
                <span>
                  Créer la <span>v{nextVersionLabel}</span>
                </span>
              ) : (
                <span>Création…</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="modal-backdrop print-hidden" role="presentation" style={{ display: pendingDeleteVersion !== null ? "flex" : "none" }} onClick={cancelDelete}>
        <div className="modal" role="dialog" aria-labelledby="confirm-delete-title" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="modal-row">
            <span className="modal-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id="confirm-delete-title" className="modal-title">
                Supprimer la <span>v{pendingDeleteVersion}</span> ?
              </h2>
              <p className="modal-body" style={{ marginTop: 6 }}>
                Cette action est définitive. Le contenu de la version (data, config, narratifs) sera retiré du dossier — l&apos;historique d&apos;audit côté serveur le
                garde, mais le rapport ne sera plus accessible depuis l&apos;app.
              </p>
            </div>
          </div>
          {versionError && pendingDeleteVersion !== null ? <p className="modal-error">{versionError}</p> : null}
          <div className="modal-footer">
            <button type="button" className="modal-button modal-button-secondary" disabled={deletingVersion !== null} onClick={cancelDelete}>
              Annuler
            </button>
            <button type="button" className="modal-button modal-button-danger" disabled={deletingVersion !== null} onClick={() => void confirmDelete()}>
              {deletingVersion === null ? (
                <span>
                  Supprimer la <span>v{pendingDeleteVersion}</span>
                </span>
              ) : (
                <span>Suppression…</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
