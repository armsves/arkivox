"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import { bragaChain } from "@/lib/chains";
import type { AuditorDisclosureView } from "@/lib/types";
import { revokeAuditorAccess } from "@/lib/ledger-operations";
import {
  clearRevokeContext,
  getRevokeContext,
} from "@/lib/session-revoke-store";
import { supportsRemoveViewer } from "@/lib/nox-acl";
import {
  getArkivWalletClientForBraga,
  getHandleClientForNox,
} from "@/lib/wallet-clients";
import { wagmiConfig } from "@/lib/wagmi";
import { getWalletClient } from "@wagmi/core";

export function useRevokeDisclosure() {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const queryClient = useQueryClient();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const revoke = useCallback(
    async (disclosure: AuditorDisclosureView) => {
      try {
        setError(null);
        setWarning(null);
        setBusyKey(disclosure.entityKey);

        await switchChainAsync({ chainId: arbitrumSepolia.id });
        const ownerViem = await getWalletClient(wagmiConfig, {
          chainId: arbitrumSepolia.id,
        });
        if (!ownerViem) throw new Error("Connect wallet on Arbitrum Sepolia");
        const ownerHandle = await getHandleClientForNox();

        await switchChainAsync({ chainId: bragaChain.id });
        const ownerArkiv = await getArkivWalletClientForBraga();

        const result = await revokeAuditorAccess(
          ownerViem,
          ownerArkiv,
          ownerHandle,
          disclosure,
          getRevokeContext(disclosure.entityKey),
        );
        clearRevokeContext(disclosure.entityKey);

        if (result.noxSkipped) {
          const supported = await supportsRemoveViewer();
          setWarning(
            supported
              ? "Nox removeViewer failed — Arkiv revocation recorded; auditor blocked in this app."
              : "This Nox deployment has no removeViewer yet — Arkiv revocation recorded; on-chain ACL may still allow direct SDK decrypt until iExec upgrades the contract.",
          );
        }

        await queryClient.invalidateQueries({
          queryKey: ["ledger-owner-disclosures", address],
        });
        await queryClient.invalidateQueries({
          queryKey: ["ledger-disclosures"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["ledger-revocations", address],
        });
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [address, queryClient, switchChainAsync],
  );

  const reset = useCallback(() => {
    setError(null);
    setWarning(null);
  }, []);

  return { revoke, busyKey, error, warning, reset };
}
