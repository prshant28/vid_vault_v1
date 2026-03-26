import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useInView } from "framer-motion";
import {
  Mail, Lock, Loader2, ArrowUpRight, Youtube, Folder, Tag, Zap,
  BookOpen, BarChart3, Download, Play, Pause, Volume2, Maximize,
  CheckCircle2, Sparkles, Brain, FileText, CheckSquare, ChevronRight,
  Plus, X, ExternalLink
} from "lucide-react";

type AuthMode = "landing" | "register" | "login-manual";
type NavSection = "SAVE" | "FEATURES" | "AI_TOOLS" | "HOW_IT_WORKS" | "GET_STARTED";

const SIDEBAR_W = 48;

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function Counter({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = Math.max(1, Math.ceil(to / 55));
    const t = setInterval(() => { v = Math.min(v + step, to); setN(v); if (v >= to) clearInterval(t); }, 22);
    return () => clearInterval(t);
  }, [to]);
  return <>{n}</>;
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

function MonoInput({ type = "text", placeholder, value, onChange, icon: Icon, autoFocus }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void;
  icon?: any; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused ? "text-[#8b5cf6]" : "text-[#333]"}`} />}
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoFocus={autoFocus}
        className="w-full h-11 text-sm text-white placeholder:text-[#252525] focus:outline-none transition-all"
        style={{ fontFamily: "'Raleway', sans-serif", background: "#0c0c0e", border: `1px solid ${focused ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: Icon ? "0 12px 0 38px" : "0 12px", boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.07)" : "none" }} />
    </div>
  );
}

