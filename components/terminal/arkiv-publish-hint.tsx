import { BRAGA_EXPLORER, BRAGA_FAUCET } from "@/lib/arkiv";
import { ARKIV_SYSTEM_ADDRESS } from "@/lib/arkiv-encode";

function truncate(addr: string) {
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}

/** Explains the MetaMask “Sending 0 GLM” dialog (normal for Arkiv). */
export function ArkivPublishHint() {
  return (
    <div className="space-y-2 border border-outline-variant bg-surface-container-low p-4 font-label-sm text-on-surface-variant normal-case leading-relaxed">
      <p className="font-label-md text-primary-container">What MetaMask will show</p>
      <p>
        Arkiv stores your ciphertext with one Braga transaction — same as the{" "}
        <a
          className="text-primary-container underline"
          href="https://docs.arkiv.network/learn/metamask-sketch-app/2-data/"
          target="_blank"
          rel="noreferrer"
        >
          MetaMask sketch tutorial
        </a>
        . MetaMask labels it <strong className="text-on-surface">Sending 0 GLM</strong> to{" "}
        <a
          className="text-primary-container underline"
          href={`${BRAGA_EXPLORER}/address/${ARKIV_SYSTEM_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
        >
          {truncate(ARKIV_SYSTEM_ADDRESS)}
        </a>{" "}
        (the Arkiv system contract). That is expected — you are not transferring GLM; storage is
        paid via the <strong className="text-on-surface">network fee</strong> in GLM.
      </p>
      <p>
        Confirm the transaction. If it fails with “underpriced”, cancel any pending Braga txs in
        Activity, get GLM from the{" "}
        <a className="text-primary-container underline" href={BRAGA_FAUCET} target="_blank" rel="noreferrer">
          Braga faucet
        </a>
        , then retry.
      </p>
    </div>
  );
}
