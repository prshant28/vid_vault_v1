import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Mail, Lock, Loader2, ArrowUpRight, Sparkles, Brain, FileText, CheckSquare, ChevronDown } from "lucide-react";

type AuthMode = "landing" | "register" | "login-manual";

/* ══════════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════════ */

function Counter({ to, color = "#fff" }: { to: number; color?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.max(1, Math.ceil(to / 50));
    const t = setInterval(() => {
      v = Math.min(v + step, to);
      setN(v);
      if (v >= to) clearInterval(t);
    }, 25);
    return () => clearInterval(t);
  }, [to]);
  return <span style={{ color }}>{n}</span>;
}

function TypedText({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const d = setTimeout(() => {
      const t = setInterval(() => {
        setShown(text.slice(0, ++i));
        if (i >= text.length) clearInterval(t);
      }, 38);
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
      {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused ? "text-[#8b5cf6]" : "text-[#333]"}`} />}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full h-11 text-sm text-white placeholder:text-[#252525] focus:outline-none transition-all font-sans"
        style={{
          background: "#0c0c0e",
          border: `1px solid ${focused ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`,
          padding: Icon ? "0 12px 0 38px" : "0 12px",
          boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.07)" : "none",
        }}
      />
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
      style={{
        padding: pad, fontSize: fs, width: fullWidth ? "100%" : undefined,
        minHeight: size === "lg" ? 46 : size === "md" ? 42 : 34,
        background: hov ? "#8b5cf6" : "#fff",
        color: hov ? "#fff" : "#000",
        clipPath: "polygon(6% 0px, 100% 0px, 100% 76%, 94% 100%, 0px 100%, 0px 24%)",
        transition: "background 0.2s, color 0.2s",
      }}
    >{children}</motion.button>
  );
}

/* ══════════════════════════════════════════════
   FLOATING PILL HEADER (reference-style)
══════════════════════════════════════════════ */
function FloatingNav({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const links = ["Home", "Features", "AI Tools", "Pricing"];

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="px-4 sm:px-6 pt-4 flex-shrink-0 relative z-30"
    >
      <div
        className="flex items-center justify-between h-12 sm:h-14 px-4 sm:px-5 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(10,10,11,0.95)" : "rgba(18,18,20,0.85)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "9999px",
          backdropFilter: "blur(20px)",
          boxShadow: scrolled
            ? "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white flex items-center justify-center font-black text-black text-[10px] font-mono-ui flex-shrink-0">
            VV
          </div>
          <span className="font-black text-white uppercase tracking-[0.12em] text-xs font-mono-ui hidden sm:block">
            VIDVAULT<span className="text-[#8b5cf6]"> AI</span>
          </span>
        </motion.div>

        {/* Center nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <motion.button
              key={link}
              onClick={() => setActiveLink(link)}
              className="relative px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 rounded-full"
              style={{ color: activeLink === link ? "#fff" : "#555", fontFamily: "Inter, sans-serif" }}
              whileHover={{ color: "#fff" }}
            >
              {activeLink === link && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link}</span>
            </motion.button>
          ))}
          <motion.button
            className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-full"
            style={{ color: "#555", fontFamily: "Inter, sans-serif" }}
            whileHover={{ color: "#fff" }}
          >
            Pages <ChevronDown className="w-3 h-3" />
          </motion.button>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onLogin}
            className="text-[#555] text-xs font-medium hover:text-white transition-colors hidden sm:block"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Log In
          </button>
          <motion.button
            onClick={onRegister}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 sm:px-5 h-8 sm:h-9 text-[11px] sm:text-xs font-semibold text-white flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              borderRadius: "9999px",
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 4px 12px rgba(139,92,246,0.25)",
            }}
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   ANIMATED BAR CHART
══════════════════════════════════════════════ */
function LiveBarChart() {
  const [bars, setBars] = useState(() => Array.from({ length: 12 }, () => Math.random() * 60 + 20));

  useEffect(() => {
    const t = setInterval(() => {
      setBars(prev => prev.map(b => Math.max(15, Math.min(100, b + (Math.random() - 0.45) * 25))));
    }, 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-end gap-[3px] h-full">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex-1 rounded-sm"
          style={{
            minWidth: 3,
            background: i % 3 === 0
              ? "rgba(139,92,246,0.9)"
              : i % 3 === 1
              ? "rgba(139,92,246,0.4)"
              : "rgba(139,92,246,0.2)",
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   3D VAULT CARD — matching the radar-style ref
══════════════════════════════════════════════ */
const AI_OUTPUTS = [
  "→ Summarizing video content...",
  "→ Extracting 14 flashcards...",
  "→ Building MCQ question set...",
  "→ Writing structured notes...",
  "→ Generating PPT outline...",
  "→ Detecting key insights...",
];

function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const styles: Record<string, React.CSSProperties> = {
    tl: { top: 8, left: 8, borderTop: "1px solid rgba(139,92,246,0.4)", borderLeft: "1px solid rgba(139,92,246,0.4)" },
    tr: { top: 8, right: 8, borderTop: "1px solid rgba(139,92,246,0.4)", borderRight: "1px solid rgba(139,92,246,0.4)" },
    bl: { bottom: 8, left: 8, borderBottom: "1px solid rgba(139,92,246,0.4)", borderLeft: "1px solid rgba(139,92,246,0.4)" },
    br: { bottom: 8, right: 8, borderBottom: "1px solid rgba(139,92,246,0.4)", borderRight: "1px solid rgba(139,92,246,0.4)" },
  };
  return <div className="absolute w-3 h-3 sm:w-4 sm:h-4" style={styles[pos]} />;
}

function VaultHeroVisual() {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 120, damping: 20 });
  const springY = useSpring(rotY, { stiffness: 120, damping: 20 });

  const [aiIdx, setAiIdx] = useState(0);
  const [aiText, setAiText] = useState("");
  const [videosCount] = useState(24);
  const [aiRuns] = useState(89);
  const [folders] = useState(11);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotX.set(-dy * 8);
    rotY.set(dx * 8);
  }, []);

  const handleMouseLeave = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
  }, []);

  // AI typing cycle
  useEffect(() => {
    const cycle = setInterval(() => {
      setAiIdx(p => (p + 1) % AI_OUTPUTS.length);
      setAiText("");
    }, 3200);
    return () => clearInterval(cycle);
  }, []);
  useEffect(() => {
    const target = AI_OUTPUTS[aiIdx];
    let i = 0;
    const t = setInterval(() => {
      setAiText(target.slice(0, ++i));
      if (i >= target.length) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [aiIdx]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 perspective-[1200px]">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        className="w-full max-w-[480px] relative select-none cursor-default"
      >
        {/* Main card */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "rgba(14,14,18,0.92)",
            border: "1px solid rgba(139,92,246,0.18)",
            borderRadius: 12,
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(139,92,246,0.06)",
            padding: "16px",
          }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }} />

          {/* Corner brackets */}
          <CornerBracket pos="tl" />
          <CornerBracket pos="tr" />
          <CornerBracket pos="bl" />
          <CornerBracket pos="br" />

          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px pointer-events-none z-10"
            style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* ── Header row ── */}
          <div className="flex items-start justify-between mb-3 sm:mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div className="w-2 h-2 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="font-mono-ui text-[10px] sm:text-xs font-bold text-white uppercase tracking-[0.06em]">
                  LIVE_RADAR_SCANNING
                </span>
              </div>
              <p className="font-mono-ui text-[8px] text-[#333] uppercase tracking-[0.2em] ml-4">
                LOC: VIDVAULT_AI_NODE_1
              </p>
            </div>
            <div className="px-2 py-1 border border-[rgba(139,92,246,0.35)] flex-shrink-0">
              <span className="font-mono-ui text-[8px] text-[#8b5cf6] uppercase tracking-widest">
                SECURE_P2P_E2EE
              </span>
            </div>
          </div>

          {/* ── Body: stats + chart ── */}
          <div className="flex gap-3 sm:gap-4 relative z-10">

            {/* Left: stat counters */}
            <div className="flex flex-col gap-3 sm:gap-4 flex-shrink-0 justify-center min-w-[90px] sm:min-w-[110px]">
              {/* Stat 1 */}
              <div>
                <div className="text-2xl sm:text-3xl font-black leading-none">
                  <Counter to={videosCount} color="#ffffff" />
                </div>
                <p className="font-mono-ui text-[7px] sm:text-[8px] text-[#444] uppercase tracking-widest mt-0.5">
                  VIDEOS_SAVED
                </p>
              </div>
              {/* Stat 2 */}
              <div>
                <div className="text-2xl sm:text-3xl font-black leading-none">
                  <Counter to={folders} color="#22c55e" />
                </div>
                <p className="font-mono-ui text-[7px] sm:text-[8px] text-[#444] uppercase tracking-widest mt-0.5">
                  FOLDERS_ACTIVE
                </p>
              </div>
              {/* Stat 3 */}
              <div>
                <div className="text-2xl sm:text-3xl font-black leading-none">
                  <Counter to={aiRuns} color="#8b5cf6" />
                </div>
                <p className="font-mono-ui text-[7px] sm:text-[8px] text-[#444] uppercase tracking-widest mt-0.5">
                  AI_RUNS_TOTAL
                </p>
              </div>
            </div>

            {/* Right: bar chart */}
            <div className="flex-1 flex flex-col min-h-0">
              <div
                className="flex-1 relative overflow-hidden"
                style={{
                  background: "rgba(8,8,10,0.7)",
                  border: "1px solid rgba(139,92,246,0.1)",
                  borderRadius: 6,
                  padding: "10px 10px 8px",
                  minHeight: 110,
                }}
              >
                <LiveBarChart />
                {/* Chart label */}
                <div className="absolute bottom-2 right-3">
                  <span className="font-mono-ui text-[7px] text-[#2a2a2a] uppercase tracking-widest">
                    AI_DATA_STREAM
                  </span>
                </div>
              </div>

              {/* AI output strip */}
              <div className="mt-2 px-2.5 py-1.5 flex items-center gap-2"
                style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: 4 }}>
                <motion.div className="w-1 h-1 rounded-full bg-[#8b5cf6] flex-shrink-0"
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                <span className="font-mono-ui text-[8px] text-[#8b5cf6] truncate">
                  {aiText}<span className="animate-pulse">_</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Footer status row ── */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              {[
                { label: "SUMMARY", active: true },
                { label: "FLASHCARD", active: true },
                { label: "MCQ", active: false },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full"
                    style={{ background: active ? "#22c55e" : "#2a2a2a" }} />
                  <span className="font-mono-ui text-[7px] uppercase tracking-widest"
                    style={{ color: active ? "#444" : "#222" }}>{label}</span>
                </div>
              ))}
            </div>
            <span className="font-mono-ui text-[7px] text-[#1e1e1e] uppercase tracking-widest">VV_CORE_v2.0</span>
          </div>
        </div>

        {/* 3D "depth" layer behind the card */}
        <div
          className="absolute inset-0 rounded-xl -z-10"
          style={{
            background: "rgba(139,92,246,0.06)",
            transform: "translateZ(-20px) scale(0.96)",
            filter: "blur(2px)",
          }}
        />
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH RIGHT PANEL — Knowledge graph
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
  const lines = [
    ["50%","38%","25%","24%"], ["50%","38%","74%","22%"],
    ["50%","38%","20%","60%"], ["50%","38%","76%","60%"],
    ["50%","38%","50%","70%"],
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ width: 280, height: 280, top: "24%", left: "50%", translateX: "-50%", background: "#8b5cf6", filter: "blur(110px)", opacity: 0.06 }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 5, repeat: Infinity }} />

      {[260, 360, 460].map((d, i) => (
        <motion.div key={d} className="absolute rounded-full pointer-events-none"
          style={{ width: d, height: d, top: "38%", left: "50%", translateX: "-50%", translateY: "-50%", border: `1px solid rgba(139,92,246,${0.07 - i * 0.02})` }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 18 + i * 5, repeat: Infinity, ease: "linear" }} />
      ))}

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {lines.map(([x1,y1,x2,y2], i) => (
          <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.7 }} />
        ))}
      </svg>

      {nodes.map((node, i) => (
        <motion.div key={node.label} className="absolute flex flex-col items-center gap-1"
          style={{ left: node.x, top: node.y, translateX: "-50%", translateY: "-50%" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, node.primary ? -7 : -4, 0] }}
          transition={{
            opacity: { delay: 0.2 + i * 0.1, duration: 0.4 },
            scale: { delay: 0.2 + i * 0.1, duration: 0.4 },
            y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
          }}>
          <div className="flex items-center justify-center font-mono-ui font-black"
            style={{
              width: node.size, height: node.size,
              background: node.primary ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" : "#111113",
              border: `1px solid ${node.primary ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.14)"}`,
              clipPath: "polygon(10% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%, 0% 10%)",
              boxShadow: node.primary ? "0 0 22px rgba(139,92,246,0.28)" : "none",
              color: node.primary ? "#fff" : "#8b5cf6",
              fontSize: node.primary ? "10px" : "7px",
            }}>
            {node.label.slice(0, 3)}
          </div>
          <span className="font-mono-ui text-[7px] text-[#2a2a2a] uppercase tracking-widest">{node.label}</span>
        </motion.div>
      ))}

      <motion.div className="absolute bottom-6 left-6 right-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {["SUMMARIES", "FLASHCARDS", "MCQ_SETS", "OUTLINES", "INSIGHTS"].map((f, i) => (
            <motion.span key={f} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 + i * 0.07 }}
              className="font-mono-ui text-[7px] px-2 py-1 uppercase tracking-widest"
              style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
              {f}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, #0a0a0b 0%, transparent 10%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0a0a0b 0%, transparent 8%, transparent 88%, #0a0a0b 100%)" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN LOGIN PAGE
