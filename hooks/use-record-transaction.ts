"use client";

import { useCallback, useState } from "react";
import { usePublicClient, useSwitchChain } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { arbitrumSepolia } from "viem/chains";
import { isAddress, type Hex } from "viem";
import { bragaChain } from "@/lib/chains";
import { isConfidentialTxType } from "@/lib/arkiv";
import { wagmiConfig } from "@/lib/wagmi";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import {
  prepareConfidentialTransaction,
  publishConfidentialTransaction,
  recordTokenTransaction,
  type RecordTransactionInput,
} from "@/lib/ledger-operations";
import { confidentialTransferOnChain } from "@/lib/ctoken-onchain";
import { formatArkivError } from "@/lib/arkiv-errors";
import { assertBragaFunded } from "@/lib/braga-preflight";
import {
  arkivEncryptionKeyHandle,
  commitArkivEncryptionKeyHandle,
} from "@/lib/handle-registry";
import { registerNoxDekHandleForOwner } from "@/lib/nox-handle-acl";

export type RecordStep =
  | "idle"
  | "sepolia"
  | "sepolia-registry"
  | "nox"
  | "arkiv"
  | "done"
  | "error";

export function useRecordTransaction() {
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });
  const [step, setStep] = useState<RecordStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const record = useCallback(
    async (
      input: {
        txType: RecordTransactionInput["txType"];
        token: string;
        counterparty: string;
        amount: string;
        memo?: string;
        noxTxHash?: string;
        existingAmountHandle?: string;
      },
      options?: { onChainFirst?: boolean },
    ) => {
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
        const onChainFirst = options?.onChainFirst ?? true;
        let prepared;

        if (confidential) {
          await switchChainAsync({ chainId: arbitrumSepolia.id });
          const ownerViem = await getWalletClient(wagmiConfig, {
            chainId: arbitrumSepolia.id,
          });
          if (!ownerViem) throw new Error("Connect wallet on Arbitrum Sepolia");
          if (!publicClient) throw new Error("Arbitrum Sepolia RPC unavailable");

          const handle = await getHandleClientForNox();

          if (
            onChainFirst &&
            !params.existingAmountHandle &&
            input.txType === "transfer"
          ) {
            setStep("sepolia");
            const cToken = input.token === "cRLC" ? "cRLC" : "cUSDC";
            const onChain = await confidentialTransferOnChain(
              ownerViem,
              publicClient,
              handle,
              cToken,
              input.amount,
              input.counterparty as `0x${string}`,
            );
            params.existingAmountHandle = onChain.amountHandle;
            params.noxTxHash = onChain.txHash;
          }

          setStep("nox");
          prepared = await prepareConfidentialTransaction(handle, params);

          setStep("sepolia-registry");
          const dekHandle = arkivEncryptionKeyHandle(prepared.outerPayload);
          await registerNoxDekHandleForOwner(
            ownerViem,
            publicClient,
            ownerViem.account.address,
            dekHandle,
            prepared.dekHandleProof,
          );
          await commitArkivEncryptionKeyHandle(
            ownerViem,
            publicClient,
            prepared.outerPayload,
            "token_transaction",
          );
        }

        setStep("arkiv");
        await switchChainAsync({ chainId: bragaChain.id });
        const arkivWallet = await getArkivWalletClientForBraga();
        const owner = arkivWallet.account?.address;
        if (!owner) throw new Error("Connect wallet on Arkiv Braga");
        await assertBragaFunded(owner);

        let entityKey: string;

        if (prepared) {
          const result = await publishConfidentialTransaction(arkivWallet, prepared);
          entityKey = result.entityKey;
        } else {
          const result = await recordTokenTransaction(arkivWallet, params);
          entityKey = result.entityKey;
        }

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
