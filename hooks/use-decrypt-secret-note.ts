"use client";

import { useCallback, useState } from "react";
import { useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import type { DecryptedSecretNote, SecretNoteView } from "@/lib/types";
import { getHandleClientForNox } from "@/lib/wallet-clients";
import { decryptSecretNoteSecret } from "@/lib/secret-note-operations";
import { getSessionDek } from "@/lib/session-dek-store";
import { isNoxViewer } from "@/lib/nox-acl";
import { useAccount } from "wagmi";

export function useDecryptSecretNote() {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [revealed, setRevealed] = useState<Record<string, DecryptedSecretNote>>(
    {},
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reveal = useCallback(
    async (note: SecretNoteView) => {
      setBusyKey(note.entityKey);
      setError(null);
      try {
        const sessionDek = getSessionDek(note.entityKey);
        if (sessionDek) {
          const data = await decryptSecretNoteSecret(null, note, sessionDek);
          setRevealed((prev) => ({ ...prev, [note.entityKey]: data }));
          return;
        }
        const viewer = (address ?? note.owner) as `0x${string}` | undefined;
        if (viewer) {
          const allowed = await isNoxViewer(note.payload.amountHandle, viewer);
          if (!allowed) {
            throw new Error(
              "This note’s Nox key was never registered on Sepolia (older notes). Save a new note after updating, or reveal in the same browser right after encrypting.",
            );
          }
        }
        await switchChainAsync({ chainId: arbitrumSepolia.id });
        const handleClient = await getHandleClientForNox();
        const data = await decryptSecretNoteSecret(handleClient, note);
        setRevealed((prev) => ({ ...prev, [note.entityKey]: data }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Cannot decrypt note");
      } finally {
        setBusyKey(null);
      }
    },
    [address, switchChainAsync],
  );

  return { revealed, busyKey, error, reveal };
}
