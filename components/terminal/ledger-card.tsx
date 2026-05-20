"use client";

import type { AuditorDisclosureView, TokenTransactionView } from "@/lib/types";
import type { DecryptedTransaction } from "@/lib/types";
import { isConfidentialTxType, type TxType } from "@/lib/arkiv";
import { PrivacyBadge } from "./privacy-badge";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function truncateKey(key: string) {
  return `${key.slice(0, 10)}…${key.slice(-8)}`;
}

function txLabel(type: TxType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function LedgerCard({
  tx,
  decrypted,
  shared,
  busyReveal,
  busyRevokeKey,
  onReveal,
  onShare,
  onRevoke,
}: {
  tx: TokenTransactionView;
  decrypted?: DecryptedTransaction;
  shared: AuditorDisclosureView[];
  busyReveal: boolean;
  busyRevokeKey: string | null;
  onReveal: () => void;
  onShare: () => void;
  onRevoke: (d: AuditorDisclosureView) => void;
}) {
  const isPublicTx =
    !isConfidentialTxType(tx.txType) || tx.payload.public || !!tx.amount;
  const show =
    decrypted ??
    (isPublicTx
      ? {
          txType: tx.txType,
          token: tx.token,
          counterparty: tx.counterparty,
        }
      : null);
  const isDecrypted = !!decrypted;
  const displayAmount = decrypted?.amount ?? (isPublicTx ? tx.amount : undefined);
  const badgeState = isPublicTx
    ? "public"
    : isDecrypted
      ? "decrypted"
      : "encrypted";
  const canShare = isConfidentialTxType(tx.txType) && tx.isPrivate;

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
              {show ? txLabel(show.txType) : "••••••"}
            </span>
            <PrivacyBadge state={badgeState} />
          </div>
          <div className="font-label-md text-on-surface-variant">
            TOKEN:{" "}
            <span className="text-on-surface">{show ? show.token : "••••"}</span>
          </div>
          {show && (
            <div className="mt-1 font-label-sm text-on-surface-variant normal-case">
              CP: {truncate(show.counterparty)}
            </div>
          )}
        </div>
        <div className="text-right">
          {displayAmount ? (
            <>
              <div className="font-headline-md text-secondary-fixed-dim">
                {displayAmount}
              </div>
              <div className="font-label-sm text-on-surface-variant">Amount</div>
            </>
          ) : (
            <>
              <div className="font-label-sm text-on-surface-variant">TXID_HASH</div>
              <div className="font-label-md text-on-surface">
                {truncateKey(tx.entityKey)}
              </div>
            </>
          )}
        </div>
      </div>

      {(decrypted?.memo || (isPublicTx && tx.memo)) && (
        <div className="border-l-2 border-secondary-fixed-dim bg-surface-container-lowest p-3">
          <div className="mb-1 font-label-sm text-secondary-fixed-dim">Memo</div>
          <p className="font-body-md italic text-on-surface">
            &quot;{decrypted?.memo ?? tx.memo}&quot;
          </p>
        </div>
      )}

      <div
        className={`grid gap-4 border-t border-outline-variant pt-4 ${
          canShare ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {!isPublicTx && (
          <button
            type="button"
            disabled={busyReveal}
            onClick={onReveal}
            className="active-scale w-full border border-primary-container py-2 font-label-md text-primary-container transition-all hover:bg-primary-container/10 disabled:opacity-50"
          >
            {busyReveal ? "…" : "Reveal"}
          </button>
        )}
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            className="active-scale w-full border border-outline py-2 font-label-md text-on-surface transition-all hover:bg-surface-variant"
          >
            Share
          </button>
        )}
      </div>

      {shared.length > 0 && (
        <div className="border-t border-outline-variant pt-4">
          <p className="mb-2 font-label-sm text-on-surface-variant">
            Shared with ({shared.length})
          </p>
          <ul className="space-y-2">
            {shared.map((d) => (
              <li
                key={d.entityKey}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="font-label-md text-on-surface-variant">
                  {d.isPrivate
                    ? `hash ${truncate(d.granteeHash ?? d.entityKey)}`
                    : truncate(d.grantee)}
                </span>
                <button
                  type="button"
                  disabled={busyRevokeKey === d.entityKey}
                  onClick={() => onRevoke(d)}
                  className="active-scale border border-error px-2 py-1 font-label-sm text-error hover:bg-error/10 disabled:opacity-50"
                >
                  {busyRevokeKey === d.entityKey ? "Revoking…" : "Revoke Access"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
