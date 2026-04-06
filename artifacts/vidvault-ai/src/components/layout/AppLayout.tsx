import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sun, Moon, Sparkles, Home, FolderOpen, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { AISidebar } from "./AISidebar";
import { UrlPasteModal } from "../videos/UrlPasteModal";
import { useAuth } from "@workspace/replit-auth-web";
import Login from "@/pages/Login";
import { LoadingScreen } from "../ui/loading-screen";
import { useTheme } from "@/contexts/ThemeContext";
import { useUI } from "@/contexts/ui-context";

const SIDEBAR_COLLAPSED_KEY = "vv_sidebar_collapsed";

/* ── Animated Hamburger ── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 h-4 flex flex-col justify-between relative">
      <motion.span animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25 }} className="block h-0.5 rounded-full origin-center" style={{ background: "var(--vv-text)" }} />
      <motion.span animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.2 }} className="block h-0.5 rounded-full" style={{ background: "var(--vv-text)" }} />
      <motion.span animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.25 }} className="block h-0.5 rounded-full origin-center" style={{ background: "var(--vv-text)" }} />
    </div>
  );
}

/* ── Mobile bottom nav items ── */
const NAV_ITEMS = [
  { icon: Home,       label: "Home",    path: "/" },
  { icon: Search,     label: "Videos",  path: "/videos" },
  { icon: FolderOpen, label: "Folders", path: "/folders" },
  { icon: Sparkles,   label: "AI",      path: "/ai" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"; } catch { return false; }
  });
  const { isDark, toggleTheme } = useTheme();
  const { setUrlModalOpen, setAiSidebarOpen } = useUI();
  const [location, navigate] = useLocation();

  /* Persist sidebar collapse preference */
  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Login />;

  return (
    <div className="flex h-screen w-full overflow-hidden relative transition-colors duration-300" style={{ background: "var(--vv-bg)" }}>
      <div className="grain-overlay" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 relative z-20">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="fixed left-0 top-0 h-screen z-50 lg:hidden">
              <Sidebar collapsed={false} onToggleCollapse={() => {}} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── Mobile Top Bar ── */}
        <div className="lg:hidden flex-shrink-0 h-14 flex items-center justify-between px-3 relative transition-colors duration-300" style={{ background: "var(--vv-sidebar)", borderBottom: "1px solid var(--vv-border)" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors" style={{ background: mobileSidebarOpen ? "rgba(139,92,246,0.12)" : "transparent", border: mobileSidebarOpen ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent" }}>
            <HamburgerIcon open={mobileSidebarOpen} />
          </motion.button>

          {/* Center logo */}
          <motion.div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <img src="/logo.png" alt="VidVault AI" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-black lp-heading text-xs uppercase tracking-[0.12em]" style={{ fontFamily: "'Alegreya Sans SC', serif", color: "var(--vv-text)" }}>
              VidVault <span style={{ color: "#8b5cf6" }}>AI</span>
            </span>
          </motion.div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ scale: 0.88 }} onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ border: "1px solid var(--vv-border)", color: "var(--vv-text-muted)" }}>
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.span key="sun" initial={{ rotate: -60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 60, opacity: 0 }} transition={{ duration: 0.18 }} className="flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -60, opacity: 0 }} transition={{ duration: 0.18 }} className="flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setAiSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ border: "1px solid var(--vv-border)", color: "var(--vv-text-muted)" }}>
              <Sparkles className="w-4 h-4" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setUrlModalOpen(true)} className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", boxShadow: "0 2px 12px rgba(139,92,246,0.35)", fontFamily: "'Raleway', sans-serif" }}>
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Save</span>
            </motion.button>
          </div>
        </div>

        {/* ── Desktop Top Nav (hidden on mobile) ── */}
        <div className="hidden lg:block flex-shrink-0">
          <TopNav />
        </div>

        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex-1 overflow-y-auto hide-scrollbar grid-mesh transition-colors duration-300 pb-16 lg:pb-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-5 lg:p-6">{children}</div>
        </motion.main>

        {/* ── Mobile Bottom Navigation ── */}
        <motion.nav initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 280, damping: 30 }} className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around" style={{ height: 60, background: "var(--vv-sidebar)", borderTop: "1px solid var(--vv-border)", backdropFilter: "blur(20px)" }}>
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = path === "/" ? location === "/" : location.startsWith(path);
            return (
              <motion.button key={path} whileTap={{ scale: 0.85 }} onClick={() => navigate(path)} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative">
                {isActive && (
                  <motion.div layoutId="mobile-nav-pill" className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full" style={{ background: "#8b5cf6" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <Icon className="w-5 h-5" style={{ color: isActive ? "#8b5cf6" : "var(--vv-text-muted)" }} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", color: isActive ? "#8b5cf6" : "var(--vv-text-muted)" }}>
                  {label}
                </span>
              </motion.button>
            );
          })}
          {/* Center FAB */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setUrlModalOpen(true)} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", boxShadow: "0 4px 16px rgba(139,92,246,0.45)" }}>
              <Plus className="w-5 h-5 text-white" />
            </div>
          </motion.button>
        </motion.nav>
      </div>

      <AISidebar />
      <UrlPasteModal />
    </div>
  );
}
