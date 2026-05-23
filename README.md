# Arkivox

**Arkivox** (*Arkiv* + *Nox*) — confidential token ledger with selective disclosure.

Record **confidential token transactions** on [Arkiv Braga](https://docs.arkiv.network/) and let a **third party** (auditor, compliance, counterparty) **reveal amounts** via [iExec Nox](https://github.com/iExec-Nox/demo-ctoken) on Arbitrum Sepolia.

## What it does

| Who | Sees on Arkiv (public index) | Sees after decrypt |
|-----|------------------------------|---------------------|
| **Owner** | `entityType` only (+ block metadata) | Full tx via AES + Nox (Reveal) |
| **Third party** | `granteeHash` + `parentKeyHash` (no plain addresses) | Grant + amount after Nox + AES |

Works with cUSDC / cRLC-style flows from [demo-ctoken](https://github.com/iExec-Nox/demo-ctoken): optionally paste an existing **Nox amount handle** from an on-chain confidential transfer.

## Architecture

| Layer | Network | Role |
|-------|---------|------|
| **Arkiv** | Braga | `token_transaction` + `auditor_disclosure` entities |
| **Nox** | Arbitrum Sepolia | `encryptInput(amount)` → handle; `addViewer` / `removeViewer` for third party |

### Entity types

1. **`token_transaction` (v3)** — public attributes: `entityType` only; AES payload: type, token, counterparty, amount, memo, time; Nox `amountHandle` wraps DEK  
2. **`auditor_disclosure` (v3)** — public: `granteeHash`, `parentKeyHash`; AES payload: grantee, label, parent key, share handle, metadata  

Legacy v2 entities (plain attributes) still parse for older records.

### Revoking auditor access

1. **Nox** — `removeViewer(shareAmountHandle, auditor)` when the deployed NoxCompute includes it (see `contracts/reference/ACLRemoveViewer.sol` for the upstream patch).
2. **Arkiv** — `auditor_revocation` tombstone + delete `auditor_disclosure`.

Until iExec ships `removeViewer` on Sepolia (`0xd464…c229` does not include it yet), revoke still tombstones on Arkiv and blocks decrypt in this app.

`PROJECT_ATTRIBUTE`: `project = arkivox-7k2m` (queries also match legacy `arkiv-vault-nox-demo-7k2m`)

## Prerequisites

- Node.js 18+
- Wallet funded for the full stack (same as [demo-ctoken](https://github.com/iExec-Nox/demo-ctoken)):
  1. **Ethereum Sepolia ETH** — [Google Cloud Web3 faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
  2. **Bridge to Arbitrum Sepolia** — [Arbitrum portal](https://portal.arbitrum.io/bridge?sourceChain=sepolia&destinationChain=arbitrum-sepolia)
  3. **Testnet USDC** (optional, for wrap demos) — [Circle faucet](https://faucet.circle.com/) (select Arbitrum Sepolia)
  4. **Braga GLM** — [Arkiv faucet](https://braga.hoodi.arkiv.network/faucet/)
- Optional: Reown project ID for WalletConnect

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## UI tabs

1. **My ledger** — your `token_transaction` history; reveal amounts; share with third party  
2. **Record tx** — log transfer / wrap / unwrap with confidential amount  
3. **Third-party view** — disclosures shared **to your address**; reveal if Nox ACL granted  

## Node E2E tests

| Command | Keys | Covers |
|---------|------|--------|
| `npm run test:e2e:smoke` | `OWNER_PRIVATE_KEY` | Record, index, fetch, owner reveal |
| `npm run test:e2e` | `OWNER` + `GRANTEE_PRIVATE_KEY` | Share, grantee reveal, **revoke**, tombstone |
| `npm run test:e2e:all` | both | Smoke then full |

```bash
cp .env.test.example .env
# fund OWNER (and GRANTEE for full) on Arb Sepolia + Braga
npm run test:e2e:smoke
npm run test:e2e
```

## Scripts

```bash
npm run dev
npm run build
npm run test:e2e
npm run test:e2e:smoke
npm run test:e2e:all
```

## References

- [Arkiv docs](https://docs.arkiv.network/)
- [Arkiv skills](https://github.com/Arkiv-Network/skills)
- [iExec Nox demo-ctoken](https://github.com/iExec-Nox/demo-ctoken)

MIT