/* Ripple burst button */
function RippleBtn({ children, onClick, size = "md", type = "button", disabled = false, fullWidth = false, variant = "primary" }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg"; type?: "button" | "submit"; disabled?: boolean;
  fullWidth?: boolean; variant?: "primary" | "ghost";
}) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [hov, setHov] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const nextId = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = nextId.current++;
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    }
    onClick?.(e);
  };

  const pad = { sm: "8px 18px", md: "12px 26px", lg: "14px 36px" }[size];
  const fs = { sm: "11px", md: "12px", lg: "13px" }[size];
  const minH = { sm: 36, md: 44, lg: 52 }[size];

  const bg = variant === "ghost"
    ? hov ? "rgba(255,255,255,0.06)" : "transparent"
    : hov ? "#8b5cf6" : "#fff";
  const fg = variant === "ghost" ? (hov ? "#fff" : "#555") : (hov ? "#fff" : "#000");

  return (
    <motion.button ref={ref} type={type} onClick={handleClick} disabled={disabled}
      whileTap={{ scale: 0.96 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 uppercase tracking-[0.07em]"
      style={{ padding: pad, fontSize: fs, width: fullWidth ? "100%" : undefined, minHeight: minH,
        fontFamily: "'Raleway', sans-serif", background: bg, color: fg,
        clipPath: variant === "ghost" ? "none" : "polygon(6% 0px,100% 0px,100% 76%,94% 100%,0px 100%,0px 24%)",
        border: variant === "ghost" ? "1px solid rgba(255,255,255,0.08)" : "none",
        borderRadius: variant === "ghost" ? 8 : 0,
        transition: "background 0.2s,color 0.2s,box-shadow 0.2s",
        boxShadow: hov && variant !== "ghost" ? "0 8px 30px rgba(139,92,246,0.4)" : "none" }}>
      {ripples.map(r => (
        <span key={r.id} className="ripple-element" style={{ top: r.y, left: r.x }} />
      ))}
      {children}
    </motion.button>
  );
}

/* ══════════════════════════════════════════════
   URL HELPERS (client-side)
══════════════════════════════════════════════ */
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function isValidUrl(url: string): boolean {
  try { const u = new URL(url); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
}

/* ══════════════════════════════════════════════
   LIVE VIDEO CAPTURE — hero right panel
══════════════════════════════════════════════ */
const DEMO_VIDEOS = [
  { title: "The Complete React 19 Guide", channel: "Fireship", id: "dQw4w9WgXcQ", duration: "18:42", views: "1.2M" },
  { title: "System Design: Scale to Millions", channel: "ByteByteGo", id: "xpDnVSmNFX0", duration: "32:15", views: "847K" },
  { title: "OpenAI GPT-5 Full Tutorial", channel: "AI Explained", id: "SXpJ9bc4DBs", duration: "44:08", views: "2.1M" },
];
const AI_TASKS = [
  { label: "AI Summary", icon: FileText, color: "#8b5cf6", result: "847-word structured summary" },
  { label: "Flashcard Deck", icon: Brain, color: "#06b6d4", result: "14 spaced-repetition cards" },
  { label: "MCQ Set", icon: CheckSquare, color: "#22c55e", result: "12 auto-graded questions" },
  { label: "Blog Article", icon: FileText, color: "#f59e0b", result: "1,200-word SEO article" },
  { label: "PPT Outline", icon: BarChart3, color: "#ec4899", result: "8-slide deck structure" },
  { label: "Key Insights", icon: Sparkles, color: "#a78bfa", result: "Top 9 actionable takeaways" },
];

type CapturePhase = "idle" | "previewing" | "adding" | "added" | "demo";

function LiveVideoCapture({ onSignUpNeeded }: { onSignUpNeeded: () => void }) {
  const [inputUrl, setInputUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [phase, setPhase] = useState<CapturePhase>("demo");
  const [addStatus, setAddStatus] = useState<"idle" | "loading" | "needsAuth" | "error">("idle");
  const [addError, setAddError] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(32);
  const [demoIdx, setDemoIdx] = useState(0);
  const [tasksDone, setTasksDone] = useState(3);

  const demoVideo = DEMO_VIDEOS[demoIdx];

  /* Cycle demo videos — keeps the card never blank */
  useEffect(() => {
    if (phase !== "demo") return;
    const t = setTimeout(() => {
      setDemoIdx(p => (p + 1) % DEMO_VIDEOS.length);
      setProgress(32);
      setTasksDone(3);
    }, 13000);
    return () => clearTimeout(t);
  }, [phase, demoIdx]);

  /* Demo progress & task animation */
  useEffect(() => {
    if (phase !== "demo") return;
    const pTimer = setInterval(() => setProgress(p => Math.min(p + 0.18, 96)), 90);
    let td = tasksDone;
    const tTimer = setInterval(() => {
      if (td < AI_TASKS.length) { td++; setTasksDone(td); }
      else clearInterval(tTimer);
    }, 1200);
    return () => { clearInterval(pTimer); clearInterval(tTimer); };
  }, [phase, demoIdx]);

  /* URL detection — supports YouTube AND any http(s) URL */
  useEffect(() => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setVideoId(null);
      setPhase("demo");
      setAddStatus("idle");
      return;
    }
    const ytId = extractYouTubeId(trimmed);
    if (ytId) {
      setVideoId(ytId);
      setPhase("previewing");
      setAddStatus("idle");
    } else if (isValidUrl(trimmed)) {
      setVideoId(null);
      setPhase("previewing");
      setAddStatus("idle");
    } else {
      setVideoId(null);
      setPhase("idle");
    }
  }, [inputUrl]);

  const handleAdd = async () => {
    if (!inputUrl.trim()) return;
    setAddStatus("loading");
    try {
      const authRes = await fetch("/api/auth/user");
      const authData = await authRes.json() as { user?: { id: string } };
      if (!authData.user) {
        setAddStatus("needsAuth");
        return;
      }
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl.trim() }),
      });
      if (res.ok) {
        setPhase("added");
        setAddStatus("idle");
        setTimeout(() => {
          setInputUrl(""); setVideoId(null); setAddStatus("idle"); setPhase("demo");
          setProgress(32); setTasksDone(3);
        }, 4500);
      } else {
        const d = await res.json() as { error?: string };
        setAddError(d.error || "Failed to add video");
        setAddStatus("error");
      }
    } catch {
      setAddError("Network error");
      setAddStatus("error");
    }
  };

  /* 3D tilt */
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sX = useSpring(rotX, { stiffness: 90, damping: 22 });
  const sY = useSpring(rotY, { stiffness: 90, damping: 22 });
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect(); if (!r) return;
    rotX.set(-((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 5);
    rotY.set(((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 5);
  }, []);
  const onMouseLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, []);

  const showVideo = phase === "demo" || phase === "previewing" || phase === "added";
  const activeId = phase === "demo" ? demoVideo.id : videoId;
  const activeTitle = phase === "demo" ? demoVideo.title : (videoId ? "Your YouTube Video" : "Web Video");
  const activeChannel = phase === "demo" ? demoVideo.channel : (videoId ? "YouTube" : new URL(inputUrl.trim().startsWith("http") ? inputUrl.trim() : "https://x").hostname || "Web");
  const activeProgress = phase === "demo" ? progress : 0;
  const isYouTubePreview = phase === "previewing" && videoId;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 lg:p-6" style={{ perspective: "1100px" }}>
      <motion.div ref={cardRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        style={{ rotateX: sX, rotateY: sY, transformStyle: "preserve-3d" }}
        className="w-full max-w-[520px]"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}>

        <div className="overflow-hidden relative"
          style={{ background: "rgba(10,10,14,0.97)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 18, boxShadow: "0 28px 70px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)" }}>

          {/* Scan line — always visible */}
          <motion.div className="absolute left-0 right-0 h-px pointer-events-none z-20"
            style={{ background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.45),transparent)" }}
            animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />

          {/* Grid bg */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />

          {/* ─── URL BAR ─── */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] relative z-10">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            </div>

            <div className="flex-1 flex items-center gap-2 px-3 h-8 min-w-0"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7 }}>
              <Youtube className="w-3 h-3 text-red-500 flex-shrink-0" />
              <input
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && phase === "previewing" && handleAdd()}
                placeholder="Paste any video URL from the web..."
                className="flex-1 bg-transparent text-[11px] text-white placeholder:text-[#2e2e2e] focus:outline-none min-w-0 font-mono-ui"
              />
              {inputUrl && (
                <button onClick={() => { setInputUrl(""); setVideoId(null); setPhase("demo"); setAddStatus("idle"); setProgress(32); setTasksDone(3); }}
                  className="text-[#444] hover:text-white transition-colors flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <motion.div className="w-1.5 h-1.5 rounded-full"
                style={{ background: phase === "added" ? "#22c55e" : phase === "previewing" ? "#f59e0b" : "#22c55e" }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <span className="font-mono-ui text-[8px] uppercase tracking-widest hidden sm:block"
                style={{ color: phase === "added" ? "#22c55e" : phase === "previewing" ? "#f59e0b" : "#22c55e" }}>
                {phase === "idle" ? "INVALID" : phase === "previewing" ? "READY" : phase === "added" ? "SAVED" : "LIVE"}
              </span>
            </div>
          </div>

          {/* ─── MAIN CONTENT ─── */}
          <div className="relative z-10">

            {/* Invalid URL notice */}
            {phase === "idle" && inputUrl && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <X className="w-4 h-4 text-red-500" />
                </div>
                <span className="font-mono-ui text-[10px] text-[#333] uppercase tracking-wider">NOT A VALID URL</span>
                <span className="font-mono-ui text-[9px] text-[#222]">Try: youtube.com/... or any https:// link</span>
              </motion.div>
            )}

            {/* Video area — always shows something in demo mode */}
            {showVideo && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>

                {/* Video frame */}
                <div className="relative mx-3 mt-3 overflow-hidden"
                  style={{ borderRadius: 10, aspectRatio: "16/9", background: "#080810" }}>

                  {/* Always-present gradient background (prevents blank) */}
                  <div key={`bg-${demoIdx}`} className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${["#1a0a2e","#0a1a2e","#2e1a0a"][demoIdx % 3]} 0%, #080810 70%)` }} />

                  {/* YouTube thumbnail — crossfade on top of gradient */}
                  {activeId && (
                    <motion.img
                      key={`thumb-${activeId}`}
                      src={`https://img.youtube.com/vi/${activeId}/hqdefault.jpg`}
                      alt="thumbnail"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: "brightness(0.62)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}

                  {/* Non-YouTube preview placeholder */}
                  {phase === "previewing" && !videoId && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
                        <Play className="w-6 h-6 text-[#8b5cf6] ml-0.5" />
                      </div>
                      <span className="font-mono-ui text-[9px] text-[#555] uppercase tracking-widest">Video URL Ready</span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }} />

                  {/* Play/pause button */}
                  <button onClick={() => setIsPlaying(p => !p)}
                    className="absolute inset-0 flex items-center justify-center">
                    <motion.div className="w-14 h-14 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.7)", borderRadius: 14, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
                      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
                      {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white fill-white ml-0.5" />}
                    </motion.div>
                  </button>

                  {/* AI badge */}
                  <motion.div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1"
                    style={{ background: "rgba(139,92,246,0.88)", borderRadius: 6, backdropFilter: "blur(6px)" }}>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-white"
                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    <span className="font-mono-ui text-[9px] text-white uppercase tracking-widest">AI ANALYZING</span>
                  </motion.div>

                  {/* Controls bar */}
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.95))" }}>
                    <div className="w-full h-1 rounded-full overflow-hidden mb-2"
                      style={{ background: "rgba(255,255,255,0.12)" }}>
                      <motion.div className="h-full rounded-full"
                        animate={{ width: `${activeProgress}%` }} transition={{ duration: 0.5 }}
                        style={{ background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }} />
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsPlaying(p => !p)} className="text-white hover:text-white/80 transition-colors">
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      </button>
                      <span className="font-mono-ui text-[9px] text-white/60 flex-1">
                        {Math.floor(activeProgress / 100 * 18)}:{String(Math.floor((activeProgress / 100 * 42) % 60)).padStart(2, "0")}
                        {" / "}
                        {phase === "demo" ? demoVideo.duration : "--:--"}
                      </span>
                      <Volume2 className="w-3.5 h-3.5 text-white/50" />
                      <Maximize className="w-3.5 h-3.5 text-white/50" />
                    </div>
                  </div>
                </div>

                {/* Video info */}
                <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-white leading-snug truncate" style={{ fontFamily: "'Raleway', sans-serif" }}>
                      {activeTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono-ui text-[9px] text-[#444]">{activeChannel}</span>
                      {phase === "demo" && (
                        <><span className="text-[#222] font-mono-ui text-[8px]">•</span>
                          <span className="font-mono-ui text-[9px] text-[#333]">{demoVideo.views} views</span></>
                      )}
                    </div>
                  </div>
                  {phase === "demo" && (
                    <span className="font-mono-ui text-[7px] text-[#1e1e1e] uppercase tracking-widest mt-0.5 flex-shrink-0">DEMO</span>
                  )}
                </div>

                {/* ─── CAPTURE CTA ─── */}
                <AnimatePresence>
                  {/* Valid URL detected */}
                  {phase === "previewing" && addStatus !== "needsAuth" && (
                    <motion.div key="cta" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-4 py-3 border-b border-white/[0.05]"
                      style={{ background: "rgba(139,92,246,0.05)" }}>
                      <p className="font-mono-ui text-[9px] text-[#8b5cf6] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        {isYouTubePreview ? "YOUTUBE URL DETECTED" : "VIDEO URL DETECTED"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <RippleBtn onClick={handleAdd} size="sm" disabled={addStatus === "loading"}>
                          {addStatus === "loading"
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> ADDING...</>
                            : <><Plus className="w-3 h-3" /> ADD TO VAULT</>}
                        </RippleBtn>
                        {addStatus === "error" && (
                          <span className="font-mono-ui text-[9px] text-red-400">ERR: {addError}</span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Not logged in prompt */}
                  {addStatus === "needsAuth" && (
                    <motion.div key="auth" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-4 py-4 border-b border-white/[0.05]"
                      style={{ background: "rgba(139,92,246,0.06)", borderTop: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                          <Lock className="w-4 h-4 text-[#8b5cf6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[12px] text-white mb-0.5" style={{ fontFamily: "'Raleway', sans-serif" }}>
                            Sign in to save this video
                          </p>
                          <p className="font-mono-ui text-[9px] text-[#444] mb-3">
                            Create a free account or log in to add videos to your vault.
                          </p>
                          <div className="flex items-center gap-2">
                            <RippleBtn onClick={onSignUpNeeded} size="sm">
                              Create Account
                            </RippleBtn>
                            <button onClick={() => { window.location.href = "/api/login"; }}
                              className="text-[10px] font-semibold text-[#555] hover:text-white transition-colors px-3 py-1.5 border border-white/[0.08] rounded-md"
                              style={{ fontFamily: "'Raleway', sans-serif" }}>
                              Log In
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Success */}
                  {phase === "added" && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="px-4 py-4 flex items-center gap-3 border-b"
                      style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.15)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(34,197,94,0.15)" }}>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[12px] text-green-400" style={{ fontFamily: "'Raleway', sans-serif" }}>
                          Video Added to Vault!
                        </p>
                        <p className="font-mono-ui text-[9px] text-[#444] mt-0.5">AI analysis queued. Opening library...</p>
                      </div>
                      <a href="/" className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI outputs grid */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkles className="w-3 h-3 text-[#8b5cf6]" />
                    <span className="font-mono-ui text-[9px] text-[#8b5cf6] uppercase tracking-widest">AI_GENERATION_SUITE</span>
                    {tasksDone >= AI_TASKS.length && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="ml-auto font-mono-ui text-[8px] text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />ALL DONE
                      </motion.span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AI_TASKS.map((task, i) => {
                      const done = i < tasksDone;
                      const active = i === tasksDone && phase === "demo";
                      return (
                        <motion.div key={task.label}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: done || active ? 1 : 0.22, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 px-2 py-1.5"
                          style={{ background: done ? `${task.color}0d` : "rgba(255,255,255,0.02)", border: `1px solid ${done ? `${task.color}28` : "rgba(255,255,255,0.03)"}`, borderRadius: 8, transition: "all 0.3s" }}>
                          {done ? (
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: task.color }} />
                          ) : active ? (
                            <motion.div className="w-3 h-3 rounded-full flex-shrink-0"
                              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                              transition={{ duration: 0.65, repeat: Infinity }}
                              style={{ background: task.color }} />
                          ) : (
                            <task.icon className="w-3 h-3 flex-shrink-0 text-[#1e1e1e]" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-semibold truncate"
                              style={{ color: done ? "#ccc" : "#2a2a2a", fontFamily: "'Raleway', sans-serif" }}>
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
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LEFT SIDEBAR
══════════════════════════════════════════════ */
const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: "SAVE", label: "SAVE" },
  { id: "FEATURES", label: "FEATURES" },
  { id: "AI_TOOLS", label: "AI TOOLS" },
  { id: "HOW_IT_WORKS", label: "HOW IT WORKS" },
  { id: "GET_STARTED", label: "GET STARTED" },
];

function LeftSidebar({ active, onNav }: { active: NavSection; onNav: (id: NavSection) => void }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex flex-col items-center"
      style={{ width: SIDEBAR_W, background: "#08080b", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Logo */}
      <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        className="w-9 h-9 flex items-center justify-center font-black text-black text-[11px] cursor-default mt-4 flex-shrink-0"
        style={{ fontFamily: "'Alegreya Sans SC', serif", background: "#fff", borderRadius: 6, boxShadow: "0 2px 12px rgba(139,92,246,0.2)" }}>
        VV
      </motion.div>

      {/* Nav items — gap auto-adjusts to available height */}
      <div className="flex-1 flex flex-col items-center justify-evenly py-4 min-h-0">
        {NAV_ITEMS.map((item, i) => (
          <motion.button key={item.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.07 }}
            onClick={() => onNav(item.id)}
            className="relative group cursor-pointer transition-all duration-200 flex-shrink-0"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            <span className="font-mono-ui text-[8px] uppercase tracking-[0.25em] transition-all duration-200"
              style={{ color: active === item.id ? "#8b5cf6" : "#202020" }}>
              {item.label}
            </span>
            {active === item.id && (
              <motion.div layoutId="nav-active-dot"
                className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full -translate-x-1/2"
                style={{ background: "#8b5cf6" }} />
            )}
          </motion.button>
        ))}
      </div>

      {/* Status dot */}
      <motion.div className="mb-5 flex flex-col items-center gap-2 flex-shrink-0">
        <motion.div className="w-2 h-2 rounded-full bg-green-500"
          animate={{ opacity: [1, 0.3, 1], scale: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }} />
      </motion.div>
    </aside>
  );
}

/* ══════════════════════════════════════════════
   TOP BAR
══════════════════════════════════════════════ */
function TopBar({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="flex items-center justify-between px-6 sm:px-10 h-14 sm:h-16 flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-2">
        <span className="font-black text-white uppercase text-base sm:text-lg"
          style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "0.04em" }}>
          VidVault
        </span>
        <span className="font-black text-base sm:text-lg" style={{ fontFamily: "'Alegreya Sans SC', serif", color: "#8b5cf6", letterSpacing: "0.04em" }}>
          AI
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button onClick={onLogin}
          className="text-[11px] uppercase tracking-widest text-[#3a3a3a] hover:text-white transition-colors font-semibold"
          style={{ fontFamily: "'Raleway', sans-serif" }}>LOG IN</button>
        <RippleBtn onClick={onRegister} size="sm">
          GET STARTED <ArrowUpRight className="w-3 h-3" />
        </RippleBtn>
      </div>
    </motion.header>
  );
}

/* ══════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="badge-mono mb-5 block w-fit text-[10px]">{children}</span>;
}

/* ══════════════════════════════════════════════
   FEATURES SECTION
══════════════════════════════════════════════ */
function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const cards = [
    { icon: Youtube, title: "SAVE VIDEOS", desc: "Paste any YouTube URL or playlist. Import up to 500 videos instantly with full metadata.", color: "#ef4444" },
    { icon: Folder, title: "SMART FOLDERS", desc: "Organize with nested folders and color-coded tags. Zero friction, full control.", color: "#f59e0b" },
    { icon: Sparkles, title: "AI GENERATION", desc: "6 AI tools: summaries, flashcards, MCQ, outlines, insights, blog posts.", color: "#8b5cf6" },
    { icon: Download, title: "EXPORT ANYWHERE", desc: "Export to PDF, Markdown, JSON, PPT. Or share a public link instantly.", color: "#06b6d4" },
    { icon: Brain, title: "FLASHCARD DECKS", desc: "Auto-generated spaced-repetition flashcards from any video transcript.", color: "#10b981" },
    { icon: BarChart3, title: "KNOWLEDGE GRAPH", desc: "Visual graph of your saved videos, tags, and AI-generated connections.", color: "#ec4899" },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14">
      <SectionLabel>CORE_FEATURES</SectionLabel>
      <div className="overflow-hidden mb-12">
        <motion.h2 initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-black uppercase text-white leading-[0.88]"
          style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
          The Core<br /><span className="text-outline-strong">Protocols.</span>
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.title}
            initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08 + i * 0.08, duration: 0.5 }}
            className="card-interactive group p-6 cursor-default relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle, ${card.color}1a 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                style={{ background: `${card.color}15`, border: `1px solid ${card.color}30`, borderRadius: 10 }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="font-black text-[12px] uppercase tracking-wide text-white"
                style={{ fontFamily: "'Raleway', sans-serif" }}>{card.title}</span>
            </div>
            <p className="text-[11px] text-[#3a3a3a] leading-relaxed" style={{ fontFamily: "'Raleway', sans-serif" }}>{card.desc}</p>
            <ChevronRight className="w-3 h-3 text-[#1e1e1e] absolute bottom-4 right-4 group-hover:text-[#8b5cf6] transition-colors duration-200" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   AI TOOLS SECTION
══════════════════════════════════════════════ */
function AIToolsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const tools = [
    { id: "01", label: "AI SUMMARY", desc: "Full-length structured summary with key points and timestamps.", color: "#8b5cf6" },
    { id: "02", label: "FLASHCARDS", desc: "Spaced-repetition ready Q&A deck generated from the video.", color: "#06b6d4" },
    { id: "03", label: "MCQ SET", desc: "Auto-graded multiple-choice quiz from any topic in the video.", color: "#22c55e" },
    { id: "04", label: "BLOG ARTICLE", desc: "SEO-optimized article written from the video transcript.", color: "#f59e0b" },
    { id: "05", label: "PPT OUTLINE", desc: "Slide-by-slide presentation structure ready to export.", color: "#ec4899" },
    { id: "06", label: "KEY INSIGHTS", desc: "Bullet-point critical takeaways extracted for quick review.", color: "#a78bfa" },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <SectionLabel>AI_GENERATION_SUITE</SectionLabel>
      <div className="overflow-hidden mb-12">
        <motion.h2 initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-black text-white leading-[0.88]"
          style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
          6 AI Tools.<br /><span className="text-outline-strong">One Vault.</span>
        </motion.h2>
      </div>
      <div className="space-y-px">
        {tools.map((tool, i) => (
          <motion.div key={tool.id}
            initial={{ opacity: 0, x: -24 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.05 + i * 0.07, duration: 0.45 }}
            className="flex items-center gap-5 px-5 py-4 group cursor-default transition-all duration-200 hover:bg-white/[0.02]"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", borderRadius: 4 }}>
            <span className="font-mono-ui text-[10px] font-black w-7 flex-shrink-0" style={{ color: tool.color }}>{tool.id}</span>
            <div className="w-px h-6 flex-shrink-0" style={{ background: `${tool.color}40` }} />
            <span className="font-black text-sm uppercase tracking-wide text-white w-36 sm:w-44 flex-shrink-0 transition-colors group-hover:text-white"
              style={{ fontFamily: "'Raleway', sans-serif" }}>{tool.label}</span>
            <span className="text-[11px] text-[#333] flex-1 hidden sm:block leading-relaxed"
              style={{ fontFamily: "'Raleway', sans-serif" }}>{tool.desc}</span>
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

/* ══════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════ */
function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const steps = [
    { n: "01", title: "Paste URL", desc: "Drop any YouTube link or playlist. Supports single videos and playlists up to 500 items.", icon: Youtube, color: "#8b5cf6" },
    { n: "02", title: "AI Processes", desc: "Our engine extracts the transcript & metadata, then sends to GPT for deep structured analysis.", icon: Zap, color: "#06b6d4" },
    { n: "03", title: "Get Knowledge", desc: "Download 6 AI artifacts — summaries, flashcards, MCQs, articles, outlines, and insights.", icon: BookOpen, color: "#10b981" },
  ];
  return (
    <section ref={ref} className="py-20 sm:py-28 px-8 sm:px-14" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <SectionLabel>WORKFLOW</SectionLabel>
      <div className="overflow-hidden mb-16">
        <motion.h2 initial={{ y: 60, opacity: 0 }} animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-black text-white leading-[0.88]"
          style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
          Three Steps.<br /><span className="text-outline-strong">Infinite Knowledge.</span>
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <motion.div key={step.n}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.12 + i * 0.12, duration: 0.5 }}
            className="card-interactive group p-7 relative overflow-hidden">
            <div className="text-[72px] font-black absolute -top-3 -right-1 opacity-[0.035] pointer-events-none select-none leading-none"
              style={{ fontFamily: "'Alegreya Sans SC', serif", color: step.color }}>{step.n}</div>
            <div className="w-14 h-14 flex items-center justify-center mb-5 relative"
              style={{ background: `${step.color}12`, border: `1px solid ${step.color}25`, borderRadius: 12 }}>
              <step.icon className="w-7 h-7" style={{ color: step.color }} />
              <span className="absolute -top-1.5 -right-1.5 font-black text-black text-[9px] px-1.5 py-0.5"
                style={{ background: "#fff", borderRadius: 4, fontFamily: "'Raleway', sans-serif" }}>{step.n}</span>
            </div>
            <h3 className="font-black text-white text-xl mb-2" style={{ fontFamily: "'Alegreya Sans SC', serif" }}>
              {step.title}
            </h3>
            <p className="text-[11px] text-[#3a3a3a] leading-relaxed" style={{ fontFamily: "'Raleway', sans-serif" }}>{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   GET STARTED SECTION
══════════════════════════════════════════════ */
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
            className="font-black text-white leading-[0.88]"
            style={{ fontSize: "clamp(2.2rem, 5vw, 5rem)", fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
            Build Your<br /><span className="text-outline-strong">Second Brain.</span>
          </motion.h2>
        </div>
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}
          className="text-[13px] text-[#3a3a3a] mb-8 leading-relaxed max-w-md"
          style={{ fontFamily: "'Raleway', sans-serif" }}>
          Join thousands of students and creators who use VidVault AI to turn YouTube into structured, searchable knowledge.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <RippleBtn onClick={onRegister} size="lg">
            Create Free Account <ArrowUpRight className="w-4 h-4" />
          </RippleBtn>
          <span className="font-mono-ui text-[9px] text-[#1e1e1e] uppercase tracking-widest">NO CREDIT CARD REQUIRED</span>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   AUTH VISUAL (for auth right panel)
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
            style={{ width: node.size, height: node.size, fontFamily: "'Alegreya Sans SC', serif", background: node.primary ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "#0f0f12", border: `1px solid ${node.primary ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.12)"}`, borderRadius: node.primary ? 12 : 8, boxShadow: node.primary ? "0 0 28px rgba(139,92,246,0.3)" : "none", color: node.primary ? "#fff" : "#8b5cf6", fontSize: node.primary ? "11px" : "8px" }}>
            {node.label.slice(0, 3)}
          </div>
          <span className="font-mono-ui text-[7px] text-[#222] uppercase tracking-widest">{node.label}</span>
        </motion.div>
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right,#0a0a0b 0%,transparent 10%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom,#0a0a0b 0%,transparent 8%,transparent 88%,#0a0a0b 100%)" }} />
    </div>
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
    if (mode !== "landing") return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { const id = e.target.getAttribute("data-section") as NavSection; if (id) setActiveNav(id); } }),
      { threshold: 0.25 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [mode]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { stiffness: 55, damping: 18 });
  const glowY = useSpring(mouseY, { stiffness: 55, damping: 18 });
  useEffect(() => {
    const h = (e: MouseEvent) => { mouseX.set(e.clientX - 170); mouseY.set(e.clientY - 170); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const handleReplitLogin = () => { window.location.href = "/api/login"; };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, firstName, lastName }) });
      if (res.ok) window.location.href = "/";
      else { const d = await res.json() as { error?: string }; setError(d.error || "Registration failed"); }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/login-manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (res.ok) window.location.href = "/";
      else { const d = await res.json() as { error?: string }; setError(d.error || "Login failed"); }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const textVars = {
    hidden: { y: 80, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: 0.08 + i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] as any } }),
  };

  return (
    <div className="flex relative" style={{ background: "#09090c", color: "#e0e0e0", minHeight: "100vh" }}>
      <motion.div className="fixed w-[360px] h-[360px] rounded-full pointer-events-none z-0"
        style={{ x: glowX, y: glowY, background: "radial-gradient(circle,rgba(139,92,246,0.045) 0%,transparent 70%)" }} />

      <AnimatePresence mode="wait">

        {/* ══════════ LANDING ══════════ */}
        {mode === "landing" && (
          <motion.div key="landing" className="flex w-full min-h-screen"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            <LeftSidebar active={activeNav} onNav={scrollToSection} />

            <div className="flex-1 flex flex-col overflow-y-auto" style={{ marginLeft: SIDEBAR_W }}>

              <div className="grid-mesh absolute inset-0 pointer-events-none z-0" style={{ left: SIDEBAR_W }} />

              <TopBar onLogin={() => setMode("login-manual")} onRegister={() => setMode("register")} />

              {/* ─── HERO ─── */}
              <section data-section="SAVE" ref={el => { sectionRefs.current.SAVE = el; }}
                className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] relative z-10">

                {/* Left text */}
                <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-14 lg:py-0 lg:w-[48%] flex-shrink-0">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <span className="badge-mono mb-5 block w-fit">AI_POWERED // SECOND_BRAIN</span>
                  </motion.div>

                  {/* Hero headings — Alegreya Sans SC */}
                  <div className="space-y-[0.02em]">
                    {["SAVE.", "ANALYZE.", "MASTER."].map((word, i) => (
                      <div key={word} className="overflow-hidden">
                        <motion.h1 custom={i} variants={textVars} initial="hidden" animate="visible"
                          className={`font-black leading-[0.88] uppercase ${i === 1 ? "text-outline-strong" : "text-white"}`}
                          style={{ fontSize: "clamp(2.8rem, 7.5vw, 7.8rem)", letterSpacing: "-0.01em", fontFamily: "'Alegreya Sans SC', serif" }}>
                          {word}
                        </motion.h1>
                      </div>
                    ))}
                  </div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 }}
                    className="mt-5 text-[#3a3a3a] leading-relaxed max-w-[360px] font-mono-ui"
                    style={{ fontSize: "11px" }}>
                    <TypedText text="Save YouTube videos. Generate AI summaries, flashcards & MCQs. Build your knowledge vault." startDelay={700} />
                  </motion.p>

                  {/* Stats */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                    className="mt-7 flex items-center gap-8 sm:gap-10">
                    {[
                      { label: "AI_TOOLS", value: 6, suffix: "+" },
                      { label: "EXPORT_FMT", value: 5, suffix: "" },
                      { label: "MAX_VIDEOS", value: 500, suffix: "+" },
                    ].map(s => (
                      <div key={s.label} className="flex flex-col">
                        <span className="font-black text-white leading-none"
                          style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", fontFamily: "'Alegreya Sans SC', serif" }}>
                          <Counter to={s.value} />{s.suffix}
                        </span>
                        <span className="font-mono-ui text-[7px] text-[#1e1e1e] uppercase tracking-widest mt-1">{s.label}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* CTAs */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <RippleBtn onClick={() => setMode("register")} size="md">
                      Start For Free <ArrowUpRight className="w-3.5 h-3.5" />
                    </RippleBtn>
                    <RippleBtn onClick={handleReplitLogin} size="md" variant="ghost">
                      Sign In With Replit
                    </RippleBtn>
                  </motion.div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                    className="mt-3 font-mono-ui text-[9px] text-[#1e1e1e] uppercase tracking-widest">
                    HAVE AN ACCOUNT?{" "}
                    <button onClick={() => setMode("login-manual")} className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
                      SIGN IN →
                    </button>
                  </motion.p>
                </div>

                {/* Right — live video capture */}
                <div className="flex-1 border-l hidden lg:flex items-center overflow-hidden"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <LiveVideoCapture onSignUpNeeded={() => setMode("register")} />
                </div>

                {/* Mobile video capture */}
                <div className="lg:hidden border-t px-4 py-4" style={{ borderColor: "rgba(255,255,255,0.04)", minHeight: 400 }}>
                  <LiveVideoCapture onSignUpNeeded={() => setMode("register")} />
                </div>
              </section>

              {/* ─── Scrollable sections ─── */}
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
                style={{ borderColor: "rgba(255,255,255,0.04)", marginLeft: 0 }}>
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

            {/* Left form panel */}
            <div className="flex flex-col flex-1 lg:max-w-[50%]">
              <header className="flex items-center justify-between px-8 sm:px-10 h-14 sm:h-16 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center font-black text-black text-[11px]"
                    style={{ fontFamily: "'Alegreya Sans SC', serif", background: "#fff", borderRadius: 5 }}>VV</div>
                  <span className="font-black text-white text-sm hidden sm:block"
                    style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "0.04em" }}>
                    VidVault <span style={{ color: "#8b5cf6" }}>AI</span>
                  </span>
                </div>
                <button onClick={() => { setMode("landing"); setError(""); }}
                  className="font-mono-ui text-[9px] uppercase tracking-widest hover:text-white transition-colors text-[#282828]">
                  ← BACK
                </button>
              </header>

              <div className="flex-1 flex items-center justify-center px-8 py-10">
                <div className="w-full max-w-sm">
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-8">
                    <span className="badge-mono mb-3 block w-fit">{mode === "register" ? "CREATE_ACCOUNT" : "SIGN_IN"}</span>
                    <h2 className="font-black text-white"
                      style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontFamily: "'Alegreya Sans SC', serif" }}>
                      {mode === "register" ? "Join VidVault" : "Welcome Back"}
                    </h2>
                    <p className="font-mono-ui text-[9px] text-[#252525] mt-1.5 uppercase tracking-wider">
                      {mode === "register" ? "BUILD YOUR KNOWLEDGE VAULT" : "ACCESS YOUR VAULT"}
                    </p>
                  </motion.div>

                  <motion.form initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    onSubmit={mode === "register" ? handleRegister : handleManualLogin} className="space-y-4">
                    {mode === "register" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#282828]">FIRST NAME</label>
                          <MonoInput placeholder="John" value={firstName} onChange={setFirstName} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#282828]">LAST NAME</label>
                          <MonoInput placeholder="Doe" value={lastName} onChange={setLastName} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#282828]">EMAIL_ADDRESS</label>
                      <MonoInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#282828]">PASSWORD</label>
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
                    <RippleBtn type="submit" disabled={loading} size="md" fullWidth>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "register" ? "Create Account" : "Sign In")}
                    </RippleBtn>
                  </motion.form>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="font-mono-ui text-[8px] text-[#1e1e1e] uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    <button onClick={handleReplitLogin}
                      className="w-full h-11 font-mono-ui text-[9px] uppercase tracking-widest text-[#2a2a2a] hover:text-white transition-all flex items-center justify-center"
                      style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                    >CONTINUE WITH REPLIT</button>
                    <p className="mt-5 font-mono-ui text-[9px] text-[#1e1e1e] uppercase tracking-widest text-center">
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

            {/* Right visual panel — shows LiveVideoCapture */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
              className="hidden lg:flex flex-1 border-l overflow-hidden relative flex-col"
              style={{ borderColor: "rgba(255,255,255,0.04)", background: "#08080b" }}>
              <div className="flex-1 flex items-center justify-center p-6">
                <LiveVideoCapture onSignUpNeeded={() => setMode("register")} />
              </div>
              <div className="px-8 pb-8 text-center">
                <p className="font-mono-ui text-[9px] text-[#1e1e1e] uppercase tracking-widest">
                  PASTE A YOUTUBE URL TO SEE IT IN ACTION
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
