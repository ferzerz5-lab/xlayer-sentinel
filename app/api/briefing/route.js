import { createPublicClient, http, formatEther, formatUnits } from "viem";
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

const TRACKED_TOKENS = [
  {
    symbol: "USDC",
    address: "0xDec90b78111Ba2fc6FC6d84d8B9ec159A2d4b9B3",
    decimals: 6,
  },
];

const erc20BalanceAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

async function getTokenBalances(address) {
  try {
    const positions = [];
    for (const token of TRACKED_TOKENS) {
      const raw = await client.readContract({
        address: token.address,
        abi: erc20BalanceAbi,
        functionName: "balanceOf",
        args: [address],
      });
      positions.push({
        symbol: token.symbol,
        balance: formatUnits(raw, token.decimals),
      });
    }
    console.log("[Sentinel] Onchain token reads succeeded:", positions);
    return { available: true, positions };
  } catch (e) {
    console.log("[Sentinel] Onchain token read failed:", e.message);
    return { available: false, positions: [] };
  }
}

async function getPoolVolumeSignal() {
  return { available: false };
}

const SYSTEM_PROMPT = `You are Sentinel, a risk-verification agent for wallets on X Layer (OKX's L2).
Your job is NOT to suggest what to buy. Your job is to flag risk before a user trades or
holds a position — pool manipulation signals, thin liquidity, concentration risk, contract
risk. Be honest about data you don't have; never invent specific numbers you weren't given.
Respond ONLY with valid JSON in this exact shape, nothing else:
{
  "trust_score": <integer 0-100>,
  "steps": [ { "title": "...", "detail": "..." } ],
  "recommendation": "..."
}
Include 3 to 5 items in "steps".`;

async function callGemini(dataSummary) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [{ text: `Here is the real onchain data for this wallet:\n\n${dataSummary}\n\nProduce the risk-scan reasoning trail.` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return JSON.parse(text);
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

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        trust_score: 68,
        steps: [
          { title: "[MOCK] Scanned wallet", detail: `Read native balance for ${address}: ${nativeBalance ?? "unavailable"} OKB, plus ${tokenData.positions.map(p => `${p.balance} ${p.symbol}`).join(", ") || "no tracked tokens"}. This is placeholder reasoning — no GEMINI_API_KEY is set.` },
          { title: "[MOCK] No live model call made", detail: "Add GEMINI_API_KEY to .env.local to replace this with a real AI-generated reasoning trail." },
        ],
        recommendation: "[MOCK DATA] Set GEMINI_API_KEY to get a real recommendation.",
        dataSourcesUsed: { nativeBalance: nativeBalance !== null, tokenBalances: tokenData.available, poolVolume: volumeSignal.available },
        mock: true,
      });
    }

    const dataSummary = `
Wallet address: ${address}
Native OKB balance: ${nativeBalance ?? "unavailable"}
Token balances available: ${tokenData.available ? "yes (read directly from X Layer)" : "no"}
${tokenData.available ? JSON.stringify(tokenData.positions) : ""}
Pool volume data available: ${volumeSignal.available ? "yes" : "no (not wired up yet)"}
`.trim();

    let parsed;
    try {
      parsed = await callGemini(dataSummary);
    } catch (e) {
      console.log("[Sentinel] Gemini call failed:", e.message);
      return Response.json({ error: `AI reasoning call failed: ${e.message}` }, { status: 500 });
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
