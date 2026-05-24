"use client";

import { useCallback, useState } from "react";
import { useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import type { DecryptedTransaction, TokenTransactionView } from "@/lib/types";
import { isConfidentialTxType } from "@/lib/arkiv";
import { getHandleClientForNox } from "@/lib/wallet-clients";
import { decryptTransactionSecret } from "@/lib/ledger-operations";

export function useDecryptTransaction() {
  const { switchChainAsync } = useSwitchChain();
  const [revealed, setRevealed] = useState<Record<string, DecryptedTransaction>>(
    {},
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reveal = useCallback(
    async (tx: TokenTransactionView) => {
      setBusyKey(tx.entityKey);
      setError(null);
      try {
        const isPublic =
          !isConfidentialTxType(tx.txType) ||
          tx.payload.public ||
          (!tx.payload.ciphertext && !!tx.amount);

        if (isPublic) {
          const data = await decryptTransactionSecret(null, tx);
          setRevealed((prev) => ({ ...prev, [tx.entityKey]: data }));
          return;
        }

        await switchChainAsync({ chainId: arbitrumSepolia.id });
        const handleClient = await getHandleClientForNox();
        const data = await decryptTransactionSecret(handleClient, tx);
        setRevealed((prev) => ({ ...prev, [tx.entityKey]: data }));
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Cannot reveal amount — Nox ACL required",
        );
      } finally {
        setBusyKey(null);
      }
    },
    [switchChainAsync],
  );

  return { revealed, busyKey, error, reveal };
}
