"use client";

import type { AuditorDisclosureView, DecryptedSecretNote, SecretNoteView } from "@/lib/types";
import { PrivacyBadge } from "./privacy-badge";
import { IconLock, IconLockOpen } from "./icons";

function truncateKey(key: string) {
  return `${key.slice(0, 10)}…${key.slice(-8)}`;
}

export function SecretNoteCard({
  note,
  decrypted,
  shared,
  busyReveal,
  busyRevokeKey,
  onReveal,
  onShare,
  onRevoke,
}: {
  note: SecretNoteView;
  decrypted?: DecryptedSecretNote;
  shared: AuditorDisclosureView[];
  busyReveal: boolean;
  busyRevokeKey: string | null;
  onReveal: () => void;
  onShare: () => void;
  onRevoke: (d: AuditorDisclosureView) => void;
}) {
  const isDecrypted = !!decrypted;

  return (
    <div
      className={`flex flex-col gap-4 border border-outline-variant bg-surface-card p-4 ${
        isDecrypted ? "glow-cyber-gold border-secondary-fixed-dim" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-headline-md text-on-surface">
              {decrypted?.title ?? note.title}
            </span>
            <PrivacyBadge state={isDecrypted ? "decrypted" : "encrypted"} />
          </div>
          {note.label && (
            <div className="font-label-md text-on-surface-variant">
              LABEL: <span className="text-on-surface">{note.label}</span>
            </div>
          )}
          <div className="mt-1 font-label-sm text-on-surface-variant normal-case">
            KEY: {truncateKey(note.entityKey)}
          </div>
        </div>
        <span className="text-primary-container">
          {isDecrypted ? <IconLockOpen className="h-5 w-5" /> : <IconLock className="h-5 w-5" />}
        </span>
      </div>

      {isDecrypted ? (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words border border-outline-variant bg-surface-container p-3 font-body-md text-on-surface normal-case">
          {decrypted.body}
        </pre>
      ) : (
        <p className="font-body-md text-on-surface-variant">••••••••••••</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busyReveal}
          onClick={onReveal}
          className="active-scale border border-primary-container bg-primary-container/10 px-4 py-2 font-label-md text-primary-container disabled:opacity-50"
        >
          {busyReveal ? "Decrypting…" : isDecrypted ? "Re-decrypt" : "Reveal"}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="active-scale border border-secondary-fixed-dim px-4 py-2 font-label-md text-secondary-fixed-dim"
        >
          Share
        </button>
      </div>

      {shared.length > 0 && (
        <div className="border-t border-outline-variant pt-3">
          <p className="mb-2 font-label-sm text-on-surface-variant">Shared with</p>
          <ul className="space-y-2">
            {shared.map((d) => (
              <li
                key={d.entityKey}
                className="flex flex-wrap items-center justify-between gap-2 font-label-sm normal-case"
              >
                <span className="text-on-surface">{d.auditorLabel}</span>
                <button
                  type="button"
                  disabled={busyRevokeKey === d.entityKey}
                  onClick={() => onRevoke(d)}
                  className="text-error hover:underline disabled:opacity-50"
                >
                  {busyRevokeKey === d.entityKey ? "Revoking…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
