"use client";

import { useConnectWallet } from "@/hooks/use-connect-wallet";

export function WalletConnectButton({
  className = "",
  label = "Connect wallet",
}: {
  className?: string;
  label?: string;
}) {
  const { connectWallet, isPending } = useConnectWallet();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => void connectWallet()}
      className={`glow-primary active-scale shrink-0 bg-primary-container px-4 py-2 font-label-md font-bold uppercase tracking-wide text-on-primary transition-all hover:brightness-110 disabled:opacity-50 ${className}`}
    >
      {isPending ? "Connecting…" : label}
    </button>
  );
}
