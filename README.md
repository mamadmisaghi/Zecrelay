# ZecRelay

An independent ZEC-paired Solana launchpad prototype. The visual layout takes its sidebar and launch workflow from the earlier TelePay project; none of TelePay's Telegram accounts, database records, treasury configuration or production hosting are used.

**Current status:** the frontend builds; the API, accounting, and 1Click native ZEC integration are implemented and covered by local tests. A live Pump launch and native Zcash payout have **not** yet been executed on mainnet. Launches and native payouts default to **disabled**. Do not call this production ready until a funded small-value end-to-end test finishes.

## Product flows

- Create a Pump.fun `create_v2` coin with the supported ZEC Solana mint as its quote asset. The connected Solana wallet signs; the application generates and co-signs the mint key. Optional initial ZEC buy is included in the creation transaction.
- **Holder rewards:** Pump.fun records the holder reward mode on chain and controls rewards to token holders on Solana. There is no Zcash address or creator payout for this mode.
- **Creator rewards:** a unique platform-controlled creator address belongs to each coin, so per-token fees stay attributable. The creator provides a checksummed, transparent native Zcash `t` address. Once collection and sweeps are finalized, the system can reserve a payout, obtain an exact ZEC-to-ZEC bridge quote, send ZEC on Solana to the quoted deposit address, and mark the payout confirmed only after the bridge reports a native Zcash transaction hash.
- Creator payout is **custodial**. The private mint and creator keys are encrypted in the isolated PostgreSQL database; no private key is committed to GitHub. Bridge/refund failures require operator review and never become a confirmed payout automatically.
- This first version supports native **transparent** ZEC payouts only. A `t` address, its received amount, and parts of the settlement path can be publicly traced. Shielded transactions are a separate research/test phase.

## Run locally

Requires Node.js 24+, npm, and PostgreSQL. Copy `api/.env.example` to `api/.env` and fill the required variables (the env file is ignored by git). Start PostgreSQL with an independent, empty ZecRelay database.

```sh
npm ci
npm run test
npm run dev
```

Run the API in another terminal: `node --env-file=api/.env api/src/server.mjs`. The frontend is served on `http://localhost:5173` and proxies `/api` to port 3001. Run `node --env-file=api/.env api/src/worker.mjs` separately to confirm launches and process settled fees.

## Deployment

Create a **new** Railway project with a new PostgreSQL service. Point the web/API service and worker service to this repository; the web/API service builds with `npm run build` and starts with `npm run start`; the worker starts with `npm run worker`. Both need the same `DATABASE_URL`, `SOLANA_RPC_URL`, `SOLANA_CLUSTER`, `KEY_ENCRYPTION_KEY`, and fee operator configuration. `PUBLIC_ORIGIN` must be the new service's HTTPS origin (no trailing slash). The API serves the built frontend from `dist/`. The worker needs an independent funded Solana gas payer (`OPERATOR_KEYPAIR`) and ZEC treasury (`TREASURY_KEYPAIR`); those are deployment secrets, never files in the repo.

Activation order:

1. Deploy with all write flags `false`. Check `/api/health` and `/api/status` plus the Pump quote mint and network hash from your RPC.
2. Check the official ZEC mint still appears among Pump's supported pairs. Fund a **new** test wallet with SOL and the exact ZEC mint on Solana. Enable `LAUNCHES_ENABLED=true` for a tiny holder rewards launch first; verify the on-chain curve's quote and reward flags.
3. Supply a separate Solana treasury, gas payer, and a 1Click partner API key in Railway. Validate that 1Click currently lists the **exact** Solana ZEC mint and native ZEC pair. Set `COLLECTIONS_ENABLED=true` and `NATIVE_PAYOUTS_ENABLED=true` only when the operator can monitor bridge deposits and refunds.
4. Launch one tiny creator reward token, generate fees, watch collection, sweep, bridge quote, Solana deposit and native `t`-address receipt. Compare exact raw amounts and the bridge fee. Keep payout size caps small (`MIN_NATIVE_PAYOUT_RAW`, `MAX_NATIVE_PAYOUT_RAW`) until fully reconciled.
5. On bridge `FAILED`, `REFUNDED`, expired quote after submission, or an ambiguous on-chain state, pause native payouts and reconcile funds manually. Do not release reserved funds or retry from a new quote without checking both chains.

No TelePay secret, Railway project, token or treasury should be copied into this service. To use an existing wallet later, first reconcile its legacy liabilities and move only the intended testing funds to a fresh address. The Zcash `t` address is immutable for a token in this initial flow. There is no ownership proof for that address; the connected wallet confirms its spelling before signing.

## Test commands

`npm run test` exercises address checksums, encryption, backend validation, fee isolation across two tokens, and exact bridge asset/recipient/refund checking with no transfer of funds. `npm run build` verifies the frontend bundle. A local test cannot prove mainnet RPC access, a Pump transaction, supported pair liquidity, or delivery by the external bridge.

Source documentation: [Pump custom pairs](https://pump.fun/docs/custom-pairs), [Pump holder rewards](https://github.com/pump-fun/pump-public-docs/blob/main/docs/HOLDER_REWARDS_README.md), [Pump collect creator fees](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COLLECT_CREATOR_FEE.md), [NEAR Intents 1Click flow](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request), [Zcash transparency](https://zcash.readthedocs.io/en/latest/rtd_pages/ux_wallet_checklist.html).
