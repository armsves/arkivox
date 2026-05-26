"use client";

import { useCallback, useState } from "react";
import { usePublicClient, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import { isAddress } from "viem";
import { assertBragaFunded } from "@/lib/braga-preflight";
import type { TokenTransactionView } from "@/lib/types";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import { wagmiConfig } from "@/lib/wagmi";
import { getWalletClient } from "@wagmi/core";
import { shareTransactionWithAuditor } from "@/lib/ledger-operations";
import { setRevokeContext } from "@/lib/session-revoke-store";

export type ShareStep = "idle" | "nox" | "arkiv" | "done" | "error";

export function useShareDisclosure() {
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });
  const [step, setStep] = useState<ShareStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(
    async (
      tx: TokenTransactionView,
      auditorAddress: string,
      auditorLabel?: string,
    ) => {
      if (!isAddress(auditorAddress)) {
        setError("Invalid auditor address");
        return false;
      }
      const auditor = auditorAddress as `0x${string}`;
      try {
        setError(null);
        setStep("nox");
        await switchChainAsync({ chainId: arbitrumSepolia.id });
        const ownerViem = await getWalletClient(wagmiConfig, {
          chainId: arbitrumSepolia.id,
        });
        if (!ownerViem) throw new Error("Connect wallet on Arbitrum Sepolia");
        if (!publicClient) throw new Error("Arbitrum Sepolia RPC unavailable");
        const handleClient = await getHandleClientForNox();

        const ownerArkiv = await getArkivWalletClientForBraga();
        const bragaOwner = ownerArkiv.account?.address;
        if (!bragaOwner) throw new Error("Connect wallet on Arkiv Braga");
        await assertBragaFunded(bragaOwner);

        const result = await shareTransactionWithAuditor(
          ownerViem,
          ownerArkiv,
          handleClient,
          publicClient,
          tx,
          auditor,
          { auditorLabel: auditorLabel ?? "Third-party auditor" },
        );
        setRevokeContext(result.disclosureEntityKey, result.revokeContext);
        setStep("done");
        return true;
      } catch (e) {
        setStep("error");
        setError(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [publicClient, switchChainAsync],
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
  }, []);

  return { share, step, error, reset };
}
