import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { AISidebar } from "./AISidebar";
import { UrlPasteModal } from "../videos/UrlPasteModal";
import { useAuth } from "@workspace/replit-auth-web";
import Login from "@/pages/Login";
import { LoadingScreen } from "../ui/loading-screen";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Login />;

  return (
    <div className="flex h-screen w-full overflow-hidden relative" style={{ background: "#0a0a0b" }}>
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(0,0,0,0.7)" }}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed left-0 top-0 h-screen z-50 lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile top bar */}
        <div
          className="lg:hidden h-14 flex items-center justify-between px-4 border-b"
          style={{ background: "#080809", borderColor: "rgba(255,255,255,0.05)" }}
        >
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#666] hover:text-white transition-colors p-2">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span className="font-mono-ui font-black text-white uppercase tracking-[0.15em] text-xs">VIDVAULT AI</span>
          <div className="w-8" />
        </div>

        <TopNav />

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto hide-scrollbar"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </motion.main>
      </div>

      <AISidebar />
      <UrlPasteModal />
    </div>
  );
}
