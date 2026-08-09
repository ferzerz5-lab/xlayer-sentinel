"use client";

import { useState, useEffect } from "react";
import {
  Home, Sparkles, ArrowLeftRight, Activity, Wallet, ChevronRight, Check, Undo2,
  ExternalLink, TrendingUp, AlertTriangle, Search, Link2, Github, Compass, AtSign, Loader2,
} from "lucide-react";
import { useWallet } from "../lib/wallet";
import { activeChain, explorerAddressUrl } from "../lib/chains";

const palette = {
  bg: "#0B0E14",
  bgElevated: "#10141C",
  panel: "rgba(255,255,255,0.035)",
  panelBorder: "rgba(255,255,255,0.08)",
  panelBorderStrong: "rgba(255,255,255,0.14)",
  textPrimary: "#E8EAF0",
  textSecondary: "#8B93A7",
  textMuted: "#5A6178",
  indigo: "#7C9CFF",
  indigoSoft: "rgba(124,156,255,0.12)",
  teal: "#3ED9B3",
  tealSoft: "rgba(62,217,179,0.12)",
  coral: "#FF6B6B",
  coralSoft: "rgba(255,107,107,0.12)",
};

const navItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "briefing", label: "Risk scan", icon: Sparkles },
  { id: "actions", label: "Actions", icon: ArrowLeftRight },
  { id: "activity", label: "Activity", icon: Activity },
];

const projectLinks = {
  github: "https://github.com/your-repo",
  x: "https://x.com/your-project-handle",
  explorer: activeChain.blockExplorers.default.url,
};

// ---------- shared bits ----------

function GlassPanel({ children, style = {} }) {
  return (
    <div
      style={{
        background: palette.panel,
        border: `1px solid ${palette.panelBorder}`,
        borderRadius: "16px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, tone = "indigo" }) {
  const colors = {
    indigo: { bg: palette.indigoSoft, fg: palette.indigo },
    teal: { bg: palette.tealSoft, fg: palette.teal },
    coral: { bg: palette.coralSoft, fg: palette.coral },
  }[tone];
  return (
    <span
      style={{
        background: colors.bg, color: colors.fg, fontFamily: "Inter", fontSize: "12px", fontWeight: 500,
        padding: "4px 10px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "6px",
      }}
    >
      {children}
    </span>
  );
}

function SignalRing({ size = 168, pulse, highlight, score }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, (score ?? 72) / 100));
  const glow = pulse || highlight;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={palette.indigo} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: glow ? `drop-shadow(0 0 5px rgba(76,95,224,0.45))` : "none", transition: "all 0.6s ease" }}
      />
    </svg>
  );
}

function StatCard({ label, value, sub, tone = "neutral", onClick, expandable, expanded, expandedContent }) {
  const toneColor = tone === "positive" ? palette.teal : tone === "negative" ? palette.coral : palette.textPrimary;
  const [hover, setHover] = useState(false);
  return (
    <GlassPanel style={{ padding: "18px 20px", cursor: onClick ? "pointer" : "default", border: `1px solid ${hover || expanded ? palette.panelBorderStrong : palette.panelBorder}`, transition: "border-color 0.15s ease" }}>
      <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "12px", color: palette.textSecondary, fontFamily: "Inter", marginBottom: "8px", letterSpacing: "0.02em" }}>{label}</div>
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: "22px", fontWeight: 500, color: toneColor }}>{value}</div>
          {sub && <div style={{ fontSize: "12px", color: palette.textMuted, fontFamily: "Inter", marginTop: "4px" }}>{sub}</div>}
        </div>
        {onClick && (
          <ChevronRight size={15} color={palette.textMuted} style={{ flexShrink: 0, marginTop: "2px", transform: expandable && expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
        )}
      </div>
      {expandable && expanded && (
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: `1px solid ${palette.panelBorder}` }}>{expandedContent}</div>
      )}
    </GlassPanel>
  );
}

