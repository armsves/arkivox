import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { FaucetGuide } from "./faucet-guide";
import { IconSecurity } from "./icons";

const STEPS = [
  {
    n: "1",
    title: "Record a transaction",
    text: "Log a confidential transfer (encrypted) or a public wrap/unwrap (on-chain cToken tx referenced on Arkiv).",
  },
  {
    n: "2",
    title: "Keys stay in Nox",
    text: "For transfers only: the decryption key is wrapped in an iExec Nox handle on Arbitrum Sepolia — a TEE, not plain storage.",
  },
  {
    n: "3",
    title: "Ledger on Arkiv",
    text: "Confidential transfers store ciphertext on Arkiv Braga. Wrap/unwrap entries store plaintext amounts — those ops are already public on-chain.",
  },
  {
    n: "4",
    title: "Share one proof",
    text: "Pick a transaction and grant an auditor wallet access to that amount only — not your full history.",
  },
  {
    n: "5",
    title: "Revoke when done",
    text: "Remove auditor access. A revocation record on Arkiv blocks the app from showing that grant again.",
  },
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-headline-md text-primary-container">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`border border-outline-variant bg-surface-container p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function LandingPage({ connectSlot }: { connectSlot?: ReactNode }) {
  return (
    <div className="space-y-12 pb-8">
      <header className="space-y-6 border-b border-outline-variant pb-10">
        <p className="font-label-md text-primary-container">{BRAND.name}</p>
        <h1 className="font-headline-xl max-w-2xl text-on-surface">
          Private token transactions.
          <br />
          <span className="text-primary-container">Prove what you need. Hide the rest.</span>
        </h1>
        <p className="max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
          {BRAND.name} is a demo ledger for confidential DeFi-style tokens (cUSDC, cRLC). You
          store encrypted transaction records on{" "}
          <span className="text-on-surface">Arkiv</span>, control who can read amounts with{" "}
          <span className="text-on-surface">iExec Nox</span>, and share selective disclosure
          with auditors — one transaction at a time.
        </p>
        {connectSlot && <div className="pt-2">{connectSlot}</div>}
      </header>

      <Section title="Why this exists">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="border-error/30 bg-surface-card">
            <p className="font-label-md text-error">The problem</p>
            <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
              Normal on-chain activity is public. Amounts, counterparties, and memos are visible
              to everyone. Auditors often need proof of one payment — not your entire wallet
              history.
            </p>
          </Panel>
          <Panel className="border-primary-container/40 glow-primary">
            <p className="font-label-md text-primary-container">What {BRAND.name} does</p>
            <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
              You keep a private ledger on Arkiv. Amounts are locked behind Nox handles. When
              compliance asks, you disclose exactly one transaction — they never see the rest.
            </p>
          </Panel>
        </div>
      </Section>

      <Section title="The stack in one picture">
        <Panel className="bg-surface-container-lowest font-mono text-sm leading-relaxed text-on-surface-variant">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-2">
            <span className="border border-outline-variant px-3 py-2 text-on-surface">
              You (wallet)
            </span>
            <span className="hidden text-primary-container md:inline">→</span>
            <span className="border border-primary-container px-3 py-2 text-primary-container">
              Encrypt transfer
            </span>
            <span className="hidden text-primary-container md:inline">→</span>
            <span className="border border-secondary-fixed-dim px-3 py-2 text-secondary-fixed-dim">
              Nox · Arb Sepolia (keys)
            </span>
            <span className="hidden text-primary-container md:inline">+</span>
            <span className="border border-outline px-3 py-2 text-on-surface">
              Arkiv · Braga (ciphertext)
            </span>
            <span className="hidden text-primary-container md:inline">→</span>
            <span className="border border-primary-container px-3 py-2 text-on-surface">
              Auditor sees one grant
            </span>
          </div>
        </Panel>
      </Section>

      <Section title="How to use it">
        <ol className="space-y-3">
          {STEPS.map(({ n, title, text }) => (
            <li
              key={n}
              className="flex gap-4 border border-outline-variant bg-surface-card p-4 md:p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary-container font-headline-md text-on-primary">
                {n}
              </span>
              <div>
                <p className="font-headline-md text-on-surface">{title}</p>
                <p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Who sees what">
        <div className="overflow-x-auto border border-outline-variant">
          <table className="w-full min-w-[480px] text-left text-body-md">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container">
                <th className="p-4 font-label-md text-on-surface-variant">Role</th>
                <th className="p-4 font-label-md text-on-surface-variant">On-chain (public)</th>
                <th className="p-4 font-label-md text-on-surface-variant">After decrypt</th>
              </tr>
            </thead>
            <tbody className="text-on-surface-variant">
              <tr className="border-b border-outline-variant">
                <td className="p-4 text-on-surface">You (owner)</td>
                <td className="p-4">Entity type, timestamps, hashes</td>
                <td className="p-4 text-primary-container">Full tx + amount + memo</td>
              </tr>
              <tr className="border-b border-outline-variant">
                <td className="p-4 text-on-surface">Auditor</td>
                <td className="p-4">Grant hash only — no plain addresses</td>
                <td className="p-4 text-secondary-fixed-dim">
                  One shared transaction&apos;s amount
                </td>
              </tr>
              <tr>
                <td className="p-4 text-on-surface">Everyone else</td>
                <td className="p-4">Same minimal metadata</td>
                <td className="p-4 text-outline">Nothing</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Inside the app">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              tab: "My Ledger",
              desc: "Your transactions. Confidential transfers need Reveal. Wrap/unwrap show amounts directly. Share applies to transfers only.",
            },
            {
              tab: "Record",
              desc: "Transfer: encrypt via Nox + Arkiv. Wrap/unwrap: log public on-chain tx (Braga only).",
            },
            {
              tab: "Disclosures",
              desc: "Switch to the grantee wallet. See disclosures shared to you and reveal amounts.",
            },
          ].map(({ tab, desc }) => (
            <Panel key={tab} className="bg-surface-card">
              <p className="font-headline-md text-primary-container">{tab}</p>
              <p className="mt-2 text-body-md leading-relaxed text-on-surface-variant">
                {desc}
              </p>
            </Panel>
          ))}
        </div>
      </Section>

      <Section title="Under the hood">
        <Panel className="flex gap-4 bg-surface-container-low">
          <span className="shrink-0 text-secondary-fixed-dim">
            <IconSecurity className="h-6 w-6" />
          </span>
          <div className="space-y-3 text-body-md leading-relaxed text-on-surface-variant">
            <p>
              Confidential <span className="text-on-surface">transfers</span> use a random{" "}
              <span className="text-on-surface">DEK</span> (AES-256-GCM). The DEK is wrapped as
              a Nox <code className="text-primary-container">amountHandle</code>. Wrap and unwrap
              are public cToken contract calls — Arkiv stores them as plaintext ledger references,
              not ciphertext.
            </p>
            <p>
              Two networks: <span className="text-on-surface">Arbitrum Sepolia</span> for Nox
              encrypt/ACL · <span className="text-on-surface">Arkiv Braga</span> for durable
              storage.
            </p>
          </div>
        </Panel>
      </Section>

      <Section title="Fund your wallet (testnet)">
        <FaucetGuide />
      </Section>

      {connectSlot && (
        <footer className="border-t border-outline-variant pt-8">{connectSlot}</footer>
      )}
    </div>
  );
}
