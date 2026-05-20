"use client";

import { useConnectWallet } from "@/hooks/use-connect-wallet";
import { LandingPage } from "./landing-page";
import { WalletConnectButton } from "./wallet-connect-button";

function ConnectPanel() {
  const { error } = useConnectWallet();

  return (
    <div className="space-y-4">
      <WalletConnectButton className="w-full py-4 text-base" label="Connect wallet" />
      {error && <p className="font-label-md text-error normal-case">{error}</p>}
    </div>
  );
}

export function ConnectScreen() {
  return <LandingPage connectSlot={<ConnectPanel />} />;
}

/** Same content for connected users (About tab) — no connect CTA in hero. */
export function AboutPage() {
  return <LandingPage />;
}
