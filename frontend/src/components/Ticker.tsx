"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TickerItem {
  hash: string;
  type: string;
  amount: string;
  asset: string;
  value: string;
  isUp: boolean;
}

const INITIAL_ITEMS: TickerItem[] = [
  { hash: "0x3f2a...c1e9", type: "BUY", amount: "100", asset: "REC", value: "+₹4.2L", isUp: true },
  { hash: "0x91bb...d44f", type: "SELL", amount: "50", asset: "CCC", value: "-₹42K", isUp: false },
  { hash: "0xb87e...3301", type: "MINT", amount: "500", asset: "REC", value: "REGULATOR", isUp: true },
  { hash: "0x0c21...fa12", type: "BUY", amount: "200", asset: "CCC", value: "+₹1.7L", isUp: true },
  { hash: "0xd11c...9912", type: "SELL", amount: "80", asset: "REC", value: "-₹3.4L", isUp: false },
  { hash: "0xa2fe...7701", type: "BUY", amount: "320", asset: "CCC", value: "+₹2.7L", isUp: true },
  { hash: "0x5c9d...e238", type: "SWAP", amount: "1", asset: "REC", value: "ATOMIC", isUp: true },
  { hash: "0xff3a...0011", type: "BUY", amount: "1000", asset: "REC", value: "+₹42L", isUp: true },
  { hash: "0x8812...bb44", type: "SELL", amount: "400", asset: "CCC", value: "-₹3.4L", isUp: false },
];

function TickerBadge({ type }: { type: string }) {
  const colors: Record<string, [string, string]> = {
    BUY: ["rgba(57,255,20,0.12)", "#39FF14"],
    SELL: ["rgba(255,68,68,0.12)", "#FF4444"],
    MINT: ["rgba(155,89,255,0.12)", "#9B59FF"],
    SWAP: ["rgba(0,245,255,0.12)", "#00F5FF"],
  };
  const [bg, color] = colors[type] || ["rgba(255,255,255,0.05)", "#888"];
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, background: bg, color, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
      {type}
    </span>
  );
}

export default function Ticker() {
  const [items] = useState<TickerItem[]>([...INITIAL_ITEMS, ...INITIAL_ITEMS]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 99,
        background: "rgba(5,5,5,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(57,255,20,0.15)",
        padding: "9px 0",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Live badge */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "4px 16px", borderRight: "1px solid rgba(255,255,255,0.08)", marginRight: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#39FF14", boxShadow: "0 0 8px #39FF14", animation: "pulse-glow 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#39FF14", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, whiteSpace: "nowrap" }}>SEPOLIA LIVE</span>
        </div>

        {/* Scrolling ticker */}
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div className="ticker-track">
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "0 28px",
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 10, color: "#666", fontFamily: "'JetBrains Mono', monospace" }}>{item.hash}</span>
                <TickerBadge type={item.type} />
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                  {item.amount} <span style={{ color: item.asset === "REC" ? "#39FF14" : "#00F5FF" }}>{item.asset}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, color: item.isUp ? "#39FF14" : "#FF4444", fontFamily: "'JetBrains Mono', monospace" }}>
                  {item.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
