"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import AnalyseResults from "./modes/AnalyseResults";
import RoastResults from "./modes/RoastResults";
import StressResults from "./modes/StressResults";
import StakeholderResults from "./modes/StakeholderResults";
import FirstFiveResults from "./modes/FirstFiveResults";

type Mode = "analyse" | "roast" | "stress" | "stakeholder" | "firstfive";

const ZONE_HIGHLIGHT: Record<string, { top: string; left: string; width: string; height: string }> = {
  "top-left":      { top: "0%",  left: "0%",   width: "34%", height: "33%" },
  "top-center":    { top: "0%",  left: "33%",  width: "34%", height: "33%" },
  "top-right":     { top: "0%",  left: "66%",  width: "34%", height: "33%" },
  "mid-left":      { top: "33%", left: "0%",   width: "34%", height: "34%" },
  "mid-center":    { top: "33%", left: "33%",  width: "34%", height: "34%" },
  "mid-right":     { top: "33%", left: "66%",  width: "34%", height: "34%" },
  "bottom-left":   { top: "67%", left: "0%",   width: "34%", height: "33%" },
  "bottom-center": { top: "67%", left: "33%",  width: "34%", height: "33%" },
  "bottom-right":  { top: "67%", left: "66%",  width: "34%", height: "33%" },
};

const ZONE_POSITIONS: Record<string, { top: string; left: string; transform: string }> = {
  "top-left":      { top: "16.5%", left: "17%",  transform: "translate(-50%, -50%)" },
  "top-center":    { top: "16.5%", left: "50%",  transform: "translate(-50%, -50%)" },
  "top-right":     { top: "16.5%", left: "83%",  transform: "translate(-50%, -50%)" },
  "mid-left":      { top: "50%",   left: "17%",  transform: "translate(-50%, -50%)" },
  "mid-center":    { top: "50%",   left: "50%",  transform: "translate(-50%, -50%)" },
  "mid-right":     { top: "50%",   left: "83%",  transform: "translate(-50%, -50%)" },
  "bottom-left":   { top: "83.5%", left: "17%",  transform: "translate(-50%, -50%)" },
  "bottom-center": { top: "83.5%", left: "50%",  transform: "translate(-50%, -50%)" },
  "bottom-right":  { top: "83.5%", left: "83%",  transform: "translate(-50%, -50%)" },
};

const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case "critical": return { color: "#EF4444", bg: "#FEE2E2" };
    case "high": return { color: "#F59E0B", bg: "#FEF3C7" };
    case "medium": return { color: "#F97316", bg: "#FFEDD5" };
    case "win": return { color: "#10B981", bg: "#D1FAE5" };
    default: return { color: "#6B7280", bg: "#F3F4F6" };
  }
};

type Props = {
  analysisResult: any;
  roastResult: any;
  stressResult: any;
  stakeholderResult: any;
  firstFiveResult: any;
  imagePreview: string;
  onNewAnalysis: () => void;
  onRunRoast: () => void;
  onRunStress: () => void;
  onRunStakeholder: () => void;
  onRunFirstFive: () => void;
  isRoasting: boolean;
  isStressing: boolean;
  isStakeholdering: boolean;
  isFirstFiving: boolean;
  expandedCards: number[];
  setExpandedCards: React.Dispatch<React.SetStateAction<number[]>>;
};

