"use client";

import { useCallback, useState } from "react";
import { useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import { isAddress } from "viem";
import { bragaChain } from "@/lib/chains";
import type { SecretNoteView } from "@/lib/types";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import { wagmiConfig } from "@/lib/wagmi";
import { getWalletClient } from "@wagmi/core";
import { shareSecretNoteWithAuditor } from "@/lib/secret-note-operations";
import { getSessionDek } from "@/lib/session-dek-store";
import { setRevokeContext } from "@/lib/session-revoke-store";

export type ShareNoteStep = "idle" | "nox" | "arkiv" | "done" | "error";

export function useShareSecretNote() {
  const { switchChainAsync } = useSwitchChain();
  const [step, setStep] = useState<ShareNoteStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const share = useCallback(
    async (
      note: SecretNoteView,
      recipientAddress: string,
      recipientLabel?: string,
    ) => {
      if (!isAddress(recipientAddress)) {
        setError("Invalid recipient address");
        return false;
      }
      const recipient = recipientAddress as `0x${string}`;
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

        const result = await shareSecretNoteWithAuditor(
          ownerViem,
          ownerArkiv,
          handleClient,
          note,
          recipient,
          {
            auditorLabel: recipientLabel ?? "Recipient",
            sessionDek: getSessionDek(note.entityKey),
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
