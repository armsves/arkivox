import type { EncryptStep } from "@/hooks/use-record-secret-note";
import { getHandleRegistryAddress } from "@/lib/handle-registry";
import { ArkivPublishHint } from "./arkiv-publish-hint";

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
  const registry = getHandleRegistryAddress();
  const busy =
    encryptStep === "nox" || encryptStep === "sepolia" || encryptStep === "arkiv";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline-lg text-primary-container">Encrypt &amp; share</h2>
        <p className="mt-2 font-body-md text-on-surface-variant">
          Your text is encrypted in the browser, the AES key is wrapped via Nox, then you sign on
          Sepolia to store that key handle in ArkivoxHandleRegistry, then Arkiv Braga for the
          ciphertext. You need Sepolia ETH and Braga GLM (Faucets below).
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 font-label-sm text-on-surface-variant normal-case">
          <li>Stay on Arbitrum Sepolia for Nox encrypt + HandleRegistry commit.</li>
          {!registry && (
            <li className="text-error">
              Deploy ArkivoxHandleRegistry and set NEXT_PUBLIC_HANDLE_REGISTRY (npm run
              deploy:registry).
            </li>
          )}
          {registry && (
            <li>
              Sign Sepolia tx to store the encryption key handle in the registry contract.
            </li>
          )}
          <li>
            Approve the Arkiv Braga transaction — storage is paid in GLM as gas (tx value is
            0).
          </li>
          <li>
            If you see “replacement underpriced” or “pending nonce”, cancel the stuck Braga
            tx in your wallet, fund GLM from the faucet, then retry.
          </li>
        </ol>
      </div>

      <ArkivPublishHint />

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
            : encryptStep === "sepolia"
              ? "Committing handle (Sepolia)…"
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
