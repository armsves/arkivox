"use client";

import { useCallback, useState } from "react";
import { usePublicClient, useSwitchChain } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { arbitrumSepolia } from "viem/chains";
import { bragaChain } from "@/lib/chains";
import { wagmiConfig } from "@/lib/wagmi";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import {
  prepareSecretNoteEncryption,
  publishSecretNote,
} from "@/lib/secret-note-operations";
import { setSessionDek } from "@/lib/session-dek-store";
import { formatArkivError } from "@/lib/arkiv-errors";
import { assertBragaFunded } from "@/lib/braga-preflight";
import { commitArkivEncryptionKeyHandle } from "@/lib/handle-registry";

export type EncryptStep = "idle" | "nox" | "sepolia" | "arkiv" | "done" | "error";

export function useRecordSecretNote() {
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });
  const [step, setStep] = useState<EncryptStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const record = useCallback(
    async (input: { title: string; body: string; label?: string }) => {
      setError(null);
      try {
        setStep("nox");
        await switchChainAsync({ chainId: arbitrumSepolia.id });
        const ownerViem = await getWalletClient(wagmiConfig, {
          chainId: arbitrumSepolia.id,
        });
        if (!ownerViem) throw new Error("Connect wallet on Arbitrum Sepolia");
        const ownerHandle = await getHandleClientForNox();
        // Nox gateway only accepts Arbitrum Sepolia — encrypt before switching chains.
        const prepared = await prepareSecretNoteEncryption(ownerHandle, input);

        setStep("sepolia");
        if (!publicClient) throw new Error("Arbitrum Sepolia RPC unavailable");
        await commitArkivEncryptionKeyHandle(
          ownerViem,
          publicClient,
          prepared.outerPayload,
          "encrypted_note",
        );

        setStep("arkiv");
        await switchChainAsync({ chainId: bragaChain.id });
        const ownerArkiv = await getArkivWalletClientForBraga();
        const owner = ownerArkiv.account?.address;
        if (!owner) throw new Error("Connect wallet on Arkiv Braga");
        await assertBragaFunded(owner);

        const { entityKey, sessionDek } = await publishSecretNote(
          ownerArkiv,
          prepared,
        );
        setSessionDek(entityKey, sessionDek);
        setStep("done");
        return entityKey;
      } catch (e) {
        setStep("error");
        setError(formatArkivError(e));
        return null;
      }
    },
    [publicClient, switchChainAsync],
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
  }, []);

  return { record, step, error, reset };
}
