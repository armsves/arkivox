"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useSwitchChain } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { arbitrumSepolia } from "viem/chains";
import { isAddress } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import { recordVerifiedConfidentialTransfer } from "@/lib/ledger-operations";
import { formatArkivError } from "@/lib/arkiv-errors";
import { assertBragaFunded } from "@/lib/braga-preflight";

/** After a Tokens-tab cToken transfer, append an Arkiv ledger row anchored to that Sepolia tx. */
export function useRecordVerifiedTransfer() {
  const queryClient = useQueryClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendToLedger = useCallback(
    async (input: {
      token: "cUSDC" | "cRLC";
      amount: string;
      counterparty: `0x${string}`;
      memo?: string;
      noxTxHash: `0x${string}`;
      amountHandle: `0x${string}`;
    }) => {
      if (!isAddress(input.counterparty)) {
        setError("Invalid counterparty");
        return null;
      }
      setBusy(true);
      setError(null);
      try {
        const arkivWallet = await getArkivWalletClientForBraga();
        const owner = arkivWallet.account?.address;
        if (!owner) throw new Error("Connect wallet on Arkiv Braga");
        await assertBragaFunded(owner);

        await switchChainAsync({ chainId: arbitrumSepolia.id });
        const ownerViem = await getWalletClient(wagmiConfig, {
          chainId: arbitrumSepolia.id,
        });
        if (!ownerViem) throw new Error("Connect wallet on Arbitrum Sepolia");
        if (!publicClient) throw new Error("Arbitrum Sepolia RPC unavailable");

        const handle = await getHandleClientForNox();
        const result = await recordVerifiedConfidentialTransfer(
          arkivWallet,
          ownerViem,
          publicClient,
          handle,
          {
            txType: "transfer",
            token: input.token,
            counterparty: input.counterparty,
            amount: input.amount,
            memo: input.memo,
            noxTxHash: input.noxTxHash,
            existingAmountHandle: input.amountHandle,
          },
        );

        await queryClient.invalidateQueries({ queryKey: ["ledger-transactions"] });
        return result;
      } catch (e) {
        setError(formatArkivError(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [publicClient, queryClient, switchChainAsync],
  );

  return { appendToLedger, busy, error };
}
