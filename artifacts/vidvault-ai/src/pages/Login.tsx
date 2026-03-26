import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useInView } from "framer-motion";
import {
  Mail, Lock, Loader2, ArrowUpRight, Youtube, Folder, Tag, Zap,
  BookOpen, BarChart3, Download, Play, Pause, Volume2, Maximize,
  CheckCircle2, Sparkles, Brain, FileText, CheckSquare, ChevronRight
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
    const step = Math.max(1, Math.ceil(to / 55));
    const t = setInterval(() => { v = Math.min(v + step, to); setN(v); if (v >= to) clearInterval(t); }, 22);
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
        className="w-full h-11 text-sm text-white placeholder:text-[#252525] focus:outline-none transition-all"
        style={{ fontFamily: "'Raleway', sans-serif", background: "#0c0c0e", border: `1px solid ${focused ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: Icon ? "0 12px 0 38px" : "0 12px", boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.07)" : "none" }} />
    </div>
  );
}

function MonolithBtn({ children, onClick, size = "md", type = "button", disabled = false, fullWidth = false }: {
  children: React.ReactNode; onClick?: () => void; size?: "sm" | "md" | "lg";
  type?: "button" | "submit"; disabled?: boolean; fullWidth?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const pad = { sm: "8px 18px", md: "12px 26px", lg: "14px 32px" }[size];
  const fs = { sm: "11px", md: "12px", lg: "13px" }[size];
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} whileTap={{ scale: 0.96 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 flex-shrink-0 uppercase tracking-[0.07em]"
      style={{ padding: pad, fontSize: fs, width: fullWidth ? "100%" : undefined, minHeight: size === "lg" ? 50 : size === "md" ? 44 : 36, fontFamily: "'Raleway', sans-serif", background: hov ? "#8b5cf6" : "#fff", color: hov ? "#fff" : "#000", clipPath: "polygon(6% 0px,100% 0px,100% 76%,94% 100%,0px 100%,0px 24%)", transition: "background 0.2s,color 0.2s,box-shadow 0.2s", boxShadow: hov ? "0 8px 30px rgba(139,92,246,0.35)" : "none" }}
    >{children}</motion.button>
  );
}

/* ══════════════════════════════════════════════
   LEFT SIDEBAR
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="w-9 h-9 bg-white flex items-center justify-center font-black text-black text-[11px] flex-shrink-0 mt-3 cursor-default"
        style={{ fontFamily: "'Raleway', sans-serif", borderRadius: 4 }}>VV
      </motion.div>
      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        {NAV_ITEMS.map((item, i) => (
          <motion.button key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
            onClick={() => onNav(item.id)}
            className="font-mono-ui text-[8px] uppercase tracking-[0.25em] cursor-pointer transition-all duration-200 hover:text-white"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: active === item.id ? "#8b5cf6" : "#2a2a2a" }}
          >{item.label}</motion.button>
        ))}
      </div>
      <motion.div className="mb-4 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
        animate={{ opacity: [1, 0.3, 1], scale: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }} />
    </aside>
  );
}

/* ══════════════════════════════════════════════
   TOP BAR
══════════════════════════════════════════════ */
function TopBar({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="flex items-center justify-between px-6 sm:px-10 h-14 sm:h-16 flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="font-black text-white uppercase tracking-[0.08em] text-sm"
        style={{ fontFamily: "'Raleway', sans-serif" }}>
        VIDVAULT<span className="text-[#8b5cf6]"> AI</span>
      </span>
      <div className="flex items-center gap-4 sm:gap-6">
        <button onClick={onLogin}
          className="text-[11px] uppercase tracking-widest text-[#444] hover:text-white transition-colors font-semibold"
          style={{ fontFamily: "'Raleway', sans-serif" }}>LOG IN</button>
        <motion.button onClick={onRegister} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="text-[11px] uppercase tracking-widest text-white px-5 h-9 flex items-center font-bold"
          style={{ fontFamily: "'Raleway', sans-serif", border: "1px solid rgba(255,255,255,0.28)", clipPath: "polygon(4% 0,100% 0,100% 78%,96% 100%,0 100%,0 22%)", transition: "border-color 0.2s, background 0.2s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.6)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.28)"}
        >GET STARTED</motion.button>
      </div>
    </motion.header>
  );
}

/* ══════════════════════════════════════════════
   ANIMATED VIDEO PLAYER MOCK — landing hero right panel
   Shows the full VidVault workflow: paste → load → AI → outputs
══════════════════════════════════════════════ */
const VIDEO_DEMOS = [
  { title: "The Complete React 19 Guide", channel: "Fireship", views: "1.2M views", duration: "18:42", color: "#1a1a3e", bar: "#8b5cf6" },
  { title: "System Design: Scale to Millions", channel: "ByteByteGo", views: "847K views", duration: "32:15", color: "#1a2e1a", bar: "#10b981" },
  { title: "OpenAI GPT-5 Full Tutorial", channel: "AI Explained", views: "2.1M views", duration: "44:08", color: "#2e1a1a", bar: "#ef4444" },
];
const AI_TASKS = [
  { label: "AI Summary", icon: FileText, color: "#8b5cf6", result: "847-word structured summary" },
  { label: "Flashcard Deck", icon: Brain, color: "#06b6d4", result: "14 spaced-repetition cards" },
  { label: "MCQ Set", icon: CheckSquare, color: "#22c55e", result: "12 auto-graded questions" },
  { label: "Blog Article", icon: FileText, color: "#f59e0b", result: "1,200-word SEO article" },
  { label: "PPT Outline", icon: BarChart3, color: "#ec4899", result: "8-slide deck structure" },
  { label: "Key Insights", icon: Sparkles, color: "#a78bfa", result: "Top 9 actionable takeaways" },
];

type DemoPhase = "url" | "loading" | "player" | "ai" | "done";

function VideoPlayerMock() {
  const [videoIdx, setVideoIdx] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("url");
  const [urlText, setUrlText] = useState("");
  const [progress, setProgress] = useState(22);
  const [tasksDone, setTasksDone] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const video = VIDEO_DEMOS[videoIdx];
  const URL_FULL = `youtube.com/watch?v=dQw4w9WgXcQ`;

  // Master cycle controller
  useEffect(() => {
    const seq: Array<[DemoPhase, number]> = [
      ["url", 0],
      ["loading", 2400],
      ["player", 4200],
      ["ai", 6500],
      ["done", 11500],
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    seq.forEach(([p, delay]) => {
      timers.push(setTimeout(() => setPhase(p), delay));
    });
    timers.push(setTimeout(() => {
      setVideoIdx(prev => (prev + 1) % VIDEO_DEMOS.length);
      setPhase("url"); setUrlText(""); setProgress(22); setTasksDone(0);
    }, 15000));
    return () => timers.forEach(clearTimeout);
  }, [videoIdx]);

  // URL typing animation
  useEffect(() => {
    if (phase !== "url") return;
    setUrlText("");
    let i = 0;
    const t = setInterval(() => {
      setUrlText(URL_FULL.slice(0, ++i));
      if (i >= URL_FULL.length) clearInterval(t);
    }, 55);
    return () => clearInterval(t);
  }, [phase, videoIdx]);

  // Progress bar
  useEffect(() => {
    if (phase !== "player" && phase !== "ai" && phase !== "done") return;
    const t = setInterval(() => setProgress(p => Math.min(p + 0.3, 98)), 120);
    return () => clearInterval(t);
  }, [phase]);

  // AI tasks reveal
  useEffect(() => {
    if (phase !== "ai") { if (phase === "url" || phase === "loading") setTasksDone(0); return; }
    setTasksDone(0);
    let i = 0;
    const t = setInterval(() => { i++; setTasksDone(i); if (i >= AI_TASKS.length) clearInterval(t); }, 700);
    return () => clearInterval(t);
  }, [phase]);

  // 3D tilt
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sX = useSpring(rotX, { stiffness: 90, damping: 20 });
  const sY = useSpring(rotY, { stiffness: 90, damping: 20 });
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect(); if (!r) return;
    rotX.set(-((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 6);
    rotY.set(((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 6);
  }, []);
  const onMouseLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{ perspective: "1100px" }}>
      <motion.div ref={cardRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        style={{ rotateX: sX, rotateY: sY, transformStyle: "preserve-3d" }}
        className="w-full max-w-[520px]"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}>

        {/* Outer card */}
        <div className="overflow-hidden relative"
          style={{ background: "rgba(10,10,14,0.97)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 18, boxShadow: "0 28px 70px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 100px rgba(139,92,246,0.05)" }}>

          {/* Grid bg */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />

          {/* Scan line */}
          <motion.div className="absolute left-0 right-0 h-px pointer-events-none z-20"
            style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)" }}
            animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }} />

          {/* App top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
              <div className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
              <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
            </div>
            <div className="flex-1 mx-3">
              <div className="flex items-center gap-2 px-3 h-7 max-w-[260px] mx-auto"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6 }}>
                <Youtube className="w-3 h-3 text-red-500 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {phase === "url" ? (
                    <span key="typing" className="font-mono-ui text-[9px] text-[#666] truncate">
                      {urlText}<span className="text-[#8b5cf6] animate-pulse">|</span>
                    </span>
                  ) : (
                    <motion.span key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="font-mono-ui text-[9px] text-[#555] truncate">
                      {URL_FULL}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <motion.div className="w-1.5 h-1.5 rounded-full"
                style={{ background: phase === "ai" || phase === "done" ? "#22c55e" : "#333" }}
                animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="font-mono-ui text-[8px] uppercase tracking-widest"
                style={{ color: phase === "ai" || phase === "done" ? "#22c55e" : "#2a2a2a" }}>
                {phase === "url" ? "IDLE" : phase === "loading" ? "FETCHING" : phase === "player" ? "READY" : phase === "ai" ? "ANALYZING" : "COMPLETE"}
              </span>
            </div>
          </div>

          {/* Main content area */}
          <div className="relative z-10">

            {/* Loading phase */}
            <AnimatePresence>
              {phase === "loading" && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 gap-4">
                  <motion.div className="w-10 h-10 border-2 border-[#8b5cf6] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                  <span className="font-mono-ui text-[10px] text-[#444] uppercase tracking-widest">
                    <TypedText text="Fetching transcript & metadata..." />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* URL phase placeholder */}
            {phase === "url" && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 12 }}>
                  <Youtube className="w-6 h-6 text-[#2a2a2a]" />
                </div>
                <span className="font-mono-ui text-[10px] text-[#222] uppercase tracking-widest">PASTE YOUTUBE URL ABOVE</span>
              </div>
            )}

            {/* Video player + AI panel */}
            <AnimatePresence>
              {(phase === "player" || phase === "ai" || phase === "done") && (
                <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                  {/* Video frame */}
                  <div className="relative mx-3 mt-3 overflow-hidden"
                    style={{ borderRadius: 10, background: video.color, aspectRatio: "16/9" }}>

                    {/* Fake video content */}
                    <div className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${video.color}, #0a0a0b 70%)` }} />
                    <div className="absolute inset-0 opacity-[0.04]"
                      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.25, 0.15] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: video.bar, filter: "blur(20px)" }} />
                      <motion.button
                        onClick={() => setIsPlaying(!isPlaying)}
                        animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute w-12 h-12 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.7)", borderRadius: 12, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                        {isPlaying
                          ? <Pause className="w-5 h-5 text-white" />
                          : <Play className="w-5 h-5 text-white fill-white ml-0.5" />}
                      </motion.button>
                    </div>

                    {/* AI overlay badge during AI phase */}
                    <AnimatePresence>
                      {(phase === "ai" || phase === "done") && (
                        <motion.div key="ai-badge" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1"
                          style={{ background: "rgba(139,92,246,0.85)", borderRadius: 6, backdropFilter: "blur(4px)" }}>
                          <motion.div className="w-1.5 h-1.5 rounded-full bg-white"
                            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
                          <span className="font-mono-ui text-[8px] text-white uppercase tracking-widest">AI ANALYZING</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Video controls bar */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }}>
                      <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.15)" }}>
                        <motion.div className="h-full rounded-full" animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }} style={{ background: video.bar }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-white/80">
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
                        </button>
                        <span className="font-mono-ui text-[9px] text-white/70 flex-1">
                          {Math.floor(progress / 100 * 18)}:{String(Math.floor((progress / 100 * 42) % 60)).padStart(2, "0")} / {video.duration}
                        </span>
                        <Volume2 className="w-3 h-3 text-white/60" />
                        <Maximize className="w-3 h-3 text-white/60" />
                      </div>
                    </div>
                  </div>

                  {/* Video info */}
                  <div className="px-4 py-2.5 border-b border-white/[0.05]">
                    <p className="font-bold text-xs text-white leading-snug truncate" style={{ fontFamily: "'Raleway', sans-serif" }}>
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono-ui text-[9px] text-[#555]">{video.channel}</span>
                      <span className="text-[#2a2a2a] font-mono-ui text-[8px]">•</span>
                      <span className="font-mono-ui text-[9px] text-[#444]">{video.views}</span>
                    </div>
                  </div>

                  {/* AI outputs */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-[#8b5cf6]" />
                      <span className="font-mono-ui text-[9px] text-[#8b5cf6] uppercase tracking-widest">AI_GENERATION_SUITE</span>
                      {phase === "done" && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="ml-auto font-mono-ui text-[8px] text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />ALL DONE
                        </motion.span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {AI_TASKS.map((task, i) => {
                        const done = i < tasksDone;
                        const active = i === tasksDone && phase === "ai";
                        return (
                          <motion.div key={task.label}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: done || active ? 1 : 0.25, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            className="flex items-center gap-2 px-2 py-1.5"
                            style={{ background: done ? `${task.color}0d` : "rgba(255,255,255,0.02)", border: `1px solid ${done ? `${task.color}30` : "rgba(255,255,255,0.04)"}`, borderRadius: 7, transition: "all 0.3s" }}>
                            {done ? (
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: task.color }} />
                            ) : active ? (
                              <motion.div className="w-3 h-3 rounded-full flex-shrink-0"
                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                style={{ background: task.color }} />
                            ) : (
                              <task.icon className="w-3 h-3 flex-shrink-0 text-[#2a2a2a]" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-semibold truncate" style={{ color: done ? "#bbb" : "#333", fontFamily: "'Raleway', sans-serif" }}>
                                {task.label}
                              </span>
                              {done && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  className="font-mono-ui text-[7px] truncate" style={{ color: task.color }}>
                                  {task.result}
                                </motion.span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3D shadow layer */}
        <div className="absolute inset-0 -z-10 rounded-[18px]"
          style={{ background: "rgba(139,92,246,0.08)", transform: "translateZ(-24px) scale(0.94)", filter: "blur(3px)" }} />
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   AUTH VISUAL
══════════════════════════════════════════════ */
function VaultAuthVisual() {
  const nodes = [
    { x: "50%", y: "38%", label: "VIDEO", size: 56, primary: true },
    { x: "25%", y: "24%", label: "NOTES", size: 40, primary: false },
    { x: "74%", y: "22%", label: "AI", size: 44, primary: false },
    { x: "20%", y: "60%", label: "TAGS", size: 36, primary: false },
    { x: "76%", y: "60%", label: "MCQ", size: 38, primary: false },
    { x: "50%", y: "70%", label: "FLASH", size: 34, primary: false },
  ];
  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div className="absolute rounded-full pointer-events-none"
        style={{ width: 300, height: 300, top: "24%", left: "50%", translateX: "-50%", background: "#8b5cf6", filter: "blur(120px)", opacity: 0.06 }}
        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
      {[280, 380, 480].map((d, i) => (
        <motion.div key={d} className="absolute rounded-full pointer-events-none"
          style={{ width: d, height: d, top: "38%", left: "50%", translateX: "-50%", translateY: "-50%", border: `1px solid rgba(139,92,246,${0.07 - i * 0.02})` }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }} transition={{ duration: 18 + i * 5, repeat: Infinity, ease: "linear" }} />
      ))}
      {nodes.map((node, i) => (
        <motion.div key={node.label} className="absolute flex flex-col items-center gap-1"
          style={{ left: node.x, top: node.y, translateX: "-50%", translateY: "-50%" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, node.primary ? -8 : -4, 0] }}
          transition={{ opacity: { delay: 0.2 + i * 0.1 }, scale: { delay: 0.2 + i * 0.1 }, y: { duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 } }}>
          <div className="flex items-center justify-center font-black"
            style={{ width: node.size, height: node.size, fontFamily: "'Raleway', sans-serif", background: node.primary ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "#111113", border: `1px solid ${node.primary ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.14)"}`, borderRadius: node.primary ? 12 : 8, boxShadow: node.primary ? "0 0 28px rgba(139,92,246,0.3)" : "none", color: node.primary ? "#fff" : "#8b5cf6", fontSize: node.primary ? "11px" : "8px" }}>
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
    { icon: Youtube, title: "SAVE VIDEOS", desc: "Paste any YouTube URL or playlist. Import up to 500 videos instantly with metadata.", color: "#ef4444" },
    { icon: Folder, title: "SMART FOLDERS", desc: "Organize with nested folders and color-coded tags. Zero friction.", color: "#f59e0b" },
    { icon: Sparkles, title: "AI GENERATION", desc: "6 AI tools: summaries, flashcards, MCQ, outlines, insights, blog posts.", color: "#8b5cf6" },
    { icon: Download, title: "EXPORT ANYWHERE", desc: "Export to PDF, Markdown, JSON, PPT, or share a public link.", color: "#06b6d4" },
    { icon: Brain, title: "FLASHCARD DECKS", desc: "Auto-generated spaced-repetition flashcards from any video.", color: "#10b981" },
    { icon: BarChart3, title: "KNOWLEDGE GRAPH", desc: "Visual graph of your saved videos, tags, and AI connections.", color: "#ec4899" },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14">
      <SectionLabel>CORE_FEATURES</SectionLabel>
      <div className="overflow-hidden mb-12">
        <motion.h2 initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-black uppercase text-white leading-[0.88]"
          style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", letterSpacing: "-0.02em", fontFamily: "'Raleway', sans-serif" }}>
          THE CORE<br /><span className="text-outline-strong">PROTOCOLS.</span>
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.title}
            initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08 + i * 0.08, duration: 0.5 }}
            className="card-interactive group p-6 cursor-default relative overflow-hidden">
            {/* Accent glow */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${card.color}20 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                style={{ background: `${card.color}15`, border: `1px solid ${card.color}30`, borderRadius: 10 }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="font-black text-[11px] uppercase tracking-widest text-white" style={{ fontFamily: "'Raleway', sans-serif" }}>{card.title}</span>
            </div>
            <p className="font-mono-ui text-[10px] text-[#444] leading-relaxed">{card.desc}</p>
            <ChevronRight className="w-3 h-3 text-[#222] absolute bottom-4 right-4 group-hover:text-[#8b5cf6] transition-colors" />
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
        <motion.h2 initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-black uppercase text-white leading-[0.88]"
          style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", letterSpacing: "-0.02em", fontFamily: "'Raleway', sans-serif" }}>
          6 AI TOOLS.<br /><span className="text-outline-strong">ONE VAULT.</span>
        </motion.h2>
      </div>
      <div className="space-y-px">
        {tools.map((tool, i) => (
          <motion.div key={tool.id}
            initial={{ opacity: 0, x: -24 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.05 + i * 0.07, duration: 0.45 }}
            className="flex items-center gap-6 px-5 py-4 group cursor-default transition-all duration-200 hover:bg-white/[0.025]"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", borderRadius: 4 }}>
            <span className="font-mono-ui text-[10px] font-black w-7 flex-shrink-0" style={{ color: tool.color }}>{tool.id}</span>
            <div className="w-px h-6 flex-shrink-0" style={{ background: `${tool.color}50` }} />
            <span className="font-black text-sm uppercase tracking-widest text-white w-36 sm:w-44 flex-shrink-0" style={{ fontFamily: "'Raleway', sans-serif" }}>{tool.label}</span>
            <span className="font-mono-ui text-[10px] text-[#444] flex-1 hidden sm:block">{tool.desc}</span>
            <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
              style={{ background: `${tool.color}18`, borderRadius: 6 }}>
              <ArrowUpRight className="w-3.5 h-3.5" style={{ color: tool.color }} />
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
    { n: "01", title: "PASTE URL", desc: "Drop any YouTube link or playlist URL. We support single videos and full playlists up to 500 items.", icon: Youtube, color: "#8b5cf6" },
    { n: "02", title: "AI PROCESSES", desc: "Our engine extracts transcript & metadata, then sends to GPT for deep structured analysis.", icon: Zap, color: "#06b6d4" },
    { n: "03", title: "GET KNOWLEDGE", desc: "Download 6 AI artifacts — summaries, flashcards, MCQs, articles, outlines, and insights.", icon: BookOpen, color: "#10b981" },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <SectionLabel>WORKFLOW</SectionLabel>
      <div className="overflow-hidden mb-16">
        <motion.h2 initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-black uppercase text-white leading-[0.88]"
          style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", letterSpacing: "-0.02em", fontFamily: "'Raleway', sans-serif" }}>
          THREE STEPS.<br /><span className="text-outline-strong">INFINITE KNOWLEDGE.</span>
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <motion.div key={step.n}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.12 + i * 0.12, duration: 0.5 }}
            className="card-interactive group p-6 relative overflow-hidden">
            {/* Number */}
            <div className="text-[60px] font-black absolute -top-2 -right-2 opacity-[0.04] pointer-events-none select-none leading-none"
              style={{ fontFamily: "'Raleway', sans-serif", color: step.color }}>{step.n}</div>
            <div className="w-14 h-14 flex items-center justify-center mb-5 relative"
              style={{ background: `${step.color}12`, border: `1px solid ${step.color}28`, borderRadius: 12 }}>
              <step.icon className="w-7 h-7" style={{ color: step.color }} />
              <span className="absolute -top-1.5 -right-1.5 font-black text-black text-[9px] px-1.5 py-0.5"
                style={{ background: "#fff", borderRadius: 4, fontFamily: "'Raleway', sans-serif" }}>{step.n}</span>
            </div>
            <h3 className="font-black text-white uppercase text-lg mb-2 tracking-tight" style={{ fontFamily: "'Raleway', sans-serif" }}>
              {step.title}
            </h3>
            <p className="font-mono-ui text-[10px] text-[#444] leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
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
          <motion.h2 initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-black uppercase text-white leading-[0.88]"
            style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", letterSpacing: "-0.02em", fontFamily: "'Raleway', sans-serif" }}>
            BUILD YOUR<br /><span className="text-outline-strong">SECOND BRAIN.</span>
          </motion.h2>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}
          className="font-mono-ui text-[11px] text-[#444] mb-8 leading-relaxed max-w-md">
          Join thousands of students and creators who use VidVault AI to turn YouTube into structured, searchable knowledge.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <MonolithBtn onClick={onRegister} size="lg">
            CREATE FREE ACCOUNT <ArrowUpRight className="w-4 h-4" />
          </MonolithBtn>
          <span className="font-mono-ui text-[9px] text-[#1e1e1e] uppercase tracking-widest">NO CREDIT CARD REQUIRED</span>
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { const id = e.target.getAttribute("data-section") as NavSection; if (id) setActiveNav(id); } }),
      { threshold: 0.3 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
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
    hidden: { y: 70, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: 0.1 + i * 0.11, duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  return (
    <div className="flex relative" style={{ background: "#0a0a0b", color: "#e0e0e0", minHeight: "100vh" }}>
      <motion.div className="fixed w-[340px] h-[340px] rounded-full pointer-events-none z-0"
        style={{ x: glowX, y: glowY, background: "radial-gradient(circle,rgba(139,92,246,0.05) 0%,transparent 70%)" }} />

      <AnimatePresence mode="wait">

        {/* ══════════ LANDING ══════════ */}
        {mode === "landing" && (
          <motion.div key="landing" className="flex w-full min-h-screen"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            <LeftSidebar active={activeNav} onNav={scrollToSection} />

            <div className="flex-1 flex flex-col overflow-y-auto" style={{ marginLeft: 36 }}>
              <TopBar onLogin={() => setMode("login-manual")} onRegister={() => setMode("register")} />

              <div className="grid-mesh absolute inset-0 pointer-events-none z-0" style={{ left: 36 }} />

              {/* ─── HERO ─── */}
              <section data-section="SAVE" ref={el => { sectionRefs.current.SAVE = el; }}
                className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] relative z-10">

                {/* Left text */}
                <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-14 lg:py-0 lg:w-[50%] flex-shrink-0">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <span className="badge-mono mb-5 block w-fit">AI_POWERED // SECOND_BRAIN</span>
                  </motion.div>

                  <div className="space-y-[0.03em]">
                    {["SAVE.", "ANALYZE.", "MASTER."].map((word, i) => (
                      <div key={word} className="overflow-hidden">
                        <motion.h1 custom={i} variants={textVars} initial="hidden" animate="visible"
                          className={`font-black leading-[0.88] uppercase ${i === 1 ? "text-outline-strong" : "text-white"}`}
                          style={{ fontSize: "clamp(3rem, 7.5vw, 7.5rem)", letterSpacing: "-0.025em", fontFamily: "'Raleway', sans-serif" }}>
                          {word}
                        </motion.h1>
                      </div>
                    ))}
                  </div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
                    className="mt-5 text-[#555] leading-relaxed max-w-[360px] font-mono-ui"
                    style={{ fontSize: "11px" }}>
                    <TypedText text="Save YouTube videos. Generate AI summaries, flashcards & MCQs. Build your knowledge vault." startDelay={600} />
                  </motion.p>

                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.53 }}
                    className="mt-6 flex items-center gap-6 sm:gap-9">
                    {[
                      { label: "AI_TOOLS", value: 6, suffix: "+" },
                      { label: "EXPORT_FMT", value: 5, suffix: "" },
                      { label: "MAX_VIDEOS", value: 500, suffix: "+" },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col">
                        <span className="font-black text-white leading-none" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)", fontFamily: "'Raleway', sans-serif" }}>
                          <Counter to={s.value} />{s.suffix}
                        </span>
                        <span className="font-mono-ui text-[7px] text-[#222] uppercase tracking-widest mt-1">{s.label}</span>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <MonolithBtn onClick={() => setMode("register")} size="md">
                      START FOR FREE <ArrowUpRight className="w-3.5 h-3.5" />
                    </MonolithBtn>
                    <button onClick={handleReplitLogin}
                      className="h-11 px-6 uppercase tracking-widest text-[#555] hover:text-white transition-all flex items-center justify-center font-semibold"
                      style={{ fontSize: "11px", fontFamily: "'Raleway', sans-serif", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 0 }}
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

                {/* Right — video player */}
                <div className="flex-1 border-l hidden lg:flex items-center overflow-hidden"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <VideoPlayerMock />
                </div>

                {/* Mobile video player */}
                <div className="lg:hidden border-t px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.04)", minHeight: 360 }}>
                  <VideoPlayerMock />
                </div>
              </section>

              {/* Scrollable sections */}
              <div ref={el => { sectionRefs.current.FEATURES = el; }} data-section="FEATURES">
                <FeaturesSection />
              </div>
              <div ref={el => { sectionRefs.current.AI_TOOLS = el; }} data-section="AI_TOOLS">
                <AIToolsSection />
              </div>
              <div ref={el => { sectionRefs.current.HOW_IT_WORKS = el; }} data-section="HOW_IT_WORKS">
                <HowItWorksSection />
              </div>
              <div ref={el => { sectionRefs.current.GET_STARTED = el; }} data-section="GET_STARTED">
                <GetStartedSection onRegister={() => setMode("register")} />
              </div>

              <footer className="px-8 sm:px-14 py-6 border-t flex items-center justify-between"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <span className="font-mono-ui text-[8px] text-[#1a1a1a] uppercase tracking-widest">© 2026 VIDVAULT AI</span>
                <span className="font-mono-ui text-[8px] text-[#1a1a1a] uppercase tracking-widest">VV_CORE_v2.0</span>
              </footer>
            </div>
          </motion.div>
        )}

        {/* ══════════ AUTH ══════════ */}
        {(mode === "register" || mode === "login-manual") && (
          <motion.div key="auth" className="flex w-full min-h-screen"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            <div className="flex flex-col flex-1 lg:max-w-[50%]">
              <header className="flex items-center justify-between px-8 sm:px-10 h-14 sm:h-16 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white flex items-center justify-center font-black text-black text-[11px] flex-shrink-0"
                    style={{ fontFamily: "'Raleway', sans-serif", borderRadius: 4 }}>VV</div>
                  <span className="font-black text-white uppercase tracking-[0.1em] text-sm hidden sm:block"
                    style={{ fontFamily: "'Raleway', sans-serif" }}>VIDVAULT<span className="text-[#8b5cf6]"> AI</span></span>
                </div>
                <button onClick={() => { setMode("landing"); setError(""); }}
                  className="font-mono-ui text-[9px] uppercase tracking-widest hover:text-white transition-colors text-[#333]">
                  ← BACK
                </button>
              </header>

              <div className="flex-1 flex items-center justify-center px-8 py-10">
                <div className="w-full max-w-sm">
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-8">
                    <span className="badge-mono mb-3 block w-fit">{mode === "register" ? "CREATE_ACCOUNT" : "SIGN_IN"}</span>
                    <h2 className="font-black text-white uppercase tracking-tight"
                      style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontFamily: "'Raleway', sans-serif" }}>
                      {mode === "register" ? "Join VidVault" : "Welcome Back"}
                    </h2>
                    <p className="font-mono-ui text-[9px] text-[#2a2a2a] mt-1.5 uppercase tracking-wider">
                      {mode === "register" ? "BUILD YOUR KNOWLEDGE VAULT" : "ACCESS YOUR VAULT"}
                    </p>
                  </motion.div>

                  <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    onSubmit={mode === "register" ? handleRegister : handleManualLogin} className="space-y-4">
                    {mode === "register" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#2a2a2a]">FIRST NAME</label>
                          <MonoInput placeholder="John" value={firstName} onChange={setFirstName} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#2a2a2a]">LAST NAME</label>
                          <MonoInput placeholder="Doe" value={lastName} onChange={setLastName} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#2a2a2a]">EMAIL_ADDRESS</label>
                      <MonoInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#2a2a2a]">PASSWORD</label>
                      <MonoInput type="password" placeholder="••••••••" value={password} onChange={setPassword} icon={Lock} />
                    </div>
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="p-3 text-red-400 text-xs font-mono-ui"
                          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.14)", borderRadius: 8 }}>
                          ERR: {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <MonolithBtn type="submit" disabled={loading} size="md" fullWidth>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "register" ? "CREATE ACCOUNT" : "SIGN IN")}
                    </MonolithBtn>
                  </motion.form>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="font-mono-ui text-[8px] text-[#1e1e1e] uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    <button onClick={handleReplitLogin}
                      className="w-full h-11 font-mono-ui text-[9px] uppercase tracking-widest text-[#333] hover:text-white transition-all flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)"}
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
