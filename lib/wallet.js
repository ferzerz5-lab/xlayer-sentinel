"use client";

import { useState, useEffect, useCallback } from "react";
import { activeChain } from "./chains";

// Lightweight wallet hook using the raw EIP-1193 provider (window.ethereum).
// Works with MetaMask, OKX Wallet extension, and any other injected wallet —
// no wagmi/rainbowkit dependency, which keeps this simple to audit and deploy.
//
// If you'd rather support WalletConnect / mobile wallets too, swap this out
// for wagmi + the OKX Wallet connector later. For a hackathon submission,
// injected-provider support is enough to demo and to actually transact on X Layer.

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const getProvider = () => {
    if (typeof window === "undefined") return null;
    return window.ethereum || null;
  };

  const refreshAccounts = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      const accounts = await provider.request({ method: "eth_accounts" });
      setAddress(accounts && accounts.length > 0 ? accounts[0] : null);
      const cid = await provider.request({ method: "eth_chainId" });
      setChainId(parseInt(cid, 16));
    } catch (e) {
      // silent — this just means no wallet connected yet
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
    const provider = getProvider();
    if (!provider) return;

    const onAccountsChanged = (accounts) => setAddress(accounts?.[0] || null);
    const onChainChanged = (cid) => setChainId(parseInt(cid, 16));

    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refreshAccounts]);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setError("No wallet found. Install MetaMask or OKX Wallet.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      const cid = await provider.request({ method: "eth_chainId" });
      setChainId(parseInt(cid, 16));
      await switchToActiveChain();
    } catch (e) {
      setError(e?.message || "Connection rejected");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Injected providers don't have a real "disconnect" — this just clears local state.
    setAddress(null);
  }, []);

  const switchToActiveChain = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: activeChain.hex }],
      });
    } catch (switchError) {
      // 4902 = chain not added to wallet yet
      if (switchError.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: activeChain.hex,
              chainName: activeChain.name,
              nativeCurrency: activeChain.nativeCurrency,
              rpcUrls: activeChain.rpcUrls.default.http,
              blockExplorerUrls: [activeChain.blockExplorers.default.url],
            },
          ],
        });
      }
    }
  }, []);

  const isOnCorrectChain = chainId === activeChain.id;

  return { address, chainId, connecting, error, connect, disconnect, isOnCorrectChain, switchToActiveChain };
}
