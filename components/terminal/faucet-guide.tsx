import { BRAGA_FAUCET } from "@/lib/arkiv";
import {
  GAS_FAUCETS,
  TOKEN_FAUCETS,
  type FaucetLink,
} from "@/lib/faucets";

function FaucetRow({ item }: { item: FaucetLink }) {
  return (
    <li className="border border-outline-variant bg-surface-card p-4">
      <a
        className="font-headline-md text-primary-container hover:underline"
        href={item.href}
        target="_blank"
        rel="noreferrer"
      >
        {item.name} ↗
      </a>
      <p className="mt-1 text-body-md text-on-surface-variant">{item.description}</p>
      {item.note && (
        <p className="mt-1 font-label-sm normal-case text-secondary-fixed-dim">
          {item.note}
        </p>
      )}
    </li>
  );
}

export function FaucetGuide() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-label-md text-primary-container">1 · Get gas</h3>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Nox runs on Arbitrum Sepolia. Mint ETH on Ethereum Sepolia, then bridge it
          across (same flow as the{" "}
          <a
            className="text-primary-container underline"
            href="https://github.com/iExec-Nox/demo-ctoken"
            target="_blank"
            rel="noreferrer"
          >
            cToken demo
          </a>
          ).
        </p>
        <ul className="mt-4 space-y-3">
          {GAS_FAUCETS.map((item) => (
            <FaucetRow key={item.id} item={item} />
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-label-md text-primary-container">2 · Get tokens</h3>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Public USDC / RLC on Arbitrum Sepolia for wrap and confidential transfer
          demos.
        </p>
        <ul className="mt-4 space-y-3">
          {TOKEN_FAUCETS.map((item) => (
            <FaucetRow key={item.id} item={item} />
          ))}
        </ul>
        <p className="mt-3 font-label-sm normal-case text-outline">
          Demo limits (cToken app): ~0.1 ETH / 100 USDC per 24h on testnet faucets.
        </p>
      </section>

      <section>
        <h3 className="font-label-md text-primary-container">3 · Arkiv Braga GLM</h3>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Pay for encrypted ledger writes on Braga.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="border border-outline-variant bg-surface-card p-4">
            <a
              className="font-headline-md text-primary-container hover:underline"
              href={BRAGA_FAUCET}
              target="_blank"
              rel="noreferrer"
            >
              Braga GLM faucet ↗
            </a>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Arkiv entity writes (transactions, disclosures, revocations)
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