══════════════════════════════════════════════ */
export default function Login() {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    hidden: { y: 50, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: 0.08 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  const stats = [
    { label: "AI_TOOLS", value: 6, suffix: "+" },
    { label: "EXPORT_FMT", value: 5, suffix: "" },
    { label: "MAX_VIDEOS", value: 500, suffix: "+" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#0a0a0b", color: "#e0e0e0" }}>
      {/* Cursor glow */}
      <motion.div className="fixed w-[320px] h-[320px] rounded-full pointer-events-none z-0"
        style={{ x: glowX, y: glowY, background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />

      {/* Grid */}
      <div className="grid-mesh absolute inset-0 pointer-events-none z-0" />

      {/* Page-wide scan line */}
      <motion.div className="absolute left-0 right-0 h-px pointer-events-none z-10"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }}
        animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />

      <AnimatePresence mode="wait">

        {/* ═══════════ LANDING ═══════════ */}
        {mode === "landing" && (
          <motion.div key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
            className="flex flex-col min-h-screen relative z-10"
          >
            {/* Floating pill header */}
            <FloatingNav onLogin={() => setMode("login-manual")} onRegister={() => setMode("register")} />

            {/* Hero body */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 mt-2 lg:mt-0">

              {/* Vertical nav (xl) */}
              <div className="hidden xl:flex w-11 border-r border-white/[0.04] flex-col items-center justify-center gap-7 flex-shrink-0 relative">
                {["SAVE", "SORT", "AI", "LEARN"].map((item, i) => (
                  <motion.span key={item} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                    className="font-mono-ui text-[7px] uppercase tracking-[0.35em] text-[#1e1e1e] hover:text-[#8b5cf6] transition-colors cursor-default"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{item}</motion.span>
                ))}
                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute bottom-10 w-px h-14 bg-gradient-to-b from-transparent to-[#8b5cf6]" />
              </div>

              {/* Text column */}
              <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-10 py-8 lg:py-0 lg:w-[50%] xl:w-[46%] flex-shrink-0">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4">
                  <span className="badge-mono">AI_POWERED // SECOND_BRAIN</span>
                </motion.div>

                <div className="overflow-hidden space-y-[0.04em]">
                  {["SAVE.", "ANALYZE.", "MASTER."].map((word, i) => (
                    <div key={word} className="overflow-hidden">
                      <motion.h1 custom={i} variants={textVars} initial="hidden" animate="visible"
                        className={`font-black leading-[0.9] uppercase tracking-[-0.02em] ${i === 1 ? "text-outline-strong" : "text-white"}`}
                        style={{ fontSize: "clamp(2rem, 6vw, 5.5rem)" }}>
                        {word}
                      </motion.h1>
                    </div>
                  ))}
                </div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                  className="mt-4 text-[#444] text-[11px] sm:text-xs leading-relaxed max-w-[340px] font-mono-ui">
                  <TypedText text="Save YouTube videos. Generate AI summaries, flashcards & MCQs. Build your knowledge vault." startDelay={500} />
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="mt-5 flex items-center gap-5 sm:gap-7">
                  {stats.map(s => (
                    <div key={s.label} className="flex flex-col">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono-ui leading-none">
                        <Counter to={s.value} />{s.suffix}
                      </span>
                      <span className="font-mono-ui text-[7px] text-[#222] uppercase tracking-widest mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <MonolithBtn onClick={() => setMode("register")} size="md">
                    START FOR FREE <ArrowUpRight className="w-3 h-3 ml-1 inline" />
                  </MonolithBtn>
                  <button onClick={handleReplitLogin}
                    className="h-10 sm:h-11 px-5 font-mono-ui text-[10px] uppercase tracking-widest text-[#555] hover:text-white transition-all duration-200 flex items-center justify-center"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)"}
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

              {/* 3D Vault card panel (desktop) */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
                className="hidden lg:flex flex-1 items-center justify-center border-l border-white/[0.04] overflow-hidden"
                style={{ minHeight: 420 }}>
                <VaultHeroVisual />
              </motion.div>

              {/* Mobile card (smaller) */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="lg:hidden w-full border-t border-white/[0.04] overflow-hidden flex-shrink-0" style={{ height: 240 }}>
                <VaultHeroVisual />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ AUTH FORMS ═══════════ */}
        {(mode === "register" || mode === "login-manual") && (
          <motion.div key="auth"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.28 }}
            className="flex flex-col min-h-screen relative z-10"
          >
            {/* Simple header for auth */}
            <header className="flex items-center justify-between px-4 sm:px-8 h-14 sm:h-16 border-b border-white/[0.04] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white flex items-center justify-center font-black text-black text-xs font-mono-ui">VV</div>
                <span className="font-black text-white uppercase tracking-[0.12em] text-xs font-mono-ui hidden sm:block">
                  VIDVAULT<span className="text-[#8b5cf6]"> AI</span>
                </span>
              </div>
              <button onClick={() => { setMode("landing"); setError(""); }}
                className="text-[#444] font-mono-ui text-[9px] uppercase tracking-widest hover:text-white transition-colors">
                ← BACK
              </button>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              {/* Form */}
              <div className="flex items-center justify-center px-4 sm:px-8 py-8 lg:py-0 lg:w-1/2 flex-shrink-0">
                <div className="w-full max-w-sm">
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="mb-7">
                    <span className="badge-mono mb-3 block w-fit">{mode === "register" ? "CREATE_ACCOUNT" : "SIGN_IN"}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      {mode === "register" ? "Join VidVault" : "Welcome Back"}
                    </h2>
                    <p className="font-mono-ui text-[9px] text-[#333] mt-1.5 uppercase tracking-wider">
                      {mode === "register" ? "BUILD YOUR KNOWLEDGE VAULT" : "ACCESS YOUR VAULT"}
                    </p>
                  </motion.div>

                  <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
                    onSubmit={mode === "register" ? handleRegister : handleManualLogin} className="space-y-3.5">
                    {mode === "register" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#333]">FIRST NAME</label>
                          <MonoInput placeholder="John" value={firstName} onChange={setFirstName} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#333]">LAST NAME</label>
                          <MonoInput placeholder="Doe" value={lastName} onChange={setLastName} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#333]">EMAIL_ADDRESS</label>
                      <MonoInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[8px] uppercase tracking-widest text-[#333]">PASSWORD</label>
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

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }} className="mt-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="font-mono-ui text-[8px] text-[#1e1e1e] uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    <button onClick={handleReplitLogin}
                      className="w-full h-11 font-mono-ui text-[9px] uppercase tracking-widest text-[#444] hover:text-white transition-all flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                    >CONTINUE WITH REPLIT</button>
                    <p className="mt-5 font-mono-ui text-[9px] text-[#2a2a2a] uppercase tracking-widest text-center">
                      {mode === "register" ? "HAVE AN ACCOUNT? " : "NO ACCOUNT? "}
                      <button onClick={() => { setMode(mode === "register" ? "login-manual" : "register"); setError(""); }}
                        className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
                        {mode === "register" ? "SIGN IN →" : "REGISTER →"}
                      </button>
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Auth visual */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                className="hidden lg:block flex-1 border-l border-white/[0.04] relative overflow-hidden">
                <VaultAuthVisual />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
