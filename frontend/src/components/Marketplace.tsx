"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Zap, Leaf, MapPin, Building2,
  ArrowUpRight, ArrowDownRight, Activity, RefreshCw, AlertTriangle
} from "lucide-react";
import { ethers } from "ethers";
import { getReadContract, getSignedContract, CONTRACT_ADDRESS } from "@/lib/contract";

// Token ID 1 = REC, Token ID 2 = CCC
const SOURCE_NAMES: Record<string, string> = { "1": "Solar", "2": "Wind" };
const SOURCE_COLORS: Record<string, string> = { Solar: "#39FF14", Wind: "#00F5FF", Hydro: "#9B59FF", Hydel: "#FF9F1C" };
const CCC_PRICE_INR = 850;

// Demo listings shown when no on-chain listings exist
const DUMMY_REC_LISTINGS: Listing[] = [
  { listingId: 9001, seller: "0xDEMO0000000000000000000000000000000SOLAR1", tokenId: 1, amount: BigInt(250), priceInInr: BigInt(4200), active: true },
  { listingId: 9002, seller: "0xDEMO0000000000000000000000000000000WIND01", tokenId: 1, amount: BigInt(500), priceInInr: BigInt(3800), active: true },
  { listingId: 9003, seller: "0xDEMO0000000000000000000000000000000HYDRO1", tokenId: 1, amount: BigInt(180), priceInInr: BigInt(4500), active: true },
];

const DUMMY_CCC_LISTINGS: Listing[] = [
  { listingId: 9101, seller: "0xDEMO0000000000000000000000000000000CCC001", tokenId: 2, amount: BigInt(100), priceInInr: BigInt(850), active: true },
  { listingId: 9102, seller: "0xDEMO0000000000000000000000000000000CCC002", tokenId: 2, amount: BigInt(300), priceInInr: BigInt(820), active: true },
];

type Listing = {
  listingId: number;
  seller: string;
  tokenId: number;
  amount: bigint;
  priceInInr: bigint;
  active: boolean;
};

function StatusBadge({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: "4px 10px", borderRadius: 6, background: `${color}20`, border: `1px solid ${color}40`, fontSize: 11, fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace" }}>
      {text}
    </div>
  );
}

const SOURCE_NAMES_BY_ID: Record<number, string> = { 1: "Solar", 9002: "Wind", 9003: "Hydro" };

function RECCard({ listing, onBuy, walletAddress }: { listing: Listing; onBuy: (l: Listing) => void; walletAddress?: string | null }) {
  const isDummy = listing.listingId >= 9000;
  const srcName = isDummy ? (SOURCE_NAMES_BY_ID[listing.listingId] || "Solar") : (SOURCE_NAMES[listing.tokenId.toString()] || "Solar");
  const color = SOURCE_COLORS[srcName] || "#39FF14";
  const isSelf = !isDummy && walletAddress?.toLowerCase() === listing.seller.toLowerCase();

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -6 }}
      className="glass-card" style={{ padding: 24, position: "relative", overflow: "hidden", cursor: "pointer" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <StatusBadge text={`⚡ ${srcName.toUpperCase()}`} color={color} />
        <StatusBadge text="✓ VERIFIED" color="#39FF14" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Building2 size={14} color="#888" />
        <span style={{ fontSize: 15, fontWeight: 700 }}>{isDummy ? `Demo Seller (${srcName})` : `${listing.seller.slice(0, 6)}…${listing.seller.slice(-4)}`}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <MapPin size={12} color="#888" />
        <span style={{ fontSize: 12, color: "#888" }}>Listing #{listing.listingId.toString().padStart(4, "0")}</span>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 10, color: "#666", letterSpacing: 1, marginBottom: 4 }}>VOLUME AVAILABLE</div>
        <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>
          {listing.amount.toString()} <span style={{ fontSize: 13, fontWeight: 400, color: "#888" }}>units</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: "#666", letterSpacing: 1 }}>PRICE / unit</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#F0F0F0" }}>₹{listing.priceInInr.toString()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#666", letterSpacing: 1 }}>TOKEN ID</div>
          <div style={{ fontSize: 13, color: "#888", fontFamily: "'JetBrains Mono', monospace" }}>#{listing.tokenId}</div>
        </div>
      </div>

      <button id={`buy-rec-${listing.listingId}`} onClick={() => onBuy(listing)}
        disabled={!walletAddress || isSelf}
        className="btn-primary" style={{ width: "100%", opacity: (walletAddress && !isSelf) ? 1 : 0.5 }}>
        {!walletAddress ? "Connect Wallet to Buy" : isSelf ? "Your Listing" : isDummy ? "🔮 Demo Buy" : "Buy with MetaMask"}
      </button>
    </motion.div>
  );
}

