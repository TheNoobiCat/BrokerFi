# BrokerFi Frontend (Archived Testnet)

> [!WARNING]
> **This is archived, unaudited, experimental software. It is not a live product and is not production-ready.**
>
> - It was built for the **Arbitrum Sepolia testnet** only (chain ID `421614`).
> - It has **not been audited**, has **no test suite**, and was retired.
> - Do **not** deploy it with real funds, real user data, or mainnet contracts.
> - Some screens use mock, indicative, or hardcoded data. Some flows depend on external services that no longer exist.
> - The code is published as a reference archive, not as financial software. Use at your own risk.

## What it is

This repository is a public snapshot of the BrokerFi derivatives frontend. BrokerFi was an experimental on-chain derivatives project on Arbitrum Sepolia with:

- perpetual futures markets with liquidity pools and limit orders,
- an options chain with calls, puts, expiries, and margin accounts,
- an "Instant Execution" session-key flow for gasless transactions through a relayer,
- an AI trading-agent chat interface (Grok over WebSocket) with tools for market data, trades, and position management,
- a leaderboard, a testnet faucet, and a CLETH staking/fee-discount UI.

The app is a **Next.js App Router** frontend. It talks to on-chain contracts, Pyth price feeds, a Goldsky subgraph, and an off-chain relayer. Those backend components are **not** included in this snapshot.

The original repository kept its full private history. This snapshot intentionally starts with a single clean commit and contains no prior Git history.

## Status

| Item | Status |
| --- | --- |
| Lifecycle | **Archived / retired** |
| Network | **Arbitrum Sepolia testnet only** (chain ID `421614`) |
| Audit | **None** |
| Tests | **None** |
| Production ready | **No** |
| Search indexing | Disabled (`robots: noindex, nofollow` in app metadata) |
| Support | None |

This snapshot was prepared to make the code readable and buildable. It does not claim that the application is functional end to end without reconstructing the related services and deployments.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack builds) and React 19
- **Language:** TypeScript 5, strict mode
- **Styling:** Tailwind CSS 4, PostCSS
- **Wallet / chain:** Wagmi, Viem, Reown AppKit (WalletConnect)
- **Data fetching:** TanStack Query, native `fetch`, WebSocket (`ws://`/`wss://`)
- **Market data:** Pyth Hermes and Pyth Benchmarks APIs
- **Charts:** [`@klinecharts/pro`](vendor/klinecharts-pro), vendored under `vendor/klinecharts-pro` (Apache-2.0), with a patched `klinecharts` peer package
- **Indexing:** Goldsky-hosted GraphQL subgraph (config in `subgraph/`)
- **Relayer protocol:** MessagePack over WebSocket, session keys signed client-side
- **Bot / captcha:** Grok WebSocket endpoint and Cloudflare Turnstile
- **Package manager:** npm (`package-lock.json` committed)

## Repository layout

```text
app/                 Next.js App Router pages and API routes
  api/               Server routes for assets, limit orders, USDC history
  options/[asset]/   Options chain
  perpetual/         Perpetual futures and LP pages
  home/              Connected dashboard
  leaderboard/       Relayer-backed leaderboard
components/          UI, onboarding, trading, options, and layout components
blockchain/          ABIs, price-feed IDs, Viem public client
config/              Wagmi/Reown AppKit configuration
hooks/               React hooks (chat, orders, positions, favorites)
services/            Chain, relayer, Pyth, Grok, options, and session logic
store/               React contexts (session, trading, UI)
public/              Static assets, icons, sprites, screenshots
scripts/             Asset/sprites/icon maintenance scripts
subgraph/            Standalone Graph Protocol subgraph package
types/               Ambient TypeScript declarations
vendor/              Vendored third-party chart library (excluded from lint/tsc)
```

## Architecture

At a high level:

```text
Browser (Next.js client components)
  ├─ Wagmi / Reown AppKit ──────────────> Arbitrum Sepolia RPC
  ├─ Pyth Hermes / Benchmarks ──────────> live and historical prices
  ├─ Goldsky GraphQL ───────────────────> orders, positions, community markets
  ├─ WebSocket relayer ─────────────────> session creation, batch execution
  │    └─ session key signed locally, stored in browser IndexedDB
  └─ Grok WebSocket ────────────────────> AI agent chat and tool calls

Next.js server routes
  ├─ /api/assets ───────────────────────> local Pyth asset metadata
  ├─ /api/limit-orders ─────────────────> Alchemy RPC event logs
  └─ /api/usdc-balance ─────────────────> Alchemy RPC balances/transfers
```

Important implementation notes:

- The app is **client-heavy**. Most trading and wallet logic runs in the browser.
- Session private keys are generated and stored in the browser (IndexedDB) so the relayer can execute signed batches. This was testnet-grade key handling and is **not suitable for production**.
- Options prices are calculated locally with a Black-Scholes model for indicative display; they are not an executable order book.
- Some dashboard data (for example the LP earnings chart) is explicitly mock data.
- `middleware.ts` redirects the old `testnet.brokerfi.trade` hostname to `brokerfi.trade`. The archived app is not intended to be deployed at that hostname.

