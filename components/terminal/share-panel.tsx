export function SharePanel({
  subjectLabel,
  auditorAddr,
  setAuditorAddr,
  shareStep,
  shareError,
  onShare,
  onCancel,
}: {
  subjectLabel: string;
  auditorAddr: string;
  setAuditorAddr: (s: string) => void;
  shareStep: string;
  shareError: string | null;
  onShare: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-6 border border-secondary-fixed-dim bg-surface-container-low p-4">
      <p className="font-label-md text-on-surface">
        Disclose to third party — {subjectLabel}
      </p>
      <p className="mt-1 font-label-sm text-on-surface-variant normal-case">
        Like the cToken demo: NoxCompute <code className="text-primary-container">addViewer</code> on
        the transfer amount handle, plus an encrypted grant row on Arkiv for the auditor.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className="terminal-input flex-1"
          placeholder="Auditor 0x address"
          value={auditorAddr}
          onChange={(e) => setAuditorAddr(e.target.value)}
        />
        <button
          type="button"
          disabled={shareStep === "nox" || shareStep === "arkiv"}
          onClick={onShare}
          className="active-scale border border-primary-container bg-primary-container/10 px-4 py-2 font-label-md text-primary-container disabled:opacity-50"
        >
          {shareStep === "nox"
            ? "Nox ACL…"
            : shareStep === "arkiv"
              ? "Arkiv…"
              : "Grant access"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-label-md text-on-surface-variant"
        >
          Cancel
        </button>
      </div>
      {shareError && (
        <p className="mt-2 font-label-sm text-error normal-case">{shareError}</p>
      )}
    </div>
  );
}
