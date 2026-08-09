# Sentinel — risk verification for X Layer

An AI agent that scans a wallet and the pools it's about to trade into on X Layer, flags
manipulation and risk signals (like wash-trading-style volume spikes), and requires an
explicit "proceed anyway or cancel" decision before anything executes — built for the
BuildX AI Season Hackathon.

## What's real vs. what's still a placeholder

**Real:**
- Next.js app, deployable as-is to Vercel
- Wallet connection via any injected EIP-1193 wallet (MetaMask, OKX Wallet extension) — real `eth_requestAccounts`, real chain detection, prompts to add/switch to X Layer if the wallet isn't on it
- `/api/briefing` reads a real native OKB balance from X Layer directly via `viem`, and calls the real Anthropic API to generate the reasoning trail — this is not a hardcoded script

**Still placeholder — do these before submitting:**
1. **Token balances**: `getTokenBalances()` in `app/api/briefing/route.js` expects a `COVALENT_API_KEY`. Confirm the correct Covalent/GoldRush chain slug for X Layer and drop your key into `.env.local`.
2. **Pool volume data**: `getPoolVolumeSignal()` is unimplemented. Wire it to OKX's DEX market API so the "wash trading" flag is computed from real 24h volume vs. 30-day average, not asserted by the model without evidence.
3. **Swap execution**: `lib/okxDex.js` is a stub. Follow the comments in that file to get a real quote and send a real `eth_sendTransaction` on X Layer testnet.
4. **Activity log**: still sample rows. Once you've made real testnet transactions, pull them from Covalent's transaction history endpoint instead.
5. **Smart contract, if you want one**: nothing here requires a custom contract — the agent reads state and triggers swaps through OKX's DEX aggregator. If you want an onchain footprint that's fully yours (stronger for "integration with X Layer"), consider a small contract that logs each risk-scan result onchain. `/mnt/skills` doesn't cover Solidity — ask me when you're ready and we'll scaffold one with Foundry or Hardhat.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY at minimum
npm run dev
```

Open http://localhost:3000. Connect a wallet — you'll be prompted to add/switch to X Layer
Testnet (chain ID 1952) if you're not already on it.

## Get testnet funds

X Layer testnet uses OKB as gas. Use the official faucet linked from OKX's X Layer dev
portal (https://web3.okx.com/xlayer/docs) to fund your test wallet before trying any
transaction flow.

## Deploy

```bash
vercel deploy
```

Set the same environment variables (`ANTHROPIC_API_KEY`, `COVALENT_API_KEY`, etc.) in the
Vercel project settings — don't commit `.env.local`.

## Network reference

| | Mainnet | Testnet |
|---|---|---|
| Chain ID | 196 | 1952 |
| RPC | https://rpc.xlayer.tech | https://testrpc.xlayer.tech/terigon |
| Explorer | https://www.okx.com/web3/explorer/xlayer | https://www.okx.com/web3/explorer/xlayer-test |

`lib/chains.js` controls which one the app targets — switch `activeChain` to
`xLayerMainnet` once you move to the Launch Grant phase after the hackathon deadline.

## Hackathon submission checklist

- [ ] Deploy on X Layer Testnet, confirm end-to-end, then deploy to Mainnet
- [ ] Dedicated project X account, active before submission, posting build updates
- [ ] Public GitHub repo (update the placeholder URL in `components/Sentinel.jsx` → `projectLinks`)
- [ ] Submission post tags @XLayerOfficial
- [ ] Submit via the official Google Form on the Build X page before Aug 21, 23:59 UTC
