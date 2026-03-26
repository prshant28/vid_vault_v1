import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useInView } from "framer-motion";
import {
  Mail, Lock, Loader2, ArrowUpRight, Sparkles, Brain, FileText,
  CheckSquare, Youtube, Folder, Tag, Zap, BookOpen, BarChart3, Download
} from "lucide-react";

type AuthMode = "landing" | "register" | "login-manual";
type NavSection = "SAVE" | "FEATURES" | "AI_TOOLS" | "HOW_IT_WORKS" | "GET_STARTED";

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function Counter({ to, color = "#fff" }: { to: number; color?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.max(1, Math.ceil(to / 50));
    const t = setInterval(() => { v = Math.min(v + step, to); setN(v); if (v >= to) clearInterval(t); }, 25);
    return () => clearInterval(t);
  }, [to]);
  return <span style={{ color }}>{n}</span>;
}

function TypedText({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const d = setTimeout(() => {
      const t = setInterval(() => { setShown(text.slice(0, ++i)); if (i >= text.length) clearInterval(t); }, 36);
      return () => clearInterval(t);
    }, startDelay);
    return () => clearTimeout(d);
  }, [text, startDelay]);
  return <>{shown}{shown.length < text.length && <span className="text-[#8b5cf6] animate-pulse">|</span>}</>;
}

