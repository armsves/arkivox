"use client";

import { useEffect } from "react";
import { FaucetGuide } from "./faucet-guide";

export function FaucetsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faucets-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Close faucets"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col border border-outline-variant bg-surface-container shadow-lg sm:mx-4">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
          <h2 id="faucets-modal-title" className="font-headline-md text-primary-container">
            Testnet faucets
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-label-md text-on-surface-variant hover:text-on-surface"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">
          <FaucetGuide />
        </div>
      </div>
    </div>
  );
}
