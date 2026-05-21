"use client";

import { useCallback, useState } from "react";
import { useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import { isAddress } from "viem";
import { bragaChain } from "@/lib/chains";
import type { TokenTransactionView } from "@/lib/types";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import { wagmiConfig } from "@/lib/wagmi";
import { getWalletClient } from "@wagmi/core";
import { shareTransactionWithAuditor } from "@/lib/ledger-operations";
import { getSessionDek } from "@/lib/session-dek-store";
import { setRevokeContext } from "@/lib/session-revoke-store";

export type ShareStep = "idle" | "nox" | "arkiv" | "done" | "error";

export function useShareDisclosure() {
  const { switchChainAsync } = useSwitchChain();
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
        const handleClient = await getHandleClientForNox();

        setStep("arkiv");
        await switchChainAsync({ chainId: bragaChain.id });
        const ownerArkiv = await getArkivWalletClientForBraga();

        const result = await shareTransactionWithAuditor(
          ownerViem,
          ownerArkiv,
          handleClient,
          tx,
          auditor,
          {
            auditorLabel: auditorLabel ?? "Third-party auditor",
            sessionDek: getSessionDek(tx.entityKey),
          },
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
    [switchChainAsync],
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
  }, []);

  return { share, step, error, reset };
}