function MonoInput({ type = "text", placeholder, value, onChange, icon: Icon }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; icon?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${focused ? "text-[#8b5cf6]" : "text-[#333]"}`} />}
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full h-11 text-sm text-white placeholder:text-[#252525] focus:outline-none font-sans"
        style={{ background: "#0c0c0e", border: `1px solid ${focused ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`, padding: Icon ? "0 12px 0 38px" : "0 12px", boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.07)" : "none" }} />
    </div>
  );
}

function MonolithBtn({ children, onClick, size = "md", type = "button", disabled = false, fullWidth = false }: {
  children: React.ReactNode; onClick?: () => void; size?: "sm" | "md" | "lg";
  type?: "button" | "submit"; disabled?: boolean; fullWidth?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const pad = { sm: "7px 16px", md: "11px 22px", lg: "12px 28px" }[size];
  const fs = { sm: "10px", md: "11px", lg: "12px" }[size];
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="font-mono-ui uppercase tracking-[0.07em] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 flex-shrink-0"
      style={{ padding: pad, fontSize: fs, width: fullWidth ? "100%" : undefined, minHeight: size === "lg" ? 46 : size === "md" ? 42 : 34, background: hov ? "#8b5cf6" : "#fff", color: hov ? "#fff" : "#000", clipPath: "polygon(6% 0px,100% 0px,100% 76%,94% 100%,0px 100%,0px 24%)", transition: "background 0.2s,color 0.2s" }}
    >{children}</motion.button>
  );
}

/* ══════════════════════════════════════════════
   LEFT SIDEBAR NAV (CampusConnect style)
══════════════════════════════════════════════ */
const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: "SAVE", label: "SAVE" },
  { id: "FEATURES", label: "FEATURES" },
  { id: "AI_TOOLS", label: "AI_TOOLS" },
  { id: "HOW_IT_WORKS", label: "HOW_IT_WORKS" },
  { id: "GET_STARTED", label: "GET_STARTED" },
];

function LeftSidebar({ active, onNav }: { active: NavSection; onNav: (id: NavSection) => void }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col items-center"
      style={{ width: 36, background: "#0a0a0b", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Logo */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="w-9 h-9 bg-white flex items-center justify-center font-black text-black text-[11px] font-mono-ui flex-shrink-0 mt-3 cursor-default">
        VV
      </motion.div>

      {/* Nav links — vertical rotated */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {NAV_ITEMS.map((item, i) => (
          <motion.button key={item.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
            onClick={() => onNav(item.id)}
            className="font-mono-ui text-[8px] uppercase tracking-[0.25em] cursor-pointer transition-colors duration-200 hover:text-white"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: active === item.id ? "#8b5cf6" : "#2a2a2a",
              letterSpacing: "0.22em",
            }}
          >
            {item.label}
          </motion.button>
        ))}
      </div>

      {/* Status dot */}
      <motion.div className="mb-4 w-1.5 h-1.5 rounded-full bg-green-500"
        animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
    </aside>
  );
}

/* ══════════════════════════════════════════════
   TOP BAR (CampusConnect style — flat)
══════════════════════════════════════════════ */
function TopBar({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="flex items-center justify-between px-6 sm:px-10 h-14 sm:h-16 flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="font-black text-white uppercase tracking-[0.1em] text-sm font-mono-ui">
        VIDVAULT<span className="text-[#8b5cf6]"> AI</span>
      </span>
      <div className="flex items-center gap-4 sm:gap-6">
        <button onClick={onLogin}
          className="font-mono-ui text-[10px] uppercase tracking-widest text-[#444] hover:text-white transition-colors">
          LOG IN
        </button>
        <motion.button onClick={onRegister} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="font-mono-ui text-[10px] uppercase tracking-widest text-white px-5 h-9 flex items-center"
          style={{ border: "1px solid rgba(255,255,255,0.3)", clipPath: "polygon(4% 0,100% 0,100% 78%,96% 100%,0 100%,0 22%)" }}>
          GET STARTED
        </motion.button>
      </div>
    </motion.header>
  );
}

/* ══════════════════════════════════════════════
   LIVE RADAR CARD — animated workflow demo
══════════════════════════════════════════════ */
const DEMO_PHASES = [
  { phase: "INPUT", label: "PASTE_URL", desc: "youtube.com/watch?v=dQw4w9Wg..." },
  { phase: "FETCH", label: "FETCHING_META", desc: "Downloading transcript & metadata..." },
  { phase: "AI_PROCESS", label: "AI_ANALYZING", desc: "GPT processing 18,432 tokens..." },
  { phase: "OUTPUT", label: "OUTPUTS_READY", desc: "6 artifacts generated successfully" },
];

const TASKS = [
  { label: "TRANSCRIPT_EXTRACT", color: "#22c55e" },
  { label: "AI_SUMMARY", color: "#8b5cf6" },
  { label: "FLASHCARD_SET", color: "#06b6d4" },
  { label: "MCQ_GENERATION", color: "#f59e0b" },
  { label: "PPT_OUTLINE", color: "#ec4899" },
  { label: "KEY_INSIGHTS", color: "#8b5cf6" },
];

function LiveBarChart() {
  const [bars, setBars] = useState(() => Array.from({ length: 14 }, () => Math.random() * 55 + 20));
  useEffect(() => {
    const t = setInterval(() => {
      setBars(prev => prev.map(b => {
        const next = b + (Math.random() - 0.45) * 28;
        return Math.max(12, Math.min(100, next));
      }));
    }, 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-end gap-[3px] h-full w-full">
      {bars.map((h, i) => (
        <motion.div key={i} animate={{ height: `${h}%` }} transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex-1 rounded-sm min-w-[3px]"
          style={{ background: i % 4 === 0 ? "rgba(139,92,246,0.95)" : i % 4 === 1 ? "rgba(139,92,246,0.5)" : i % 4 === 2 ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.12)" }} />
      ))}
    </div>
  );
}

function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const s: Record<string, React.CSSProperties> = {
    tl: { top: 6, left: 6, borderTop: "1.5px solid rgba(139,92,246,0.5)", borderLeft: "1.5px solid rgba(139,92,246,0.5)" },
    tr: { top: 6, right: 6, borderTop: "1.5px solid rgba(139,92,246,0.5)", borderRight: "1.5px solid rgba(139,92,246,0.5)" },
    bl: { bottom: 6, left: 6, borderBottom: "1.5px solid rgba(139,92,246,0.5)", borderLeft: "1.5px solid rgba(139,92,246,0.5)" },
    br: { bottom: 6, right: 6, borderBottom: "1.5px solid rgba(139,92,246,0.5)", borderRight: "1.5px solid rgba(139,92,246,0.5)" },
  };
  return <div className="absolute w-3.5 h-3.5" style={s[pos]} />;
}

function VaultRadarCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 100, damping: 22 });
  const springY = useSpring(rotY, { stiffness: 100, damping: 22 });

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [taskProgress, setTaskProgress] = useState<number[]>(TASKS.map(() => 0));
  const [allDone, setAllDone] = useState(false);
  const [tick, setTick] = useState(0);

  // Cycle phases every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setPhaseIdx(p => {
        const next = (p + 1) % DEMO_PHASES.length;
        if (next === 0) { setTaskProgress(TASKS.map(() => 0)); setAllDone(false); }
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Animate task progress bars during AI_PROCESS phase
  useEffect(() => {
    if (DEMO_PHASES[phaseIdx].phase !== "AI_PROCESS") return;
    setTaskProgress(TASKS.map(() => 0));
    const t = setInterval(() => {
      setTaskProgress(prev => {
        const next = prev.map((v, i) => Math.min(100, v + Math.random() * 18 + (i < 2 ? 5 : 0)));
        if (next.every(v => v >= 100)) { setAllDone(true); clearInterval(t); }
        return next;
      });
    }, 180);
    return () => clearInterval(t);
  }, [phaseIdx]);

  // Tick for live clock
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    rotX.set(-dy * 7); rotY.set(dx * 7);
  }, []);

  const handleMouseLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, []);

  const phase = DEMO_PHASES[phaseIdx];
  const isProcessing = phase.phase === "AI_PROCESS";
  const isOutput = phase.phase === "OUTPUT";
  const isInput = phase.phase === "INPUT";

  return (
    <div className="w-full h-full flex items-center justify-center p-3 sm:p-6" style={{ perspective: "1200px" }}>
      <motion.div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
        className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="relative overflow-hidden"
          style={{ background: "rgba(12,12,16,0.96)", border: "1px solid rgba(139,92,246,0.22)", borderRadius: 10, backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 80px rgba(139,92,246,0.04)", padding: "14px 16px" }}>

          {/* Grid bg */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{ backgroundImage: "linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)", backgroundSize: "22px 22px" }} />

          {/* Scan line */}
          <motion.div className="absolute left-0 right-0 h-px pointer-events-none z-10"
            style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.6),transparent)" }}
            animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />

          <CornerBracket pos="tl" /><CornerBracket pos="tr" />
          <CornerBracket pos="bl" /><CornerBracket pos="br" />

          {/* Header row */}
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <motion.div className="w-2 h-2 rounded-full"
                  style={{ background: isInput ? "#ef4444" : isProcessing ? "#f59e0b" : "#22c55e" }}
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                <span className="font-mono-ui text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-[0.06em]">
                  LIVE_RADAR_SCANNING
                </span>
                <span className="font-mono-ui text-[8px] text-[#333] ml-1">[{String(tick % 60).padStart(2, "0")}s]</span>
              </div>
              <p className="font-mono-ui text-[8px] text-[#2a2a2a] uppercase tracking-[0.18em] ml-4">
                LOC: VIDVAULT_AI_NODE_1
              </p>
            </div>
            <div className="px-2 py-1 flex-shrink-0" style={{ border: "1px solid rgba(139,92,246,0.35)" }}>
              <span className="font-mono-ui text-[8px] text-[#8b5cf6] uppercase tracking-widest">SECURE_P2P_E2EE</span>
            </div>
          </div>

          {/* Phase indicator tabs */}
          <div className="flex gap-1 mb-3 relative z-10">
            {DEMO_PHASES.map((p, i) => (
              <div key={p.phase} className="flex-1 h-0.5 rounded-full transition-all duration-500"
                style={{ background: i <= phaseIdx ? "#8b5cf6" : "rgba(139,92,246,0.12)" }} />
            ))}
          </div>

          {/* Phase status */}
          <motion.div key={phaseIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 relative z-10 px-2.5 py-1.5 flex items-center gap-2"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 4 }}>
            <span className="font-mono-ui text-[8px] text-[#8b5cf6] uppercase tracking-widest flex-shrink-0">[{phase.label}]</span>
            <span className="font-mono-ui text-[8px] text-[#444] truncate">{phase.desc}</span>
          </motion.div>

          {/* ── Body ── */}
          <div className="flex gap-3 relative z-10">

            {/* LEFT: stats + task list */}
            <div className="flex flex-col gap-2 flex-shrink-0" style={{ minWidth: 100 }}>
              {/* Stat counters */}
              <div className="flex flex-col gap-1.5">
                <div>
                  <div className="text-2xl font-black leading-none"><Counter to={24} color="#ffffff" /></div>
                  <p className="font-mono-ui text-[7px] text-[#333] uppercase tracking-widest mt-0.5">VIDEOS_SAVED</p>
                </div>
                <div>
                  <div className="text-2xl font-black leading-none"><Counter to={11} color="#22c55e" /></div>
                  <p className="font-mono-ui text-[7px] text-[#333] uppercase tracking-widest mt-0.5">FOLDERS_ACTIVE</p>
                </div>
                <div>
                  <div className="text-2xl font-black leading-none"><Counter to={89} color="#8b5cf6" /></div>
                  <p className="font-mono-ui text-[7px] text-[#333] uppercase tracking-widest mt-0.5">AI_RUNS_TOTAL</p>
                </div>
              </div>
            </div>

            {/* RIGHT: chart + task progress */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">

              {/* Bar chart */}
              <div className="relative overflow-hidden" style={{ background: "rgba(6,6,9,0.8)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: 5, padding: "8px 8px 6px", height: 80 }}>
                <LiveBarChart />
                <div className="absolute bottom-1.5 right-2">
                  <span className="font-mono-ui text-[6px] text-[#222] uppercase tracking-widest">AI_DATA_STREAM</span>
                </div>
              </div>

              {/* Task progress bars */}
              <div className="flex flex-col gap-1">
                {TASKS.map((task, i) => (
                  <div key={task.label} className="flex items-center gap-1.5">
                    <span className="font-mono-ui text-[6px] uppercase tracking-widest w-24 truncate flex-shrink-0"
                      style={{ color: taskProgress[i] > 0 ? task.color : "#2a2a2a" }}>
                      {task.label}
                    </span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <motion.div className="h-full rounded-full"
                        animate={{ width: `${taskProgress[i]}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{ background: `linear-gradient(90deg, ${task.color}cc, ${task.color})` }} />
                    </div>
                    <span className="font-mono-ui text-[6px] w-6 text-right flex-shrink-0"
                      style={{ color: taskProgress[i] >= 100 ? task.color : "#2a2a2a" }}>
                      {taskProgress[i] >= 100 ? "✓" : isProcessing ? `${Math.round(taskProgress[i])}%` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t flex items-center justify-between relative z-10"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {isOutput && (
                  <motion.div key="done" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    <span className="font-mono-ui text-[8px] text-green-500 uppercase tracking-widest">6_OUTPUTS_READY</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {!isOutput && ["SUMMARY", "FLASHCARD", "MCQ"].map((l, i) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full"
                    style={{ background: taskProgress[i] >= 100 ? "#22c55e" : "#222" }} />
                  <span className="font-mono-ui text-[7px] uppercase tracking-widest"
                    style={{ color: taskProgress[i] >= 100 ? "#444" : "#1e1e1e" }}>{l}</span>
                </div>
              ))}
            </div>
            <span className="font-mono-ui text-[7px] text-[#1a1a1a] uppercase">VV_CORE_v2.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH VISUAL — knowledge graph
══════════════════════════════════════════════ */
function VaultAuthVisual() {
  const nodes = [
    { x: "50%", y: "38%", label: "VIDEO", size: 52, primary: true },
    { x: "25%", y: "24%", label: "NOTES", size: 36, primary: false },
    { x: "74%", y: "22%", label: "AI", size: 40, primary: false },
    { x: "20%", y: "60%", label: "TAGS", size: 32, primary: false },
    { x: "76%", y: "60%", label: "MCQ", size: 34, primary: false },
    { x: "50%", y: "70%", label: "FLASH", size: 30, primary: false },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ width: 280, height: 280, top: "24%", left: "50%", translateX: "-50%", background: "#8b5cf6", filter: "blur(110px)", opacity: 0.06 }}
        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
      {[260, 360, 460].map((d, i) => (
        <motion.div key={d} className="absolute rounded-full pointer-events-none"
          style={{ width: d, height: d, top: "38%", left: "50%", translateX: "-50%", translateY: "-50%", border: `1px solid rgba(139,92,246,${0.07 - i * 0.02})` }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }} transition={{ duration: 18 + i * 5, repeat: Infinity, ease: "linear" }} />
      ))}
      {nodes.map((node, i) => (
        <motion.div key={node.label} className="absolute flex flex-col items-center gap-1"
          style={{ left: node.x, top: node.y, translateX: "-50%", translateY: "-50%" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, node.primary ? -7 : -4, 0] }}
          transition={{ opacity: { delay: 0.2 + i * 0.1 }, scale: { delay: 0.2 + i * 0.1 }, y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 } }}>
          <div className="flex items-center justify-center font-mono-ui font-black"
            style={{ width: node.size, height: node.size, background: node.primary ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "#111113", border: `1px solid ${node.primary ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.14)"}`, clipPath: "polygon(10% 0%,100% 0%,100% 90%,90% 100%,0% 100%,0% 10%)", boxShadow: node.primary ? "0 0 22px rgba(139,92,246,0.28)" : "none", color: node.primary ? "#fff" : "#8b5cf6", fontSize: node.primary ? "10px" : "7px" }}>
            {node.label.slice(0, 3)}
          </div>
          <span className="font-mono-ui text-[7px] text-[#2a2a2a] uppercase tracking-widest">{node.label}</span>
        </motion.div>
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right,#0a0a0b 0%,transparent 10%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom,#0a0a0b 0%,transparent 8%,transparent 88%,#0a0a0b 100%)" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   LANDING SECTIONS
══════════════════════════════════════════════ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="badge-mono mb-4 block w-fit">{children}</span>;
}

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const cards = [
    { icon: Youtube, title: "SAVE VIDEOS", desc: "Paste any YouTube URL or playlist. Import up to 500 videos instantly." },
    { icon: Folder, title: "SMART FOLDERS", desc: "Organize with nested folders and color-coded tags. Zero friction." },
    { icon: Sparkles, title: "AI GENERATION", desc: "6 AI tools: summaries, flashcards, MCQ, outlines, insights, blog posts." },
    { icon: Download, title: "EXPORT ANYWHERE", desc: "Export to PDF, Markdown, JSON, PPT, or share a public link." },
    { icon: Brain, title: "FLASHCARD DECKS", desc: "Auto-generated spaced-repetition flashcards from any video." },
    { icon: BarChart3, title: "KNOWLEDGE GRAPH", desc: "Visual graph of your saved videos, tags, and AI connections." },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14">
      <SectionLabel>CORE_FEATURES</SectionLabel>
      <div className="overflow-hidden mb-12">
        <motion.h2
          initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-black uppercase text-white leading-[0.9]"
          style={{ fontSize: "clamp(2rem, 4.5vw, 4.5rem)", letterSpacing: "-0.02em" }}>
          THE CORE<br /><span className="text-outline-strong">PROTOCOLS.</span>
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div key={card.title}
            initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
            className="group p-5 cursor-default transition-all duration-300 hover:border-[rgba(139,92,246,0.25)]"
            style={{ background: "#0d0d10", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <card.icon className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <span className="font-mono-ui text-[9px] font-bold uppercase tracking-widest text-white">{card.title}</span>
            </div>
            <p className="font-mono-ui text-[9px] text-[#444] leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function AIToolsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const tools = [
    { id: "01", label: "AI SUMMARY", desc: "Full-length structured summary with key points.", color: "#8b5cf6" },
    { id: "02", label: "FLASHCARDS", desc: "Spaced-repetition ready Q&A deck from video.", color: "#06b6d4" },
    { id: "03", label: "MCQ SET", desc: "Auto-graded multiple-choice quiz generation.", color: "#22c55e" },
    { id: "04", label: "BLOG ARTICLE", desc: "SEO-optimized article from video transcript.", color: "#f59e0b" },
    { id: "05", label: "PPT OUTLINE", desc: "Slide-by-slide presentation structure.", color: "#ec4899" },
    { id: "06", label: "KEY INSIGHTS", desc: "Bullet-point critical takeaways for review.", color: "#a78bfa" },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <SectionLabel>AI_GENERATION_SUITE</SectionLabel>
      <div className="overflow-hidden mb-12">
        <motion.h2
          initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-black uppercase text-white leading-[0.9]"
          style={{ fontSize: "clamp(2rem, 4.5vw, 4.5rem)", letterSpacing: "-0.02em" }}>
          6 AI TOOLS.<br /><span className="text-outline-strong">ONE VAULT.</span>
        </motion.h2>
      </div>
      <div className="space-y-px">
        {tools.map((tool, i) => (
          <motion.div key={tool.id}
            initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.05 + i * 0.07, duration: 0.45 }}
            className="flex items-center gap-6 px-5 py-4 group cursor-default transition-all duration-200 hover:bg-white/[0.02]"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="font-mono-ui text-[9px] font-black w-6 flex-shrink-0" style={{ color: tool.color }}>{tool.id}</span>
            <div className="w-px h-6 flex-shrink-0" style={{ background: `${tool.color}40` }} />
            <span className="font-mono-ui text-xs font-bold uppercase tracking-widest text-white w-32 sm:w-40 flex-shrink-0">{tool.label}</span>
            <span className="font-mono-ui text-[9px] text-[#444] flex-1 hidden sm:block">{tool.desc}</span>
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `${tool.color}15` }}>
              <ArrowUpRight className="w-3 h-3" style={{ color: tool.color }} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const steps = [
    { n: "01", title: "PASTE URL", desc: "Drop any YouTube link or playlist URL into VidVault.", icon: Youtube },
    { n: "02", title: "AI PROCESSES", desc: "Our engine extracts transcript, metadata, and sends to GPT for deep analysis.", icon: Zap },
    { n: "03", title: "GET KNOWLEDGE", desc: "Download 6 AI-generated artifacts — ready to study, share, or publish.", icon: BookOpen },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <SectionLabel>WORKFLOW</SectionLabel>
      <div className="overflow-hidden mb-16">
        <motion.h2
          initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-black uppercase text-white leading-[0.9]"
          style={{ fontSize: "clamp(2rem, 4.5vw, 4.5rem)", letterSpacing: "-0.02em" }}>
          THREE STEPS.<br /><span className="text-outline-strong">INFINITE KNOWLEDGE.</span>
        </motion.h2>
      </div>
      <div className="relative">
        {/* Connector line */}
        <motion.div className="absolute top-8 left-0 right-0 h-px hidden lg:block"
          initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)", transformOrigin: "left" }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.n}
              initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
              className="relative">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-16 flex items-center justify-center relative"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <step.icon className="w-6 h-6 text-[#8b5cf6]" />
                    <span className="absolute -top-1.5 -right-1.5 font-mono-ui text-[8px] font-black text-black bg-white px-1">{step.n}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight text-lg mb-2">{step.title}</h3>
                  <p className="font-mono-ui text-[10px] text-[#444] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GetStartedSection({ onRegister }: { onRegister: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} className="py-20 sm:py-32 px-8 sm:px-14" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="max-w-2xl">
        <SectionLabel>START_NOW</SectionLabel>
        <div className="overflow-hidden mb-6">
          <motion.h2
            initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-black uppercase text-white leading-[0.9]"
            style={{ fontSize: "clamp(2rem, 4.5vw, 4.5rem)", letterSpacing: "-0.02em" }}>
            BUILD YOUR<br /><span className="text-outline-strong">SECOND BRAIN.</span>
          </motion.h2>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}
          className="font-mono-ui text-[10px] text-[#444] mb-8 leading-relaxed max-w-md">
          Join thousands of students and creators who use VidVault AI to turn YouTube into structured, searchable knowledge.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <MonolithBtn onClick={onRegister} size="lg">
            CREATE FREE ACCOUNT <ArrowUpRight className="w-4 h-4 ml-1 inline" />
          </MonolithBtn>
          <span className="font-mono-ui text-[9px] text-[#222] uppercase tracking-widest sm:ml-2">NO CREDIT CARD REQUIRED</span>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════ */
export default function Login() {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [activeNav, setActiveNav] = useState<NavSection>("SAVE");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sectionRefs = useRef<Record<NavSection, HTMLElement | null>>({
    SAVE: null, FEATURES: null, AI_TOOLS: null, HOW_IT_WORKS: null, GET_STARTED: null,
  });

  const scrollToSection = (id: NavSection) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
    setActiveNav(id);
  };

  // IntersectionObserver for active nav highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section") as NavSection;
            if (id) setActiveNav(id);
          }
        });
      },
      { threshold: 0.3 }
    );
    Object.entries(sectionRefs.current).forEach(([, el]) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [mode]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { stiffness: 55, damping: 18 });
  const glowY = useSpring(mouseY, { stiffness: 55, damping: 18 });
  useEffect(() => {
    const h = (e: MouseEvent) => { mouseX.set(e.clientX - 160); mouseY.set(e.clientY - 160); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const handleReplitLogin = () => { window.location.href = "/api/login"; };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, firstName, lastName }) });
      if (res.ok) window.location.href = "/";
      else { const d = await res.json(); setError(d.error || "Registration failed"); }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/login-manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (res.ok) window.location.href = "/";
      else { const d = await res.json(); setError(d.error || "Login failed"); }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const textVars = {
    hidden: { y: 60, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: 0.12 + i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  return (
    <div className="flex relative" style={{ background: "#0a0a0b", color: "#e0e0e0", minHeight: "100vh" }}>
      {/* Cursor glow */}
      <motion.div className="fixed w-[320px] h-[320px] rounded-full pointer-events-none z-0"
        style={{ x: glowX, y: glowY, background: "radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)" }} />

      <AnimatePresence mode="wait">

        {/* ══════════ LANDING ══════════ */}
        {mode === "landing" && (
          <motion.div key="landing" className="flex w-full min-h-screen"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* Fixed left sidebar */}
            <LeftSidebar active={activeNav} onNav={scrollToSection} />

            {/* Main scroll area */}
            <div className="flex-1 flex flex-col overflow-y-auto" style={{ marginLeft: 36 }}>

              {/* Top bar */}
              <TopBar onLogin={() => setMode("login-manual")} onRegister={() => setMode("register")} />

              {/* Global grid */}
              <div className="grid-mesh absolute inset-0 pointer-events-none z-0" style={{ left: 36 }} />

              {/* ─── HERO SECTION ─── */}
              <section
                id="save" data-section="SAVE"
                ref={el => { sectionRefs.current.SAVE = el; }}
                className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] relative z-10">

                {/* Left text */}
                <div className="flex flex-col justify-center px-8 sm:px-14 py-12 lg:py-0 lg:w-[52%] flex-shrink-0">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <span className="badge-mono mb-5 block w-fit">AI_POWERED // SECOND_BRAIN</span>
                  </motion.div>

                  <div className="space-y-[0.04em]">
                    {["SAVE.", "ANALYZE.", "MASTER."].map((word, i) => (
                      <div key={word} className="overflow-hidden">
                        <motion.h1 custom={i} variants={textVars} initial="hidden" animate="visible"
                          className={`font-black leading-[0.88] uppercase ${i === 1 ? "text-outline-strong" : "text-white"}`}
                          style={{ fontSize: "clamp(2.5rem, 7vw, 6.5rem)", letterSpacing: "-0.02em" }}>
                          {word}
                        </motion.h1>
                      </div>
                    ))}
                  </div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="mt-5 text-[#444] text-xs leading-relaxed max-w-[340px] font-mono-ui">
                    <TypedText text="Save YouTube videos. Generate AI summaries, flashcards & MCQs. Build your knowledge vault." startDelay={600} />
                  </motion.p>

                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                    className="mt-5 flex items-center gap-5 sm:gap-8">
                    {[
                      { label: "AI_TOOLS", value: 6, suffix: "+" },
                      { label: "EXPORT_FMT", value: 5, suffix: "" },
                      { label: "MAX_VIDEOS", value: 500, suffix: "+" },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono-ui leading-none">
                          <Counter to={s.value} />{s.suffix}
                        </span>
                        <span className="font-mono-ui text-[7px] text-[#222] uppercase tracking-widest mt-0.5">{s.label}</span>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
                    className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <MonolithBtn onClick={() => setMode("register")} size="md">
                      START FOR FREE <ArrowUpRight className="w-3 h-3 ml-1 inline" />
                    </MonolithBtn>
                    <button onClick={handleReplitLogin}
                      className="h-11 px-5 font-mono-ui text-[10px] uppercase tracking-widest text-[#555] hover:text-white transition-all flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
                    >SIGN IN WITH REPLIT</button>
                  </motion.div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                    className="mt-3 font-mono-ui text-[9px] text-[#222] uppercase tracking-widest">
                    HAVE AN ACCOUNT?{" "}
                    <button onClick={() => setMode("login-manual")} className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
                      SIGN IN →
                    </button>
                  </motion.p>
                </div>

                {/* Right: radar card */}
                <div className="flex-1 border-l lg:flex hidden items-center justify-center overflow-hidden"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <VaultRadarCard />
                </div>

                {/* Mobile card */}
                <div className="lg:hidden border-t px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.04)", minHeight: 340 }}>
                  <VaultRadarCard />
                </div>
              </section>

              {/* ─── FEATURES ─── */}
              <div ref={el => { sectionRefs.current.FEATURES = el; }} data-section="FEATURES">
                <FeaturesSection />
              </div>

              {/* ─── AI TOOLS ─── */}
              <div ref={el => { sectionRefs.current.AI_TOOLS = el; }} data-section="AI_TOOLS">
                <AIToolsSection />
              </div>

              {/* ─── HOW IT WORKS ─── */}
              <div ref={el => { sectionRefs.current.HOW_IT_WORKS = el; }} data-section="HOW_IT_WORKS">
                <HowItWorksSection />
              </div>

              {/* ─── GET STARTED ─── */}
              <div ref={el => { sectionRefs.current.GET_STARTED = el; }} data-section="GET_STARTED">
                <GetStartedSection onRegister={() => setMode("register")} />
              </div>

              {/* Footer */}
              <footer className="px-8 sm:px-14 py-6 border-t flex items-center justify-between"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="font-mono-ui text-[8px] text-[#1e1e1e] uppercase tracking-widest">© 2026 VIDVAULT AI — ALL RIGHTS RESERVED</span>
                <span className="font-mono-ui text-[8px] text-[#1e1e1e] uppercase tracking-widest">VV_CORE_v2.0</span>
              </footer>
            </div>
          </motion.div>
        )}

        {/* ══════════ AUTH FORMS ══════════ */}
        {(mode === "register" || mode === "login-manual") && (
          <motion.div key="auth" className="flex w-full min-h-screen"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* Auth left */}
            <div className="flex flex-col flex-1 lg:max-w-[50%]">
              <header className="flex items-center justify-between px-8 sm:px-10 h-14 sm:h-16 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white flex items-center justify-center font-black text-black text-[11px] font-mono-ui">VV</div>
                  <span className="font-black text-white uppercase tracking-[0.1em] text-xs font-mono-ui hidden sm:block">
                    VIDVAULT<span className="text-[#8b5cf6]"> AI</span>
                  </span>
                </div>
                <button onClick={() => { setMode("landing"); setError(""); }}
                  className="text-[#333] font-mono-ui text-[9px] uppercase tracking-widest hover:text-white transition-colors">
                  ← BACK
                </button>
              </header>

              <div className="flex-1 flex items-center justify-center px-8 py-10">
                <div className="w-full max-w-sm">
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-7">
                    <span className="badge-mono mb-3 block w-fit">{mode === "register" ? "CREATE_ACCOUNT" : "SIGN_IN"}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      {mode === "register" ? "Join VidVault" : "Welcome Back"}
                    </h2>
                    <p className="font-mono-ui text-[9px] text-[#2a2a2a] mt-1.5 uppercase tracking-wider">
                      {mode === "register" ? "BUILD YOUR KNOWLEDGE VAULT" : "ACCESS YOUR VAULT"}
                    </p>
                  </motion.div>

                  <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    onSubmit={mode === "register" ? handleRegister : handleManualLogin} className="space-y-3.5">
                    {mode === "register" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#2a2a2a]">FIRST NAME</label>
                          <MonoInput placeholder="John" value={firstName} onChange={setFirstName} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#2a2a2a]">LAST NAME</label>
                          <MonoInput placeholder="Doe" value={lastName} onChange={setLastName} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#2a2a2a]">EMAIL_ADDRESS</label>
                      <MonoInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#2a2a2a]">PASSWORD</label>
                      <MonoInput type="password" placeholder="••••••••" value={password} onChange={setPassword} icon={Lock} />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="p-3 text-red-400 text-xs font-mono-ui"
                          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.14)" }}>
                          ERR: {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <MonolithBtn type="submit" disabled={loading} size="md" fullWidth>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "register" ? "CREATE ACCOUNT" : "SIGN IN")}
                    </MonolithBtn>
                  </motion.form>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mt-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="font-mono-ui text-[8px] text-[#1e1e1e] uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    <button onClick={handleReplitLogin}
                      className="w-full h-11 font-mono-ui text-[9px] uppercase tracking-widest text-[#333] hover:text-white transition-all flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                    >CONTINUE WITH REPLIT</button>
                    <p className="mt-5 font-mono-ui text-[9px] text-[#222] uppercase tracking-widest text-center">
                      {mode === "register" ? "HAVE AN ACCOUNT? " : "NO ACCOUNT? "}
                      <button onClick={() => { setMode(mode === "register" ? "login-manual" : "register"); setError(""); }}
                        className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
                        {mode === "register" ? "SIGN IN →" : "REGISTER →"}
                      </button>
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Auth visual */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
              className="hidden lg:block flex-1 border-l overflow-hidden relative"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <VaultAuthVisual />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
