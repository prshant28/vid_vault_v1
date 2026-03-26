import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, ArrowUpRight } from "lucide-react";

const Spline = lazy(() => import("@splinetool/react-spline"));

type AuthMode = "landing" | "register" | "login-manual";

/* ─── Floating Orb (ambient glow) ─── */
function FloatingOrb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: `blur(${size * 0.6}px)`, opacity: 0 }}
      animate={{ opacity: [0, 0.06, 0.03, 0.08, 0], scale: [1, 1.15, 0.95, 1.1, 1], x: [0, 20, -10, 15, 0], y: [0, -15, 10, -20, 0] }}
      transition={{ duration: 12, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─── Scan Line ─── */
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-10"
      style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)", top: "0%" }}
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ─── Animated counter ─── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [to]);
  return <>{count}{suffix}</>;
}

/* ─── Typed text ─── */
function TypedText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, [text]);
  return (
    <span className="font-mono-ui">
      {displayed}
      <span className="animate-pulse text-[#8b5cf6]">_</span>
    </span>
  );
}

/* ─── Auth Input ─── */
function MonoInput({ type = "text", placeholder, value, onChange, icon: Icon }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; icon?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      {Icon && <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${focused ? "text-[#8b5cf6]" : "text-[#333]"}`} />}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [splineLoaded, setSplineLoaded] = useState(false);

  // Cursor-following glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const glowY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX - 150);
      mouseY.set(e.clientY - 150);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const handleReplitLogin = () => { window.location.href = "/api/login"; };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, firstName, lastName }) });
      if (res.ok) { window.location.href = "/"; }
      else { const d = await res.json(); setError(d.error || "Registration failed"); }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/login-manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (res.ok) { window.location.href = "/"; }
      else { const d = await res.json(); setError(d.error || "Login failed"); }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const textVariants = {
    hidden: { y: 80, opacity: 0 },
    visible: (i: number) => ({ y: 0, opacity: 1, transition: { delay: 0.2 + i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] } }),
  };

  const features = [
    { label: "SAVE_VIDEOS", value: "∞", suffix: " URLS" },
    { label: "AI_GENERATIONS", value: 6, suffix: "+" },
    { label: "EXPORT_FORMATS", value: 5, suffix: "" },
  ];

  return (
    <div
      className="min-h-screen text-[#e0e0e0] flex flex-col relative overflow-hidden"
      style={{ background: "#0a0a0b" }}
    >
      {/* Cursor glow */}
      <motion.div
        className="fixed w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          x: glowX, y: glowY,
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Ambient orbs */}
      <FloatingOrb x="5%" y="20%" size={400} color="#8b5cf6" delay={0} />
      <FloatingOrb x="70%" y="60%" size={300} color="#06b6d4" delay={3} />
      <FloatingOrb x="40%" y="80%" size={250} color="#8b5cf6" delay={6} />

      {/* Grid */}
      <div className="grid-mesh absolute inset-0 pointer-events-none z-0" />

      {/* Scan line */}
      <ScanLine />

      <AnimatePresence mode="wait">

        {/* ═══════════════ LANDING ═══════════════ */}
        {mode === "landing" && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="flex flex-col min-h-screen relative z-10">

            {/* Nav */}
            <header className="flex items-center justify-between px-4 sm:px-8 lg:px-12 h-14 sm:h-16 border-b border-white/[0.04] relative z-20">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white flex items-center justify-center font-black text-black text-xs font-mono-ui flex-shrink-0">VV</div>
                <span className="font-black text-white uppercase tracking-[0.12em] sm:tracking-[0.15em] text-xs sm:text-sm font-mono-ui">VIDVAULT AI</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="flex items-center gap-3 sm:gap-5">
                <button onClick={() => setMode("login-manual")} className="text-[#555] font-mono-ui text-[10px] sm:text-xs uppercase tracking-widest hover:text-white transition-colors hidden sm:block">LOG IN</button>
                <MonolithBtn onClick={() => setMode("register")} size="sm">GET STARTED</MonolithBtn>
              </motion.div>
            </header>

            {/* Hero */}
            <main className="flex-1 flex flex-col lg:flex-row relative">

              {/* Left vertical nav */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="hidden xl:flex w-12 border-r border-white/[0.04] flex-col items-center justify-center gap-8 relative">
                {["SAVE", "SORT", "AI", "LEARN"].map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                    className="text-[#2a2a2a] font-mono-ui text-[8px] uppercase tracking-[0.35em] cursor-default hover:text-[#8b5cf6] transition-colors"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  >
                    {item}
                  </motion.span>
                ))}
                <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1, duration: 0.6 }}
                  className="absolute bottom-10 w-px h-16 bg-gradient-to-b from-transparent to-[#8b5cf6]" />
              </motion.div>

              {/* Text content */}
              <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-14 py-10 lg:py-0 relative z-10 lg:max-w-[55%]">

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-5 sm:mb-7">
                  <span className="badge-mono">AI_POWERED // SECOND_BRAIN</span>
                </motion.div>

                {/* Big headline with overflow clip for reveal */}
                <div className="space-y-1 overflow-hidden">
                  {["SAVE.", "ANALYZE.", "MASTER."].map((word, i) => (
                    <div key={word} className="overflow-hidden">
                      <motion.h1
                        custom={i}
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        className={`text-[clamp(3rem,9vw,7.5rem)] font-black leading-[0.92] uppercase tracking-[-0.025em] ${i === 1 ? "text-outline-strong" : "text-white"}`}
                      >
                        {word}
                      </motion.h1>
                    </div>
                  ))}
                </div>

                {/* Typed sub-headline */}
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} className="mt-6 sm:mt-8 text-[#555] text-xs sm:text-sm leading-relaxed max-w-sm lg:max-w-md">
                  <TypedText text="Your AI-powered second brain for YouTube. Save videos, generate summaries, flashcards, MCQs and more." />
                </motion.p>

                {/* Stats row */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-8 flex items-center gap-6 sm:gap-8">
                  {features.map((f) => (
                    <div key={f.label} className="flex flex-col">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono-ui leading-none">
                        {typeof f.value === "number" ? <Counter to={f.value} suffix={f.suffix} /> : f.value}
                      </span>
                      <span className="font-mono-ui text-[8px] sm:text-[9px] text-[#333] uppercase tracking-widest mt-1">{f.label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTA row */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25 }} className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <MonolithBtn onClick={() => setMode("register")} size="lg">
                    START FOR FREE <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline" />
                  </MonolithBtn>
                  <button
                    onClick={handleReplitLogin}
                    className="h-11 sm:h-12 px-6 sm:px-8 font-mono-ui text-xs uppercase tracking-widest text-[#666] hover:text-white hover:border-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    SIGN IN WITH REPLIT
                  </button>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-5 font-mono-ui text-[10px] text-[#333] uppercase tracking-widest">
                  HAVE AN ACCOUNT?{" "}
                  <button onClick={() => setMode("login-manual")} className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
                    SIGN IN →
                  </button>
                </motion.p>
              </div>

              {/* Spline 3D / Right panel */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="hidden lg:flex flex-1 relative overflow-hidden border-l border-white/[0.04]"
                style={{ minHeight: "500px" }}
              >
                {/* Loading shimmer while Spline loads */}
                {!splineLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                    <div className="w-12 h-12 border border-white/[0.05] flex items-center justify-center">
                      <span className="font-mono-ui font-black text-[#8b5cf6] text-sm">3D</span>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="w-1 h-1 bg-[#8b5cf6]"
                          animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                          transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }} />
                      ))}
                    </div>
                    <p className="font-mono-ui text-[9px] text-[#333] uppercase tracking-widest">LOADING_3D_SCENE</p>
                  </div>
                )}
                <Suspense fallback={null}>
                  <Spline
                    scene="https://prod.spline.design/0BUcjX-vgW7RqxgS/scene.splinecode"
                    onLoad={() => setSplineLoaded(true)}
                    style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                  />
                </Suspense>

                {/* Corner overlays to blend Spline with dark bg */}
                <div className="absolute inset-0 pointer-events-none z-20" style={{ background: "linear-gradient(to right, #0a0a0b 0%, transparent 8%)" }} />
                <div className="absolute inset-0 pointer-events-none z-20" style={{ background: "linear-gradient(to top, #0a0a0b 0%, transparent 12%)" }} />

                {/* Platform badge */}
                <div className="absolute bottom-5 right-5 z-30 text-right">
                  <div className="font-mono-ui text-[8px] text-[#2a2a2a] uppercase tracking-widest">PLATFORM_VERSION</div>
                  <div className="font-mono-ui text-[10px] text-[#333]">VV_CORE_v2.0.1</div>
                </div>
              </motion.div>

              {/* Mobile Spline (reduced height) */}
              <div className="lg:hidden w-full h-[220px] sm:h-[280px] relative overflow-hidden border-t border-white/[0.04]">
                <Suspense fallback={null}>
                  <Spline
                    scene="https://prod.spline.design/0BUcjX-vgW7RqxgS/scene.splinecode"
                    style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                  />
                </Suspense>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0a0a0b 0%, transparent 20%, transparent 80%, #0a0a0b 100%)" }} />
              </div>
            </main>
          </motion.div>
        )}

        {/* ═══════════════ AUTH FORMS ═══════════════ */}
        {(mode === "register" || mode === "login-manual") && (
          <motion.div key="auth" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="flex flex-col min-h-screen relative z-10">

            <header className="flex items-center justify-between px-4 sm:px-8 h-14 sm:h-16 border-b border-white/[0.04] relative z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white flex items-center justify-center font-black text-black text-xs font-mono-ui">VV</div>
                <span className="font-black text-white uppercase tracking-[0.12em] text-xs font-mono-ui">VIDVAULT AI</span>
              </div>
              <button onClick={() => { setMode("landing"); setError(""); }} className="text-[#444] font-mono-ui text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                ← BACK
              </button>
            </header>

            <main className="flex-1 flex lg:flex-row">

              {/* Form side */}
              <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 lg:py-0 lg:max-w-lg xl:max-w-xl mx-auto w-full">
                <div className="w-full max-w-md">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                    <span className="badge-mono mb-3 block w-fit">{mode === "register" ? "CREATE_ACCOUNT" : "SIGN_IN"}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">{mode === "register" ? "Join VidVault" : "Welcome Back"}</h2>
                    <p className="text-[#444] text-xs font-mono-ui mt-2 uppercase tracking-wider">{mode === "register" ? "BUILD YOUR KNOWLEDGE VAULT" : "ACCESS YOUR VAULT"}</p>
                  </motion.div>

                  <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} onSubmit={mode === "register" ? handleRegister : handleManualLogin} className="space-y-4">
                    {mode === "register" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#444]">FIRST NAME</label>
                          <MonoInput placeholder="John" value={firstName} onChange={setFirstName} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#444]">LAST NAME</label>
                          <MonoInput placeholder="Doe" value={lastName} onChange={setLastName} />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#444]">EMAIL_ADDRESS</label>
                      <MonoInput type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-mono-ui text-[9px] uppercase tracking-widest text-[#444]">PASSWORD</label>
                      <MonoInput type="password" placeholder="••••••••" value={password} onChange={setPassword} icon={Lock} />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="p-3 text-red-400 text-xs font-mono-ui"
                          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          ERR: {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <MonolithBtn type="submit" disabled={loading} size="full" className="mt-1">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (mode === "register" ? "CREATE ACCOUNT" : "SIGN IN")}
                    </MonolithBtn>
                  </motion.form>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="font-mono-ui text-[9px] text-[#2a2a2a] uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                    <button onClick={handleReplitLogin}
                      className="w-full h-11 font-mono-ui text-[10px] uppercase tracking-widest text-[#555] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}
                    >
                      CONTINUE WITH REPLIT
                    </button>
                    <p className="mt-5 font-mono-ui text-[10px] text-[#333] uppercase tracking-widest text-center">
                      {mode === "register" ? "HAVE AN ACCOUNT? " : "NO ACCOUNT? "}
                      <button onClick={() => { setMode(mode === "register" ? "login-manual" : "register"); setError(""); }} className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors">
                        {mode === "register" ? "SIGN IN →" : "REGISTER →"}
                      </button>
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Spline right panel (desktop only) */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="hidden lg:block flex-1 relative overflow-hidden border-l border-white/[0.04]">
                <Suspense fallback={null}>
                  <Spline
                    scene="https://prod.spline.design/0BUcjX-vgW7RqxgS/scene.splinecode"
                    style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                  />
                </Suspense>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, #0a0a0b 0%, transparent 10%)" }} />
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, #0a0a0b 0%, transparent 15%)" }} />
              </motion.div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Monolith Button ─── */
function MonolithBtn({
  children, onClick, size = "md", type = "button", disabled = false, className = "",
}: {
  children: React.ReactNode; onClick?: () => void; size?: "sm" | "md" | "lg" | "full";
  type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const sizes = {
    sm: { padding: "8px 18px", fontSize: "10px", minHeight: "36px" },
    md: { padding: "11px 24px", fontSize: "11px", minHeight: "44px" },
    lg: { padding: "13px 28px", fontSize: "12px", minHeight: "48px" },
    full: { padding: "13px 24px", fontSize: "11px", minHeight: "44px", width: "100%" },
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`font-mono-ui uppercase tracking-[0.08em] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors duration-200 ${className}`}
      style={{
        ...sizes[size],
        background: hovered ? "#8b5cf6" : "#ffffff",
        color: hovered ? "#ffffff" : "#000000",
        clipPath: "polygon(6% 0px, 100% 0px, 100% 75%, 94% 100%, 0px 100%, 0px 25%)",
        border: "none",
      }}
    >
      {children}
    </motion.button>
  );
}
