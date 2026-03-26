import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Mail, Lock, Loader2, ArrowUpRight, Sparkles, Folder, Tag, Brain, FileText, CheckSquare } from "lucide-react";

type AuthMode = "landing" | "register" | "login-manual";

/* ══════════════════════════════════════════════
   MINI COMPONENTS
══════════════════════════════════════════════ */

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-10"
      style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)" }}
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
    />
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.max(1, Math.ceil(to / 45));
    const t = setInterval(() => {
      v += step;
      if (v >= to) { setCount(to); clearInterval(t); } else setCount(v);
    }, 28);
    return () => clearInterval(t);
  }, [to]);
  return <>{count}{suffix}</>;
}

function TypedText({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const d = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(d);
  }, [startDelay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [started, text]);
  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="text-[#8b5cf6] animate-pulse">|</span>}
    </span>
  );
}

function MonoInput({ type = "text", placeholder, value, onChange, icon: Icon }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; icon?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focused ? "text-[#8b5cf6]" : "text-[#333]"}`} />}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full h-11 text-sm text-white placeholder:text-[#2a2a2a] focus:outline-none transition-all duration-200 font-sans"
        style={{
          background: "#0c0c0e",
          border: `1px solid ${focused ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`,
          padding: Icon ? "0 12px 0 38px" : "0 12px",
          boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.08)" : "none",
        }}
      />
    </div>
  );
}

function MonolithBtn({ children, onClick, size = "md", type = "button", disabled = false, fullWidth = false }: {
  children: React.ReactNode; onClick?: () => void; size?: "sm" | "md" | "lg";
  type?: "button" | "submit"; disabled?: boolean; fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const pad = { sm: "8px 18px", md: "11px 24px", lg: "13px 30px" }[size];
  const fs = { sm: "10px", md: "11px", lg: "12px" }[size];
  return (
    <motion.button
      type={type} onClick={onClick} disabled={disabled}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="font-mono-ui uppercase tracking-[0.08em] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors duration-200 flex-shrink-0"
      style={{
        padding: pad, fontSize: fs, width: fullWidth ? "100%" : undefined,
        minHeight: size === "lg" ? 48 : size === "md" ? 44 : 36,
        background: hovered ? "#8b5cf6" : "#ffffff",
        color: hovered ? "#ffffff" : "#000000",
        clipPath: "polygon(6% 0px, 100% 0px, 100% 76%, 94% 100%, 0px 100%, 0px 24%)",
        border: "none",
      }}
    >
      {children}
    </motion.button>
  );
}

/* ══════════════════════════════════════════════
   HERO VISUAL — LANDING (right panel)
   Animated mock of the VidVault dashboard
══════════════════════════════════════════════ */
const MOCK_VIDEOS = [
  { title: "React 19 Deep Dive", ch: "Fireship", thumb: "#1a1a3a", tag: "DEV", time: "18:42" },
  { title: "System Design 101", ch: "ByteByteGo", thumb: "#1a2a1a", tag: "ARCH", time: "32:15" },
  { title: "AI for Everyone", ch: "Andrew Ng", thumb: "#2a1a2a", tag: "AI", time: "44:08" },
];

const AI_OUTPUTS = [
  "→ Summarizing key concepts...",
  "→ Extracting 12 flashcards...",
  "→ Building MCQ set...",
  "→ Writing study notes...",
  "→ Generating outline...",
];

function VaultHeroVisual() {
  const [activeCard, setActiveCard] = useState(0);
  const [aiLine, setAiLine] = useState(0);
  const [aiText, setAiText] = useState("");

  useEffect(() => {
    const t = setInterval(() => setActiveCard((p) => (p + 1) % MOCK_VIDEOS.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const cycle = setInterval(() => {
      setAiLine((p) => (p + 1) % AI_OUTPUTS.length);
      setAiText("");
    }, 3500);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    const target = AI_OUTPUTS[aiLine];
    let i = 0;
    const t = setInterval(() => {
      setAiText(target.slice(0, i + 1));
      i++;
      if (i >= target.length) clearInterval(t);
    }, 35);
    return () => clearInterval(t);
  }, [aiLine]);

  return (
    <div className="relative w-full h-full flex flex-col p-4 sm:p-6 gap-3 overflow-hidden select-none">
      {/* ── Top label ── */}
      <div className="flex items-center justify-between">
        <span className="font-mono-ui text-[9px] text-[#2a2a2a] uppercase tracking-[0.3em]">VAULT_PREVIEW</span>
        <div className="flex items-center gap-1.5">
          <motion.div className="w-1.5 h-1.5 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      {/* ── Folder sidebar + videos grid ── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* Sidebar mock */}
        <div className="hidden sm:flex flex-col w-28 gap-1 flex-shrink-0">
          <span className="font-mono-ui text-[8px] text-[#2a2a2a] uppercase tracking-[0.3em] mb-1 px-2">FOLDERS</span>
          {[
            { name: "Dev", color: "#8b5cf6", count: 12 },
            { name: "AI/ML", color: "#06b6d4", count: 8 },
            { name: "Design", color: "#f59e0b", count: 5 },
            { name: "System", color: "#10b981", count: 9 },
          ].map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer group"
              style={{ background: i === 0 ? "rgba(139,92,246,0.08)" : "transparent", borderLeft: `2px solid ${i === 0 ? f.color : "transparent"}` }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.color }} />
              <span className="font-mono-ui text-[9px] uppercase tracking-widest truncate" style={{ color: i === 0 ? "#aaa" : "#333" }}>{f.name}</span>
              <span className="font-mono-ui text-[8px] text-[#222] ml-auto">{f.count}</span>
            </motion.div>
          ))}

          {/* Tags */}
          <div className="mt-3">
            <span className="font-mono-ui text-[8px] text-[#2a2a2a] uppercase tracking-[0.3em] mb-1.5 px-2 block">TAGS</span>
            <div className="flex flex-wrap gap-1 px-2">
              {["REACT", "AI", "ARCH", "CSS"].map((t, i) => (
                <motion.span key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
                  className="font-mono-ui text-[7px] px-1.5 py-0.5 uppercase"
                  style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  {t}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Video cards */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {MOCK_VIDEOS.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.15 }}
              className="flex items-center gap-3 p-2.5 cursor-pointer flex-shrink-0 transition-all duration-300"
              style={{
                background: activeCard === i ? "rgba(139,92,246,0.06)" : "#111113",
                border: `1px solid ${activeCard === i ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)"}`,
              }}
            >
              {/* Thumbnail */}
              <div className="w-14 h-9 flex-shrink-0 flex items-center justify-center relative overflow-hidden" style={{ background: v.thumb }}>
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{ opacity: activeCard === i ? [0.1, 0.25, 0.1] : 0.1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ background: "linear-gradient(135deg, #8b5cf6, transparent)" }}
                />
                <span className="font-mono-ui text-[7px] text-[#444] uppercase relative z-10">{v.time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[10px] truncate uppercase tracking-tight" style={{ color: activeCard === i ? "#ddd" : "#555" }}>
                  {v.title}
                </p>
                <p className="font-mono-ui text-[8px] text-[#2a2a2a] mt-0.5 uppercase tracking-widest">{v.ch}</p>
              </div>
              <span className="font-mono-ui text-[7px] px-1.5 py-0.5 flex-shrink-0"
                style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                {v.tag}
              </span>
            </motion.div>
          ))}

          {/* AI panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex-1 p-3 min-h-0 flex flex-col"
            style={{ background: "#0d0d0f", border: "1px solid rgba(139,92,246,0.12)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-[#8b5cf6]" />
              <span className="font-mono-ui text-[9px] text-[#8b5cf6] uppercase tracking-widest">AI_STUDIO</span>
              <motion.div className="ml-auto w-1 h-1 rounded-full bg-[#8b5cf6]"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {[
                { icon: FileText, label: "SUMMARY", done: true },
                { icon: CheckSquare, label: "MCQ_SET", done: true },
                { icon: Brain, label: "FLASHCARDS", done: false },
              ].map(({ icon: Icon, label, done }, i) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className={`w-2.5 h-2.5 ${done ? "text-green-500" : "text-[#333]"}`} />
                  <span className={`font-mono-ui text-[8px] uppercase tracking-widest ${done ? "text-[#444]" : "text-[#222]"}`}>{label}</span>
                  {done && <span className="ml-auto font-mono-ui text-[7px] text-green-500">DONE</span>}
                </div>
              ))}
              <div className="mt-auto pt-2 border-t border-white/[0.03]">
                <p className="font-mono-ui text-[8px] text-[#8b5cf6] leading-relaxed min-h-[16px]">
                  {aiText}<span className="animate-pulse">_</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom stat strip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-4 pt-2 border-t"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        {[
          { label: "VIDEOS", val: 24 },
          { label: "FOLDERS", val: 6 },
          { label: "AI_RUNS", val: 89 },
        ].map((s) => (
          <div key={s.label} className="flex flex-col">
            <span className="font-mono-ui text-xs font-black text-white leading-none"><Counter to={s.val} /></span>
            <span className="font-mono-ui text-[7px] text-[#2a2a2a] uppercase tracking-widest mt-0.5">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto text-right">
          <div className="font-mono-ui text-[7px] text-[#1e1e1e] uppercase tracking-widest">PLATFORM_VERSION</div>
          <div className="font-mono-ui text-[9px] text-[#2a2a2a]">VV_CORE_v2.0.1</div>
        </div>
      </motion.div>

      {/* Corner gradient overlays — blends with bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0a0a0b 0%, transparent 6%)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, #0a0a0b 0%, transparent 8%)" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   HERO VISUAL — AUTH FORMS (right panel)
   Animated geometric "knowledge vault"
══════════════════════════════════════════════ */
function VaultAuthVisual() {
  const nodes = [
    { x: "50%", y: "38%", label: "VIDEO", size: 52, primary: true },
    { x: "25%", y: "25%", label: "NOTES", size: 36, primary: false },
    { x: "72%", y: "22%", label: "AI", size: 40, primary: false },
    { x: "20%", y: "58%", label: "TAGS", size: 32, primary: false },
    { x: "75%", y: "60%", label: "MCQ", size: 34, primary: false },
    { x: "50%", y: "68%", label: "FLASH", size: 30, primary: false },
  ];

  const lines = [
    { x1: "50%", y1: "38%", x2: "25%", y2: "25%" },
    { x1: "50%", y1: "38%", x2: "72%", y2: "22%" },
    { x1: "50%", y1: "38%", x2: "20%", y2: "58%" },
    { x1: "50%", y1: "38%", x2: "75%", y2: "60%" },
    { x1: "50%", y1: "38%", x2: "50%", y2: "68%" },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Ambient glow */}
      <motion.div className="absolute rounded-full"
        style={{ width: 300, height: 300, top: "20%", left: "50%", translateX: "-50%", background: "#8b5cf6", filter: "blur(120px)", opacity: 0.06 }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      {/* Orbital rings */}
      {[240, 340, 440].map((d, i) => (
        <motion.div key={d} className="absolute rounded-full"
          style={{
            width: d, height: d,
            top: "38%", left: "50%",
            translateX: "-50%", translateY: "-50%",
            border: `1px solid rgba(139,92,246,${0.06 - i * 0.015})`,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 18 + i * 6, repeat: Infinity, ease: "linear" }} />
      ))}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {lines.map((l, i) => (
          <motion.line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="rgba(139,92,246,0.12)" strokeWidth="1" strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.8 }} />
        ))}
        {/* Traveling pulse along lines */}
        {lines.map((l, i) => (
          <motion.circle key={`p${i}`} r="2" fill="#8b5cf6"
            initial={{ offsetDistance: "0%" } as any}
            animate={{ offsetDistance: ["0%", "100%"] } as any}
            transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity, ease: "linear" }}
            style={{
              offsetPath: `path("M ${l.x1} ${l.y1} L ${l.x2} ${l.y2}")`,
              opacity: 0.6,
            } as any}
          />
        ))}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div key={node.label}
          className="absolute flex flex-col items-center gap-1"
          style={{ left: node.x, top: node.y, translateX: "-50%", translateY: "-50%" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, node.primary ? -6 : -4, 0] }}
          transition={{
            opacity: { delay: 0.2 + i * 0.1, duration: 0.5 },
            scale: { delay: 0.2 + i * 0.1, duration: 0.5 },
            y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
          }}
        >
          <div
            className="flex items-center justify-center font-mono-ui font-black"
            style={{
              width: node.size, height: node.size,
              background: node.primary ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" : "#111113",
              border: `1px solid ${node.primary ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.15)"}`,
              clipPath: "polygon(10% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%, 0% 10%)",
              boxShadow: node.primary ? "0 0 20px rgba(139,92,246,0.3)" : "none",
              color: node.primary ? "#fff" : "#8b5cf6",
              fontSize: node.primary ? "10px" : "7px",
            }}
          >
            {node.label.slice(0, 3)}
          </div>
          <span className="font-mono-ui text-[7px] text-[#2a2a2a] uppercase tracking-widest">{node.label}</span>
        </motion.div>
      ))}

      {/* Feature list bottom */}
      <motion.div
        className="absolute bottom-6 left-6 right-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex flex-wrap gap-2 justify-center">
          {["SUMMARIES", "FLASHCARDS", "MCQ_SETS", "OUTLINES", "KEY_INSIGHTS"].map((f, i) => (
            <motion.span key={f}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.08 }}
              className="font-mono-ui text-[7px] px-2 py-1 uppercase tracking-widest"
              style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}
            >
              {f}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Corner blends */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0a0a0b 0%, transparent 8%)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, #0a0a0b 0%, transparent 8%, transparent 88%, #0a0a0b 100%)" }} />
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
  const glowX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const h = (e: MouseEvent) => { mouseX.set(e.clientX - 150); mouseY.set(e.clientY - 150); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const handleReplitLogin = () => { window.location.href = "/api/login"; };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, firstName, lastName }) });
      if (res.ok) { window.location.href = "/"; }
      else { const d = await res.json(); setError(d.error || "Registration failed"); }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/login-manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (res.ok) { window.location.href = "/"; }
      else { const d = await res.json(); setError(d.error || "Login failed"); }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const textVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: 0.1 + i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] } }),
  };

  const stats = [
    { label: "AI_TOOLS", value: 6, suffix: "+" },
    { label: "EXPORT_FMT", value: 5, suffix: "" },
    { label: "MAX_VIDEOS", value: 500, suffix: "+" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#0a0a0b", color: "#e0e0e0" }}>
      {/* Cursor glow */}
      <motion.div className="fixed w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{ x: glowX, y: glowY, background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />

      {/* Grid */}
      <div className="grid-mesh absolute inset-0 pointer-events-none z-0" />

      {/* Scan line */}
      <ScanLine />

      <AnimatePresence mode="wait">

        {/* ═══════════ LANDING ═══════════ */}
        {mode === "landing" && (
          <motion.div key="landing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen relative z-10"
          >
            {/* Nav */}
            <header className="flex items-center justify-between px-4 sm:px-8 lg:px-10 h-14 sm:h-16 border-b border-white/[0.04] flex-shrink-0">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }} className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white flex items-center justify-center font-black text-black text-xs font-mono-ui flex-shrink-0">VV</div>
                <span className="font-black text-white uppercase tracking-[0.12em] text-xs font-mono-ui hidden sm:block">VIDVAULT AI</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} className="flex items-center gap-3 sm:gap-5">
                <button onClick={() => setMode("login-manual")} className="text-[#555] font-mono-ui text-[10px] uppercase tracking-widest hover:text-white transition-colors hidden sm:block">LOG IN</button>
                <MonolithBtn onClick={() => setMode("register")} size="sm">GET STARTED</MonolithBtn>
              </motion.div>
            </header>

            {/* Body: left text + right visual */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">

              {/* Left vertical nav (xl only) */}
              <div className="hidden xl:flex w-11 border-r border-white/[0.04] flex-col items-center justify-center gap-7 flex-shrink-0 relative">
                {["SAVE", "SORT", "AI", "LEARN"].map((item, i) => (
                  <motion.span key={item}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                    className="font-mono-ui text-[7px] uppercase tracking-[0.35em] text-[#222] hover:text-[#8b5cf6] transition-colors cursor-default"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  >{item}</motion.span>
                ))}
                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
                  className="absolute bottom-10 w-px h-14 bg-gradient-to-b from-transparent to-[#8b5cf6]" />
              </div>

              {/* ── Text content ── */}
              <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-8 lg:py-0 lg:w-[50%] xl:w-[48%] flex-shrink-0">

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
                  <span className="badge-mono">AI_POWERED // SECOND_BRAIN</span>
                </motion.div>

                <div className="overflow-hidden space-y-[0.04em]">
                  {["SAVE.", "ANALYZE.", "MASTER."].map((word, i) => (
                    <div key={word} className="overflow-hidden">
                      <motion.h1
                        custom={i} variants={textVariants} initial="hidden" animate="visible"
                        className={`font-black leading-[0.9] uppercase tracking-[-0.02em] ${i === 1 ? "text-outline-strong" : "text-white"}`}
                        style={{ fontSize: "clamp(2.2rem, 6.5vw, 5.8rem)" }}
                      >{word}</motion.h1>
                    </div>
                  ))}
                </div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="mt-4 text-[#444] text-xs leading-relaxed max-w-[360px] font-mono-ui">
                  <TypedText text="Save YouTube videos. Generate AI summaries, flashcards & MCQs. Build your knowledge vault." startDelay={600} />
                </motion.p>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="mt-5 flex items-center gap-5 sm:gap-7">
                  {stats.map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono-ui leading-none">
                        <Counter to={s.value} suffix={s.suffix} />
                      </span>
                      <span className="font-mono-ui text-[7px] text-[#2a2a2a] uppercase tracking-widest mt-1">{s.label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                  className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <MonolithBtn onClick={() => setMode("register")} size="md">
                    START FOR FREE <ArrowUpRight className="w-3 h-3 ml-1 inline" />
                  </MonolithBtn>
                  <button onClick={handleReplitLogin}
                    className="h-11 px-5 font-mono-ui text-[10px] uppercase tracking-widest text-[#555] hover:text-white transition-all duration-200 flex items-center justify-center"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
                  >SIGN IN WITH REPLIT</button>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
                  className="mt-3 font-mono-ui text-[9px] text-[#2a2a2a] uppercase tracking-widest">
                  HAVE AN ACCOUNT?{" "}
                  <button onClick={() => setMode("login-manual")} className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">SIGN IN →</button>
                </motion.p>
              </div>

              {/* ── Right visual (desktop) ── */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.7 }}
                className="hidden lg:block flex-1 border-l border-white/[0.04] relative overflow-hidden"
                style={{ minHeight: 420 }}
              >
                <VaultHeroVisual />
              </motion.div>

              {/* ── Mobile mini-visual ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="lg:hidden w-full border-t border-white/[0.04] overflow-hidden flex-shrink-0"
                style={{ height: 200 }}
              >
                <VaultHeroVisual />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ AUTH FORMS ═══════════ */}
        {(mode === "register" || mode === "login-manual") && (
          <motion.div key="auth"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen relative z-10"
          >
            <header className="flex items-center justify-between px-4 sm:px-8 h-14 sm:h-16 border-b border-white/[0.04] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white flex items-center justify-center font-black text-black text-xs font-mono-ui">VV</div>
                <span className="font-black text-white uppercase tracking-[0.12em] text-xs font-mono-ui hidden sm:block">VIDVAULT AI</span>
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
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-7">
                    <span className="badge-mono mb-3 block w-fit">{mode === "register" ? "CREATE_ACCOUNT" : "SIGN_IN"}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                      {mode === "register" ? "Join VidVault" : "Welcome Back"}
                    </h2>
                    <p className="font-mono-ui text-[9px] text-[#333] mt-1.5 uppercase tracking-wider">
                      {mode === "register" ? "BUILD YOUR KNOWLEDGE VAULT" : "ACCESS YOUR VAULT"}
                    </p>
                  </motion.div>

                  <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    onSubmit={mode === "register" ? handleRegister : handleManualLogin}
                    className="space-y-3.5"
                  >
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

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="font-mono-ui text-[8px] text-[#222] uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    <button onClick={handleReplitLogin}
                      className="w-full h-11 font-mono-ui text-[9px] uppercase tracking-widest text-[#444] hover:text-white transition-all duration-200 flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
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

              {/* Auth right visual */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:block flex-1 border-l border-white/[0.04] relative overflow-hidden"
              >
                <VaultAuthVisual />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
