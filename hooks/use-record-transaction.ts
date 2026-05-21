"use client";

import { useCallback, useState } from "react";
import { useSwitchChain } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { arbitrumSepolia } from "viem/chains";
import { isAddress, type Hex } from "viem";
import { bragaChain } from "@/lib/chains";
import { isConfidentialTxType, type TxType } from "@/lib/arkiv";
import { wagmiConfig } from "@/lib/wagmi";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import {
  recordTokenTransaction,
  type RecordTransactionInput,
} from "@/lib/ledger-operations";
import { setSessionDek } from "@/lib/session-dek-store";

export type RecordStep = "idle" | "nox" | "arkiv" | "done" | "error";

export function useRecordTransaction() {
  const { switchChainAsync } = useSwitchChain();
  const [step, setStep] = useState<RecordStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const record = useCallback(
    async (input: {
      txType: TxType;
      token: string;
      counterparty: string;
      amount: string;
      memo?: string;
      noxTxHash?: string;
      existingAmountHandle?: string;
    }) => {
      if (!isAddress(input.counterparty)) {
        setError("Invalid counterparty address");
        return null;
      }
      setError(null);
      try {
        const params: RecordTransactionInput = {
          txType: input.txType,
          token: input.token,
          counterparty: input.counterparty as `0x${string}`,
          amount: input.amount,
          memo: input.memo,
          noxTxHash: input.noxTxHash as Hex | undefined,
          existingAmountHandle: input.existingAmountHandle as Hex | undefined,
        };

        const confidential = isConfidentialTxType(input.txType);
        let nox;

        if (confidential) {
          setStep("nox");
          await switchChainAsync({ chainId: arbitrumSepolia.id });
          const ownerViem = await getWalletClient(wagmiConfig, {
            chainId: arbitrumSepolia.id,
          });
          if (!ownerViem) throw new Error("Connect wallet on Arbitrum Sepolia");
          nox = { viem: ownerViem, handle: await getHandleClientForNox() };
        }

        setStep("arkiv");
        await switchChainAsync({ chainId: bragaChain.id });
        const arkivWallet = await getArkivWalletClientForBraga();
        if (!arkivWallet) throw new Error("Connect wallet on Arkiv Braga");

        const { entityKey, sessionDek } = await recordTokenTransaction(
          arkivWallet,
          params,
          nox,
        );
        if (sessionDek) setSessionDek(entityKey, sessionDek);

        setStep("done");
        return entityKey;
      } catch (e) {
        setStep("error");
        setError(e instanceof Error ? e.message : String(e));
        return null;
      }
    },
    [switchChainAsync],
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
  }, []);

  return { record, step, error, reset };
}
