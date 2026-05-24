"use client";

import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { getWalletClient } from "@wagmi/core";
import { arbitrumSepolia } from "viem/chains";
import { isAddress } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import { getHandleClientForNox } from "@/lib/wallet-clients";
import {
  confidentialTransferOnChain,
  finalizeUnwrapOnChain,
  unwrapOnChainStep1,
  wrapOnChain,
} from "@/lib/ctoken-onchain";
import { formatTransactionError } from "@/lib/transaction-errors";
import { getHandleRegistryAddress } from "@/lib/handle-registry";

export type CTokenActionStep =
  | "idle"
  | "approving"
  | "encrypting"
  | "submitting"
  | "finalize"
  | "done"
  | "error";

export function useCTokenActions() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: arbitrumSepolia.id });
  const { switchChainAsync } = useSwitchChain();
  const [step, setStep] = useState<CTokenActionStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [unwrapHandle, setUnwrapHandle] = useState<`0x${string}` | undefined>();

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(undefined);
    setUnwrapHandle(undefined);
  }, []);

  const ensureSepolia = useCallback(async () => {
    await switchChainAsync({ chainId: arbitrumSepolia.id });
    const wallet = await getWalletClient(wagmiConfig, { chainId: arbitrumSepolia.id });
    if (!wallet) throw new Error("Connect wallet on Arbitrum Sepolia");
    if (!publicClient) throw new Error("RPC unavailable");
    return { wallet, publicClient };
  }, [publicClient, switchChainAsync]);

  const wrap = useCallback(
    async (token: "USDC" | "RLC", amount: string) => {
      try {
        setError(null);
        const { wallet, publicClient: rpc } = await ensureSepolia();
        setStep("approving");
        const result = await wrapOnChain(wallet, rpc, token, amount);
        setTxHash(result.txHash);
        setStep("done");
        return true;
      } catch (e) {
        setStep("error");
        setError(formatTransactionError(e));
        return false;
      }
    },
    [ensureSepolia],
  );

  const transfer = useCallback(
    async (token: "cUSDC" | "cRLC", amount: string, recipient: string) => {
      if (!isAddress(recipient)) {
        setError("Invalid recipient");
        setStep("error");
        return null;
      }
      try {
        setError(null);
        const { wallet, publicClient: rpc } = await ensureSepolia();
        const handleClient = await getHandleClientForNox();
        setStep("encrypting");
        const result = await confidentialTransferOnChain(
          wallet,
          rpc,
          handleClient,
          token,
          amount,
          recipient,
        );
        setTxHash(result.txHash);
        setStep("done");
        return result;
      } catch (e) {
        setStep("error");
        setError(formatTransactionError(e));
        return null;
      }
    },
    [ensureSepolia],
  );

  const unwrapStart = useCallback(
    async (
      token: "cUSDC" | "cRLC",
      amount: string,
      recipient: `0x${string}` | undefined,
    ) => {
      const to = recipient ?? address;
      if (!to || !isAddress(to)) {
        setError("Invalid recipient");
        setStep("error");
        return false;
      }
      try {
        setError(null);
        const { wallet, publicClient: rpc } = await ensureSepolia();
        const handleClient = await getHandleClientForNox();
        setStep("encrypting");
        const result = await unwrapOnChainStep1(
          wallet,
          rpc,
          handleClient,
          token,
          amount,
          to,
        );
        setTxHash(result.txHash);
        setUnwrapHandle(result.unwrapHandle);
        setStep("finalize");
        return true;
      } catch (e) {
        setStep("error");
        setError(formatTransactionError(e));
        return false;
      }
    },
    [address, ensureSepolia],
  );

  const unwrapFinalize = useCallback(
    async (token: "cUSDC" | "cRLC", handle: `0x${string}`) => {
      try {
        setError(null);
        const { wallet, publicClient: rpc } = await ensureSepolia();
        const handleClient = await getHandleClientForNox();
        setStep("finalize");
        const result = await finalizeUnwrapOnChain(
          wallet,
          rpc,
          handleClient,
          token,
          handle,
        );
        setTxHash(result.txHash);
        setStep("done");
        return true;
      } catch (e) {
        setStep("error");
        setError(formatTransactionError(e));
        return false;
      }
    },
    [ensureSepolia],
  );

  return {
    step,
    error,
    txHash,
    unwrapHandle,
    wrap,
    transfer,
    unwrapStart,
    unwrapFinalize,
    reset,
    registryConfigured: !!getHandleRegistryAddress(),
  };
}
