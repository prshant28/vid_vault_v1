import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Youtube, Brain, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "landing" | "register" | "login-manual";

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
    } catch (err) {
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
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Animated background elements */}
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Landing Page */}
      {mode === "landing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col w-full"
        >
          <header className="h-20 px-6 lg:px-8 flex items-center justify-between relative z-10">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-xl lg:text-2xl tracking-tight text-white">
                VidVault AI
              </span>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleReplitLogin}
                variant="outline"
                className="rounded-full px-6 border-white/10 hover:bg-white/5"
              >
                Sign In
              </Button>
            </motion.div>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 flex items-center justify-center relative z-10 px-4 lg:px-6 py-8 lg:py-0"
          >
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-accent mx-auto lg:mx-0 w-fit"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  The ultimate learning companion
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.1]"
                >
                  Your Second <br className="hidden sm:block" />
                  Brain for <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    Video Knowledge
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-base lg:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0"
                >
                  Transform hours of YouTube content into actionable insights, flashcards, and structured notes in
                  seconds using advanced AI.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-4"
                >
                  <Button
                    onClick={handleReplitLogin}
                    size="lg"
                    className="rounded-full w-full sm:w-auto px-8 h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all group"
                  >
                    Get Started with Replit
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    onClick={() => setMode("register")}
                    size="lg"
                    variant="outline"
                    className="rounded-full w-full sm:w-auto px-8 h-14 text-base font-semibold border-white/10 hover:bg-white/5"
                  >
                    Create Account
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground pt-4"
                >
                  <span>Already have an account?</span>
                  <button
                    onClick={() => setMode("login-manual")}
                    className="text-accent hover:text-accent/90 font-semibold transition-colors"
                  >
                    Sign In Here
                  </button>
                </motion.div>
              </div>

              {/* Right Visual */}
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blur-3xl rounded-full" />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="relative glass-panel rounded-2xl p-6 border border-white/10 aspect-square flex flex-col justify-between overflow-hidden"
                >
                  <div className="flex gap-4">
                    <div className="w-full bg-secondary/50 rounded-lg p-4 space-y-3 border border-white/5">
                      <Youtube className="w-8 h-8 text-red-500" />
                      <div className="h-2 w-3/4 bg-white/10 rounded animate-pulse" />
                      <div className="h-2 w-1/2 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="w-full bg-secondary/50 rounded-lg p-4 space-y-3 border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                      <Brain className="w-8 h-8 text-primary relative z-10" />
                      <div className="h-2 w-full bg-primary/40 rounded relative z-10 animate-pulse" />
                      <div className="h-2 w-4/5 bg-primary/40 rounded relative z-10 animate-pulse" />
                      <div className="h-2 w-5/6 bg-primary/40 rounded relative z-10 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-4 bg-background/50 rounded-xl p-4 border border-white/5">
                    <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent animate-pulse" /> AI Summary generated
                    </p>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-white/20 rounded animate-pulse" />
                      <div className="h-1.5 w-full bg-white/20 rounded animate-pulse" />
                      <div className="h-1.5 w-2/3 bg-white/20 rounded animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.main>
        </motion.div>
      )}

      {/* Register Page */}
      {mode === "register" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex items-center justify-center relative z-10 px-4 py-8"
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="glass-panel rounded-2xl p-6 lg:p-8 border border-white/10 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-white">Create Account</h2>
                <p className="text-muted-foreground">Join VidVault AI today</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">First Name</label>
                    <Input
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-secondary/50 border-white/10 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Last Name</label>
                    <Input
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-secondary/50 border-white/10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary/50 border-white/10 h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary/50 border-white/10 h-11 pl-10"
                    />
                  </div>
                </div>

                {error && <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-lg text-sm text-destructive">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">Or</span>
                </div>
              </div>

              <Button onClick={handleReplitLogin} variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5">
                Sign Up with Replit
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setMode("login-manual")} className="text-accent hover:text-accent/90 font-semibold">
                  Sign In
                </button>
              </p>

              <button
                onClick={() => { setMode("landing"); setError(""); }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Login Page */}
      {mode === "login-manual" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex items-center justify-center relative z-10 px-4 py-8"
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <div className="glass-panel rounded-2xl p-6 lg:p-8 border border-white/10 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-white">Welcome Back</h2>
                <p className="text-muted-foreground">Sign in to your account</p>
              </div>

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary/50 border-white/10 h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary/50 border-white/10 h-11 pl-10"
                    />
                  </div>
                </div>

                {error && <div className="p-3 bg-destructive/20 border border-destructive/30 rounded-lg text-sm text-destructive">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">Or</span>
                </div>
              </div>

              <Button onClick={handleReplitLogin} variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5">
                Sign In with Replit
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button onClick={() => setMode("register")} className="text-accent hover:text-accent/90 font-semibold">
                  Create one
                </button>
              </p>

              <button
                onClick={() => { setMode("landing"); setError(""); }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