function Footer() {
  const linkStyle = { display: "flex", alignItems: "center", gap: "7px", color: palette.textSecondary, textDecoration: "none", fontFamily: "Inter", fontSize: "12px", fontWeight: 500 };
  return (
    <div style={{ marginTop: "32px", paddingTop: "18px", borderTop: `1px solid ${palette.panelBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
      <div style={{ fontFamily: "Inter", fontSize: "12px", color: palette.textMuted }}>Built on X Layer</div>
      <div style={{ display: "flex", gap: "22px" }}>
        <a href={projectLinks.github} target="_blank" rel="noopener noreferrer" style={linkStyle}><Github size={14} /> GitHub</a>
        <a href={projectLinks.x} target="_blank" rel="noopener noreferrer" style={linkStyle}><AtSign size={14} /> Project on X</a>
        <a href={projectLinks.explorer} target="_blank" rel="noopener noreferrer" style={linkStyle}><Compass size={14} /> X Layer explorer</a>
      </div>
    </div>
  );
}

// ---------- connect wallet ----------

function ConnectWalletButton({ wallet }) {
  const { address, connecting, connect, disconnect, isOnCorrectChain, switchToActiveChain } = wallet;

  if (address && !isOnCorrectChain) {
    return (
      <button onClick={switchToActiveChain} style={{ display: "flex", alignItems: "center", gap: "8px", background: palette.coral, border: "none", borderRadius: "10px", padding: "9px 16px", cursor: "pointer", fontFamily: "Inter", fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
        <AlertTriangle size={14} /> Wrong network — switch to {activeChain.name}
      </button>
    );
  }

  if (address) {
    return (
      <a href={explorerAddressUrl(activeChain, address)} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", background: palette.bg, border: `1px solid ${palette.panelBorder}`, borderRadius: "10px", padding: "8px 14px", cursor: "pointer", textDecoration: "none" }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: palette.teal, display: "inline-block" }} />
        <span style={{ fontFamily: "IBM Plex Mono", fontSize: "12px", color: palette.textPrimary }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </a>
    );
  }

  return (
    <button onClick={connect} disabled={connecting} style={{ display: "flex", alignItems: "center", gap: "8px", background: palette.indigo, border: "none", borderRadius: "10px", padding: "9px 16px", cursor: "pointer", fontFamily: "Inter", fontSize: "13px", fontWeight: 600, color: "#0B0E14", opacity: connecting ? 0.7 : 1 }}>
      {connecting ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
      {connecting ? "Connecting..." : "Connect wallet"}
    </button>
  );
}

// ---------- overview ----------

function HealthBreakdown({ steps }) {
  // Falls back to a labeled sample breakdown until a live scan has run.
  const factors = steps && steps.length > 0
    ? steps.map((s, i) => ({ label: s.title, score: 60 + i * 8, note: s.detail }))
    : [
        { label: "Pool depth stability", score: 58, note: "Connect a wallet and run a scan for live data" },
        { label: "Volume irregularity", score: 41, note: "Sample data" },
        { label: "Contract verification", score: 91, note: "Sample data" },
      ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {factors.map((f) => (
        <div key={f.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontFamily: "Inter", fontSize: "12px", color: palette.textSecondary }}>{f.label}</span>
            <span style={{ fontFamily: "IBM Plex Mono", fontSize: "12px", color: palette.textPrimary }}>{f.score}</span>
          </div>
          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "5px" }}>
            <div style={{ width: `${f.score}%`, height: "100%", background: f.score >= 70 ? palette.teal : f.score >= 50 ? palette.indigo : palette.coral, borderRadius: "2px" }} />
          </div>
          <div style={{ fontFamily: "Inter", fontSize: "11px", color: palette.textMuted }}>{f.note}</div>
        </div>
      ))}
    </div>
  );
}

function OverviewView({ pulse, onNavigate, briefing, walletAddress }) {
  const [expanded, setExpanded] = useState(null);
  const [healthOpen, setHealthOpen] = useState(false);
  const toggle = (id) => setExpanded((cur) => (cur === id ? null : id));
  const trustScore = briefing?.trust_score ?? 72;

  return (
    <div>
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
        <GlassPanel style={{ padding: "28px", flex: "1 1 340px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <div onClick={() => setHealthOpen((v) => !v)} style={{ position: "relative", width: "168px", height: "168px", flexShrink: 0, cursor: "pointer" }}>
              <SignalRing pulse={pulse} highlight={healthOpen} score={trustScore} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "Inter", fontSize: "11px", color: palette.textMuted, marginBottom: "6px", letterSpacing: "0.04em" }}>TRUST SCORE</div>
                <div style={{ fontFamily: "IBM Plex Mono", fontSize: "30px", fontWeight: 600, color: palette.textPrimary }}>
                  {trustScore}<span style={{ fontSize: "16px", color: palette.textMuted }}>/100</span>
                </div>
                <div style={{ fontFamily: "Inter", fontSize: "10px", color: palette.indigo, marginTop: "6px", display: "flex", alignItems: "center", gap: "3px" }}>
                  {healthOpen ? "Hide breakdown" : "See breakdown"}
                  <ChevronRight size={11} style={{ transform: healthOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }} />
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textSecondary, marginBottom: "6px" }}>Wallet on X Layer</div>
              <div style={{ fontFamily: "IBM Plex Mono", fontSize: "20px", fontWeight: 600, color: palette.textPrimary, marginBottom: "10px" }}>
                {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : "Not connected"}
              </div>
              <Badge tone={briefing ? "teal" : "indigo"}>
                <TrendingUp size={13} /> {briefing ? "Live scan complete" : "Sample data"}
              </Badge>
              <div style={{ marginTop: "14px", fontFamily: "Inter", fontSize: "13px", color: palette.textSecondary, lineHeight: 1.5 }}>
                {walletAddress ? "The sentinel is monitoring this wallet for irregular pool activity on X Layer." : "Connect a wallet to let the sentinel run a live scan."}
              </div>
            </div>
          </div>
          {healthOpen && (
            <div style={{ marginTop: "22px", paddingTop: "20px", borderTop: `1px solid ${palette.panelBorder}` }}>
              <div style={{ fontFamily: "Inter", fontSize: "12px", color: palette.textSecondary, marginBottom: "14px" }}>What makes up this score</div>
              <HealthBreakdown steps={briefing?.steps} />
            </div>
          )}
        </GlassPanel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
        <StatCard label="Risk scan" value={briefing ? "Complete" : "Not run"} sub="Read wallet + pool state on X Layer" tone="neutral" onClick={() => onNavigate("briefing")} />
        <StatCard label="Recommendation" value={briefing ? "See scan" : "—"} sub={briefing?.recommendation ? briefing.recommendation.slice(0, 40) + "..." : "Run a scan first"} tone={briefing ? "positive" : "neutral"} onClick={() => onNavigate("briefing")} />
        <StatCard label="Pending reviews" value="1" sub="Trade held for risk check" tone="neutral" onClick={() => onNavigate("actions")} />
        <StatCard label="Network" value={activeChain.name} sub={walletAddress ? "Wallet connected" : "No wallet connected"} tone="neutral" />
      </div>
    </div>
  );
}

// ---------- briefing ----------

const sampleSteps = [
  { title: "Scanned wallet and target pool", detail: "Read open positions on X Layer, then checked the pool you're about to trade into." },
  { title: "Detected volume irregularity", detail: "The pool saw a large volume spike with no matching price movement — a pattern consistent with wash trading." },
  { title: "Cross-referenced OKX DEX history", detail: "Compared this pool's volume against its 30-day average and comparable pools on X Layer." },
  { title: "Recommendation", detail: "This is sample data. Connect a wallet and run a live scan to get a real reasoning trail from Claude." },
];

function BriefingView({ onGoToActions, briefing, loading, error, onRunScan, walletAddress }) {
  const steps = briefing?.steps?.length ? briefing.steps : sampleSteps;
  return (
    <div>
      <GlassPanel style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textSecondary }}>
            {briefing ? "Reasoning trail · live scan" : "Reasoning trail · sample data"}
          </div>
          {walletAddress && (
            <button onClick={onRunScan} disabled={loading} style={{ background: "transparent", border: `1px solid ${palette.panelBorder}`, borderRadius: "8px", padding: "6px 12px", fontFamily: "Inter", fontSize: "12px", color: palette.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              {loading ? "Scanning..." : "Run live scan"}
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: "18px", padding: "12px 14px", background: palette.coralSoft, borderRadius: "10px", color: palette.coral, fontFamily: "Inter", fontSize: "12px" }}>
            {error}
          </div>
        )}

        <div>
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={i} style={{ display: "flex", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: isLast ? palette.indigoSoft : "rgba(255,255,255,0.05)", border: `1px solid ${isLast ? palette.indigo : palette.panelBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isLast ? <Sparkles size={16} color={palette.indigo} /> : <Search size={16} color={palette.textSecondary} />}
                  </div>
                  {!isLast && <div style={{ width: "1px", flex: 1, background: palette.panelBorder, minHeight: "28px" }} />}
                </div>
                <div style={{ paddingBottom: isLast ? 0 : "22px" }}>
                  <div style={{ fontFamily: "Inter", fontSize: "14px", fontWeight: 500, color: palette.textPrimary, marginBottom: "4px" }}>{step.title}</div>
                  <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textSecondary, lineHeight: 1.5, maxWidth: "440px" }}>{step.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onGoToActions} style={{ marginTop: "8px", background: palette.indigo, color: "#0B0E14", border: "none", borderRadius: "10px", padding: "10px 18px", fontFamily: "Inter", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          Review flagged trade <ChevronRight size={14} />
        </button>
      </GlassPanel>
    </div>
  );
}

// ---------- actions ----------

function ActionsView() {
  const [status, setStatus] = useState("pending");
  return (
    <div>
      <GlassPanel style={{ padding: "24px", maxWidth: "560px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textSecondary }}>Trade under review</div>
          {status === "pending" && <Badge tone="coral"><AlertTriangle size={13} /> Flagged for review</Badge>}
          {status === "confirmed" && <Badge tone="coral"><Check size={13} /> Proceeded despite flag</Badge>}
          {status === "undone" && <Badge tone="teal">Trade cancelled</Badge>}
        </div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: "20px", fontWeight: 600, color: palette.textPrimary, marginBottom: "6px" }}>Swap 200 USDC → OKB</div>
        <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textSecondary, lineHeight: 1.6, marginBottom: "18px" }}>
          This pool shows a volume pattern consistent with wash trading over the last 6 hours. Trading here carries elevated risk of manipulated pricing.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ fontFamily: "Inter", fontSize: "11px", color: palette.textMuted, marginBottom: "4px" }}>RATE</div>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: "14px", color: palette.textPrimary }}>1 OKB ≈ 42.18 USDC</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ fontFamily: "Inter", fontSize: "11px", color: palette.textMuted, marginBottom: "4px" }}>VOLUME ANOMALY</div>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: "14px", color: palette.coral }}>+340% vs 30d avg</div>
          </div>
        </div>
        {status === "pending" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStatus("confirmed")} style={{ flex: 1, background: "transparent", color: palette.coral, border: `1px solid rgba(255,107,107,0.35)`, borderRadius: "10px", padding: "11px", fontFamily: "Inter", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <AlertTriangle size={15} /> Proceed anyway
            </button>
            <button onClick={() => setStatus("undone")} style={{ flex: 1, background: palette.teal, color: "#04342C", border: "none", borderRadius: "10px", padding: "11px 16px", fontFamily: "Inter", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Undo2 size={14} /> Cancel trade
            </button>
          </div>
        )}
        {status === "confirmed" && <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.coral }}>Trade submitted despite the flag. It will appear in Activity once confirmed.</div>}
        {status === "undone" && <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textMuted }}>No trade was made. The sentinel will keep monitoring this pool and let you know if the flag clears.</div>}
        <div style={{ marginTop: "14px", fontFamily: "Inter", fontSize: "11px", color: palette.textMuted }}>
          TODO: wire these buttons to lib/okxDex.js — get a real quote, then send an eth_sendTransaction via the connected wallet on {activeChain.name}.
        </div>
      </GlassPanel>
    </div>
  );
}

