"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, BarChart2, LayoutDashboard, Menu, X, Wallet, Shield } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "#home", icon: Zap },
  { label: "Marketplace", href: "#marketplace", icon: BarChart2 },
  { label: "Dashboard", href: "#dashboard", icon: LayoutDashboard },
  { label: "Admin", href: "#admin", icon: Shield, adminOnly: true },
];

interface NavbarProps {
  walletAddress?: string | null;
  onConnectWallet: () => void;
}

export default function Navbar({ walletAddress, onConnectWallet }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <nav className="navbar" style={{ padding: "0 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        >
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #39FF14, #00F5FF)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Zap size={20} color="#000" fill="#000" />
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>
              <span className="neon-green">Green</span>
              <span style={{ color: "#F0F0F0" }}>Ledger</span>
            </span>
            <div style={{ fontSize: 9, color: "#888", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace", marginTop: -2 }}>
              SEPOLIA TESTNET
            </div>
          </div>
        </motion.div>

        {/* Desktop links */}
        <div style={{ display: "flex", gap: 4 }} className="nav-links">
          {NAV_LINKS.filter(link => !link.adminOnly || walletAddress).map((link, i) => (
            <motion.a
              key={link.href}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setActiveSection(link.label.toLowerCase())}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                color: activeSection === link.label.toLowerCase() ? "#39FF14" : "#888",
                fontSize: 14, fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s",
                background: activeSection === link.label.toLowerCase() ? "rgba(57,255,20,0.08)" : "transparent",
              }}
            >
              <link.icon size={15} />
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* Wallet Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          {/* Network badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.2)" }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: 11, color: "#39FF14", fontFamily: "'JetBrains Mono', monospace" }}>Sepolia</span>
          </div>

          <button
            id="wallet-connect-btn"
            onClick={onConnectWallet}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 8,
              background: walletAddress ? "rgba(57,255,20,0.1)" : "linear-gradient(135deg, #39FF14, #00c210)",
              border: walletAddress ? "1px solid rgba(57,255,20,0.4)" : "none",
              color: walletAddress ? "#39FF14" : "#000",
              fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.3s",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <Wallet size={15} />
            {shortAddress ? shortAddress : "Connect Wallet"}
          </button>

          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </motion.div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px" }}
          >
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "#888", textDecoration: "none", fontSize: 15 }}>
                <link.icon size={16} />
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
