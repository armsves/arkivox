"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "viem/chains";
import { useLedger } from "@/hooks/use-ledger";
import { useRecordTransaction } from "@/hooks/use-record-transaction";
import { useShareDisclosure } from "@/hooks/use-share-disclosure";
import { useRevokeDisclosure } from "@/hooks/use-revoke-disclosure";
import { useDecryptTransaction } from "@/hooks/use-decrypt-transaction";
import { fetchTransactionByKey } from "@/lib/ledger-queries";
import {
  fetchRevokedShareHandleHashes,
  isShareHandleRevoked,
} from "@/lib/ledger-queries";
import { decryptDisclosureSecret } from "@/lib/ledger-operations";
import { parentKeyHash } from "@/lib/ledger-secrets";
import { getHandleClientForNox } from "@/lib/wallet-clients";
import type { AuditorDisclosureView, DecryptedDisclosure, TokenTransactionView } from "@/lib/types";
import type { TxType } from "@/lib/arkiv";
import { bragaChain } from "@/lib/chains";
import { BRAND } from "@/lib/brand";
import { BRAGA_EXPLORER } from "@/lib/arkiv";
import { ARBITRUM_SEPOLIA_EXPLORER } from "@/lib/nox";
import {
  AppHeader,
  AppShell,
  BottomNav,
  type AppTab,
} from "@/components/terminal/app-shell";
import { AboutPage, ConnectScreen } from "@/components/terminal/connect-screen";
import { WalletConnectButton } from "@/components/terminal/wallet-connect-button";
import { useConnectWallet } from "@/hooks/use-connect-wallet";
import { LedgerCard } from "@/components/terminal/ledger-card";
import { RecordForm } from "@/components/terminal/record-form";
import { AuditorPanel } from "@/components/terminal/auditor-panel";
import { SharePanel } from "@/components/terminal/share-panel";
import { FaucetsModal } from "@/components/terminal/faucets-modal";

type Tab = AppTab;

function chainBadge(chainId: number, tab: Tab) {
  if (tab === "record") return "Arb Sepolia (Nox)";
  if (chainId === bragaChain.id) return "Braga (Arkiv)";
  if (chainId === arbitrumSepolia.id) return "Arb Sepolia (Nox)";
  return `Chain ${chainId}`;
}

function headerTitle(tab: Tab, connected: boolean) {
  if (!connected) return BRAND.name;
  if (tab === "about") return BRAND.name;
  if (tab === "record") return "Record";
  return BRAND.name;
}

function headerSubtitle(tab: Tab, connected: boolean) {
  if (!connected) return "Overview";
  if (tab === "about") return "Overview";
  if (tab === "auditor") return "Auditor View";
  return undefined;
}

