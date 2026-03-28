"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, TrendingUp, Zap, Leaf, AlertTriangle, Award, RefreshCw } from "lucide-react";
import { getReadContract } from "@/lib/contract";

const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
];

// Custom gauge using canvas
function ComplianceGauge({ value }: { value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const currentVal = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H * 0.72;
    const R = Math.min(W, H) * 0.38;

    const drawGauge = (v: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0, false);
      ctx.lineWidth = 18; ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineCap = "round"; ctx.stroke();
      const gradient = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      gradient.addColorStop(0, "#FF4444"); gradient.addColorStop(0.5, "#FFB300"); gradient.addColorStop(1, "#39FF14");
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, Math.PI + (v / 100) * Math.PI, false);
      ctx.lineWidth = 18; ctx.strokeStyle = gradient; ctx.lineCap = "round"; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, Math.PI + (v / 100) * Math.PI, false);
      ctx.lineWidth = 4; ctx.strokeStyle = v > 70 ? "rgba(57,255,20,0.4)" : v > 40 ? "rgba(255,179,0,0.4)" : "rgba(255,68,68,0.4)";
      ctx.shadowColor = v > 70 ? "#39FF14" : v > 40 ? "#FFB300" : "#FF4444"; ctx.shadowBlur = 15; ctx.stroke(); ctx.shadowBlur = 0;
      const needleAngle = Math.PI + (v / 100) * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(needleAngle), cy + R * Math.sin(needleAngle));
      ctx.lineWidth = 3; ctx.strokeStyle = "#ffffff"; ctx.lineCap = "round"; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.font = "bold 32px 'JetBrains Mono', monospace"; ctx.fillStyle = v > 70 ? "#39FF14" : v > 40 ? "#FFB300" : "#FF4444";
      ctx.textAlign = "center"; ctx.fillText(`${Math.round(v)}%`, cx, cy - 20);
      ctx.font = "13px 'Outfit', sans-serif"; ctx.fillStyle = "#888"; ctx.fillText("RPO Compliance", cx, cy + 4);
      ctx.font = "11px 'JetBrains Mono', monospace"; ctx.fillStyle = "#FF4444"; ctx.textAlign = "left"; ctx.fillText("0%", cx - R - 10, cy + 28);
      ctx.fillStyle = "#39FF14"; ctx.textAlign = "right"; ctx.fillText("100%", cx + R + 10, cy + 28);
    };

    const animate = () => {
      if (currentVal.current < value) {
        currentVal.current = Math.min(currentVal.current + 0.8, value);
        drawGauge(currentVal.current); animRef.current = requestAnimationFrame(animate);
      } else { drawGauge(value); }
    };
    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [value]);

  return <canvas ref={canvasRef} width={320} height={200} style={{ width: "100%", maxWidth: 320 }} />;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card" style={{ padding: "10px 14px", fontSize: 12 }}>
        <p style={{ color: "#888", marginBottom: 4 }}>{payload[0].name}</p>
        <p style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{payload[0].value} units</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ walletAddress }: { walletAddress?: string | null }) {
  const [recBalance, setRecBalance] = useState<string>("—");
  const [cccBalance, setCccBalance] = useState<string>("—");
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [portfolioData, setPortfolioData] = useState([
    { name: "REC Tokens", value: 0, color: "#39FF14" },
    { name: "CCC Tokens", value: 0, color: "#00F5FF" },
  ]);
  const [rpoTarget] = useState(72);
  const [liveTxs, setLiveTxs] = useState<any[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  const fetchLiveTxs = useCallback(async () => {
    if (!walletAddress) return;
    setLoadingTxs(true);
    try {
      const res = await fetch('/api/record-transaction');
      const data = await res.json();
      // Filter for this wallet's transactions
      const myTxs = (data.transactions || []).filter(
        (t: any) => t.buyerAddress?.toLowerCase() === walletAddress.toLowerCase()
      );
      setLiveTxs(myTxs.slice(0, 10));
    } catch { setLiveTxs([]); }
    finally { setLoadingTxs(false); }
  }, [walletAddress]);

  const fetchBalances = async () => {
    if (!walletAddress || typeof window === "undefined") return;
    setLoadingBalances(true);
    try {
      const contract = getReadContract();
      const [rec, ccc] = await Promise.all([
        contract.balanceOf(walletAddress, 1),
        contract.balanceOf(walletAddress, 2),
      ]);
      const recNum = Number(rec);
      const cccNum = Number(ccc);
      setRecBalance(recNum.toString());
      setCccBalance(cccNum.toString());
      setPortfolioData([
        { name: "REC Tokens", value: recNum, color: "#39FF14" },
        { name: "CCC Tokens", value: cccNum, color: "#00F5FF" },
      ]);
    } catch {
      setRecBalance("N/A"); setCccBalance("N/A");
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => { fetchBalances(); }, [walletAddress]);
  useEffect(() => { fetchLiveTxs(); }, [fetchLiveTxs]);

  const statusColor = rpoTarget >= 80 ? "#39FF14" : rpoTarget >= 50 ? "#FFB300" : "#FF4444";
  const statusLabel = rpoTarget >= 80 ? "COMPLIANT" : rpoTarget >= 50 ? "AT RISK" : "NON-COMPLIANT";

  const totalValue = (Number(recBalance === "N/A" || recBalance === "—" ? 0 : recBalance) * 4200) +
    (Number(cccBalance === "N/A" || cccBalance === "—" ? 0 : cccBalance) * 850);

  return (
    <section id="dashboard" style={{ padding: "80px 24px", maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Activity size={20} color="#00F5FF" />
          <span style={{ fontSize: 12, color: "#00F5FF", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>USER DASHBOARD</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Your <span className="gradient-text">Green Portfolio</span></h2>
          {walletAddress && (
            <button onClick={fetchBalances} disabled={loadingBalances}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)", color: "#00F5FF", cursor: "pointer", fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
              <RefreshCw size={14} /> {loadingBalances ? "Loading…" : "Refresh"}
            </button>
          )}
        </div>
        {!walletAddress && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, background: "rgba(255,179,0,0.08)", border: "1px solid rgba(255,179,0,0.25)", maxWidth: 420, marginTop: 16 }}>
            <AlertTriangle size={14} color="#FFB300" />
            <span style={{ color: "#FFB300", fontSize: 13 }}>Connect wallet to see live balances from Sepolia chain.</span>
          </div>
        )}
      </motion.div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { icon: Zap, label: "REC Balance", value: loadingBalances ? "…" : recBalance, unit: "MWh", color: "#39FF14" },
          { icon: Leaf, label: "CCC Balance", value: loadingBalances ? "…" : cccBalance, unit: "t CO₂", color: "#00F5FF" },
          { icon: TrendingUp, label: "Portfolio Value", value: walletAddress ? `₹${totalValue.toLocaleString("en-IN")}` : "—", unit: "INR (est.)", color: "#9B59FF" },
          { icon: Award, label: "RPO Status", value: statusLabel, unit: `${rpoTarget}%`, color: statusColor },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="glass-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <s.icon size={16} color={s.color} />
              <span style={{ fontSize: 11, color: "#888", letterSpacing: 1 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#666" }}>{s.unit}</div>
          </motion.div>
        ))}
      </div>

      {/* Main chart area */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Compliance gauge */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <Award size={18} color="#FFB300" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>RPO Compliance Gauge</h3>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}><ComplianceGauge value={rpoTarget} /></div>
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["FY Target", "80%"], ["Current", `${rpoTarget}%`], ["Deficit", `${Math.max(0, 80 - rpoTarget)}%`], ["Expiry", "Mar 2026"]].map(([l, v]) => (
              <div key={l} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "#888", letterSpacing: 1, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#F0F0F0" }}>{v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Portfolio breakdown */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <TrendingUp size={18} color="#9B59FF" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Portfolio Breakdown</h3>
            {walletAddress && <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>Live from Sepolia</span>}
          </div>
          {!walletAddress || (recBalance === "—" && cccBalance === "—") ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: "#888" }}>
              <AlertTriangle size={32} color="#FFB300" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13 }}>Connect wallet to see your real portfolio.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}80)` }} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span style={{ color: "#888", fontSize: 12 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                {portfolioData.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, boxShadow: `0 0 8px ${d.color}80`, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, color: "#888" }}>{d.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: d.color }}>{d.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Transaction history — links to Etherscan */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} color="#39FF14" />
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>My Transactions</h3>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={fetchLiveTxs} disabled={loadingTxs}
              style={{ fontSize: 12, color: "#39FF14", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <RefreshCw size={12} /> Refresh
            </button>
            {walletAddress && (
              <a href={`https://sepolia.etherscan.io/address/${walletAddress}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: "#00F5FF", textDecoration: "none" }}>
                View on Etherscan ↗
              </a>
            )}
          </div>
        </div>
        {!walletAddress ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
            <AlertTriangle size={28} color="#FFB300" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13 }}>Connect your wallet to view your transaction history.</p>
          </div>
        ) : loadingTxs ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#888", fontSize: 13 }}>Loading your transactions…</div>
        ) : liveTxs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#888", fontSize: 13 }}>
            No transactions yet. Buy a demo token to see it appear here!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Tx Hash", "Asset", "Amount", "Value (INR)", "Demo?", "Status", "Time"].map((h) => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: "left", color: "#666", fontSize: 10, letterSpacing: 1, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveTxs.map((tx, i) => (
                  <tr key={tx.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono', monospace", color: "#00F5FF", fontSize: 12 }}>
                      <a href={tx.isDemo ? "#" : `https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                        target={tx.isDemo ? "_self" : "_blank"} rel="noreferrer"
                        style={{ color: tx.isDemo ? "#888" : "#00F5FF", textDecoration: "none" }}>
                        {tx.transactionHash?.slice(0, 14)}…
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
                    <td style={{ padding: "12px 16px" }}><span style={{ color: "#39FF14", fontSize: 11 }}>⬤ {tx.status}</span></td>
                    <td style={{ padding: "12px 16px", color: "#666", fontSize: 12 }}>
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: "center", padding: "16px 0 0", color: "#666", fontSize: 12 }}>
              Full on-chain history on <a href={`https://sepolia.etherscan.io/address/${walletAddress}`} target="_blank" rel="noreferrer" style={{ color: "#00F5FF" }}>Etherscan ↗</a>
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
