"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, RefreshCw, Activity, Download, AlertTriangle, CheckCircle, Clock } from "lucide-react";

type Tx = {
  id: number;
  transactionHash: string;
  buyerAddress: string;
  assetType: string;
  tokenId: number;
  amount: number;
  amountInINR: number;
  listingId: string;
  isDemo: boolean;
  status: string;
  timestamp: string;
};

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();

export default function AdminPanel({ walletAddress }: { walletAddress?: string | null }) {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = !ADMIN_ADDRESS || walletAddress?.toLowerCase() === ADMIN_ADDRESS;

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/record-transaction');
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch { setTransactions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (walletAddress) fetchTxs(); }, [walletAddress, fetchTxs]);

  const filtered = transactions.filter(tx =>
    search === "" ||
    tx.transactionHash?.includes(search) ||
    tx.buyerAddress?.toLowerCase().includes(search.toLowerCase()) ||
    tx.assetType?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValueINR = transactions.reduce((s, t) => s + (t.amountInINR || 0), 0);
  const demoCount = transactions.filter(t => t.isDemo).length;
  const liveCount = transactions.filter(t => !t.isDemo).length;

  const exportCSV = () => {
    const headers = ["Hash", "Buyer", "Asset", "Amount", "Value (INR)", "Demo?", "Status", "Time"];
    const rows = filtered.map(t => [t.transactionHash, t.buyerAddress, t.assetType, t.amount, t.amountInINR, t.isDemo ? "Yes" : "No", t.status, t.timestamp]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "greenledger_transactions.csv"; a.click();
  };

  if (!walletAddress) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", color: "#888" }}>
        <Shield size={48} color="#FFB300" style={{ margin: "0 auto 16px" }} />
        <p style={{ fontSize: 16 }}>Connect your wallet to access the Admin Panel.</p>
      </div>
    );
  }

  return (
    <section id="admin" style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Shield size={20} color="#FF9F1C" />
          <span style={{ fontSize: 12, color: "#FF9F1C", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>REGULATOR ADMIN</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <h2 className="section-title">Audit <span className="gradient-text">Trail</span></h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={fetchTxs} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, background: "rgba(255,159,28,0.08)", border: "1px solid rgba(255,159,28,0.25)", color: "#FF9F1C", cursor: "pointer", fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
              <RefreshCw size={14} /> {loading ? "Loading…" : "Refresh"}
            </button>
            <button onClick={exportCSV}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)", color: "#39FF14", cursor: "pointer", fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Transactions", value: transactions.length, color: "#FF9F1C" },
          { label: "Live (On-chain)", value: liveCount, color: "#39FF14" },
          { label: "Demo Simulated", value: demoCount, color: "#00F5FF" },
          { label: "Total Value (INR)", value: `₹${totalValueINR.toLocaleString("en-IN")}`, color: "#9B59FF" },
        ].map((s) => (
          <div key={s.label} className="glass-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by hash, address, asset…"
        className="cyber-input" style={{ marginBottom: 24, maxWidth: 480 }} />

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(255,159,28,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Tx Hash", "Buyer", "Asset", "Amount", "Value (INR)", "Demo?", "Status", "Time"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#888", fontSize: 10, letterSpacing: 1, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: "#888" }}>
                  <RefreshCw size={20} style={{ margin: "0 auto 8px" }} className="animate-spin" />Loading transactions from Supabase…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: "#888" }}>
                  <AlertTriangle size={24} color="#FFB300" style={{ margin: "0 auto 8px" }} />
                  No transactions found. Complete a buy to see records here.
                </td></tr>
              ) : filtered.map((tx, i) => (
                <tr key={tx.id || i}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", color: "#00F5FF", fontSize: 11 }}>
                    <a href={tx.isDemo ? "#" : `https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                      target={tx.isDemo ? "_self" : "_blank"} rel="noreferrer"
                      style={{ color: tx.isDemo ? "#888" : "#00F5FF", textDecoration: "none" }}>
                      {tx.transactionHash?.slice(0, 14)}…
                    </a>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    <a href={`https://sepolia.etherscan.io/address/${tx.buyerAddress}`} target="_blank" rel="noreferrer" style={{ color: "#aaa", textDecoration: "none" }}>
                      {tx.buyerAddress?.slice(0, 8)}…{tx.buyerAddress?.slice(-4)}
                    </a>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: tx.assetType === "REC" ? "#39FF14" : "#00F5FF" }}>{tx.assetType}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", color: "#aaa" }}>{tx.amount}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>₹{(tx.amountInINR || 0).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: tx.isDemo ? "rgba(0,245,255,0.1)" : "rgba(57,255,20,0.1)", color: tx.isDemo ? "#00F5FF" : "#39FF14", fontFamily: "'JetBrains Mono', monospace" }}>
                      {tx.isDemo ? "🔮 DEMO" : "⛓ LIVE"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: tx.status === "confirmed" || tx.status === "demo" ? "#39FF14" : "#FFB300" }}>
                      {tx.status === "confirmed" || tx.status === "demo" ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#666", fontSize: 11, whiteSpace: "nowrap" }}>
                    {tx.timestamp ? new Date(tx.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
