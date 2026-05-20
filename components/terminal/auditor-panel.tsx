"use client";

import type { AuditorDisclosureView, DecryptedDisclosure, DecryptedTransaction } from "@/lib/types";
import type { TxType } from "@/lib/arkiv";
import { PrivacyBadge } from "./privacy-badge";
import { IconSecurity } from "./icons";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function truncateKey(key: string) {
  return `${key.slice(0, 10)}…${key.slice(-8)}`;
}

function txLabel(type: TxType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function AuditorPanel({
  disclosures,
  isLoading,
  disclosureMeta,
  revealed,
  busyKey,
  auditorBusyKey,
  decryptError,
  auditorError,
  onReveal,
}: {
  disclosures: AuditorDisclosureView[];
  isLoading: boolean;
  disclosureMeta: Record<string, DecryptedDisclosure>;
  revealed: Record<string, DecryptedTransaction>;
  busyKey: string | null;
  auditorBusyKey: string | null;
  decryptError: string | null;
  auditorError: string | null;
  onReveal: (d: AuditorDisclosureView) => void;
}) {
  if (isLoading) {
    return <p className="font-body-md text-on-surface-variant">Loading disclosures…</p>;
  }

  if (disclosures.length === 0) {
    return (
      <p className="font-body-md text-on-surface-variant">
        Nothing shared with your wallet yet. Ask a ledger owner to disclose a transaction to
        your address.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {disclosures.map((d) => {
        const meta = disclosureMeta[d.entityKey];
        const show = meta ?? (d.isPrivate ? null : d);
        const dec = revealed[d.entityKey];
        const busy = busyKey === d.entityKey || auditorBusyKey === d.entityKey;

        return (
          <article key={d.entityKey} className="space-y-4">
            <section className="relative overflow-hidden border border-outline-variant bg-surface-container p-6">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <IconSecurity className="h-24 w-24" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse bg-primary-container shadow-[0_0_8px_rgba(0,255,148,0.6)]" />
                  <span className="font-label-sm text-primary-container tracking-tighter">
                    Active Disclosure Session
                  </span>
                </div>
                <div>
                  <p className="mb-1 font-label-md uppercase text-on-surface-variant">
                    Disclosure grant
                  </p>
                  <h2 className="font-headline-lg break-all text-on-surface">
                    {show?.auditorLabel ?? d.auditorLabel}
                  </h2>
                </div>
                <div className="inline-flex items-center border border-secondary-fixed-dim bg-surface-container-highest px-3 py-1 glow-cyber-gold">
                  <span className="font-label-sm text-secondary-fixed-dim">
                    Validated by iExec Nox TEE
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between">
                <h3 className="font-label-md uppercase tracking-widest text-on-surface-variant">
                  Shared Evidence
                </h3>
                <span className="font-label-sm text-outline">
                  TXID: {truncateKey(d.entityKey)}
                </span>
              </div>

              <div className="divide-y divide-outline-variant border border-outline-variant bg-surface-container-low">
                <div className="flex flex-col gap-1 p-4">
                  <span className="font-label-sm uppercase text-outline">Action Type</span>
                  {show ? (
                    <span className="font-headline-md text-on-surface">
                      {txLabel(show.txType)}
                    </span>
                  ) : (
                    <PrivacyBadge state="encrypted" />
                  )}
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <span className="font-label-sm uppercase text-outline">
                    Asset & Volume
                  </span>
                  {dec ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-lg text-primary-container">
                        {dec.amount}
                      </span>
                      <span className="font-headline-md">{dec.token}</span>
                    </div>
                  ) : (
                    <span className="font-headline-md text-on-surface-variant">••••••</span>
                  )}
                </div>
                {show && (
                  <div className="flex flex-col gap-1 p-4">
                    <span className="font-label-sm uppercase text-outline">
                      Counterparty
                    </span>
                    <p className="font-label-md text-on-surface">
                      {truncate(show.counterparty)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <button
              type="button"
              disabled={busy}
              onClick={() => onReveal(d)}
              className="active-scale flex w-full items-center justify-center gap-2 bg-primary-container py-4 font-headline-md font-bold uppercase text-on-primary disabled:opacity-50"
            >
              {busy ? "Decrypting…" : "Reveal Amount"}
            </button>

            {dec?.memo && (
              <p className="font-body-md text-on-surface-variant">
                Memo: <span className="text-on-surface">{dec.memo}</span>
              </p>
            )}
          </article>
        );
      })}

      {decryptError && (
        <p className="font-label-md text-error normal-case">{decryptError}</p>
      )}
      {auditorError && (
        <p className="font-label-md text-error normal-case">{auditorError}</p>
      )}
    </div>
  );
}
