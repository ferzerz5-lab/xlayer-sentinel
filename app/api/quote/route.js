import { getSwapQuote } from "../../../lib/okxMarket";

export const dynamic = "force-dynamic";

// Verified addresses, X Layer MAINNET — same sources as lib/okxMarket.js:
// WOKB: OKX's own GitHub token list + OKLink explorer.
// USDC: Circle's official contract address list.
const USDC = "0xb6ceceab302e2e4948951ee7843fc24e92933061";
const WOKB = "0xe538905cf8410324e03a5a23c1c177a474d59b2b";

export async function GET() {
  // Fixed demo amount matching the scenario shown in the Actions view: 200 USDC.
  // USDC has 6 decimals, so 200 USDC = 200000000 in raw units.
  const quote = await getSwapQuote({
    fromTokenAddress: USDC,
    toTokenAddress: WOKB,
    amount: "200000000",
    chainIndex: "196",
  });

  return Response.json(quote);
}