export function LedgerApp() {
  const { address, isConnected } = useAccount();
  const connected = isConnected && !!address;
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { openWalletModal } = useConnectWallet();
  const [tab, setTab] = useState<Tab>("about");
  const [faucetsOpen, setFaucetsOpen] = useState(false);

  const { transactions, disclosures, ownerDisclosures } = useLedger();
  const { record, step: recordStep, error: recordError, reset: resetRecord } =
    useRecordTransaction();
  const { share, step: shareStep, error: shareError, reset: resetShare } =
    useShareDisclosure();
  const {
    revoke,
    busyKey: revokeBusyKey,
    error: revokeError,
    warning: revokeWarning,
    reset: resetRevoke,
  } = useRevokeDisclosure();
  const { revealed, busyKey, error: decryptError, reveal } = useDecryptTransaction();

  const [txType, setTxType] = useState<TxType>("transfer");
  const [token, setToken] = useState("cUSDC");
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [noxTxHash, setNoxTxHash] = useState("");
  const [amountHandle, setAmountHandle] = useState("");
  const [auditorAddr, setAuditorAddr] = useState("");
  const [sharingTx, setSharingTx] = useState<TokenTransactionView | null>(null);
  const [auditorBusyKey, setAuditorBusyKey] = useState<string | null>(null);
  const [auditorError, setAuditorError] = useState<string | null>(null);
  const [disclosureMeta, setDisclosureMeta] = useState<
    Record<string, DecryptedDisclosure>
  >({});

  const disclosuresByParent = useMemo(() => {
    const map = new Map<string, AuditorDisclosureView[]>();
    for (const d of ownerDisclosures.data ?? []) {
      const key = d.parentKey || d.parentKeyHash || "";
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(d);
      map.set(key, list);
    }
    return map;
  }, [ownerDisclosures.data]);

  const onRecord = async () => {
    const key = await record({
      txType,
      token,
      counterparty,
      amount,
      memo: memo || undefined,
      noxTxHash: noxTxHash || undefined,
      existingAmountHandle: amountHandle || undefined,
    });
    if (key) {
      setAmount("");
      setMemo("");
      setNoxTxHash("");
      setAmountHandle("");
      resetRecord();
      await transactions.refetch();
      setTab("ledger");
    }
  };

  const onShare = async () => {
    if (!sharingTx) return;
    const ok = await share(sharingTx, auditorAddr);
    if (ok) {
      setAuditorAddr("");
      setSharingTx(null);
      resetShare();
      await ownerDisclosures.refetch();
    }
  };

  const onRevoke = async (d: AuditorDisclosureView) => {
    const ok = await revoke(d);
    if (ok) {
      resetRevoke();
      await ownerDisclosures.refetch();
    }
  };

  const onAuditorReveal = async (d: AuditorDisclosureView) => {
    setAuditorBusyKey(d.entityKey);
    setAuditorError(null);
    try {
      let meta = disclosureMeta[d.entityKey];
      if (!meta) {
        if (d.isPrivate) {
          await switchChainAsync({ chainId: arbitrumSepolia.id });
          const handleClient = await getHandleClientForNox();
          meta = await decryptDisclosureSecret(handleClient, d);
          setDisclosureMeta((prev) => ({ ...prev, [d.entityKey]: meta! }));
        } else {
          meta = {
            parentKey: d.parentKey,
            grantee: d.grantee,
            auditorLabel: d.auditorLabel,
            amountHandle: d.payload.amountHandle,
            txType: d.txType,
            token: d.token,
            counterparty: d.counterparty,
          };
        }
      }
      if (address) {
        const revoked = await fetchRevokedShareHandleHashes(address);
        if (isShareHandleRevoked(revoked, meta.amountHandle)) {
          setAuditorError(
            "Access revoked by ledger owner (Nox ACL revoked or tombstoned)",
          );
          return;
        }
      }
      const tx = await fetchTransactionByKey(meta.parentKey);
      if (!tx) return;
      await reveal({
        ...tx,
        payload: { ...tx.payload, amountHandle: meta.amountHandle },
      });
    } finally {
      setAuditorBusyKey(null);
    }
  };

  return (
    <AppShell
      header={
        <AppHeader
          title={headerTitle(tab, connected)}
          subtitle={headerSubtitle(tab, connected)}
          chainBadge={connected ? chainBadge(chainId, tab) : undefined}
          walletAction={
            connected ? (
              <button
                type="button"
                onClick={() => void openWalletModal()}
                className="active-scale max-w-[140px] truncate border border-primary-container bg-surface-container-highest px-3 py-2 font-label-sm text-primary-container normal-case hover:bg-primary-container/10"
                title={address}
              >
                {address.slice(0, 6)}…{address.slice(-4)}
              </button>
            ) : (
              <WalletConnectButton />
            )
          }
        />
      }
      footer={
        <>
          {connected && <BottomNav tab={tab} onTab={setTab} />}
          <div
            className={`fixed left-0 z-40 flex h-8 w-full items-center justify-center gap-3 border-t border-outline-variant bg-surface-container ${connected ? "bottom-20" : "bottom-0 pb-safe"}`}
          >
            <button
              type="button"
              onClick={() => setFaucetsOpen(true)}
              className="font-label-sm text-primary-container normal-case hover:underline"
            >
              Faucets
            </button>
            {connected && (
              <>
                <span className="text-outline">·</span>
                <button
                  type="button"
                  onClick={() => void openWalletModal()}
                  className="font-label-sm text-on-surface-variant normal-case hover:text-primary-container"
                >
                  {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Wallet"} ·{" "}
                  <span className="text-primary-container">Networks</span>
                </button>
              </>
            )}
          </div>
          <FaucetsModal open={faucetsOpen} onClose={() => setFaucetsOpen(false)} />
        </>
      }
    >
      {!connected ? (
        <ConnectScreen />
      ) : (
        <>
          {tab === "about" && <AboutPage />}
          {tab === "ledger" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-headline-lg text-primary-container">My Ledger</h2>
                <p className="mt-2 font-body-md text-on-surface-variant">
                  Cryptographically secured transaction records. Reveal to decrypt AES
                  payload via Nox.
                </p>
              </div>

              {transactions.isLoading && (
                <p className="font-body-md text-on-surface-variant">Loading…</p>
              )}
              {transactions.data?.length === 0 && !transactions.isLoading && (
                <p className="font-body-md text-on-surface-variant">
                  No transactions yet — use Record to add one.
                </p>
              )}

              <div className="flex flex-col gap-4">
                {transactions.data?.map((tx) => {
                  const shared =
                    disclosuresByParent.get(tx.entityKey) ??
                    disclosuresByParent.get(parentKeyHash(tx.entityKey)) ??
                    [];
                  return (
                    <LedgerCard
                      key={tx.entityKey}
                      tx={tx}
                      decrypted={revealed[tx.entityKey]}
                      shared={shared}
                      busyReveal={busyKey === tx.entityKey}
                      busyRevokeKey={revokeBusyKey}
                      onReveal={() => reveal(tx)}
                      onShare={() => setSharingTx(tx)}
                      onRevoke={onRevoke}
                    />
                  );
                })}
              </div>

              {sharingTx && (
                <SharePanel
                  tx={sharingTx}
                  auditorAddr={auditorAddr}
                  setAuditorAddr={setAuditorAddr}
                  shareStep={shareStep}
                  shareError={shareError}
                  onShare={onShare}
                  onCancel={() => setSharingTx(null)}
                />
              )}

              {decryptError && (
                <p className="font-label-md text-error normal-case">{decryptError}</p>
              )}
              {revokeError && (
                <p className="font-label-md text-error normal-case">{revokeError}</p>
              )}
              {revokeWarning && (
                <p className="font-label-md text-secondary-fixed-dim normal-case">
                  {revokeWarning}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-outline-variant bg-surface-card p-4">
                  <div className="mb-1 font-label-sm text-on-surface-variant">
                    Records
                  </div>
                  <div className="font-headline-md text-primary-container">
                    {transactions.data?.length ?? 0}
                  </div>
                </div>
                <div className="border border-outline-variant bg-surface-card p-4">
                  <div className="mb-1 font-label-sm text-on-surface-variant">
                    Disclosures
                  </div>
                  <div className="font-headline-md text-primary-container">
                    {ownerDisclosures.data?.length ?? 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "record" && (
            <RecordForm
              txType={txType}
              setTxType={setTxType}
              token={token}
              setToken={setToken}
              counterparty={counterparty}
              setCounterparty={setCounterparty}
              amount={amount}
              setAmount={setAmount}
              memo={memo}
              setMemo={setMemo}
              noxTxHash={noxTxHash}
              setNoxTxHash={setNoxTxHash}
              amountHandle={amountHandle}
              setAmountHandle={setAmountHandle}
              recordStep={recordStep}
              recordError={recordError}
              onSubmit={onRecord}
            />
          )}

          {tab === "auditor" && (
            <AuditorPanel
              disclosures={disclosures.data ?? []}
              isLoading={disclosures.isLoading}
              disclosureMeta={disclosureMeta}
              revealed={revealed}
              busyKey={busyKey}
              auditorBusyKey={auditorBusyKey}
              decryptError={decryptError}
              auditorError={auditorError}
              onReveal={onAuditorReveal}
            />
          )}

          <footer className="mt-12 border-t border-outline-variant pt-6">
            <div className="flex flex-wrap gap-x-4 gap-y-2 font-label-sm normal-case text-primary-container">
              <a href={BRAGA_EXPLORER} target="_blank" rel="noreferrer">
                Arkiv explorer ↗
              </a>
              <a href={ARBITRUM_SEPOLIA_EXPLORER} target="_blank" rel="noreferrer">
                Arbiscan ↗
              </a>
            </div>
          </footer>
        </>
      )}
    </AppShell>
  );
}