## Related repositories

These components are **not part of this snapshot**. They lived in separate repositories and may be archived, incomplete, or out of sync with this frontend:

- **Contracts (Solidity / Foundry):** <https://github.com/TheNoobiCat/bf-contracts> (archived reference contracts)
- **FeatherEngine (off-chain options matching and liquidation engine, Go):** <https://github.com/TheNoobiCat/FeatherEngine>
- **InstantExecutionRelayer (gasless session-key relayer, Go):** <https://github.com/TheNoobiCat/InstantExecutionRelayer>

The original frontend repository is kept private as a full-history archive. This repository is the clean public snapshot.

Deployed contract addresses that were used by this frontend are recorded in `public/data/contracts.json`. Treat them as historical testnet addresses; do not assume they are live or safe.

## Environment variables

Copy `.env.example` to `.env.local` and fill in your own values. Never commit real keys or tokens.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_RPC_URL` | Browser | Arbitrum Sepolia RPC endpoint |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Browser | Reown/WalletConnect project ID |
| `NEXT_PUBLIC_TESTNET` | Browser | Shows testnet UI such as the faucet and marquee |
| `NEXT_PUBLIC_USDC_ADDRESS` | Browser | Test USDC contract address |
| `NEXT_PUBLIC_CHANNEL_FACTORY` | Browser | Instant Execution channel factory address |
| `NEXT_PUBLIC_RELAYER_URL` | Browser | Relayer HTTP base URL (faucet, leaderboard) |
| `NEXT_PUBLIC_RELAYER_WS_URL` | Browser | Relayer WebSocket URL |
| `NEXT_PUBLIC_GROK_WS_URL` | Browser | Grok agent WebSocket URL |
| `NEXT_PUBLIC_GOLDSKY_URL` | Browser | Goldsky subgraph GraphQL endpoint |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Browser | Cloudflare Turnstile site key |
| `ALCHEMY_KEY` | Server only | Alchemy key used by `/api/limit-orders` and `/api/usdc-balance` |
| `USDC_CONTRACT_ADDRESS` | Server only | USDC address used by `/api/usdc-balance` |
| `LOGOKIT_TOKEN` | Scripts only | Logokit API token for `scripts/download_icons.py` |

The app has hardcoded testnet fallbacks for several addresses and endpoints. They are historical values, not a supported deployment configuration.

## Local development

Prerequisites: Node.js 22+ and npm (the snapshot was verified on Node.js 24 / npm 11).

```bash
cp .env.example .env.local
# edit .env.local with your own values
npm ci
npm run dev
```

Open <http://localhost:3000>. Without a relayer, subgraph, RPC, and wallet project ID, only parts of the UI will work.

### Build and verification

```bash
npm ci
npx tsc --noEmit
npm run lint
npm run build
npm start
```

Notes on the build pipeline:

- `next.config.ts` no longer ignores TypeScript errors; `next build` runs type checking.
- `vendor/**` is excluded from both `tsc` and ESLint because it is third-party SolidJS source, not application code.
- The vendored chart package is still installed via `file:vendor/klinecharts-pro` and remains part of the build.
- `npm run lint` currently reports pre-existing warnings (`no-explicit-any`, `prefer-const`, unescaped JSX entities, React compiler advisories) but **zero errors**. They were left as warnings rather than rewriting retired code.
- `npx tsc --noEmit` and `npm run build` pass on the snapshot.

### Maintenance scripts

```bash
npm run optimize          # optimize assets and sprites
npm run optimize:assets
npm run optimize:sprites
LOGOKIT_TOKEN=... python scripts/download_icons.py
```

`scripts/download_icons.py` requires `LOGOKIT_TOKEN` in the environment and exits with a clear error if it is missing. No token is committed.

## Screenshots

The `public/screenshots/` directory contains three screenshots from the retired testnet UI (`perps.png`, `optionsmarkets.png`, `auraagent.png`). They are kept as historical references. They are not screenshots of a production or mainnet deployment, and the UI in this snapshot may differ from what they show.

## Security

See [SECURITY.md](SECURITY.md). Do not use this code with real funds. Report vulnerabilities privately rather than opening a public issue with exploit details.

Notable archived-code risks:

- Session private keys are stored in browser IndexedDB.
- Relayer and Grok endpoints are trusted WebSocket services.
- Several server routes call third-party RPC services with an `ALCHEMY_KEY`.
- The code contains historical testnet contract addresses and public client identifiers, not production secrets.
- There is no test coverage.

## License

Original source in this snapshot is released under the [MIT License](LICENSE). Vendored third-party code keeps its own license; see `vendor/klinecharts-pro/LICENSE` (Apache-2.0). Logos, trademarks, screenshots, and other brand assets remain the property of their respective owners and are included only as historical references.
