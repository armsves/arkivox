import type { EncryptStep } from "@/hooks/use-record-secret-note";

export function EncryptForm({
  title,
  setTitle,
  body,
  setBody,
  label,
  setLabel,
  encryptStep,
  encryptError,
  onSubmit,
}: {
  title: string;
  setTitle: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  label: string;
  setLabel: (s: string) => void;
  encryptStep: EncryptStep;
  encryptError: string | null;
  onSubmit: () => void;
}) {
  const busy = encryptStep === "nox" || encryptStep === "arkiv";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline-lg text-primary-container">Encrypt &amp; share</h2>
        <p className="mt-2 font-body-md text-on-surface-variant">
          Store arbitrary text on Arkiv with AES-256-GCM. The DEK is wrapped via iExec Nox on
          Arbitrum Sepolia. Share read access with any wallet like confidential transfers.
        </p>
      </div>

      <div className="space-y-4 border border-outline-variant bg-surface-container-low p-4">
        <label className="block space-y-1">
          <span className="font-label-md text-on-surface-variant">Title</span>
          <input
            className="terminal-input w-full"
            placeholder="e.g. Meeting notes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="font-label-md text-on-surface-variant">Label (optional)</span>
          <input
            className="terminal-input w-full"
            placeholder="e.g. Q2 planning"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="font-label-md text-on-surface-variant">Secret text</span>
          <textarea
            className="terminal-input min-h-[140px] w-full resize-y"
            placeholder="Paste or type the message to encrypt…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={busy || !body.trim()}
          onClick={onSubmit}
          className="active-scale w-full border border-primary-container bg-primary-container py-3 font-headline-md text-on-primary disabled:opacity-50"
        >
          {encryptStep === "nox"
            ? "Nox encrypt…"
            : encryptStep === "arkiv"
              ? "Publishing to Arkiv…"
              : encryptStep === "done"
                ? "Encrypted"
                : "Encrypt on Arkiv"}
        </button>
        {encryptError && (
          <p className="font-label-sm text-error normal-case">{encryptError}</p>
        )}
      </div>
    </div>
  );
}
