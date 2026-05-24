"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { TX_TYPES, isConfidentialTxType, type TxType } from "@/lib/arkiv";
import {
  defaultCounterpartyForTx,
  tokensForTxType,
} from "@/lib/ctoken-contracts";
import { SUPPORTED_TOKENS } from "@/lib/tokens";
import { IconSecurity } from "./icons";

export function RecordForm({
  txType,
  setTxType,
  token,
  setToken,
  counterparty,
  setCounterparty,
  amount,
  setAmount,
  memo,
  setMemo,
  noxTxHash,
  setNoxTxHash,
  amountHandle,
  setAmountHandle,
  onChainFirst,
  setOnChainFirst,
  recordStep,
  recordError,
  onSubmit,
}: {
  txType: TxType;
  setTxType: (t: TxType) => void;
  token: string;
  setToken: (t: string) => void;
  counterparty: string;
  setCounterparty: (s: string) => void;
  amount: string;
  setAmount: (s: string) => void;
  memo: string;
  setMemo: (s: string) => void;
  noxTxHash: string;
  setNoxTxHash: (s: string) => void;
  amountHandle: string;
  setAmountHandle: (s: string) => void;
  onChainFirst: boolean;
  setOnChainFirst: (v: boolean) => void;
  recordStep: string;
  recordError: string | null;
  onSubmit: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(!!amountHandle);
  const confidential = isConfidentialTxType(txType);
  const tokenOptions = SUPPORTED_TOKENS.filter((t) =>
    tokensForTxType(txType).includes(t.symbol),
  );

  const handleTxTypeChange = (next: TxType) => {
    setTxType(next);
    if (!isConfidentialTxType(next)) {
      setShowAdvanced(false);
      setAmountHandle("");
    }
    const allowed = tokensForTxType(next);
    const nextToken = allowed.includes(token) ? token : (allowed[0] ?? "cUSDC");
    if (!allowed.includes(token)) {
      setToken(nextToken);
    }
    const cp = defaultCounterpartyForTx(next, nextToken);
    if (cp) setCounterparty(cp);
  };

  const busy =
    recordStep === "sepolia" ||
    recordStep === "sepolia-registry" ||
    recordStep === "nox" ||
    recordStep === "arkiv";

  const canSubmit =
    amount &&
    counterparty &&
    isAddress(counterparty) &&
    !busy;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-2 opacity-50">
        <div className="h-1 w-1 bg-primary-container" />
        <span className="font-label-sm tracking-tighter">
          {confidential ? "New Cryptographic Entry" : "Public On-Chain Reference"}
        </span>
        <div className="h-px flex-grow bg-outline-variant" />
      </div>

      <div className="space-y-5 border border-outline-variant bg-surface-container p-5">
        <div className="space-y-1.5">
          <label className="font-label-md block text-on-surface-variant">
            TRANSACTION_TYPE
          </label>
          <select
            className="terminal-input cursor-pointer appearance-none"
            value={txType}
            onChange={(e) => handleTxTypeChange(e.target.value as TxType)}
          >
            {TX_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {!confidential && (
          <p className="font-label-sm leading-relaxed text-on-surface-variant normal-case">
            Wrap and unwrap happen on public cToken contracts (Arbitrum Sepolia). This
            form logs the on-chain tx on Arkiv for your ledger — amounts are not
            encrypted.
          </p>
        )}

        <div className="space-y-1.5">
          <label className="font-label-md block text-on-surface-variant">
            ASSET_IDENTIFIER
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tokenOptions.map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => {
                  setToken(t.symbol);
                  const cp = defaultCounterpartyForTx(txType, t.symbol);
                  if (cp) setCounterparty(cp);
                }}
                className={`py-3 font-label-md transition-all ${
                  token === t.symbol
                    ? "border border-primary-container bg-primary-container/10 text-primary-container"
                    : "border border-outline-variant text-on-surface-variant hover:border-on-surface-variant"
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-label-md block text-on-surface-variant">
            {confidential ? "COUNTERPARTY_ADDRESS" : "TOKEN_CONTRACT"}
          </label>
          <input
            className="terminal-input"
            placeholder="0x..."
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-label-md block text-on-surface-variant">
            AMOUNT_VALUE
          </label>
          <div className="relative">
            <input
              className="terminal-input pr-16"
              placeholder="0.00"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-label-sm text-on-surface-variant">
              {token}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-label-md block text-on-surface-variant">
            METADATA_MEMO
          </label>
          <textarea
            className="terminal-input resize-none"
            placeholder={confidential ? "Private internal note..." : "Optional note..."}
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {confidential ? (
          <>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={onChainFirst}
                onChange={(e) => setOnChainFirst(e.target.checked)}
              />
              <div className="h-5 w-5 border border-outline-variant bg-surface-container-lowest peer-checked:border-primary-container peer-checked:bg-primary-container" />
              <span className="font-label-md text-on-surface-variant normal-case">
                Run cToken confidentialTransfer on Sepolia first (wallet signs)
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
              <div className="h-5 w-5 border border-outline-variant bg-surface-container-lowest peer-checked:border-secondary-fixed-dim peer-checked:bg-secondary-fixed-dim" />
              <span className="font-label-md text-on-surface-variant normal-case">
                Advanced: paste existing on-chain handle
              </span>
            </label>

            {showAdvanced && (
              <div className="space-y-1.5">
                <label className="font-label-md block uppercase text-secondary-fixed-dim">
                  Nox_Amount_Handle
                </label>
                <input
                  className="terminal-input terminal-input-nox border-secondary-fixed-dim text-secondary-fixed-dim"
                  placeholder="0x… 32-byte handle"
                  value={amountHandle}
                  onChange={(e) => setAmountHandle(e.target.value)}
                />
                <input
                  className="terminal-input mt-2"
                  placeholder="Optional Arbiscan tx hash"
                  value={noxTxHash}
                  onChange={(e) => setNoxTxHash(e.target.value)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-1.5">
            <label className="font-label-md block text-on-surface-variant">
              ARBISCAN_TX_HASH
            </label>
            <input
              className="terminal-input"
              placeholder="0x… public wrap/unwrap tx"
              value={noxTxHash}
              onChange={(e) => setNoxTxHash(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="glow-primary active-scale mt-2 w-full bg-primary-container py-4 font-label-md font-bold uppercase tracking-widest text-on-primary-container transition-all disabled:opacity-50"
        >
          {recordStep === "sepolia"
            ? "Signing transfer (Sepolia)…"
            : recordStep === "sepolia-registry"
              ? "Storing encryption key handle (Sepolia)…"
              : recordStep === "nox"
                ? "Encrypting ledger (Nox)…"
                : recordStep === "arkiv"
                  ? "Writing (Arkiv)…"
                : confidential
                  ? onChainFirst
                    ? "Transfer on Sepolia + log on Arkiv"
                    : "Encrypt & log on Arkiv"
                  : "Log on Arkiv"}
        </button>
      </div>

      <div className="flex gap-3 border border-outline-variant bg-surface-container-low p-4">
        <span className="text-secondary-fixed-dim">
          <IconSecurity />
        </span>
        <p className="font-label-sm leading-relaxed text-on-surface-variant normal-case">
          {confidential ? (
            <>
              Flow: cToken transfer on Sepolia (amount handle on contract) → Nox wraps
              the AES key → your wallet stores that key handle in{" "}
              <code className="text-primary-container">ArkivoxHandleRegistry</code> on
              Sepolia → Arkiv Braga stores ciphertext. Use the Tokens tab for wrap/unwrap.
            </>
          ) : (
            <>
              This entry references a public wrap or unwrap on Arbitrum Sepolia. The
              amount is stored in plaintext on Arkiv — selective disclosure is only
              for confidential transfers.
            </>
          )}
        </p>
      </div>

      {recordError && (
        <p className="font-label-md text-error normal-case">{recordError}</p>
      )}
    </div>
  );
}
