"use client";

import { useCallback, useState } from "react";
import { useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import type { DecryptedSecretNote, SecretNoteView } from "@/lib/types";
import { getHandleClientForNox } from "@/lib/wallet-clients";
import { decryptSecretNoteSecret } from "@/lib/secret-note-operations";

export function useDecryptSecretNote() {
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
    [switchChainAsync],
  );

  return { revealed, busyKey, error, reveal };
}
