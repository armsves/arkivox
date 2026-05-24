"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  fetchDisclosuresForAuditor,
  fetchDisclosuresForOwner,
  fetchMyTransactions,
} from "@/lib/ledger-queries";
import { fetchMySecretNotes } from "@/lib/secret-note-queries";

export function useLedger() {
  const { address } = useAccount();

  const transactions = useQuery({
    queryKey: ["ledger-transactions", address],
    queryFn: () => fetchMyTransactions(address!),
    enabled: !!address,
    refetchInterval: 15_000,
  });

  const disclosures = useQuery({
    queryKey: ["ledger-disclosures", address],
    queryFn: () => fetchDisclosuresForAuditor(address!),
    enabled: !!address,
    refetchInterval: 15_000,
  });

  const ownerDisclosures = useQuery({
    queryKey: ["ledger-owner-disclosures", address],
    queryFn: () => fetchDisclosuresForOwner(address!),
    enabled: !!address,
    refetchInterval: 15_000,
  });

  const secretNotes = useQuery({
    queryKey: ["ledger-secret-notes", address],
    queryFn: () => fetchMySecretNotes(address!),
    enabled: !!address,
    refetchInterval: 15_000,
  });

  return { transactions, disclosures, ownerDisclosures, secretNotes };
}