// ---------- activity ----------

const activityRows = [
  { action: "Risk scan", detail: "Flagged OKB/USDC volume spike", hash: "—", time: "2h ago", status: "info" },
  { action: "Trade held", detail: "200 USDC swap paused for review", hash: "—", time: "2h ago", status: "info" },
  { action: "Swap", detail: "150 USDC → OKB, cleared scan", hash: "0x8f2a...c19d", time: "1d ago", status: "confirmed" },
  { action: "Deposit", detail: "500 USDC received", hash: "0x11b4...7e02", time: "3d ago", status: "confirmed" },
];

function ActivityView() {
  return (
    <GlassPanel style={{ padding: "8px 0" }}>
      <div style={{ padding: "12px 24px", fontFamily: "Inter", fontSize: "11px", color: palette.textMuted }}>
        Sample rows — wire this to real onchain transaction history (Covalent/GoldRush) once your wallet has live activity.
      </div>
      {activityRows.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: i < activityRows.length - 1 ? `1px solid ${palette.panelBorder}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: row.status === "confirmed" ? palette.tealSoft : palette.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {row.status === "confirmed" ? <ArrowLeftRight size={15} color={palette.teal} /> : <Sparkles size={15} color={palette.indigo} />}
            </div>
            <div>
              <div style={{ fontFamily: "Inter", fontSize: "14px", color: palette.textPrimary, fontWeight: 500 }}>{row.action}</div>
              <div style={{ fontFamily: "Inter", fontSize: "12px", color: palette.textSecondary }}>{row.detail}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: "12px", color: palette.textMuted, display: "flex", alignItems: "center", gap: "5px", justifyContent: "flex-end" }}>
              {row.hash !== "—" && <ExternalLink size={11} />} {row.hash}
            </div>
            <div style={{ fontFamily: "Inter", fontSize: "12px", color: palette.textMuted, marginTop: "2px" }}>{row.time}</div>
          </div>
        </div>
      ))}
    </GlassPanel>
  );
}

// ---------- root ----------

export default function Sentinel() {
  const [view, setView] = useState("overview");
  const [pulse, setPulse] = useState(false);
  const wallet = useWallet();

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 900);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const runScan = async () => {
    if (!wallet.address) return;
    setBriefingLoading(true);
    setBriefingError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setBriefing(data);
    } catch (e) {
      setBriefingError(e.message);
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    if (wallet.address && wallet.isOnCorrectChain && !briefing && !briefingLoading) {
      runScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, wallet.isOnCorrectChain]);

  return (
    <div style={{ background: palette.bg, minHeight: "100vh", display: "flex", fontFamily: "Inter" }}>
      <div style={{ width: "220px", flexShrink: 0, background: palette.bgElevated, borderRight: `1px solid ${palette.panelBorder}`, padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", marginBottom: "32px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `linear-gradient(135deg, ${palette.indigo}, ${palette.teal})`, flexShrink: 0 }} />
          <div style={{ fontFamily: "Space Grotesk", fontSize: "15px", fontWeight: 600, color: palette.textPrimary }}>Sentinel</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: "none", background: active ? palette.indigoSoft : "transparent", color: active ? palette.indigo : palette.textSecondary, fontFamily: "Inter", fontSize: "13px", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", padding: "12px", background: palette.bg, borderRadius: "10px" }}>
          <div style={{ fontFamily: "Inter", fontSize: "11px", color: palette.textMuted, marginBottom: "4px" }}>NETWORK</div>
          <div style={{ fontFamily: "Inter", fontSize: "12px", color: palette.textSecondary, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: wallet.isOnCorrectChain ? palette.teal : palette.textMuted, display: "inline-block" }} />
            {activeChain.name}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "28px 32px", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div style={{ fontFamily: "Space Grotesk", fontSize: "20px", fontWeight: 600, color: palette.textPrimary }}>{navItems.find((n) => n.id === view)?.label}</div>
            <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textMuted, marginTop: "2px" }}>
              {wallet.address ? "Watching this wallet on X Layer" : "Connect a wallet for the sentinel to monitor"}
            </div>
          </div>
          <ConnectWalletButton wallet={wallet} />
        </div>

        {wallet.error && (
          <GlassPanel style={{ padding: "12px 16px", marginBottom: "20px", color: palette.coral, fontFamily: "Inter", fontSize: "13px" }}>{wallet.error}</GlassPanel>
        )}

        {!wallet.address && (
          <GlassPanel style={{ padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={15} color={palette.indigo} />
            <div style={{ fontFamily: "Inter", fontSize: "13px", color: palette.textSecondary }}>
              This is a preview with sample data. Connect a wallet to let the sentinel scan your actual positions on X Layer.
            </div>
          </GlassPanel>
        )}

        {view === "overview" && <OverviewView pulse={pulse} onNavigate={setView} briefing={briefing} walletAddress={wallet.address} />}
        {view === "briefing" && <BriefingView onGoToActions={() => setView("actions")} briefing={briefing} loading={briefingLoading} error={briefingError} onRunScan={runScan} walletAddress={wallet.address} />}
        {view === "actions" && <ActionsView />}
        {view === "activity" && <ActivityView />}

        <Footer />
      </div>
    </div>
  );
}
