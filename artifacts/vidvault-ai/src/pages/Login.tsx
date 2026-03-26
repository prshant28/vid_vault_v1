import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type AuthMode = "landing" | "register" | "login-manual";

function GrainOverlay() {
  return <div className="grain-overlay" />;
}

function GridMesh() {
  return <div className="grid-mesh absolute inset-0 pointer-events-none" />;
}

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const sideNavItems = ["SAVE", "ORGANIZE", "ANALYZE", "GENERATE", "LEARN"];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] flex flex-col relative overflow-hidden">
      <GrainOverlay />

      <AnimatePresence mode="wait">
        {mode === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col min-h-screen"
          >
            {/* Grid bg */}
            <GridMesh />

            {/* Top nav */}
            <header className="relative z-20 flex items-center justify-between px-6 lg:px-10 h-16 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white flex items-center justify-center font-black text-black text-sm font-mono-ui">
                  VV
                </div>
                <span className="font-black text-white uppercase tracking-[0.15em] text-sm font-mono-ui">
                  VIDVAULT AI
                </span>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setMode("login-manual")}
                  className="text-[#999] font-mono-ui text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  LOG IN
                </button>
                <button
                  onClick={() => setMode("register")}
                  className="btn-monolith text-xs py-2.5 px-6"
                >
                  GET STARTED
                </button>
              </div>
            </header>

            {/* Main hero */}
            <main className="flex-1 flex relative z-10">
              {/* Side nav (vertical) */}
              <div className="hidden lg:flex w-14 border-r border-white/5 flex-col items-center justify-center gap-10">
                {sideNavItems.map((item, i) => (
                  <div
                    key={item}
                    style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                    className="landing-fade-in"
                  >
                    <span
                      className="text-[#666] font-mono-ui text-[9px] uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
                {/* Live indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>

              {/* Hero content */}
              <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <span className="badge-mono">
                    AI_POWERED // SECOND_BRAIN
                  </span>
                </motion.div>

                {/* Massive headline */}
                <div className="space-y-0 leading-none overflow-hidden">
                  <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-black text-white leading-[0.9] uppercase tracking-[-0.02em]">
                      SAVE.
                    </h1>
                  </motion.div>

                  <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-black text-outline-strong leading-[0.9] uppercase tracking-[-0.02em]">
                      ANALYZE.
                    </h1>
                  </motion.div>

                  <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-black text-white leading-[0.9] uppercase tracking-[-0.02em]">
                      MASTER.
                    </h1>
                  </motion.div>
                </div>

                {/* Sub-copy */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="mt-10 max-w-md"
                >
                  <p className="text-[#888] text-[0.95rem] leading-relaxed">
                    VidVault AI transforms YouTube content into structured knowledge. Save videos, generate AI summaries, flashcards, MCQs, and study notes — all in one vault.
                  </p>
                </motion.div>

                {/* CTA row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-10 flex flex-col sm:flex-row items-start gap-6"
                >
                  <button
                    onClick={() => setMode("register")}
                    className="btn-monolith"
                  >
                    START FOR FREE
                  </button>
                  <button
                    onClick={handleReplitLogin}
                    className="btn-monolith"
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", clipPath: "none", padding: "1rem 2rem" }}
                  >
                    SIGN IN WITH REPLIT
                  </button>

                  <div className="hidden sm:flex flex-col justify-center ml-2">
                    <span className="font-mono-ui text-[9px] text-[#444] uppercase tracking-widest">PLATFORM_VERSION</span>
                    <span className="font-mono-ui text-[11px] text-[#666]">VV_CORE_v2.0.1</span>
                  </div>
                </motion.div>

                {/* Already have account */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="mt-6"
                >
                  <span className="text-[#555] text-sm font-mono-ui text-xs">
                    HAVE AN ACCOUNT?{" "}
                    <button
                      onClick={() => setMode("login-manual")}
                      className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors uppercase tracking-widest"
                    >
                      SIGN IN →
                    </button>
                  </span>
                </motion.div>
              </div>

              {/* Right side panel (feature grid) */}
              <div className="hidden xl:flex w-96 border-l border-white/5 flex-col">
                {[
                  { label: "SAVE VIDEOS", desc: "Any YouTube URL instantly", badge: "01" },
                  { label: "AI SUMMARIES", desc: "GPT-5 powered extraction", badge: "02" },
                  { label: "FLASHCARDS", desc: "Auto-generated study cards", badge: "03" },
                  { label: "PLAYLISTS", desc: "Bulk import entire playlists", badge: "04" },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex-1 border-b border-white/5 p-6 group hover:bg-white/[0.02] transition-colors cursor-default flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono-ui text-[9px] text-[#444] uppercase tracking-widest">{item.badge}</span>
                      <ArrowRight className="w-3 h-3 text-[#333] group-hover:text-[#8b5cf6] transition-colors" />
                    </div>
                    <div>
                      <p className="font-black text-white uppercase text-sm tracking-wider">{item.label}</p>
                      <p className="text-[#555] text-xs mt-1 font-mono-ui">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </main>
          </motion.div>
        )}

        {/* Register / Login forms */}
        {(mode === "register" || mode === "login-manual") && (
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col min-h-screen"
          >
            <GridMesh />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-6 lg:px-10 h-16 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white flex items-center justify-center font-black text-black text-sm font-mono-ui">
                  VV
                </div>
                <span className="font-black text-white uppercase tracking-[0.15em] text-sm font-mono-ui">
                  VIDVAULT AI
                </span>
              </div>
              <button
                onClick={() => { setMode("landing"); setError(""); }}
                className="text-[#666] font-mono-ui text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                ← BACK
              </button>
            </header>

            <main className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
              <div className="w-full max-w-md">
                {/* Form header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <span className="badge-mono mb-4 block w-fit">
                    {mode === "register" ? "CREATE_ACCOUNT" : "SIGN_IN"}
                  </span>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tight">
                    {mode === "register" ? "Join VidVault" : "Welcome Back"}
                  </h2>
                  <p className="text-[#555] text-sm font-mono-ui mt-2">
                    {mode === "register"
                      ? "Create your account to start building your knowledge vault."
                      : "Sign in to access your video knowledge vault."}
                  </p>
                </motion.div>

                {/* Form */}
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onSubmit={mode === "register" ? handleRegister : handleManualLogin}
                  className="space-y-4"
                >
                  {mode === "register" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-mono-ui text-[10px] uppercase tracking-widest text-[#555]">First Name</label>
                        <input
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full h-11 bg-[#0f0f10] border border-white/8 text-white text-sm px-3 focus:outline-none focus:border-[#8b5cf6] transition-colors font-sans"
                          style={{ borderColor: "rgba(255,255,255,0.08)" }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "#8b5cf6"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono-ui text-[10px] uppercase tracking-widest text-[#555]">Last Name</label>
                        <input
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full h-11 bg-[#0f0f10] border border-white/8 text-white text-sm px-3 focus:outline-none focus:border-[#8b5cf6] transition-colors font-sans"
                          style={{ borderColor: "rgba(255,255,255,0.08)" }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "#8b5cf6"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-mono-ui text-[10px] uppercase tracking-widest text-[#555]">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-[#444]" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 bg-[#0f0f10] border text-white text-sm px-3 pl-10 focus:outline-none transition-colors font-sans"
                        style={{ borderColor: "rgba(255,255,255,0.08)" }}
                        onFocus={(e) => e.currentTarget.style.borderColor = "#8b5cf6"}
                        onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono-ui text-[10px] uppercase tracking-widest text-[#555]">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#444]" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 bg-[#0f0f10] border text-white text-sm px-3 pl-10 focus:outline-none transition-colors font-sans"
                        style={{ borderColor: "rgba(255,255,255,0.08)" }}
                        onFocus={(e) => e.currentTarget.style.borderColor = "#8b5cf6"}
                        onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/40 border border-red-800/30 text-red-400 text-sm font-mono-ui">
                      ERROR: {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-monolith w-full flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      mode === "register" ? "CREATE ACCOUNT" : "SIGN IN"
                    )}
                  </button>
                </motion.form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="font-mono-ui text-[10px] text-[#444] uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <button
                  onClick={handleReplitLogin}
                  className="w-full h-11 border border-white/8 text-[#888] font-mono-ui text-xs uppercase tracking-widest hover:border-white/20 hover:text-white transition-colors flex items-center justify-center gap-2"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  CONTINUE WITH REPLIT
                </button>

                <div className="mt-6 text-center">
                  <span className="font-mono-ui text-[11px] text-[#444] uppercase tracking-widest">
                    {mode === "register" ? "ALREADY HAVE AN ACCOUNT? " : "NO ACCOUNT? "}
                    <button
                      onClick={() => { setMode(mode === "register" ? "login-manual" : "register"); setError(""); }}
                      className="text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
                    >
                      {mode === "register" ? "SIGN IN" : "REGISTER"}
                    </button>
                  </span>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
