# Agent skill — Arkiv

When working on **Arkiv** in this repo (entities, queries, Braga, SDK), read and follow:

**[`.agents/skills/arkiv-best-practices/SKILL.md`](../.agents/skills/arkiv-best-practices/SKILL.md)**

That skill is the source of truth for SDK setup, attributes, expiration, queries, and security patterns. Reference docs live under `.agents/skills/arkiv-best-practices/references/`.

## Arkivox-specific checklist

| Practice | Status in this app |
| -------- | ------------------- |
| `PROJECT_ATTRIBUTE` on every create/update | Yes — `lib/arkiv.ts` |
| `projectScopePredicate()` on every query | Yes — `lib/ledger-queries.ts` |
| Runtime guard if project value empty | Yes — throws at module load |
| Optional override | `NEXT_PUBLIC_ARKIV_PROJECT` env |
| Separate public vs wallet clients | Yes — `lib/arkiv-client.ts` (reads) vs wallet (writes) |
| `ExpirationTime` helpers, not raw seconds | Yes — `ENTITY_EXPIRES_IN` |
| Braga testnet (SDK ≥ 0.6.5) | Yes — `@arkiv-network/sdk` ^0.6.8 |
| Reject entities outside project scope | Yes — `isProjectScopedEntity()` in parsers |
| `.ownedBy()` for user wallet ledger | Yes — users publish their own rows |
| `.createdBy()` trusted backend | **N/A** — not a backend-publisher model; see comment in `lib/arkiv.ts` |
| Relationship entities for lists | N/A — flat disclosure/revocation entities with hash attributes |

## Files to touch for Arkiv changes

- `lib/arkiv.ts` — project scope, entity types, Braga URLs, TTL
- `lib/arkiv-client.ts` — read-only public client
- `lib/ledger-operations.ts` — creates (wallet client)
- `lib/ledger-queries.ts` — queries and payload parsing

## Cursor rule

Project rule `.cursor/rules/arkiv-best-practices.mdc` reminds agents to load the skill when editing the files above.
