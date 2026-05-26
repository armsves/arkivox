"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { useCTokenActions } from "@/hooks/use-ctoken-actions";
import { useRecordVerifiedTransfer } from "@/hooks/use-record-verified-transfer";
import { getHandleRegistryAddress } from "@/lib/handle-registry";
import { CTOKEN_CONTRACTS } from "@/lib/ctoken-contracts";
import { ARBITRUM_SEPOLIA_EXPLORER, NOX_COMPUTE_ADDRESS } from "@/lib/nox";

function truncate(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function TokensPanel() {
  const { address } = useAccount();
  const {
    step,
    error,
    txHash,
    unwrapHandle,
    wrap,
    transfer,
    unwrapStart,
    unwrapFinalize,
    reset,
  } = useCTokenActions();

  const [wrapToken, setWrapToken] = useState<"USDC" | "RLC">("USDC");
  const [wrapAmount, setWrapAmount] = useState("");
  const [ctoken, setCtoken] = useState<"cUSDC" | "cRLC">("cUSDC");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [unwrapAmount, setUnwrapAmount] = useState("");
  const [unwrapTo, setUnwrapTo] = useState("");
  const [transferMemo, setTransferMemo] = useState("");
  const [addToLedger, setAddToLedger] = useState(true);

  const {
    appendToLedger,
    busy: ledgerBusy,
    error: ledgerError,
  } = useRecordVerifiedTransfer();

  const busy =
    ledgerBusy ||
    (step !== "idle" && step !== "done" && step !== "error" && step !== "finalize");
  const registry = getHandleRegistryAddress();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline-lg text-primary-container">Sepolia cTokens</h2>
        <p className="mt-2 font-body-md text-on-surface-variant">
          Wrap, confidential transfer, and unwrap on Arbitrum Sepolia. Amounts are encrypted
          via Nox and stored in the ERC-7984 contracts — then log references on Arkiv from
          the Record tab.
        </p>
      </div>

      <div className="space-y-2 border border-outline-variant bg-surface-container-low p-4 font-label-sm text-on-surface-variant normal-case">
        <p>
          NoxCompute:{" "}
          <a
            className="text-primary-container hover:underline"
            href={`${ARBITRUM_SEPOLIA_EXPLORER}/address/${NOX_COMPUTE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {truncate(NOX_COMPUTE_ADDRESS)}
          </a>
        </p>
        <p>
          cUSDC:{" "}
          <a
            className="text-primary-container hover:underline"
            href={`${ARBITRUM_SEPOLIA_EXPLORER}/address/${CTOKEN_CONTRACTS.cUSDC}`}
            target="_blank"
            rel="noreferrer"
          >
            {truncate(CTOKEN_CONTRACTS.cUSDC)}
          </a>
        </p>
        {registry ? (
          <p>
            DEK handle registry (Arkiv encryption keys):{" "}
            <a
              className="text-primary-container hover:underline"
              href={`${ARBITRUM_SEPOLIA_EXPLORER}/address/${registry}`}
              target="_blank"
              rel="noreferrer"
            >
              {truncate(registry)}
            </a>
          </p>
        ) : (
          <p className="text-error normal-case">
            Required for Encrypt / Record: run{" "}
            <code className="text-primary-container">npm run deploy:registry</code> and set
            NEXT_PUBLIC_HANDLE_REGISTRY.
          </p>
        )}
      </div>

      <section className="space-y-4 border border-outline-variant p-4">
        <h3 className="font-headline-md text-on-surface">Wrap (public → confidential)</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["USDC", "RLC"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setWrapToken(t)}
              className={`py-2 font-label-md ${
                wrapToken === t
                  ? "border border-primary-container text-primary-container"
                  : "border border-outline-variant text-on-surface-variant"
              }`}
            >
              {t} → c{t}
            </button>
          ))}
        </div>
        <input
          className="terminal-input w-full"
          placeholder="Amount"
          value={wrapAmount}
          onChange={(e) => setWrapAmount(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !wrapAmount}
          onClick={() => void wrap(wrapToken, wrapAmount)}
          className="w-full border border-primary-container py-3 font-label-md text-primary-container disabled:opacity-50"
        >
          {step === "approving" ? "Approve + wrap…" : "Wrap on Sepolia"}
        </button>
      </section>

      <section className="space-y-4 border border-outline-variant p-4">
        <h3 className="font-headline-md text-on-surface">Confidential transfer</h3>
        <p className="font-label-sm text-on-surface-variant normal-case">
          Nox encrypts the amount, then{" "}
          <code className="text-primary-container">confidentialTransfer</code> runs on the
          cToken contract. Enable the ledger option to list the transfer on Arkiv with a
          Sepolia verification link.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["cUSDC", "cRLC"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCtoken(t)}
              className={`py-2 font-label-md ${
                ctoken === t
                  ? "border border-primary-container text-primary-container"
                  : "border border-outline-variant text-on-surface-variant"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className="terminal-input w-full"
          placeholder="Recipient 0x…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          className="terminal-input w-full"
          placeholder="Amount"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
        />
        <input
          className="terminal-input w-full"
          placeholder="Ledger memo (optional)"
          value={transferMemo}
          onChange={(e) => setTransferMemo(e.target.value)}
        />
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={addToLedger}
            onChange={(e) => setAddToLedger(e.target.checked)}
          />
          <div className="h-5 w-5 border border-outline-variant bg-surface-container-lowest peer-checked:border-primary-container peer-checked:bg-primary-container" />
          <span className="font-label-md text-on-surface-variant normal-case">
            Add to encrypted ledger on Arkiv (Sepolia tx anchor)
          </span>
        </label>
        <button
          type="button"
          disabled={busy || !transferAmount || !isAddress(recipient || "0x")}
          onClick={async () => {
            const result = await transfer(ctoken, transferAmount, recipient);
            if (result && addToLedger) {
              await appendToLedger({
                token: ctoken,
                amount: transferAmount,
                counterparty: recipient as `0x${string}`,
                memo: transferMemo || undefined,
                noxTxHash: result.txHash,
                amountHandle: result.amountHandle,
              });
            }
          }}
          className="w-full bg-primary-container py-3 font-label-md text-on-primary disabled:opacity-50"
        >
          {step === "encrypting"
            ? "Nox encrypt…"
            : step === "submitting"
              ? "Signing transfer…"
              : "Transfer on Sepolia"}
        </button>
      </section>

      <section className="space-y-4 border border-outline-variant p-4">
        <h3 className="font-headline-md text-on-surface">Unwrap (2 steps)</h3>
        <input
          className="terminal-input w-full"
          placeholder={`Recipient (default: ${address ? truncate(address) : "you"})`}
          value={unwrapTo}
          onChange={(e) => setUnwrapTo(e.target.value)}
        />
        <input
          className="terminal-input w-full"
          placeholder="cToken amount to unwrap"
          value={unwrapAmount}
          onChange={(e) => setUnwrapAmount(e.target.value)}
        />
        <button
          type="button"
          disabled={busy || !unwrapAmount}
          onClick={() =>
            void unwrapStart(
              ctoken,
              unwrapAmount,
              unwrapTo && isAddress(unwrapTo) ? (unwrapTo as `0x${string}`) : undefined,
            )
          }
          className="w-full border border-secondary-fixed-dim py-3 font-label-md text-secondary-fixed-dim disabled:opacity-50"
        >
          {step === "encrypting" ? "Step 1…" : "1. Request unwrap"}
        </button>
        {unwrapHandle && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void unwrapFinalize(ctoken, unwrapHandle)}
            className="w-full bg-secondary-fixed-dim py-3 font-label-md text-on-surface disabled:opacity-50"
          >
            {step === "finalize" ? "Finalizing…" : "2. Finalize unwrap"}
          </button>
        )}
      </section>

      {txHash && (
        <p className="font-label-sm normal-case text-primary-container">
          Last tx:{" "}
          <a
            href={`${ARBITRUM_SEPOLIA_EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {truncate(txHash)}
          </a>
          {step === "done" && (
            <button
              type="button"
              onClick={reset}
              className="ml-3 text-on-surface-variant hover:text-on-surface"
            >
              Clear
            </button>
          )}
        </p>
      )}

      {(error || ledgerError) && (
        <p className="font-label-md text-error normal-case">{error ?? ledgerError}</p>
      )}
    </div>
  );
}