function CCCTradingDesk({ walletAddress, cccBalance }: { walletAddress?: string | null; cccBalance: string }) {
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const total = amount ? (parseFloat(amount) * CCC_PRICE_INR).toFixed(2) : "0.00";

  const handleListCCC = async () => {
    if (!walletAddress || !amount) return;
    setLoading(true); setTxStatus(null);

    // --- DEMO MODE for CCC buy ---
    if (mode === "buy") {
      await new Promise(r => setTimeout(r, 1200));
      const fakeTx = `0xdemo${Math.random().toString(36).slice(2, 12)}`;
      // Record to Supabase
      await fetch('/api/record-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_hash: fakeTx,
          buyer_address: walletAddress,
          asset_type: 'CCC',
          token_id: 2,
          amount: parseFloat(amount),
          price_inr: parseFloat(amount) * CCC_PRICE_INR,
          listing_id: 'demo',
          is_demo: true,
          status: 'demo',
        }),
      });
      setTxStatus(`✅ Demo CCC purchase complete! 🎉 ${amount} CCC tokens recorded. Tx: ${fakeTx.slice(0, 14)}…`);
      setLoading(false);
      return;
    }
    try {
      const contract = await getSignedContract();
      // Check approval
      const approved = await contract.isApprovedForAll(walletAddress, CONTRACT_ADDRESS);
      if (!approved) {
        const approveTx = await contract.setApprovalForAll(CONTRACT_ADDRESS, true);
        setTxStatus("⏳ Approving contract… waiting for confirmation…");
        await approveTx.wait();
      }
      const tx = await contract.listCredits(2, BigInt(amount), BigInt(Math.round(parseFloat(total))));
      setTxStatus("⏳ Transaction sent… waiting for confirmation…");
      await tx.wait();
      setTxStatus(`✅ Listed ${amount} CCC tokens! Tx: ${tx.hash.slice(0, 10)}…`);
    } catch (e: any) {
      setTxStatus(`❌ ${e?.reason || e?.message || "Transaction failed."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Leaf size={22} color="#00F5FF" />
        <h3 style={{ fontSize: 20, fontWeight: 700 }}>CCC Trading Desk</h3>
        <div style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 6, background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", fontSize: 11, color: "#00F5FF", fontFamily: "'JetBrains Mono', monospace" }}>
          1 CCC = 1 t CO₂
        </div>
      </div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 28 }}>
        Your balance: <span style={{ color: "#39FF14", fontWeight: 700 }}>{cccBalance} CCC</span>. List your tokens or buy from REC channel above.
      </p>

      {/* Live price bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "CCC Spot Price", value: "₹850", change: "+2.3%", up: true },
          { label: "24h Volume", value: "₹18.4L", change: "+8.1%", up: true },
          { label: "Open Interest", value: "2,100 t", change: "-0.5%", up: false },
          { label: "Market Cap", value: "₹35.7Cr", change: "+1.8%", up: true },
        ].map((s) => (
          <div key={s.label} className="glass-card" style={{ flex: 1, minWidth: 120, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: s.up ? "#39FF14" : "#FF4444" }}>
              {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{s.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          {/* Buy/List toggle */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button id="ccc-buy-tab" onClick={() => setMode("buy")}
              style={{ flex: 1, padding: "12px 0", background: mode === "buy" ? "rgba(0,245,255,0.15)" : "transparent", color: mode === "buy" ? "#00F5FF" : "#888", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Outfit', sans-serif", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              💰 BUY CCC
            </button>
            <button id="ccc-sell-tab" onClick={() => setMode("sell")}
              style={{ flex: 1, padding: "12px 0", background: mode === "sell" ? "rgba(255,68,68,0.15)" : "transparent", color: mode === "sell" ? "#FF4444" : "#888", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
              ↓ LIST for SALE
            </button>
          </div>

          {mode === "buy" ? (
            <>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 8, letterSpacing: 1 }}>AMOUNT (CCC to buy)</label>
              <input id="ccc-buy-amount-input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter tonnes CO₂" className="cyber-input" style={{ marginBottom: 16 }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <span style={{ color: "#888", fontSize: 13 }}>Total Cost (INR)</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#00F5FF" }}>₹{parseFloat(total || "0").toLocaleString("en-IN")}</span>
              </div>
              {[DUMMY_CCC_LISTINGS[0], DUMMY_CCC_LISTINGS[1]].map((l) => (
                <div key={l.listingId} onClick={() => setAmount(l.amount.toString())}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", marginBottom: 8, borderRadius: 8, background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.12)", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, color: "#aaa" }}>{l.amount.toString()} t CO₂ available</span>
                  <span style={{ fontSize: 12, color: "#00F5FF", fontFamily: "'JetBrains Mono', monospace" }}>₹{l.priceInInr.toString()}/t</span>
                </div>
              ))}
              <button id="ccc-buy-btn" className="btn-primary" onClick={() => handleListCCC()}
                disabled={loading || !walletAddress || !amount}
                style={{ width: "100%", background: "linear-gradient(135deg, #00F5FF, #0099CC)", opacity: (walletAddress && amount) ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
                {loading ? "Processing…" : "🔮 Demo Buy CCC"}
              </button>
              {txStatus && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 12, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "#aaa", fontFamily: "'JetBrains Mono', monospace" }}>
                  {txStatus}
                </motion.div>
              )}
            </>
          ) : (
            <>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 8, letterSpacing: 1 }}>AMOUNT (CCC tokens to list)</label>
              <input id="ccc-amount-input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter tonnes CO₂" className="cyber-input" style={{ marginBottom: 16 }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
                <span style={{ color: "#888", fontSize: 13 }}>Reference Value (INR)</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#39FF14" }}>₹{parseFloat(total || "0").toLocaleString("en-IN")}</span>
              </div>
              <button id="ccc-block-deal-btn" className="btn-danger" onClick={handleListCCC}
                disabled={loading || !walletAddress || !amount}
                style={{ width: "100%", opacity: (walletAddress && amount) ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? "Processing…" : "⚡ List via MetaMask"}
              </button>
              {txStatus && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 12, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "#aaa", fontFamily: "'JetBrains Mono', monospace" }}>
                  {txStatus}
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Order book */}
        <div>
          <h4 style={{ fontSize: 13, color: "#888", letterSpacing: 1, marginBottom: 12 }}>ORDER BOOK</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontSize: 10, color: "#666", letterSpacing: 1, marginBottom: 8, padding: "0 4px" }}>
            <span>PRICE (₹)</span><span style={{ textAlign: "center" }}>SIZE (t)</span><span style={{ textAlign: "right" }}>TOTAL</span>
          </div>
          {[[920, 45, "41,400"], [890, 120, "1,06,800"], [870, 80, "69,600"], [860, 200, "1,72,000"]].map(([p, s, t], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontSize: 12, color: "#FF6666", fontFamily: "'JetBrains Mono', monospace", padding: "5px 4px", background: i % 2 === 0 ? "rgba(255,68,68,0.03)" : "transparent", borderRadius: 4, position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: "rgba(255,68,68,0.06)", width: `${20 + i * 12}%`, borderRadius: 4 }} />
              <span>{p.toLocaleString()}</span><span style={{ textAlign: "center", color: "#aaa" }}>{s}</span><span style={{ textAlign: "right", color: "#888" }}>{t}</span>
            </div>
          ))}
          <div style={{ textAlign: "center", padding: "8px 0", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: "#39FF14", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }}>
            ₹850 <span style={{ fontSize: 10, color: "#666" }}>LAST</span>
          </div>
          {[[840, 150, "1,26,000"], [830, 90, "74,700"], [810, 310, "2,51,100"], [800, 500, "4,00,000"]].map(([p, s, t], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontSize: 12, color: "#39FF14", fontFamily: "'JetBrains Mono', monospace", padding: "5px 4px", background: i % 2 === 0 ? "rgba(57,255,20,0.03)" : "transparent", borderRadius: 4, position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: "rgba(57,255,20,0.06)", width: `${15 + i * 10}%`, borderRadius: 4 }} />
              <span>{p.toLocaleString()}</span><span style={{ textAlign: "center", color: "#aaa" }}>{s}</span><span style={{ textAlign: "right", color: "#888" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Marketplace({ walletAddress }: { walletAddress?: string | null }) {
  const [activeTab, setActiveTab] = useState<"rec" | "ccc">("rec");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [cccBalance, setCccBalance] = useState("—");

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const contract = getReadContract();
      const total: bigint = await contract.nextListingId();
      const results: Listing[] = [];
      for (let i = 0; i < Number(total); i++) {
        const l = await contract.listings(i);
        if (l.active) {
          results.push({ listingId: i, seller: l.seller, tokenId: Number(l.tokenId), amount: l.amount, priceInInr: l.priceInInr, active: l.active });
        }
      }
      // Always include demo listings so the UI is populated for testing
      setListings([...results, ...DUMMY_REC_LISTINGS, ...DUMMY_CCC_LISTINGS]);
    } catch (e) {
      console.error("Failed to fetch listings:", e);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  // Fetch CCC balance when wallet connects
  useEffect(() => {
    if (!walletAddress) { setCccBalance("—"); return; }
    (async () => {
      try {
        const contract = getReadContract();
        const bal = await contract.balanceOf(walletAddress, 2);
        setCccBalance(bal.toString());
      } catch { setCccBalance("N/A"); }
    })();
  }, [walletAddress]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleBuyREC = async (listing: Listing) => {
    if (!walletAddress) return;

    // --- DEMO MODE: simulate instant success for dummy listings ---
    if (listing.listingId >= 9000) {
      setTxStatus("⏳ Simulating purchase…");
      await new Promise(r => setTimeout(r, 1200));
      const fakeTx = `0xdemo${Math.random().toString(36).slice(2, 12)}`;
      // Record to Supabase
      await fetch('/api/record-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_hash: fakeTx,
          buyer_address: walletAddress,
          asset_type: listing.tokenId === 1 ? 'REC' : 'CCC',
          token_id: listing.tokenId,
          amount: Number(listing.amount),
          price_inr: Number(listing.priceInInr),
          listing_id: String(listing.listingId),
          is_demo: true,
          status: 'demo',
        }),
      });
      setTxStatus(`✅ Demo purchase recorded! 🎉 ${listing.amount.toString()} tokens. Tx: ${fakeTx.slice(0, 14)}…`);
      return;
    }

    setTxStatus("⏳ Awaiting MetaMask approval…");
    try {
      const contract = await getSignedContract();
      const isApproved = await contract.isApprovedForAll(listing.seller, CONTRACT_ADDRESS);
      if (!isApproved) {
        setTxStatus(`❌ Seller has not approved the contract to transfer tokens. Please ask the seller (${listing.seller.slice(0,8)}…) to approve first.`);
        return;
      }
      const response = await fetch('/api/execute-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.listingId, buyerAddress: walletAddress }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTxStatus(`✅ Purchase successful! Tx: ${(data.txHash || '').slice(0, 14)}… Refreshing listings…`);
      await fetchListings();
    } catch (e: any) {
      setTxStatus(`❌ ${e?.reason || e?.message || "Transaction failed."}`);
    }
  };

  const recListings = listings.filter(l => l.tokenId === 1);
  const cccListings = listings.filter(l => l.tokenId === 2);
  const displayListings = activeTab === "rec" ? recListings : cccListings;

  return (
    <section id="marketplace" style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Activity size={20} color="#39FF14" />
          <span style={{ fontSize: 12, color: "#39FF14", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>LIVE MARKETPLACE</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 12 }}>Trade <span className="gradient-text">Green Assets</span></h2>
            <p style={{ color: "#888", fontSize: 16, maxWidth: 540 }}>India's first on-chain REC and carbon credit exchange. Regulated, verifiable, and instant.</p>
          </div>
          <button onClick={fetchListings} disabled={loadingListings} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)", color: "#39FF14", cursor: "pointer", fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
            <RefreshCw size={14} className={loadingListings ? "animate-spin" : ""} /> {loadingListings ? "Loading…" : "Refresh"}
          </button>
        </div>
      </motion.div>

      {/* TX status banner */}
      <AnimatePresence>
        {txStatus && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 24, padding: "14px 20px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 13, color: "#aaa", fontFamily: "'JetBrains Mono', monospace", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{txStatus}</span>
            <button onClick={() => setTxStatus(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {[{ key: "rec", label: "⚡ REC Channel", color: "#39FF14", count: recListings.length }, { key: "ccc", label: "🍃 CCC Channel", color: "#00F5FF", count: cccListings.length }].map((tab) => (
          <button key={tab.key} id={`marketplace-tab-${tab.key}`} onClick={() => setActiveTab(tab.key as "rec" | "ccc")}
            style={{ padding: "12px 28px", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: activeTab === tab.key ? tab.color : "#888", borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent", transition: "all 0.2s" }}>
            {tab.label} <span style={{ fontSize: 11, opacity: 0.7 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "rec" || activeTab === "ccc" && activeTab !== "ccc" ? (
          <motion.div key="rec" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {loadingListings ? (
              <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
                <RefreshCw size={32} style={{ margin: "0 auto 16px" }} className="animate-spin" />
                <p>Fetching on-chain listings from Sepolia…</p>
              </div>
            ) : displayListings.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
                <AlertTriangle size={32} color="#FFB300" style={{ margin: "0 auto 16px" }} />
                <p>No active listings found. Be the first to list!</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>Connect your wallet, get tokens minted, and use the CCC tab to list them.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {displayListings.map((listing, i) => (
                  <motion.div key={listing.listingId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <RECCard listing={listing} onBuy={handleBuyREC} walletAddress={walletAddress} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="ccc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <CCCTradingDesk walletAddress={walletAddress} cccBalance={cccBalance} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
