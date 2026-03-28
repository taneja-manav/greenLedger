"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Zap, Leaf, ArrowRight, Shield, TrendingUp, Globe } from "lucide-react";

const FEATURES = [
  { icon: Shield, label: "Regulator Verified", desc: "All credits minted by CERC-authorized regulators on-chain." },
  { icon: TrendingUp, label: "Live Pricing", desc: "Real-time INR price discovery via Razorpay CBDC bridge." },
  { icon: Globe, label: "Sepolia Testnet", desc: "ERC-1155 smart contracts. Fully auditable transaction history." },
];

function FloatingCard({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8, rotateY: 2, scale: 1.02 }}
      style={{ perspective: 1000, ...style }}
    >
      {children}
    </motion.div>
  );
}

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow BG */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 800, height: 400,
        background: "radial-gradient(ellipse, rgba(57,255,20,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div style={{ y, opacity, width: "100%", maxWidth: 1280, position: "relative", zIndex: 2 }}>
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 100,
            background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)",
          }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: 12, color: "#39FF14", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>
              LIVE ON SEPOLIA TESTNET
            </span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{ textAlign: "center", fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 800, lineHeight: 1.08, marginBottom: 24 }}
        >
          The Future of{" "}
          <span className="gradient-text">Carbon & Energy</span>
          <br />
          Credits is On-Chain
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ textAlign: "center", color: "#888", fontSize: 18, maxWidth: 640, margin: "0 auto 48px", lineHeight: 1.7 }}
        >
          GreenLedger tokenizes India's Renewable Energy Certificates and Carbon
          Credits into verifiable, tradeable digital assets — powering RPO compliance for industries.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 80 }}
        >
          <a href="#marketplace">
            <button className="btn-primary" id="hero-marketplace-btn" style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 32px", fontSize: 15 }}>
              Enter Marketplace <ArrowRight size={16} />
            </button>
          </a>
          <a href="#dashboard">
            <button className="btn-secondary" id="hero-dashboard-btn" style={{ padding: "14px 32px", fontSize: 15 }}>
              View Dashboard
            </button>
          </a>
        </motion.div>

        {/* REC vs CCC Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 64 }}>
          {/* REC Card */}
          <FloatingCard delay={0.5}>
            <div className="glass-card" style={{ padding: 32, height: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "radial-gradient(circle, rgba(57,255,20,0.15), transparent)", borderRadius: "50%" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, rgba(57,255,20,0.2), rgba(57,255,20,0.05))", border: "1px solid rgba(57,255,20,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={24} color="#39FF14" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>TOKEN ID: 1</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#39FF14" }}>REC — Energy NFT</div>
                </div>
              </div>
              <p style={{ color: "#aaa", lineHeight: 1.7, fontSize: 14, marginBottom: 20 }}>
                <strong style={{ color: "#F0F0F0" }}>Renewable Energy Certificate.</strong> 1 REC = 1 MWh of clean power generated and fed into the grid. Issued by CERC-registered generators. Each token is a unique, non-fungible provenance record.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Standard", "ERC-1155"], ["Source", "Solar/Wind"], ["Unit", "1 MWh"], ["Validity", "1 Year"]].map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(57,255,20,0.04)", borderRadius: 8, padding: "8px 12px", border: "1px solid rgba(57,255,20,0.1)" }}>
                    <div style={{ fontSize: 10, color: "#888", letterSpacing: 1 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#39FF14", fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </FloatingCard>

          {/* CCC Card */}
          <FloatingCard delay={0.65}>
            <div className="glass-card" style={{ padding: 32, height: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "radial-gradient(circle, rgba(0,245,255,0.15), transparent)", borderRadius: "50%" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,245,255,0.05))", border: "1px solid rgba(0,245,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Leaf size={24} color="#00F5FF" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>TOKEN ID: 2</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#00F5FF" }}>CCC — Carbon Coin</div>
                </div>
              </div>
              <p style={{ color: "#aaa", lineHeight: 1.7, fontSize: 14, marginBottom: 20 }}>
                <strong style={{ color: "#F0F0F0" }}>Carbon Credit Coin.</strong> 1 CCC = 1 Tonne of CO₂ avoided or removed. A fungible ERC-1155 token enabling spot trading of carbon offsets. Redeemable against industrial emission obligations.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Standard", "ERC-1155"], ["Type", "Fungible"], ["Unit", "1 t CO₂"], ["Market", "Spot Trade"]].map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(0,245,255,0.04)", borderRadius: 8, padding: "8px 12px", border: "1px solid rgba(0,245,255,0.1)" }}>
                    <div style={{ fontSize: 10, color: "#888", letterSpacing: 1 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#00F5FF", fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </FloatingCard>

          {/* Stats Card */}
          <FloatingCard delay={0.8}>
            <div className="glass-card" style={{ padding: 32, height: "100%" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#888", marginBottom: 24, letterSpacing: 1 }}>PLATFORM METRICS</h3>
              {[
                { label: "Total RECs Issued", value: "12,840", unit: "MWh", color: "#39FF14" },
                { label: "CCC in Circulation", value: "4,210", unit: "t CO₂", color: "#00F5FF" },
                { label: "Active Listings", value: "287", unit: "orders", color: "#9B59FF" },
                { label: "Firms Compliant", value: "94.3", unit: "%", color: "#39FF14" },
              ].map((stat) => (
                <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#888", fontSize: 13 }}>{stat.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 700, fontSize: 18, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</span>
                    <span style={{ color: "#666", fontSize: 11, marginLeft: 4 }}>{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </FloatingCard>
        </div>

        {/* Feature strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}
        >
          {FEATURES.map((f) => (
            <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, maxWidth: 260 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <f.icon size={16} color="#39FF14" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.label}</div>
                <div style={{ color: "#666", fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