export default function ResultsPage({
  analysisResult,
  roastResult,
  stressResult,
  stakeholderResult,
  firstFiveResult,
  imagePreview,
  onNewAnalysis,
  onRunRoast,
  onRunStress,
  onRunStakeholder,
  onRunFirstFive,
  isRoasting,
  isStressing,
  isStakeholdering,
  isFirstFiving,
  expandedCards,
  setExpandedCards,
}: Props) {
  const [activeTab, setActiveTab] = useState<Mode>("analyse");
  const [displayScore, setDisplayScore] = useState(0);
  const [scoreAnimated, setScoreAnimated] = useState(false);
  const [activeIssueId, setActiveIssueId] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const issues = [
    ...((analysisResult?.issues || []) as any[]).map((i: any) => ({ ...i, law: i.rule_violated, learnWhy: i.learn_why })),
    ...((analysisResult?.wins || []) as any[]).map((i: any, idx: number) => ({ ...i, id: (analysisResult?.issues?.length || 0) + idx + 1 })),
  ];

  const overallScore: number = analysisResult?.score?.score ?? analysisResult?.overall_score ?? 0;
  const scoreVerdict = overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Needs work" : "Critical issues";
  const benchmarkText = overallScore >= 80 ? "Top 20% of designers" : overallScore >= 60 ? "Top 40% of designers" : "Below average";
  const benchmarkColor = overallScore >= 80 ? "bg-emerald-500 text-white" : overallScore >= 60 ? "bg-amber-500 text-white" : "bg-red-500 text-white";

  const breakdown = analysisResult?.score?.breakdown || {};
  const categories: { key: string; label: string; value: number; max: number }[] = [
    { key: "clarity", label: "Usability", value: breakdown.clarity ?? 0, max: 20 },
    { key: "accessibility", label: "Accessibility", value: breakdown.accessibility ?? 0, max: 20 },
    { key: "consistency", label: "Visual", value: breakdown.consistency ?? 0, max: 20 },
    { key: "hierarchy", label: "Hierarchy", value: breakdown.hierarchy ?? 0, max: 20 },
    { key: "cognitive_load", label: "Cognitive", value: breakdown.cognitive_load ?? 0, max: 20 },
  ];

  // Score counting animation
  useEffect(() => {
    if (overallScore > 0 && !scoreAnimated) {
      let current = 0;
      const increment = Math.ceil(overallScore / 30);
      const timer = setInterval(() => {
        current += increment;
        if (current >= overallScore) {
          setDisplayScore(overallScore);
          setScoreAnimated(true);
          clearInterval(timer);
        } else {
          setDisplayScore(current);
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [overallScore, scoreAnimated]);

  // Scroll to active issue dot
  useEffect(() => {
    if (activeIssueId !== null && imageContainerRef.current) {
      const activeIssue = issues.find(i => i.id === activeIssueId);
      if (activeIssue?.zone) {
        const pos = ZONE_POSITIONS[activeIssue.zone];
        if (pos) {
          const containerHeight = imageContainerRef.current.scrollHeight;
          const topPercent = parseFloat(pos.top);
          const scrollTop = (topPercent / 100) * containerHeight - imageContainerRef.current.clientHeight / 2;
          imageContainerRef.current.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
        }
      }
    }
  }, [activeIssueId, issues]);

  const handleTabChange = (mode: Mode) => {
    setActiveTab(mode);
    if (mode === "roast" && !roastResult && !isRoasting) onRunRoast();
    else if (mode === "stress" && !stressResult && !isStressing) onRunStress();
    else if (mode === "stakeholder" && !stakeholderResult && !isStakeholdering) onRunStakeholder();
    else if (mode === "firstfive" && !firstFiveResult && !isFirstFiving) onRunFirstFive();
  };

  const tabs: { key: Mode; label: string }[] = [
    { key: "analyse", label: "Analyse" },
    { key: "roast", label: "Roast" },
    { key: "stress", label: "Stress test" },
    { key: "stakeholder", label: "Stakeholders" },
    { key: "firstfive", label: "First 5s" },
  ];

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Topbar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5a47b0] to-[#7c5fd9]">
            <span className="text-sm font-bold text-white">✦</span>
          </div>
          <div className="text-base font-bold tracking-tight">
            <span className="text-slate-900">design</span>
            <span style={{ color: '#5a47b0' }}>besti</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/'}
          className="rounded-lg border-slate-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5a47b0] text-sm"
        >
          ← New Analysis
        </Button>
      </header>

      {/* Two column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN — 40% */}
        <aside className="w-[35%] border-r border-slate-200 flex flex-col overflow-y-auto">
          {/* Section 1 — Score and benchmark */}
          <div className="px-3 py-2 border-b border-slate-200 text-center items-center">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-3xl font-semibold leading-none text-slate-900">{displayScore}</span>
              <span className="text-3xl font-semibold leading-none text-slate-300">/100</span>
            </div>
            {scoreAnimated && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="text-base text-slate-700 mb-3">{scoreVerdict}</div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <div className={`inline-flex items-center rounded-full text-sm font-semibold px-4 py-2 ${benchmarkColor}`}>
                    {benchmarkText}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Section 2 — Category rings */}
          <div className="px-3 py-2 border-b border-slate-200">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-4">Category breakdown</div>
            {scoreAnimated && (
              <div className="grid grid-cols-5 gap-2">
                {categories.map((cat, idx) => {
                  const percentage = (cat.value / cat.max) * 100;
                  const ringColor = percentage > 70 ? "#10b981" : percentage > 40 ? "#f59e0b" : "#ef4444";
                  const circumference = 2 * Math.PI * 16;
                  const offset = circumference - (percentage / 100) * circumference;

                  return (
                    <div key={cat.key} className="flex flex-col items-center">
                      <div className="relative w-10 h-10 mb-1">
                        <svg width="40" height="40" className="transform -rotate-90">
                          <circle cx="20" cy="20" r="16" stroke="#e2e8f0" strokeWidth="2.5" fill="none" />
                          <motion.circle
                            cx="20"
                            cy="20"
                            r="16"
                            stroke={ringColor}
                            strokeWidth="2.5"
                            fill="none"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 0.8, delay: 0.6 + idx * 0.1 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: '#0f172a' }}>
                          {cat.value}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium text-center leading-tight">{cat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3 — Image */}
          <div ref={imageContainerRef} className="flex-1 p-3 overflow-y-auto" style={{ minHeight: '600px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', width: '100%', overflow: 'visible' }}>
              <img
                ref={imageRef}
                src={imagePreview}
                alt="Uploaded design"
                style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '8px' }}
              />
              {activeIssueId !== null && (() => {
                const activeIssue = issues.find(i => i.id === activeIssueId);
                const zone = activeIssue?.zone;
                const highlight = zone ? ZONE_HIGHLIGHT[zone] : null;
                const style = activeIssue ? getSeverityStyle(activeIssue.severity) : null;

                return (
                  <>
                    {/* Colored zone highlight */}
                    {highlight && style && (
                      <div style={{
                        position: 'absolute',
                        top: highlight.top,
                        left: highlight.left,
                        width: highlight.width,
                        height: highlight.height,
                        boxShadow: `0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 3px ${style.color}`,
                        background: `${style.color}22`,
                        borderRadius: 6,
                        pointerEvents: 'none'
                      }} />
                    )}
                  </>
                );
              })()}
              {/* Numbered dots for each issue */}
              {issues.map((issue) => {
                const pos = issue.zone ? ZONE_POSITIONS[issue.zone] : null;
                console.log('Issue zone:', issue.id, issue.zone, 'Position found:', !!pos);
                if (!pos) return null;
                const style = getSeverityStyle(issue.severity);
                const isActive = activeIssueId === issue.id;
                const isDimmed = activeIssueId !== null && !isActive;
                return (
                  <div
                    key={issue.id}
                    style={{
                      position: 'absolute',
                      top: pos.top,
                      left: pos.left,
                      transform: pos.transform,
                      width: isActive ? 28 : 22,
                      height: isActive ? 28 : 22,
                      background: style.color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isActive ? 13 : 11,
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: isActive ? '0 0 0 3px #fff, 0 4px 12px rgba(0,0,0,0.3)' : '0 0 0 2px rgba(255,255,255,0.9), 0 2px 6px rgba(0,0,0,0.25)',
                      pointerEvents: 'none',
                      opacity: isDimmed ? 0.3 : 1,
                      transition: 'all 0.25s',
                      zIndex: isActive ? 10 : 5
                    }}
                  >
                    {issue.id}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN */}
        <main className="flex-1 flex flex-col bg-slate-50">
          {/* Verdict */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">The bottom line</div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {analysisResult?.summary || "Your design has been analyzed."}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-5 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#5a47b0] ${
                    activeTab === tab.key
                      ? "bg-[#5a47b0] text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "analyse" && (
                  <AnalyseResults
                    analysisResult={analysisResult}
                    issues={issues}
                    expandedCards={expandedCards}
                    setExpandedCards={setExpandedCards}
                    activeIssueId={activeIssueId}
                    setActiveIssueId={setActiveIssueId}
                  />
                )}
                {activeTab === "roast" && (
                  <RoastResults result={roastResult} isLoading={isRoasting} onRun={onRunRoast} />
                )}
                {activeTab === "stress" && (
                  <StressResults result={stressResult} isLoading={isStressing} onRun={onRunStress} />
                )}
                {activeTab === "stakeholder" && (
                  <StakeholderResults result={stakeholderResult} isLoading={isStakeholdering} onRun={onRunStakeholder} />
                )}
                {activeTab === "firstfive" && (
                  <FirstFiveResults result={firstFiveResult} isLoading={isFirstFiving} onRun={onRunFirstFive} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
