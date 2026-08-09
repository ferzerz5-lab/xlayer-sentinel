import Anthropic from "@anthropic-ai/sdk";
import { createPublicClient, http, formatEther } from "viem";
import { activeChain } from "../../../lib/chains";

const client = createPublicClient({
  chain: { id: activeChain.id, name: activeChain.name, nativeCurrency: activeChain.nativeCurrency, rpcUrls: activeChain.rpcUrls },
  transport: http(activeChain.rpcUrls.default.http[0]),
});

async function getNativeBalance(address) {
  try {
    const balance = await client.getBalance({ address });
    return formatEther(balance);
  } catch (e) {
    return null;
  }
}

async function getTokenBalances(address) {
  const apiKey = process.env.COVALENT_API_KEY;
  if (!apiKey) return { available: false, positions: [] };
  try {
    const res = await fetch(
      `https://api.covalenthq.com/v1/xlayer-mainnet/address/${address}/balances_v2/`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return { available: false, positions: [] };
    const data = await res.json();
    const positions = (data?.data?.items || []).map((item) => ({
      symbol: item.contract_ticker_symbol,
      balance: item.balance,
      quote: item.quote,
    }));
    return { available: true, positions };
  } catch (e) {
    return { available: false, positions: [] };
  }
}

async function getPoolVolumeSignal() {
  return { available: false };
}

export async function POST(req) {
  try {
    const { address } = await req.json();
    if (!address) {
      return Response.json({ error: "Missing wallet address" }, { status: 400 });
    }

    const [nativeBalance, tokenData, volumeSignal] = await Promise.all([
      getNativeBalance(address),
      getTokenBalances(address),
      getPoolVolumeSignal(),
    ]);

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({
        trust_score: 68,
        steps: [
          { title: "[MOCK] Scanned wallet", detail: `Read native balance for ${address}: ${nativeBalance ?? "unavailable"} OKB. This is placeholder reasoning — no ANTHROPIC_API_KEY is set.` },
          { title: "[MOCK] No live model call made", detail: "Add ANTHROPIC_API_KEY to .env.local to replace this with a real Claude-generated reasoning trail." },
        ],
        recommendation: "[MOCK DATA] Set ANTHROPIC_API_KEY to get a real recommendation.",
        dataSourcesUsed: { nativeBalance: nativeBalance !== null, tokenBalances: tokenData.available, poolVolume: volumeSignal.available },
        mock: true,
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const dataSummary = `
Wallet address: ${address}
Native OKB balance: ${nativeBalance ?? "unavailable"}
Token balances available: ${tokenData.available ? "yes" : "no (Covalent/GoldRush API key not configured)"}
${tokenData.available ? JSON.stringify(tokenData.positions) : ""}
Pool volume data available: ${volumeSignal.available ? "yes" : "no (not wired up yet)"}
`.trim();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: `You are Sentinel, a risk-verification agent for wallets on X Layer (OKX's L2).
Your job is NOT to suggest what to buy. Your job is to flag risk before a user trades or
holds a position — pool manipulation signals, thin liquidity, concentration risk, contract
risk. Be honest about data you don't have; never invent specific numbers you weren't given.
Respond ONLY with valid JSON in this exact shape, nothing else:
{
  "trust_score": <integer 0-100>,
  "steps": [ { "title": "...", "detail": "..." }, ... 3 to 5 steps ],
  "recommendation": "..."
}`,
      messages: [{ role: "user", content: `Here is the real onchain data for this wallet:\n\n${dataSummary}\n\nProduce the risk-scan reasoning trail.` }],
    });

    const raw = message.content.find((b) => b.type === "text")?.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { trust_score: null, steps: [], recommendation: raw };
    }

    return Response.json({
      ...parsed,
      dataSourcesUsed: {
        nativeBalance: nativeBalance !== null,
        tokenBalances: tokenData.available,
        poolVolume: volumeSignal.available,
      },
    });
  } catch (e) {
    return Response.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}