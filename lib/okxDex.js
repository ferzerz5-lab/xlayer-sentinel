// Not wired up yet — this is the next real piece to build.
//
// OKX's DEX API needs a signed request (API key + secret + passphrase, HMAC signature
// on every call). Docs: https://web3.okx.com/onchainos/dev-docs/trade/dex-api-introduction
//
// Flow once implemented:
// 1. getQuote(fromToken, toToken, amount) -> calls OKX DEX "quote" endpoint server-side
//    (never expose your OKX API secret to the browser — route this through an API route
//    the same way app/api/briefing/route.js does).
// 2. getSwapCalldata(...) -> calls the "swap" endpoint, which returns transaction calldata.
// 3. Frontend takes that calldata and sends it with the connected wallet:
//      await window.ethereum.request({
//        method: "eth_sendTransaction",
//        params: [{ from: address, to: calldata.to, data: calldata.data, value: calldata.value }],
//      });
// 4. Store the resulting tx hash and show it in the Activity view, linked to the
//    X Layer explorer (see lib/chains.js explorerTxUrl helper).
//
// Test this end-to-end on X Layer TESTNET with a funded test wallet before ever pointing
// it at mainnet. A swap that fails silently or sends to the wrong calldata is exactly the
// kind of thing a hackathon demo can't afford to have happen live.

export async function getQuote() {
  throw new Error("Not implemented yet — see comments in this file.");
}
