// Official X Layer network details, from OKX's own dev docs:
// https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/network-information
//
// IMPORTANT: several third-party RPC list sites (chainlist.org, rpc.info) still show
// chain ID 195 for X Layer testnet — that is a deprecated network. The current testnet
// is chain ID 1952. Always double check against OKX's own docs page above if in doubt.

export const xLayerTestnet = {
  id: 1952,
  hex: "0x7A0",
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech/terigon"] },
  },
  blockExplorers: {
    default: { name: "X Layer Explorer (Testnet)", url: "https://www.okx.com/web3/explorer/xlayer-test" },
  },
};

export const xLayerMainnet = {
  id: 196,
  hex: "0xC4",
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "X Layer Explorer", url: "https://www.okx.com/web3/explorer/xlayer" },
  },
};

// Which chain the app expects wallets to be on. Flipped to xLayerMainnet per the
// hackathon rule requiring Mainnet launch after the Testnet build/test phase.
export const activeChain = xLayerMainnet;

export function explorerAddressUrl(chain, address) {
  return `${chain.blockExplorers.default.url}/address/${address}`;
}

export function explorerTxUrl(chain, hash) {
  return `${chain.blockExplorers.default.url}/tx/${hash}`;
}
