import crypto from "crypto";

// OKX's Market API uses HMAC-SHA256 request signing, not a simple bearer token.
// Docs: https://web3.okx.com/onchainos/dev-docs/home/api-access-and-usage
//
// Signing recipe (per OKX's own docs):
// 1. prehash = timestamp + method + requestPath + body
// 2. signature = base64(HMAC_SHA256(prehash, OKX_API_SECRET))
// 3. Send as headers: OK-ACCESS-KEY, OK-ACCESS-SIGN, OK-ACCESS-TIMESTAMP, OK-ACCESS-PASSPHRASE
//
// Credentials come from web3.okx.com's Developer Portal (connect a wallet, create a
// project, generate an API key — no card, no KYC beyond an email/phone link).

function sign(timestamp, method, requestPath, body, secret) {
  const prehash = `${timestamp}${method}${requestPath}${body}`;
  return crypto.createHmac("sha256", secret).update(prehash).digest("base64");
}

function getAuthHeaders(method, requestPath, body = "") {
  const apiKey = process.env.OKX_API_KEY;
  const secret = process.env.OKX_API_SECRET;
  const passphrase = process.env.OKX_API_PASSPHRASE;
  if (!apiKey || !secret || !passphrase) return null;

  const timestamp = new Date().toISOString();
  const signature = sign(timestamp, method, requestPath, body, secret);

  return {
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": passphrase,
    "Content-Type": "application/json",
  };
}

// Verified WOKB and USDC contract addresses on X Layer MAINNET (chainIndex "196").
// WOKB verified against OKX's own GitHub token list (github.com/okx/xlayer-tokenlist)
// and OKLink, X Layer's official block explorer.
// USDC verified against Circle's official contract address list.
//
// Note: this intentionally queries MAINNET, not testnet — OKX's Market API reflects
// real trading activity, and testnet pools don't have organic volume to analyze.
// Your wallet balance reads elsewhere in the app stay on testnet; this one data point
// is real mainnet market context used to reason about a hypothetical trade.
const MARKET_TOKENS = [
  { symbol: "WOKB", chainIndex: "196", address: "0xe538905cf8410324e03a5a23c1c177a474d59b2b" },
  { symbol: "USDC", chainIndex: "196", address: "0xb6ceceab302e2e4948951ee7843fc24e92933061" },
];

export async function getPoolMarketData() {
  const requestPath = "/api/v6/dex/market/price-info";
  const body = JSON.stringify(
    MARKET_TOKENS.map((t) => ({ chainIndex: t.chainIndex, tokenContractAddress: t.address }))
  );
  const headers = getAuthHeaders("POST", requestPath, body);

  if (!headers) {
    console.log("[Sentinel] OKX Market API credentials not set");
    return { available: false, tokens: [] };
  }

  try {
    const res = await fetch(`https://web3.okx.com${requestPath}`, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.log("[Sentinel] OKX Market API error:", res.status, errText);
      return { available: false, tokens: [] };
    }

    const json = await res.json();
    if (json.code !== "0") {
      console.log("[Sentinel] OKX Market API returned error code:", json.code, json.msg);
      return { available: false, tokens: [] };
    }

    const tokens = json.data.map((d, i) => ({
      symbol: MARKET_TOKENS[i].symbol,
      volume24H: d.volume24H,
      volume1H: d.volume1H,
      txs24H: d.txs24H,
      txs1H: d.txs1H,
      liquidity: d.liquidity,
      priceChange24H: d.priceChange24H,
    }));

    console.log("[Sentinel] OKX Market data fetched:", tokens);
    return { available: true, tokens };
  } catch (e) {
    console.log("[Sentinel] OKX Market API fetch threw:", e.message);
    return { available: false, tokens: [] };
  }
}
