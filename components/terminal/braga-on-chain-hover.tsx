"use client";

import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { BRAGA_EXPLORER } from "@/lib/arkiv";
import { ARKIV_SYSTEM_ADDRESS } from "@/lib/arkiv-encode";
import {
  arkivEncryptionKeyHandle,
  getHandleRegistryAddress,
} from "@/lib/handle-registry";
import { ARBITRUM_SEPOLIA_EXPLORER, NOX_COMPUTE_ADDRESS } from "@/lib/nox";
import type { SecretNoteView, TokenTransactionView } from "@/lib/types";
import { isConfidentialTxType } from "@/lib/arkiv";

function truncate(value: string, head = 10, tail = 8) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function formatTime(ms: number) {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

type Row = { label: string; value: string; href?: string; mono?: boolean };

function HoverPanel({ title, rows, footnote }: { title: string; rows: Row[]; footnote?: string }) {
  return (
    <div
      className="w-[min(100vw-2rem,22rem)] border border-primary-container/40 bg-surface-container p-3 shadow-lg"
      role="tooltip"
    >
      <p className="mb-2 font-label-md text-primary-container">{title}</p>
      <dl className="space-y-2 font-label-sm normal-case">
        {rows.map(({ label, value, href, mono }) => (
          <div key={label}>
            <dt className="text-on-surface-variant">{label}</dt>
            <dd className={`break-all text-on-surface ${mono ? "font-mono text-[11px]" : ""}`}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-container hover:underline"
                >
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {footnote && (
        <p className="mt-3 border-t border-outline-variant pt-2 font-label-sm leading-relaxed text-on-surface-variant normal-case">
          {footnote}
        </p>
      )}
    </div>
  );
}

export function BragaOnChainHover({
  children,
  panel,
  label = "On-chain details",
}: {
  children: ReactNode;
  panel: ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  const show = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    leaveTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  return (
    <span
      className="relative inline"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        className="cursor-help border-b border-dotted border-primary-container/60 text-inherit hover:border-primary-container hover:text-primary-container"
        aria-describedby={open ? tooltipId : undefined}
        aria-label={label}
        onClick={toggle}
      >
        {children}
      </button>
      {open && (
        <div
          id={tooltipId}
          className="absolute left-0 top-full z-[80] mt-1"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {panel}
        </div>
      )}
    </span>
  );
}

export function secretNoteOnChainPanel(note: SecretNoteView) {
  const registry = getHandleRegistryAddress();
  const dekHandle = arkivEncryptionKeyHandle(note.payload);
  const rows: Row[] = [
    {
      label: "Arkiv entity key",
      value: note.entityKey,
      href: `${BRAGA_EXPLORER}/entity/${note.entityKey}?tab=payload`,
      mono: true,
    },
    { label: "Owner", value: truncate(note.owner, 8, 6), mono: true },
    { label: "Created", value: formatTime(note.createdAt) },
    {
      label: "Nox DEK handle",
      value: truncate(dekHandle, 12, 10),
      href: `${ARBITRUM_SEPOLIA_EXPLORER}/address/${NOX_COMPUTE_ADDRESS}`,
      mono: true,
    },
    { label: "Wrap", value: note.payload.wrap },
    { label: "Ciphertext (on Braga)", value: truncate(note.payload.ciphertext, 16, 12), mono: true },
    { label: "IV", value: note.payload.iv, mono: true },
  ];

  if (registry) {
    rows.push({
      label: "Handle registry (Sepolia)",
      value: truncate(registry, 8, 6),
      href: `${ARBITRUM_SEPOLIA_EXPLORER}/address/${registry}`,
      mono: true,
    });
  }

  return (
    <HoverPanel
      title="Braga storage"
      rows={rows}
      footnote={
        "Title/label may appear in the JSON payload on Braga. Body text is only in ciphertext — use Reveal + Nox to read it."
      }
    />
  );
}

export function transactionOnChainPanel(tx: TokenTransactionView) {
  const isPublic = !isConfidentialTxType(tx.txType) || tx.payload.public || !!tx.amount;

  const rows: Row[] = [
    {
      label: "Arkiv entity key",
      value: tx.entityKey,
      href: `${BRAGA_EXPLORER}/entity/${tx.entityKey}?tab=payload`,
      mono: true,
    },
    { label: "Type", value: tx.txType },
    { label: "Token", value: tx.token },
    { label: "Owner", value: truncate(tx.owner, 8, 6), mono: true },
    { label: "Counterparty", value: truncate(tx.counterparty, 8, 6), mono: true },
    { label: "Created", value: formatTime(tx.createdAt) },
  ];

  if (tx.noxTxHash) {
    rows.push({
      label: "Sepolia tx (cToken / Nox)",
      value: truncate(tx.noxTxHash, 10, 8),
      href: `${ARBITRUM_SEPOLIA_EXPLORER}/tx/${tx.noxTxHash}`,
      mono: true,
    });
  }

  if (!isPublic) {
    rows.push(
      { label: "Wrap", value: tx.payload.wrap ?? "dek" },
      {
        label: tx.payload.wrap === "amount" ? "Amount handle (cToken)" : "DEK handle (Nox)",
        value: truncate(tx.payload.amountHandle, 12, 10),
        mono: true,
      },
    );
    if (tx.payload.dekHandle) {
      rows.push({
        label: "DEK handle (Arkiv AES key)",
        value: truncate(tx.payload.dekHandle, 12, 10),
        mono: true,
      });
    }
    if (tx.payload.ciphertext) {
      rows.push({
        label: "Ciphertext",
        value: truncate(tx.payload.ciphertext, 16, 12),
        mono: true,
      });
    }
  } else if (tx.amount) {
    rows.push({ label: "Amount (public ref)", value: `${tx.amount} ${tx.token}` });
  }

  rows.push({
    label: "Arkiv system contract",
    value: truncate(ARKIV_SYSTEM_ADDRESS, 8, 6),
    href: `${BRAGA_EXPLORER}/address/${ARKIV_SYSTEM_ADDRESS}`,
    mono: true,
  });

  return (
    <HoverPanel
      title="Braga ledger entry"
      rows={rows}
      footnote={
        isPublic
          ? "Public wrap/unwrap: amount is stored in plaintext on Braga."
          : "Confidential row: amount/memo are encrypted on Braga; handles live on Sepolia (Nox / cToken)."
      }
    />
  );
}
