"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/UserMenu'
import ResultsPage from '@/components/results/ResultsPage'
import mixpanel from '@/lib/mixpanel'

const DESIGN_ICONS = [
  { id: 1, path: "M3 3h7v7H3zM13 3h7v7h-7zM3 13h7v7H3zM13 13h7v7h-7z" },
  { id: 2, path: "M4 4l7 18 2.5-7L21 12.5z" },
  { id: 3, path: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { id: 4, path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z" },
  { id: 5, path: "M2 7V5a2 2 0 012-2h2M2 17v2a2 2 0 002 2h2M22 7V5a2 2 0 00-2-2h-2M22 17v2a2 2 0 01-2 2h-2M7 2v20M17 2v20M2 7h20M2 17h20" },
  { id: 6, path: "M4 7V4h16v3M9 20h6M12 4v16" },
  { id: 7, path: "M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" },
  { id: 8, path: "M21 10H3M21 6H3M21 14H3M21 18H3" },
  { id: 9, path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { id: 10, path: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 2v16a8 8 0 000-16z" },
  { id: 11, path: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35M11 8v6M8 11h6" },
  { id: 12, path: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  { id: 13, path: "M8 7l-4 5 4 5M16 7l4 5-4 5M3 12h18" },
  { id: 14, path: "M3 3l18 18M8 3v4M12 3v2M16 3v4M3 8h4M3 12h2M3 16h4" },
  { id: 15, path: "M6.13 1L6 16a2 2 0 002 2h15M1 6.13l15-.13a2 2 0 012 2V23" },
  { id: 16, path: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
];

const ALL_PERSONAS = [
  { name: "First-time User", emoji: "👋", desc: "No prior knowledge, relies on what they see" },
  { name: "Power User", emoji: "⚡", desc: "Wants speed, efficiency, no hand-holding" },
  { name: "Accessibility User", emoji: "♿", desc: "Screen reader, keyboard nav, high contrast" },
  { name: "Older User", emoji: "👴", desc: "Needs clarity, larger targets, familiar patterns" },
  { name: "Distracted User", emoji: "😵", desc: "Multitasking, interrupted, can't re-read" },
  { name: "Mobile User", emoji: "📱", desc: "One thumb, small screen, slow connection" },
  { name: "Non-native Speaker", emoji: "🌍", desc: "Struggles with jargon, idioms, dense text" },
];

const patternMeta: Record<string, { icon: string; color: string }> = {
  "F-Pattern": { icon: "F", color: "#6366F1" },
  "Z-Pattern": { icon: "Z", color: "#8B5CF6" },
  "Gutenberg Pattern": { icon: "G", color: "#0EA5E9" },
  "Spotted Pattern": { icon: "S", color: "#F59E0B" },
  "Layer Cake Pattern": { icon: "L", color: "#10B981" },
  "No Clear Pattern": { icon: "!", color: "#EF4444" },
};

function parseBullets(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((b: any) => String(b).replace(/^[•\-]\s*/, ""));
  if (typeof val === "string") return val.split("\n").filter((b) => b.trim()).map((b) => b.replace(/^[•\-]\s*/, ""));
  return [];
}

function getSeverityStyle(severity: string) {
  if (severity === "critical") return { color: "#FF3B30", bg: "#FFF5F4", label: "Critical" };
  if (severity === "high" || severity === "moderate") return { color: "#FF9500", bg: "#FFFBF0", label: "High" };
  if (severity === "medium" || severity === "minor") return { color: "#FF6B00", bg: "#FFF8F0", label: "Medium" };
  return { color: "#34C759", bg: "#F0FFF4", label: "Win" };
}

function HomeScreen({ onStart, onBrief, onLaunchFirstFive, selectedMode, setSelectedMode, briefText, setBriefText, uploaded, fileName, imagePreview, fileInputRef, isDragging, setIsDragging, handleInputChange, handleDrop }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const iconsRef = useRef<any[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const initIcons = (w: number, h: number) => {
      const spacing = 22;
      const cols = Math.ceil(w / spacing);
      const rows = Math.ceil(h / spacing);
      iconsRef.current = [];
      const total = cols * rows;
      const pool: any[] = [];
      while (pool.length < total) {
        const shuffled = [...DESIGN_ICONS].sort(() => Math.random() - 0.5);
        pool.push(...shuffled);
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = (c + 0.5) * spacing;
          const by = (r + 0.5) * spacing;
          iconsRef.current.push({
            icon: pool[r * cols + c],
            x: bx + (Math.random() - 0.5) * 6,
            y: by + (Math.random() - 0.5) * 6,
            baseX: bx, baseY: by,
            size: 10 + Math.random() * 16,
            opacity: 0.04 + Math.random() * 0.04,
            vx: 0, vy: 0,
            rotation: (Math.random() - 0.5) * 0.5,
          });
        }
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initIcons(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);
    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      iconsRef.current.forEach((icon) => {
        const dx = icon.x - mx;
        const dy = icon.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          icon.vx += (dx / dist) * force * 4;
          icon.vy += (dy / dist) * force * 4;
        }
        icon.vx += (icon.baseX - icon.x) * 0.05;
        icon.vy += (icon.baseY - icon.y) * 0.05;
        icon.vx *= 0.82; icon.vy *= 0.82;
        icon.x += icon.vx; icon.y += icon.vy;
        const glowRadius = 140;
        const glowIntensity = dist < glowRadius ? Math.pow((glowRadius - dist) / glowRadius, 2) : 0;
        const baseOpacity = icon.opacity;
        const glowOpacity = baseOpacity + glowIntensity * 0.7;
        const lineWidth = 1.2 + glowIntensity * 1.5;
        ctx.save();
        ctx.translate(icon.x, icon.y);
        ctx.rotate(icon.rotation);
        if (glowIntensity > 0.05) {
          ctx.shadowColor = `rgba(96,165,250,${glowIntensity * 0.8})`;
          ctx.shadowBlur = glowIntensity * 18;
          ctx.strokeStyle = `rgba(147,197,253,${glowOpacity})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = `rgba(96,165,250,${baseOpacity})`;
        }
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const scale = icon.size / 24;
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);
        try { ctx.stroke(new Path2D(icon.icon.path)); } catch (_) {}
        ctx.restore();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#020B18", fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @media (max-width: 768px) {
          .db-nav { padding: 0 20px !important; }
          .db-ai-label { display: none !important; }
          .db-hero { padding: 16px 20px 0 !important; }
          .db-hero h1 { font-size: 38px !important; letter-spacing: -1.5px !important; }
          .db-hero-bg { display: none !important; }
          .db-cards { flex-direction: column !important; padding: 16px 20px 24px !important; gap: 16px !important; overflow: visible !important; }
          .db-card { max-width: 100% !important; max-height: none !important; height: auto !important; }
          .db-or { flex-direction: row !important; height: auto !important; width: 100% !important; }
          .db-or-line { width: 40px !important; height: 1px !important; flex: 1 !important; background: linear-gradient(to right, transparent, rgba(59,130,246,0.15)) !important; }
          .db-or-line-2 { background: linear-gradient(to left, transparent, rgba(59,130,246,0.15)) !important; }
          .db-social { padding: 12px 20px 20px !important; }
          .db-trust-badges { display: none !important; }
        }
        @media (max-width: 1100px) and (min-width: 769px) {
          .db-nav { padding: 0 24px !important; }
          .db-hero h1 { font-size: 44px !important; }
          .db-cards { padding: 16px 24px 16px !important; gap: 12px !important; }
        }
      `}</style>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.35 }} />

      {/* NAV */}
      <nav className="db-nav" style={{ position: "relative", zIndex: 10, padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#2563EB,#0EA5E9)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}>
            <span style={{ color: "#fff", fontSize: 16 }}>✦</span>
          </div>
          <span style={{ fontWeight: 800, color: "#fff", fontSize: 18, letterSpacing: "-0.5px" }}>Design Bestie</span>
        </div>
        <div className="db-ai-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, background: "#3B82F6", borderRadius: "50%", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500, letterSpacing: 2, textTransform: "uppercase" }}>AI Design Partner</span>
        </div>
        <UserMenu />
      </nav>

      {/* HERO */}
      <div className="db-hero" style={{ position: "relative", zIndex: 5, textAlign: "center", padding: "20px 24px 0", flexShrink: 0 }}>
        <div className="db-hero-bg" style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 140, fontWeight: 900, color: "rgba(37,99,235,0.04)", letterSpacing: 20, whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", lineHeight: 1 }}>DESIGN</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, position: "relative" }}>
          <span style={{ width: 6, height: 6, background: "#3B82F6", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px rgba(59,130,246,0.8)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 4, textTransform: "uppercase" }}>Your AI Design Partner</span>
          <span style={{ width: 6, height: 6, background: "#3B82F6", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px rgba(59,130,246,0.8)" }} />
        </div>
        <h1 style={{ fontSize: 58, fontWeight: 900, color: "#fff", margin: "0 0 6px", letterSpacing: "-2.5px", lineHeight: 1, position: "relative" }}>From Brief</h1>
        <h1 style={{ fontSize: 58, fontWeight: 900, margin: "0 0 16px", letterSpacing: "-2.5px", lineHeight: 1, position: "relative", background: "linear-gradient(90deg,#60A5FA,#93C5FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>to Launch.</h1>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: 4, textTransform: "uppercase", fontWeight: 500 }}>Two modes &nbsp;·&nbsp; Full workflow &nbsp;·&nbsp; Zero guesswork</p>
      </div>

      {/* CARDS */}
      <div className="db-cards" style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "16px 40px 12px", overflow: "visible" }}>

        {/* LEFT CARD */}
        <div className="db-card" style={{ flex: 1, maxWidth: 520, height: "100%", maxHeight: 500, display: "flex", flexDirection: "column", padding: "28px 32px 24px", background: "linear-gradient(145deg,#040D1E,#071628)", borderRadius: 28, border: "1px solid rgba(37,99,235,0.18)", boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, background: "radial-gradient(circle,rgba(37,99,235,0.15),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, background: "#3B82F6", borderRadius: "50%", boxShadow: "0 0 6px rgba(59,130,246,0.8)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", letterSpacing: 3, textTransform: "uppercase" }}>After Design</span>
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: "0 0 6px", letterSpacing: "-1px", lineHeight: 1.1 }}>Review your</h2>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-1px", lineHeight: 1.1, opacity: 0.5 }}>design.</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px", lineHeight: 1.65, letterSpacing: 0.2 }}>Upload any screen. Get research-backed critique, stress test, roast and stakeholder report.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {([
                { mode: "analyse", emoji: "🔍", label: "Analyse" },
                { mode: "stress", emoji: "🧪", label: "Stress Test" },
                { mode: "roast", emoji: "🔥", label: "Roast Mode" },
                { mode: "firstfive", emoji: "👁️", label: "First 5 Seconds" },
              ] as const).map(({ mode, emoji, label }) => {
                const isSel = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      color: isSel ? "#fff" : "rgba(147,197,253,0.7)",
                      background: isSel ? "rgba(96,165,250,0.28)" : "rgba(37,99,235,0.1)",
                      border: isSel ? "1px solid rgba(147,197,253,0.6)" : "1px solid rgba(37,99,235,0.15)",
                      borderRadius: 20,
                      padding: "4px 11px",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{emoji}</span>{label}
                  </button>
                );
              })}
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{ border: `1.5px dashed ${isDragging ? "#60A5FA" : uploaded ? "#3B82F6" : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, cursor: "pointer", background: isDragging ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.02)", transition: "all 0.2s", flex: 1 }}
            >
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleInputChange} />
              {uploaded && imagePreview ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, height: "100%" }}>
                  <div style={{ width: 52, height: 38, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                    <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{fileName}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Click to change</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 0" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v13M12 3L8 7M12 3l4 4M3 18h18" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0, letterSpacing: 0.5 }}>Drop screenshot here</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0, letterSpacing: 1, textTransform: "uppercase" }}>PNG · JPG · PDF</p>
                </div>
              )}
            </div>
            <button onClick={() => selectedMode === "firstfive" ? onLaunchFirstFive() : onStart()} style={{ width: "100%", background: uploaded ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.03)", color: uploaded ? "#fff" : "rgba(255,255,255,0.2)", border: uploaded ? "1px solid rgba(96,165,250,0.5)" : "1px solid rgba(255,255,255,0.06)", padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: uploaded ? "pointer" : "default", transition: "all 0.25s", boxShadow: uploaded ? "0 0 20px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.12)" : "none", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: uploaded ? "-0.3px" : 0 }}>
              {uploaded
                ? (selectedMode === "firstfive"
                    ? <>Start First 5 Seconds Test <span style={{ fontSize: 16 }}>→</span></>
                    : <>Analyse My Design <span style={{ fontSize: 16 }}>→</span></>)
                : "Select a Screenshot to Begin"}
            </button>
          </div>
        </div>

        {/* OR DIVIDER */}
        <div className="db-or" style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, height: 200 }}>
          <div className="db-or-line" style={{ width: 1, flex: 1, background: "linear-gradient(to bottom,transparent,rgba(59,130,246,0.15))" }} />
          <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: 1.5, flexShrink: 0 }}>OR</div>
          <div className="db-or-line db-or-line-2" style={{ width: 1, flex: 1, background: "linear-gradient(to bottom,rgba(59,130,246,0.15),transparent)" }} />
        </div>

        {/* RIGHT CARD */}
        <div className="db-card" style={{ flex: 1, maxWidth: 520, height: "100%", maxHeight: 500, display: "flex", flexDirection: "column", padding: "28px 32px 24px", background: "linear-gradient(145deg,#061220,#0B1E35)", borderRadius: 28, border: "1px solid rgba(96,165,250,0.12)", boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -80, left: -80, width: 240, height: 240, background: "radial-gradient(circle,rgba(14,165,233,0.1),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ width: 5, height: 5, background: "#0EA5E9", borderRadius: "50%", boxShadow: "0 0 6px rgba(14,165,233,0.8)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#93C5FD", letterSpacing: 3, textTransform: "uppercase" }}>Before Design</span>
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: "0 0 6px", letterSpacing: "-1px", lineHeight: 1.1 }}>Understand your</h2>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-1px", lineHeight: 1.1, opacity: 0.5 }}>requirements.</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px", lineHeight: 1.65, letterSpacing: 0.2 }}>Paste PM or BA requirements. Get every screen, state, edge case and question before you open Figma.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
              {[["📱", "Screens"], ["🔲", "States"], ["⚠️", "Edge Cases"], ["❓", "Questions"]].map(([emoji, label]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "rgba(147,197,253,0.7)", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.12)", borderRadius: 20, padding: "3px 9px" }}><span>{emoji}</span>{label}</span>
              ))}
            </div>
            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              placeholder="Paste requirements here — Slack message, BA doc, user story, anything..."
              style={{ width: "100%", flex: 1, minHeight: 80, borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.07)", padding: "12px 14px", fontSize: 12, color: "rgba(255,255,255,0.8)", resize: "none", fontFamily: "inherit", lineHeight: 1.65, boxSizing: "border-box", outline: "none", background: "rgba(255,255,255,0.03)", marginBottom: 12, caretColor: "#60A5FA" }}
            />
            <button onClick={onBrief} style={{ width: "100%", background: briefText.trim().length > 10 ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.03)", color: briefText.trim().length > 10 ? "#fff" : "rgba(255,255,255,0.2)", border: briefText.trim().length > 10 ? "1px solid rgba(14,165,233,0.4)" : "1px solid rgba(255,255,255,0.06)", padding: "14px", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: briefText.trim().length > 10 ? "pointer" : "default", transition: "all 0.25s", boxShadow: briefText.trim().length > 10 ? "0 0 20px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" : "none", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: briefText.trim().length > 10 ? "-0.3px" : 0 }}>
              {briefText.trim().length > 10 ? <>Generate Design Brief <span style={{ fontSize: 16 }}>→</span></> : "Paste your requirements above"}
            </button>
          </div>
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div className="db-social" style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 24px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex" }}>
            {["#1D4ED8","#2563EB","#0EA5E9","#0284C7","#38BDF8"].map((c, i) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: "2px solid #0F0F10", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{["A","B","C","D","E"][i]}</div>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Trusted by designers worldwide</span>
        </div>
        <div className="db-trust-badges" style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          {["50+ UX Laws", "WCAG 2.2", "Nielsen Heuristics", "Gestalt Principles", "Reading Patterns", "Business Impact"].map((b) => (
            <span key={b} style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "4px 12px" }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonaModal({ onClose, onRun }: { onClose: () => void; onRun: (p: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 3 ? [...prev, name] : prev
    );
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "36px 32px", maxWidth: 520, width: "90%", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1D1D1F", margin: 0, letterSpacing: "-0.8px" }}>Stress Test</h2>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: "6px 0 0" }}>Pick 1–3 personas to test your design against</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#AEAEB2", fontSize: 22, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 20px", padding: "10px 14px", background: "#F5F5F7", borderRadius: 10 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.5 }}>Each persona analyses the same screen through a different lens — surfacing blind spots your standard review misses.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {ALL_PERSONAS.map((p) => {
            const isSel = selected.includes(p.name);
            const isDisabled = !isSel && selected.length >= 3;
            return (
              <button key={p.name} onClick={() => !isDisabled && toggle(p.name)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, border: isSel ? "2px solid #2D0A4E" : "1px solid #E5E5EA", background: isSel ? "rgba(45,10,78,0.04)" : isDisabled ? "#FAFAFA" : "#fff", cursor: isDisabled ? "default" : "pointer", textAlign: "left", opacity: isDisabled ? 0.45 : 1, transition: "all 0.15s" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#6E6E73" }}>{p.desc}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: isSel ? "none" : "2px solid #D2D2D7", background: isSel ? "#2D0A4E" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isSel && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "none", border: "1px solid #D2D2D7", borderRadius: 12, padding: 13, fontSize: 15, color: "#6E6E73", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
          <button onClick={() => selected.length >= 1 && onRun(selected)} style={{ flex: 2, background: selected.length >= 1 ? "#2D0A4E" : "rgba(0,0,0,0.08)", color: selected.length >= 1 ? "#fff" : "#999", border: "none", borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 700, cursor: selected.length >= 1 ? "pointer" : "default", boxShadow: selected.length >= 1 ? "0 4px 20px rgba(45,10,78,0.25)" : "none", transition: "all 0.2s" }}>
            {selected.length === 0 ? "Select a persona to begin" : `Run Stress Test with ${selected.length} persona${selected.length > 1 ? "s" : ""} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, expanded, onToggle, highlighted }: { issue: any; expanded: boolean; onToggle: () => void; highlighted?: boolean }) {
  const style = getSeverityStyle(issue.severity);
  const isWin = issue.severity === "win";
  return (
    <div style={{ background: highlighted ? style.bg : "#fff", borderTop: highlighted ? `2px solid ${style.color}` : "1px solid #E5E5EA", borderRight: highlighted ? `2px solid ${style.color}` : "1px solid #E5E5EA", borderBottom: highlighted ? `2px solid ${style.color}` : "1px solid #E5E5EA", borderLeft: `3px solid ${style.color}`, borderRadius: 10, overflow: "hidden", transition: "all 0.2s" }}>
      <button onClick={onToggle} style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 22, height: 22, background: style.color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{issue.id}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>{issue.element}</span>
            <span style={{ background: style.bg, color: style.color, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8 }}>{style.label}</span>
          </div>
          {issue.what && <div style={{ fontSize: 13, color: "#3A3A3C", fontWeight: 500, marginBottom: 3 }}>{issue.what}</div>}
          {issue.why && <div style={{ fontSize: 11, color: "#5856D6", background: "#F0F0FF", padding: "2px 8px", borderRadius: 6, display: "inline-block" }}>{issue.why}</div>}
        </div>
        <span style={{ color: "#C7C7CC", fontSize: 11, flexShrink: 0 }}>{expanded ? "▴" : "▾"}</span>
      </button>
      {expanded && (
        <div style={{ padding: "0 16px 16px 50px", borderTop: "1px solid #F2F2F7" }}>
          {!isWin && issue.user_impact && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", minWidth: 80, paddingTop: 2 }}>USER</span>
              <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.55 }}>{issue.user_impact}</span>
            </div>
          )}
          {!isWin && issue.business_impact && (
            <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", minWidth: 80, paddingTop: 2 }}>BUSINESS</span>
              <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.55 }}>{issue.business_impact}</span>
            </div>
          )}
          {issue.direction && issue.direction !== "Keep this pattern" && (
            <div style={{ marginTop: 10, background: "#F0FFF4", border: "1px solid #B0F0C0", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#34C759", minWidth: 80, paddingTop: 2 }}>DIRECTION</span>
              <span style={{ fontSize: 13, color: "#1C4A26", lineHeight: 1.55 }}>{issue.direction}</span>
            </div>
          )}
          {isWin && issue.user_impact && (
            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", minWidth: 80, paddingTop: 2 }}>WHY IT WORKS</span>
              <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.55 }}>{issue.user_impact}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
const ZONE_POSITIONS: Record<string, { top: string; left: string; transform: string }> = {
  "top-left":      { top: "10%",  left: "15%",  transform: "translate(-50%,-50%)" },
  "top-center":    { top: "10%",  left: "50%",  transform: "translate(-50%,-50%)" },
  "top-right":     { top: "10%",  left: "85%",  transform: "translate(-50%,-50%)" },
  "mid-left":      { top: "50%",  left: "15%",  transform: "translate(-50%,-50%)" },
  "mid-center":    { top: "50%",  left: "50%",  transform: "translate(-50%,-50%)" },
  "mid-right":     { top: "50%",  left: "85%",  transform: "translate(-50%,-50%)" },
  "bottom-left":   { top: "85%",  left: "15%",  transform: "translate(-50%,-50%)" },
  "bottom-center": { top: "85%",  left: "50%",  transform: "translate(-50%,-50%)" },
  "bottom-right":  { top: "85%",  left: "85%",  transform: "translate(-50%,-50%)" },
};

const ZONE_HIGHLIGHT: Record<string, { top: string; left: string; width: string; height: string }> = {
  "top-left":      { top: "0%",    left: "0%",    width: "34%", height: "33%" },
  "top-center":    { top: "0%",    left: "33%",   width: "34%", height: "33%" },
  "top-right":     { top: "0%",    left: "66%",   width: "34%", height: "33%" },
  "mid-left":      { top: "33%",   left: "0%",    width: "34%", height: "34%" },
  "mid-center":    { top: "33%",   left: "33%",   width: "34%", height: "34%" },
  "mid-right":     { top: "33%",   left: "66%",   width: "34%", height: "34%" },
  "bottom-left":   { top: "67%",   left: "0%",    width: "34%", height: "33%" },
  "bottom-center": { top: "67%",   left: "33%",   width: "34%", height: "33%" },
  "bottom-right":  { top: "67%",   left: "66%",   width: "34%", height: "33%" },
};

function AnnotatedImage({ imagePreview, issues, activeIssueId }: { imagePreview: string; issues: any[]; activeIssueId: number | null }) {
  const activeIssue = activeIssueId !== null ? issues.find(i => i.id === activeIssueId) : null;
  const zone = activeIssue?.zone;
  const highlight = zone ? ZONE_HIGHLIGHT[zone] : null;
  const style = activeIssue ? getSeverityStyle(activeIssue.severity) : null;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", width: "100%" }}>
        <img src={imagePreview} alt="Design" style={{ display: "block", maxWidth: "100%", width: "100%", height: "auto", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }} />
        {highlight && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", borderRadius: 8, pointerEvents: "none", transition: "opacity 0.2s" }} />
        )}
        {highlight && style && (
          <div style={{ position: "absolute", top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height, boxShadow: `0 0 0 3px ${style.color}, inset 0 0 0 9999px transparent`, borderRadius: 6, pointerEvents: "none", transition: "all 0.25s", background: `${style.color}22` }} />
        )}
        {issues.filter(i => i.severity !== "win").map((issue) => {
          const pos = issue.zone ? ZONE_POSITIONS[issue.zone] : null;
          if (!pos) return null;
          const s = getSeverityStyle(issue.severity);
          const isActive = activeIssueId === issue.id;
          const isDimmed = activeIssueId !== null && !isActive;
          return (
            <div key={issue.id} style={{ position: "absolute", top: pos.top, left: pos.left, transform: pos.transform, width: isActive ? 28 : 22, height: isActive ? 28 : 22, background: s.color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isActive ? 13 : 11, color: "#fff", fontWeight: 700, boxShadow: isActive ? `0 0 0 3px #fff, 0 4px 12px rgba(0,0,0,0.3)` : "0 0 0 2px rgba(255,255,255,0.9), 0 2px 6px rgba(0,0,0,0.25)", pointerEvents: "none", opacity: isDimmed ? 0.3 : 1, transition: "all 0.25s", zIndex: isActive ? 10 : 5 }}>
              {issue.id}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StakeholderModal({ result, onClose }: { result: any; onClose: () => void }) {
  const score: number = result.overall_business_score || 0;
  const scoreColor = score >= 70 ? "#34C759" : score >= 50 ? "#FF9500" : "#FF3B30";
  const effortColor = (e: string) => e === "Low" ? "#34C759" : e === "Medium" ? "#FF9500" : "#FF3B30";
  const priorityColor = (p: string) => p === "Ship this sprint" ? "#FF3B30" : p === "Next sprint" ? "#FF9500" : "#AEAEB2";
  const impactColor = (i: string) => i === "High" ? "#34C759" : i === "Medium" ? "#FF9500" : "#AEAEB2";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 24, maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 32px 100px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "linear-gradient(135deg,#0A2540,#1a4a7a)", borderRadius: "24px 24px 0 0", padding: "32px 32px 24px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Stakeholder Report</div>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: "0 0 20px" }}>{result.executive_summary}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>Business Score</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 16px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{result.score_label}</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "24px 32px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Business Risks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(result.business_issues || []).map((issue: any, idx: number) => (
                <div key={idx} style={{ background: "#F5F5F7", borderRadius: 12, padding: "14px 16px", borderLeft: `3px solid ${priorityColor(issue.priority)}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{issue.element}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: priorityColor(issue.priority), background: "#fff", padding: "2px 8px", borderRadius: 8, border: `1px solid ${priorityColor(issue.priority)}` }}>{issue.priority}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: effortColor(issue.effort), background: "#fff", padding: "2px 8px", borderRadius: 8 }}>{issue.effort} effort</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#3A3A3C", margin: "0 0 4px", lineHeight: 1.5 }}>💸 {issue.business_impact}</p>
                  <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, lineHeight: 1.5 }}>👤 {issue.user_impact}</p>
                </div>
              ))}
            </div>
          </div>
          {result.wins_to_keep?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#34C759", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>What's Working</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.wins_to_keep.map((win: string, idx: number) => (
                  <div key={idx} style={{ background: "#F0FFF4", border: "1px solid #B0F0C0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1C4A26" }}>✓ {win}</div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#007AFF", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Priority Matrix — Highest ROI First</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(result.priority_matrix || []).map((item: any, idx: number) => (
                <div key={idx} style={{ background: "#F0F8FF", border: "1px solid #C0DCFF", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>#{idx + 1} {item.action}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 11, color: impactColor(item.impact), fontWeight: 600 }}>↑ {item.impact} impact</span>
                      <span style={{ fontSize: 11, color: effortColor(item.effort), fontWeight: 600 }}>⚡ {item.effort} effort</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "#3A6A9A", margin: 0 }}>{item.why}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5856D6", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Ready for Sprint Planning</div>
            <div style={{ background: "#F5F5F7", borderRadius: 12, overflow: "hidden" }}>
              {(result.sprint_recommendation || []).map((ticket: string, idx: number) => (
                <div key={idx} style={{ padding: "12px 16px", borderBottom: idx < result.sprint_recommendation.length - 1 ? "1px solid #E5E5EA" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, background: "#5856D6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
                  <span style={{ fontSize: 13, color: "#1D1D1F", lineHeight: 1.4 }}>{ticket}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { const text = `📊 Design Review — Stakeholder Summary\n\n${result.executive_summary}\n\nBusiness Score: ${score}/100 — "${result.score_label}"\n\nTop 3 actions:\n${(result.sprint_recommendation || []).map((t: string, i: number) => (i+1) + ". " + t).join("\n")}\n\nGenerated by Design Bestie — designbesti.com`; navigator.clipboard.writeText(text).then(() => alert("Copied! Ready to paste into Slack or Notion 📋")); }} style={{ flex: 1, background: "#0A2540", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Copy for Slack / Notion 📋</button>
            <button onClick={onClose} style={{ flex: 1, background: "none", border: "1px solid #D2D2D7", borderRadius: 12, padding: "13px", fontSize: 14, color: "#6E6E73", cursor: "pointer", fontWeight: 500 }}>Back to Results</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoastModal({ roastResult, onClose }: { roastResult: any; onClose: () => void }) {
  const score: number = roastResult.roast_score || 0;
  const scoreColor = score >= 70 ? "#34C759" : score >= 50 ? "#FF9500" : "#FF3B30";
  const severityColor = (s: string) => s === "critical" ? "#FF3B30" : s === "high" ? "#FF9500" : "#FF6B00";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 32px 100px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "linear-gradient(135deg,#1D1D1F,#3A1F1F)", borderRadius: "24px 24px 0 0", padding: "32px 32px 24px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔥</div>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: "0 0 20px", fontStyle: "italic" }}>"{roastResult.opening}"</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>Roast Score</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 16px", display: "inline-block" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: scoreColor }}>"{roastResult.roast_label}"</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "24px 32px 32px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>The Roast 🔥</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {(roastResult.roasts || []).map((r: any, idx: number) => (
              <div key={idx} style={{ background: "#FFF5F4", border: "1px solid #FFD5D2", borderLeft: `4px solid ${severityColor(r.severity)}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", marginBottom: 6, lineHeight: 1.4 }}>"{r.roast}"</div>
                <div style={{ fontSize: 12, color: "#6E6E73", marginBottom: 8, fontStyle: "italic" }}>{r.element} — {r.real_talk}</div>
                <div style={{ background: "#F0FFF4", border: "1px solid #B0F0C0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#1C4A26" }}>→ {r.fix}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#34C759", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>The Hype ✨</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {(roastResult.hypes || []).map((h: any, idx: number) => (
              <div key={idx} style={{ background: "#F0FFF4", border: "1px solid #B0F0C0", borderLeft: "4px solid #34C759", borderRadius: 12, padding: "14px 18px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", marginBottom: 4 }}>"{h.hype}"</div>
                <div style={{ fontSize: 12, color: "#6E6E73", fontStyle: "italic" }}>{h.element} — {h.real_talk}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#F5F5F7", borderRadius: 12, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
            <span style={{ fontSize: 14, color: "#3A3A3C", fontStyle: "italic" }}>"{roastResult.redemption}"</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { const text = `🔥 My design just got roasted on Design Bestie\n\nVerdict: "${roastResult.roast_label}" (${score}/100)\n\n"${roastResult.opening}"\n\ndesignbesti.com`; navigator.clipboard.writeText(text).then(() => alert("Copied! Ready to post 🔥")); }} style={{ flex: 1, background: "#1D1D1F", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Share the Roast 🔥</button>
            <button onClick={onClose} style={{ flex: 1, background: "none", border: "1px solid #D2D2D7", borderRadius: 12, padding: "13px", fontSize: 14, color: "#6E6E73", cursor: "pointer", fontWeight: 500 }}>Back to Results</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const FIRST_FEELING_STYLES: Record<string, { bg: string; color: string; emoji: string }> = {
  safe:         { bg: "#0E2A1A", color: "#34C759", emoji: "🛡️" },
  trustworthy:  { bg: "#0E1F3A", color: "#60A5FA", emoji: "🤝" },
  exciting:     { bg: "#3A1E0A", color: "#FF9F0A", emoji: "⚡" },
  boring:       { bg: "#1F1F22", color: "#8E8E93", emoji: "💤" },
  confusing:    { bg: "#3A0A1E", color: "#FF453A", emoji: "❓" },
  overwhelming: { bg: "#2E0A3A", color: "#BF5AF2", emoji: "🌀" },
};

function getFirstFeelingStyle(feeling: string) {
  const key = (feeling || "").toLowerCase().trim();
  return FIRST_FEELING_STYLES[key] || { bg: "#1F1F22", color: "#AEAEB2", emoji: "👁️" };
}

function FirstFiveResultsScreen({ result, imagePreview, onReset, onRoast, isRoasting }: { result: any; imagePreview: string | null; onReset: () => void; onRoast: () => void; isRoasting: boolean }) {
  const feeling = (result?.firstFeeling || "").toLowerCase().trim();
  const FEELING_TINTS: Record<string, string> = {
    overwhelming: "#e05252",
    confusing: "#e05252",
    exciting: "#5dcaa5",
    trustworthy: "#5dcaa5",
    safe: "#5a47b0",
    boring: "#f0a500",
  };
  const tint = FEELING_TINTS[feeling] || "#5dcaa5";
  const noticed: string[] = Array.isArray(result?.noticed) ? result.noticed : [];
  const missed: string[] = Array.isArray(result?.missed) ? result.missed : [];
  const misunderstood: string[] = Array.isArray(result?.misunderstood) ? result.misunderstood : [];
  const score = typeof result?.attentionScore === "number" ? Math.max(0, Math.min(100, result.attentionScore)) : 0;
  const scoreColor = score >= 70 ? "#34C759" : score >= 40 ? "#FF9F0A" : "#FF453A";

  return (
    <div style={{ minHeight: "100vh", background: "#08090F", fontFamily: "'SF Pro Display',-apple-system,sans-serif", color: "#fff" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <nav style={{ padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#F472B6,#A855F7)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 15 }}>👁️</span>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "rgba(244,114,182,0.85)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>First 5 Seconds</div>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Raw first impression</span>
          </div>
        </div>
        <button onClick={onReset} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>← New Test</button>
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 24px 40px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* IMAGE */}
        {imagePreview && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={imagePreview}
              alt="Tested design"
              style={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", display: "block" }}
            />
          </div>
        )}

        {/* FEELING BADGE — full width, tinted by feeling */}
        <div style={{ width: "100%", boxSizing: "border-box", padding: "18px 24px", borderRadius: 14, background: `${tint}22`, border: `1px solid ${tint}66`, textAlign: "center", boxShadow: `0 0 40px ${tint}1a` }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, color: `${tint}cc`, marginBottom: 6 }}>First Feeling</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: tint, letterSpacing: -1.5, textTransform: "lowercase", lineHeight: 1 }}>{feeling || "—"}</div>
        </div>

        {/* NOTICE FIRST CALLOUT — full width, eye icon */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 18px", borderRadius: 12, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)", borderLeft: "4px solid #60A5FA" }}>
          <span style={{ fontSize: 20, lineHeight: 1.3, flexShrink: 0 }}>👁️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#60A5FA", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Eye Goes To First</div>
            <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.5, fontWeight: 500 }}>{result?.noticeFirst || "—"}</div>
          </div>
        </div>

        {/* NOTICED vs MISSED — two columns, dot + text rows, no extra boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div>
            <div style={{ fontSize: 10, color: "#34C759", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Noticed</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {noticed.length > 0 ? noticed.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759", marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 1.5 }}>{item}</span>
                </div>
              )) : <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>—</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#FF453A", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Missed</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {missed.length > 0 ? missed.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF453A", marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 1.5 }}>{item}</span>
                </div>
              )) : <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>—</span>}
            </div>
          </div>
        </div>

        {/* MISUNDERSTOOD — amber warning rows, full width */}
        {misunderstood.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: "#FF9F0A", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Misunderstood</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {misunderstood.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", borderRadius: 10, background: "rgba(255,159,10,0.08)", border: "1px solid rgba(255,159,10,0.25)", borderLeft: "3px solid #FF9F0A" }}>
                  <span style={{ fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATTENTION SCORE — large number on right, label + bar on left, single row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Attention Score</div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`, borderRadius: 4, transition: "width 0.8s ease", boxShadow: `0 0 12px ${scoreColor}66` }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: -1.5 }}>{score}</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>/100</span>
          </div>
        </div>

        {/* VERDICT — large centered italic, muted */}
        <div style={{ textAlign: "center", padding: "6px 8px" }}>
          <div style={{ fontSize: 22, fontStyle: "italic", color: "rgba(255,255,255,0.55)", lineHeight: 1.45, fontWeight: 500, letterSpacing: -0.3 }}>“{result?.verdict || "—"}”</div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <button onClick={onReset} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>↻ Test Another Design</button>
          <button onClick={onRoast} disabled={isRoasting} style={{ flex: 1, background: isRoasting ? "rgba(255,69,58,0.4)" : "linear-gradient(135deg,#FF453A,#FF6B35)", border: "none", color: "#fff", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: isRoasting ? "default" : "pointer", boxShadow: "0 8px 24px rgba(255,69,58,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {isRoasting ? <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} /> Roasting…</> : <>🔥 Switch to Roast Mode</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DesignBestie() {
  const { openLoginModal, user, loading } = useAuth()
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [screen, setScreen] = useState<"home" | "analysing" | "results" | "brief" | "briefing" | "firstfive-countdown" | "firstfive-analysing" | "firstfive-results">("home");
  const [briefText, setBriefText] = useState("");
  const [briefResult, setBriefResult] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "stress">("analysis");
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [stressResult, setStressResult] = useState<any>(null);
  const [stressPersonas, setStressPersonas] = useState<string[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressStep, setStressStep] = useState(0);
  const [activePersona, setActivePersona] = useState(0);
  const [stressExpandedCards, setStressExpandedCards] = useState<number[]>([]);
  const [activeIssueId, setActiveIssueId] = useState<number | null>(null);
  const [activeStressIssueId, setActiveStressIssueId] = useState<number | null>(null);
  const [roastResult, setRoastResult] = useState<any>(null);
  const [isRoasting, setIsRoasting] = useState(false);
  const [showRoastModal, setShowRoastModal] = useState(false);
  const [stakeholderResult, setStakeholderResult] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [context, setContext] = useState("");
  const bootstrappedRef = useRef(false);
  const [bootChecked, setBootChecked] = useState(false);
  const [firstFiveResult, setFirstFiveResult] = useState<any>(null);
  const [firstFiveCountdown, setFirstFiveCountdown] = useState<number>(5);
  const [firstFiveBlurred, setFirstFiveBlurred] = useState<boolean>(false);
  const [isFirstFiving, setIsFirstFiving] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"analyse" | "stress" | "roast" | "firstfive">("analyse");

  useEffect(() => {
    if (loading || bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const pendingAnalyse = typeof window !== "undefined" ? sessionStorage.getItem("designBestiPendingAnalyse") : null;
    const pendingBrief = typeof window !== "undefined" ? sessionStorage.getItem("designBestiPendingBrief") : null;

    if (pendingAnalyse) {
      sessionStorage.removeItem("designBestiPendingAnalyse");
      try {
        const parsed = JSON.parse(pendingAnalyse);
        if (parsed?.imagePreview && parsed?.fileName) {
          setImagePreview(parsed.imagePreview);
          setFileName(parsed.fileName);
          setUploaded(true);
          setContext(typeof parsed.context === "string" ? parsed.context : "");
          if (user) {
            setActiveTab("analysis");
            setAnalysisResult(null); setStressResult(null); setRoastResult(null);
            setScreen("analysing");
          } else {
            openLoginModal();
          }
        }
      } catch {}
    } else if (pendingBrief) {
      sessionStorage.removeItem("designBestiPendingBrief");
      try {
        const parsed = JSON.parse(pendingBrief);
        if (parsed?.briefText && parsed.briefText.trim().length > 10) {
          setBriefText(parsed.briefText);
          if (user) setScreen("briefing");
          else openLoginModal();
        }
      } catch {}
    }

    setBootChecked(true);
  }, [loading, user, openLoginModal]);

  const analysingSteps = ["UX Laws and Principles", "UI Rules and Standards", "Accessibility WCAG 2.2", "Nielsen Heuristics", "Gestalt Principles", "Cognitive Load Analysis"];
  const stressSteps = ["Loading personas", "Analysing persona lenses", "Checking accessibility", "Cognitive friction scan", "Cross-persona comparison", "Synthesising insights"];

  useEffect(() => {
    if (screen !== "analysing") return;
    mixpanel.track('Analysis Started', { mode: 'analyse' });
    setStep(0);
    setAnalysisResult(null);
    let apiDone = false;
    let stepsDone = false;
    const checkDone = () => { if (apiDone && stepsDone) setTimeout(() => setScreen("results"), 400); };
    const callAPI = async () => {
      try {
        const base64 = imagePreview!.split(",")[1];
        const mimeType = imagePreview!.split(";")[0].split(":")[1];
        const res = await fetch("/api/analyse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: base64, mimeType, context }) });
        const json = await res.json();
        if (res.status === 401) { setScreen("home"); openLoginModal(); return; }
        if (res.ok && json) {
          setAnalysisResult(json);
          mixpanel.track('Analysis Completed', { score: json.overall_score || json.score?.score || 0 });
        }
        else { setAnalysisResult({ overall_score: 0, scores: { usability: 0, accessibility: 0, visual_design: 0, hierarchy: 0, cognitive_load: 0 }, summary: "Analysis failed — please try again.", issues: [], wins: [], priority_fixes: [] }); }
      } catch (e) {
        setAnalysisResult({ overall_score: 0, scores: { usability: 0, accessibility: 0, visual_design: 0, hierarchy: 0, cognitive_load: 0 }, summary: "Network error — please try again.", issues: [], wins: [], priority_fixes: [] });
      } finally { apiDone = true; checkDone(); }
    };
    callAPI();
    let current = 0;
    const interval = setInterval(() => {
      current++; setStep(current);
      if (current >= analysingSteps.length) { clearInterval(interval); stepsDone = true; checkDone(); }
    }, 1500);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (screen !== "firstfive-countdown") return;
    setFirstFiveCountdown(5);
    setFirstFiveBlurred(false);
    let n = 5;
    const interval = setInterval(() => {
      n -= 1;
      if (n > 0) {
        setFirstFiveCountdown(n);
      } else {
        clearInterval(interval);
        setFirstFiveBlurred(true);
        setTimeout(() => setScreen("firstfive-analysing"), 700);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (screen !== "firstfive-analysing") return;
    setFirstFiveResult(null);
    let cancelled = false;
    (async () => {
      try {
        if (!imagePreview) { setScreen("home"); return; }
        const base64 = imagePreview.split(",")[1];
        const mimeType = imagePreview.split(";")[0].split(":")[1];
        const res = await fetch("/api/firstfive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: base64, mimeType }) });
        const json = await res.json();
        if (cancelled) return;
        if (res.status === 401) { setScreen("home"); openLoginModal(); return; }
        if (res.ok && json && json.firstFeeling) {
          setFirstFiveResult(json);
          setScreen("firstfive-results");
        } else {
          console.error("FirstFive API error:", json);
          alert("First 5 Seconds failed: " + (json?.error || "Unknown error"));
          setScreen("home");
        }
      } catch (e) {
        if (cancelled) return;
        console.error("FirstFive fetch error:", e);
        alert("First 5 Seconds network error.");
        setScreen("home");
      }
    })();
    return () => { cancelled = true; };
  }, [screen]);

  const launchFirstFive = () => {
    if (!user) { openLoginModal(); return; }
    if (!uploaded || !imagePreview) { fileInputRef.current?.click(); return; }
    setFirstFiveResult(null);
    setScreen("firstfive-countdown");
  };

  const runStressTest = async (personas: string[]) => {
    setShowPersonaModal(false); setStressPersonas(personas); setIsStressTesting(true); setStressStep(0); setStressResult(null); setActivePersona(0); setStressExpandedCards([]);
    let current = 0;
    const interval = setInterval(() => { current++; setStressStep(current); if (current >= stressSteps.length) clearInterval(interval); }, 1400);
    try {
      const base64 = imagePreview!.split(",")[1];
      const mimeType = imagePreview!.split(";")[0].split(":")[1];
      const res = await fetch("/api/stress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: base64, mimeType, personas }) });
      const json = await res.json();
      if (res.ok && json && json.personas) { setStressResult(json); setActiveTab("stress"); }
      else { console.error("Stress API error:", json); alert("Stress test failed: " + (json?.error || "Unknown error")); }
    } catch (e) { console.error("Stress fetch error:", e); alert("Stress test network error."); }
    finally { clearInterval(interval); setIsStressTesting(false); }
  };

  const runRoast = async (openModal: boolean = false) => {
    setIsRoasting(true); setRoastResult(null);
    try {
      const base64 = imagePreview!.split(",")[1];
      const mimeType = imagePreview!.split(";")[0].split(":")[1];
      const res = await fetch("/api/roast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: base64, mimeType }) });
      const json = await res.json();
      if (res.ok && json && json.roasts) { setRoastResult(json); if (openModal) setShowRoastModal(true); }
      else { console.error("Roast API error:", json); alert("Roast failed: " + (json?.error || "Unknown error")); }
    } catch (e) { console.error("Roast fetch error:", e); alert("Roast network error."); }
    finally { setIsRoasting(false); }
  };

  const runStakeholder = async () => {
    if (!analysisResult) return;
    setIsTranslating(true); setStakeholderResult(null);
    try {
      const res = await fetch("/api/stakeholder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysisResult }) });
      const json = await res.json();
      if (res.ok && json && json.executive_summary) { setStakeholderResult(json); }
      else { console.error("Stakeholder API error:", json); alert("Translation failed: " + (json?.error || "Unknown error")); }
    } catch (e) { console.error("Stakeholder fetch error:", e); alert("Network error."); }
    finally { setIsTranslating(false); }
  };

  const runFirstFiveInline = async () => {
    if (!imagePreview) return;
    setIsFirstFiving(true); setFirstFiveResult(null);
    try {
      const base64 = imagePreview.split(",")[1];
      const mimeType = imagePreview.split(";")[0].split(":")[1];
      const res = await fetch("/api/firstfive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: base64, mimeType }) });
      const json = await res.json();
      if (res.status === 401) { openLoginModal(); return; }
      if (res.ok && json && json.firstFeeling) { setFirstFiveResult(json); }
      else { console.error("FirstFive API error:", json); alert("First 5 Seconds failed: " + (json?.error || "Unknown error")); }
    } catch (e) { console.error("FirstFive fetch error:", e); alert("First 5 Seconds network error."); }
    finally { setIsFirstFiving(false); }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setUploaded(true); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0]);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); };

  if (!bootChecked) {
    return <div style={{ position: "fixed", inset: 0, background: "#08090F", zIndex: 99999 }} />;
  }

  if (screen === "home") {
    return (
      <HomeScreen
        onStart={() => {
          if (!user) { openLoginModal(); return; }
          if (uploaded && imagePreview) { setActiveTab("analysis"); setAnalysisResult(null); setStressResult(null); setRoastResult(null); setScreen("analysing"); } else fileInputRef.current?.click();
        }}
        onBrief={() => {
          if (!user) { openLoginModal(); return; }
          if (briefText.trim().length > 10) setScreen("briefing");
        }}
        onLaunchFirstFive={launchFirstFive}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        briefText={briefText}
        setBriefText={setBriefText}
        uploaded={uploaded} fileName={fileName} imagePreview={imagePreview}
        fileInputRef={fileInputRef} isDragging={isDragging} setIsDragging={setIsDragging}
        handleInputChange={handleInputChange} handleDrop={handleDrop}
      />
    );
  }

  if (screen === "analysing") {
    return (
      <div style={{ minHeight: "100vh", background: "#020B18", fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
        <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
        <nav style={{ padding: "0 48px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#2563EB,#0EA5E9)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 15 }}>✦</span>
            </div>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>Design Bestie</span>
          </div>
          <button onClick={() => setScreen("home")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "8px 18px", cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.5)" }}>← Back</button>
        </nav>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 48 }}>
          <div style={{ display: "flex", gap: 80, alignItems: "center", maxWidth: 900, width: "100%" }}>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 260, height: 520 }}>
                <div style={{ position: "absolute", inset: -60, background: "radial-gradient(ellipse,rgba(37,99,235,0.35),transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", inset: -40, background: "radial-gradient(ellipse at 70% 30%,rgba(14,165,233,0.2),transparent 60%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,#3D3D4A,#1E1E28)", borderRadius: 52, boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 40px rgba(37,99,235,0.3)" }}>
                  <div style={{ position: "absolute", left: -4, top: 95, width: 4, height: 30, background: "linear-gradient(180deg,#4A4A5A,#2A2A3A)", borderRadius: "3px 0 0 3px" }} />
                  <div style={{ position: "absolute", left: -4, top: 135, width: 4, height: 48, background: "linear-gradient(180deg,#4A4A5A,#2A2A3A)", borderRadius: "3px 0 0 3px" }} />
                  <div style={{ position: "absolute", left: -4, top: 193, width: 4, height: 48, background: "linear-gradient(180deg,#4A4A5A,#2A2A3A)", borderRadius: "3px 0 0 3px" }} />
                  <div style={{ position: "absolute", right: -4, top: 152, width: 4, height: 68, background: "linear-gradient(180deg,#4A4A5A,#2A2A3A)", borderRadius: "0 3px 3px 0" }} />
                  <div style={{ position: "absolute", top: 10, left: 10, right: 10, bottom: 10, borderRadius: 42, overflow: "hidden", background: "#0A0A0F", boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}>
                    {imagePreview
                      ? <img src={imagePreview} alt="Design" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(145deg,#0F0F1A,#1A0A2E)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#2563EB,#0EA5E9)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#fff", fontSize: 20 }}>✦</span>
                          </div>
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 500 }}>Your design</span>
                        </div>}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 0%,rgba(37,99,235,0.12) 48%,rgba(37,99,235,0.12) 52%,transparent 100%)", animation: "pulse 2s ease-in-out infinite" }} />
                    <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 80, height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "rgba(59,130,246,0.9)", fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>Processing</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-1.2px" }}>Analysing your design</h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 0 32px" }}>Running against 50+ expert frameworks</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {analysingSteps.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: i < step ? "linear-gradient(135deg,#2563EB,#0EA5E9)" : "transparent", border: i < step ? "none" : i === step ? "2px solid #3B82F6" : "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s", boxShadow: i < step ? "0 2px 8px rgba(37,99,235,0.4)" : "none" }}>
                      {i < step ? <span style={{ color: "#fff", fontSize: 11 }}>✓</span> : i === step ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" }} /> : null}
                    </div>
                    <span style={{ fontSize: 15, color: i < step ? "rgba(255,255,255,0.9)" : i === step ? "#fff" : "rgba(255,255,255,0.2)", fontWeight: i === step ? 600 : 400, transition: "all 0.3s" }}>{s}</span>
                    {i < step && <span style={{ marginLeft: "auto", fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>Done</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Usually takes 15 seconds</span>
                  <span style={{ fontSize: 13, color: "#60A5FA", fontWeight: 700 }}>{Math.round((step / analysingSteps.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg,#2563EB,#0EA5E9)", borderRadius: 2, width: `${(step / analysingSteps.length) * 100}%`, transition: "width 0.6s ease", boxShadow: "0 0 12px rgba(37,99,235,0.6)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "results" && !analysisResult) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #1D1D1F", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 16, color: "#6E6E73" }}>Loading results…</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (screen === "results" && analysisResult) {
    return (
      <>
        {showRoastModal && roastResult && <RoastModal roastResult={roastResult} onClose={() => setShowRoastModal(false)} />}
        {showStakeholderModal && stakeholderResult && <StakeholderModal result={stakeholderResult} onClose={() => setShowStakeholderModal(false)} />}
        {showPersonaModal && <PersonaModal onClose={() => setShowPersonaModal(false)} onRun={runStressTest} />}
        <ResultsPage
          analysisResult={analysisResult}
          roastResult={roastResult}
          stressResult={stressResult}
          stakeholderResult={stakeholderResult}
          firstFiveResult={firstFiveResult}
          imagePreview={imagePreview || ""}
          onNewAnalysis={() => { setScreen("home"); setUploaded(false); setFileName(""); setImagePreview(null); setAnalysisResult(null); setStressResult(null); setRoastResult(null); setStakeholderResult(null); setFirstFiveResult(null); setExpandedCards([]); }}
          onRunRoast={() => runRoast(false)}
          onRunStress={() => setShowPersonaModal(true)}
          onRunStakeholder={runStakeholder}
          onRunFirstFive={runFirstFiveInline}
          isRoasting={isRoasting}
          isStressing={isStressTesting}
          isStakeholdering={isTranslating}
          isFirstFiving={isFirstFiving}
          expandedCards={expandedCards}
          setExpandedCards={setExpandedCards}
        />
      </>
    );
  }

  if (screen === "briefing") {
    if (!briefResult) {
      // Use useEffect pattern via a ref to avoid calling API on every render
      if (typeof window !== "undefined" && !(window as any).__briefApiCalled) {
        (window as any).__briefApiCalled = true;
        fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirements: briefText }),
        }).then(r => r.json()).then(json => {
          (window as any).__briefApiCalled = false;
          if (json && json.screens_needed) {
            setBriefResult(json);
            setScreen("brief");
          } else {
            console.error("Brief API error:", json);
            alert("Brief generation failed — please try again.");
            setScreen("home");
          }
        }).catch(e => {
          (window as any).__briefApiCalled = false;
          console.error(e);
          alert("Network error — please try again.");
          setScreen("home");
        });
      }
    }
    return (
      <div style={{ minHeight: "100vh", background: "#020B18", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(59,130,246,0.8)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 28 }}>● Processing</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: "-1.2px" }}>Analysing your</h2>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: "-1.2px", opacity: 0.4 }}>requirements.</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 40px", letterSpacing: 1, textTransform: "uppercase", fontWeight: 500 }}>Finding gaps · edge cases · missing states</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
            {["Reading requirements", "Identifying screens needed", "Flagging edge cases", "Spotting missing states", "Generating questions to ask"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", flexShrink: 0, boxShadow: "0 0 6px rgba(59,130,246,0.6)", opacity: 0.4 + i * 0.15 }} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5, opacity: 0.4 + i * 0.15 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.4)", borderTopColor: "#3B82F6", animation: "spin 0.8s linear infinite", margin: "40px auto 0" }} />
        </div>
      </div>
    );
  }

  if (screen === "brief" && briefResult) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'SF Pro Display',-apple-system,sans-serif", color: "#1D1D1F" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <nav style={{ padding: "0 48px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E5EA", position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#2563EB,#0EA5E9)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 15 }}>✦</span>
            </div>
            <span style={{ fontWeight: 700, color: "#1D1D1F", fontSize: 16 }}>Design Bestie</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setBriefResult(null); setBriefText(""); setScreen("home"); }} style={{ background: "none", border: "1px solid #D2D2D7", borderRadius: 20, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "#6E6E73" }}>← New Brief</button>
            <button onClick={() => { setUploaded(false); setFileName(""); setImagePreview(null); setScreen("home"); setTimeout(() => { const el = document.querySelector('.db-cards'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }} style={{ background: "linear-gradient(135deg,#2563EB,#0EA5E9)", color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}>Review a Design →</button>
            <UserMenu />
          </div>
        </nav>
        <div style={{ padding: "32px 48px 48px" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: "#6E6E73", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Design Brief</div>
            <h1 style={{ fontSize: 44, fontWeight: 900, color: "#1D1D1F", margin: "0 0 12px", letterSpacing: "-2px", lineHeight: 1 }}>{briefResult.feature_name || "Your Feature"}</h1>
            <p style={{ fontSize: 20, color: "#6E6E73", margin: 0, lineHeight: 1.7, maxWidth: 680 }}>{briefResult.summary}</p>
          </div>
          <div style={{ background: "#F0F4FF", border: "1px solid #C7D7FD", borderRadius: 20, padding: "24px 28px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>📱 Screens to Design</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {(briefResult.screens_needed || []).map((s: any, i: number) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #E5E5EA" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 4 }}>{s.screen}</div>
                  <div style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.6, marginBottom: s.solution ? 8 : 0 }}>{s.purpose}</div>
                  {s.solution && (
                    <div style={{ background: "#F0F4FF", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#2563EB", lineHeight: 1.6, borderLeft: "3px solid #2563EB" }}>
                      → {s.solution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#FFF5F4", border: "1px solid #FFD5D2", borderRadius: 20, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>🔲 States to Design</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(briefResult.states_needed || []).map((s: any, i: number) => (
                  <div key={i} style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, borderLeft: "3px solid #FF3B30" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#FF3B30", marginBottom: 4 }}>{s.state}</div>
                    <div style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.6, marginBottom: s.solution ? 8 : 0 }}>{s.description}</div>
                    {s.solution && (
                      <div style={{ background: "#FFF5F4", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#CC2200", lineHeight: 1.6 }}>
                        → {s.solution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#FFFBF0", border: "1px solid #FFD9A0", borderRadius: 20, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FF9500", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>⚠️ Edge Cases</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(briefResult.edge_cases || []).map((e: any, i: number) => (
                  <div key={i} style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, borderLeft: "3px solid #FF9500" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#FF9500", marginBottom: 4 }}>{e.case}</div>
                    <div style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.6, marginBottom: e.solution ? 8 : 0 }}>{e.what_to_design}</div>
                    {e.solution && (
                      <div style={{ background: "#FFFBF0", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#B35900", lineHeight: 1.6 }}>
                        → {e.solution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#F5F0FF", border: "1px solid #C4B5FD", borderRadius: 20, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5856D6", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>❓ Ask Before You Start</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(briefResult.questions_to_ask || []).map((q: string, i: number) => (
                  <div key={i} style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, borderLeft: "3px solid #5856D6", fontSize: 15, color: "#3A3A3C", lineHeight: 1.6 }}>{q}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: briefResult.conflicts?.length > 0 ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 28 }}>
            {briefResult.conflicts?.length > 0 && (
              <div style={{ background: "#FFF5F4", border: "1px solid #FFD5D2", borderRadius: 20, padding: "22px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>🚨 Conflicts in Requirements</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {briefResult.conflicts.map((c: string, i: number) => (
                    <div key={i} style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, borderLeft: "3px solid #FF3B30", fontSize: 15, color: "#3A3A3C", lineHeight: 1.6 }}>{c}</div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: "#F0FFF4", border: "1px solid #B0F0C0", borderRadius: 20, padding: "22px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#34C759", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>✅ Design Checklist</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(briefResult.checklist || []).map((item: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#fff", borderRadius: 10, fontSize: 14, color: "#3A3A3C", lineHeight: 1.55 }}>
                    <span style={{ color: "#34C759", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { const lines = ["DESIGN BRIEF — " + (briefResult.feature_name || "Feature"), "", briefResult.summary, "", "SCREENS TO DESIGN:", ...(briefResult.screens_needed || []).map((s: any) => "• " + s.screen + " — " + s.purpose), "", "STATES TO DESIGN:", ...(briefResult.states_needed || []).map((s: any) => "• " + s.state + ": " + s.description), "", "EDGE CASES:", ...(briefResult.edge_cases || []).map((e: any) => "• " + e.case + ": " + e.what_to_design), "", "QUESTIONS TO ASK FIRST:", ...(briefResult.questions_to_ask || []).map((q: string) => "• " + q), "", "Generated by Design Bestie — designbesti.com"]; navigator.clipboard.writeText(lines.join("\n")).then(() => alert("Copied! Paste into Notion or Slack 📋")); }} style={{ flex: 1, background: "#F5F5F7", color: "#1D1D1F", border: "1px solid #E5E5EA", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span>📋</span> Copy to Clipboard
            </button>
            <button onClick={() => { const featureName = briefResult.feature_name || "Feature"; const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); const divider = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; const lines = ["DESIGN REVIEW CHECKLIST", featureName.toUpperCase(), "Generated by Design Bestie  |  " + date, divider, "", "Send this to your PM / BA / Dev team before starting design.", "", divider, "SECTION 1 — QUESTIONS TO CLARIFY WITH YOUR TEAM", divider, "Please review and answer these before design begins:", "", ...(briefResult.questions_to_ask || []).map((q: string, i: number) => "  " + (i + 1) + ". " + q + "\n     Answer: _______________________________________________\n"), "", divider, "SECTION 2 — SCREENS TO CONFIRM", divider, "Confirm these screens are in scope:", "", ...(briefResult.screens_needed || []).map((s: any) => "  ☐  " + s.screen + "\n     " + s.purpose + "\n"), "", divider, "SECTION 3 — EDGE CASES TO DISCUSS", divider, "These scenarios need a decision before design starts:", "", ...(briefResult.edge_cases || []).map((e: any) => "  ☐  " + e.case + "\n     " + e.what_to_design + "\n"), "", divider, "SECTION 4 — STATES TO DESIGN", divider, "Confirm all these states need to be designed:", "", ...(briefResult.states_needed || []).map((s: any) => "  ☐  " + s.state + "\n     " + s.description + "\n"), "", divider, "NOTES / DECISIONS", divider, "", "  _______________________________________________", "  _______________________________________________", "  _______________________________________________", "  _______________________________________________", "", divider, "Powered by Design Bestie — designbesti.com", divider]; const text = lines.join("\n"); const blob = new Blob([text], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = featureName.replace(/\s+/g, "-").toLowerCase() + "-design-checklist.txt"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }} style={{ flex: 1, background: "linear-gradient(135deg,#1D4ED8,#0EA5E9)", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(14,165,233,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span>⬇️</span> Download Team Checklist
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "firstfive-countdown") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#08090F", fontFamily: "'SF Pro Display',-apple-system,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 100, padding: 24, gap: 24 }}>
        {imagePreview && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={imagePreview}
              alt="Design"
              style={{ display: "block", maxWidth: 600, maxHeight: "70vh", width: "auto", height: "auto", objectFit: "contain" }}
            />
            {!firstFiveBlurred && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0) 75%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 120, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: -4, textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>{firstFiveCountdown}</span>
                </div>
              </div>
            )}
          </div>
        )}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, fontWeight: 500, letterSpacing: 0.3 }}>Look at the design. What sticks? What's missed?</p>
      </div>
    );
  }

  if (screen === "firstfive-analysing") {
    return (
      <div style={{ minHeight: "100vh", background: "#08090F", fontFamily: "'SF Pro Display',-apple-system,sans-serif", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes ffaPulse{0%,100%{opacity:0.4}50%{opacity:1}}
        `}</style>
        <div style={{ position: "absolute", top: 28, left: 32, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#F472B6,#A855F7)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 15 }}>👁️</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(244,114,182,0.85)", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>First 5 Seconds</div>
        </div>

        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          {imagePreview && (
            <div style={{ width: 200, height: 130, margin: "0 auto 28px", borderRadius: 14, overflow: "hidden", filter: "blur(16px) brightness(0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <img src={imagePreview} alt="Design" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,114,182,0.85)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 14, animation: "ffaPulse 1.6s ease-in-out infinite" }}>● Processing first impression</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: -1.2 }}>Reading your brain.</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", lineHeight: 1.6 }}>Capturing what registered, what slipped by, and what got misunderstood — before conscious thought kicked in.</p>
          <div style={{ width: 36, height: 36, margin: "0 auto", borderRadius: "50%", border: "2px solid rgba(244,114,182,0.25)", borderTopColor: "#F472B6", animation: "spin 0.8s linear infinite" }} />
        </div>
      </div>
    );
  }

  if (screen === "firstfive-results" && firstFiveResult) {
    return (
      <>
        <FirstFiveResultsScreen
          result={firstFiveResult}
          imagePreview={imagePreview}
          onReset={() => { setFirstFiveResult(null); setScreen("home"); }}
          onRoast={() => { if (isRoasting) return; if (roastResult) { setShowRoastModal(true); } else { runRoast(true); } }}
          isRoasting={isRoasting}
        />
        {showRoastModal && roastResult && <RoastModal roastResult={roastResult} onClose={() => setShowRoastModal(false)} />}
      </>
    );
  }

  return null;
}
