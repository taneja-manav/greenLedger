"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Marketplace from "@/components/Marketplace";
import Ticker from "@/components/Ticker";

// SSR-safe dynamic imports
const Dashboard = dynamic(() => import("@/components/Dashboard"), { ssr: false });
const AdminPanel = dynamic(() => import("@/components/AdminPanel"), { ssr: false });

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install MetaMask extension.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code === 4001) {
        console.log("User rejected wallet connection.");
      } else {
        console.error("Wallet connection error:", err);
      }
    }
  }, []);

  return (
    <main style={{ position: "relative", zIndex: 1, paddingBottom: 56 }}>
      <Navbar walletAddress={walletAddress} onConnectWallet={connectWallet} />
      <HeroSection />
      <Marketplace walletAddress={walletAddress} />
      <Dashboard walletAddress={walletAddress} />
      <AdminPanel walletAddress={walletAddress} />
      <Ticker />
    </main>
  );
}
