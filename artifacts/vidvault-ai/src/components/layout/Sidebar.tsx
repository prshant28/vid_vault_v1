import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, FolderOpen, Star, Bot, Plus, LogOut, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useListFolders } from "@workspace/api-client-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/",                    label: "DASHBOARD", icon: LayoutDashboard, code: "01" },
  { href: "/videos",              label: "ALL VIDEOS", icon: Library,         code: "02" },
  { href: "/folders",             label: "FOLDERS",   icon: FolderOpen,      code: "03" },
  { href: "/videos?favorites=true", label: "FAVORITES", icon: Star,          code: "04" },
  { href: "/ai",                  label: "AI STUDIO", icon: Bot,             code: "05" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: folderData } = useListFolders();
  const { isDark, toggleTheme } = useTheme();

  const currentSearch = typeof window !== "undefined" ? window.location.search : "";
  const isFavoritesActive = currentSearch.includes("favorites=true");

  const isActive = (href: string) => {
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefPath === "/") return location === "/";
    if (!location.startsWith(hrefPath)) return false;
    if (hrefQuery) return currentSearch.includes(hrefQuery);
    if (hrefPath === "/videos") return !isFavoritesActive;
    return true;
  };

  const sidebarWidth = collapsed ? 60 : 240;

  return (
    <motion.div
      animate={{ width: sidebarWidth }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen flex flex-col shrink-0 border-r overflow-hidden transition-colors duration-300"
      style={{ background: "var(--vv-sidebar)", borderColor: "var(--vv-border)" }}
    >
      {/* Logo row */}
      <div className="h-16 flex items-center border-b flex-shrink-0" style={{ borderColor: "var(--vv-border)", paddingLeft: collapsed ? 0 : 20, paddingRight: collapsed ? 0 : 12, justifyContent: collapsed ? "center" : "space-between" }}>
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="VidVault AI" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" style={{ imageRendering: "crisp-edges" }} />
            <div className="min-w-0">
              <span className="font-black uppercase tracking-[0.12em] text-sm block truncate" style={{ fontFamily: "'Alegreya Sans SC', serif", color: "var(--vv-text)" }}>
                VidVault
              </span>
              <span className="text-[8px] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--vv-text-muted)" }}>
                AI_CORE_v2.0
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/logo.png" alt="VidVault AI" className="w-8 h-8 rounded-lg object-cover" style={{ imageRendering: "crisp-edges" }} />
        )}
        {!collapsed && (
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="theme-toggle" title={isDark ? "Light mode" : "Dark mode"}>
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onToggleCollapse}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
              style={{ color: "var(--vv-text-muted)", border: "1px solid var(--vv-border)" }}
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 hide-scrollbar" style={{ paddingLeft: collapsed ? 0 : 12, paddingRight: collapsed ? 0 : 12 }}>
        {!collapsed && (
          <p className="px-3 mb-3 text-[9px] uppercase tracking-[0.3em]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--vv-text-muted)" }}>
            NAVIGATION
          </p>
        )}

        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 py-2.5 text-xs uppercase tracking-wider transition-all duration-200 group relative rounded-lg ${collapsed ? "justify-center px-2" : "px-3"}`}
                style={{
                  background: active ? "rgba(139,92,246,0.1)" : "transparent",
                  borderLeft: !collapsed ? `2px solid ${active ? "#8b5cf6" : "transparent"}` : "none",
                  color: active ? (isDark ? "#ffffff" : "#0d0c14") : "var(--vv-text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <item.icon
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: active ? "#8b5cf6" : "var(--vv-text-muted)" }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="truncate overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && !collapsed && (
                  <div className="ml-auto w-1 h-1 rounded-full" style={{ background: "#8b5cf6" }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Folders — only show expanded */}
        {!collapsed && folderData?.folders && folderData.folders.length > 0 && (
          <div className="pt-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[9px] uppercase tracking-[0.3em]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--vv-text-muted)" }}>
                FOLDERS
              </p>
              <Link href="/folders">
                <Plus className="w-3 h-3 hover:text-primary transition-colors cursor-pointer" style={{ color: "var(--vv-text-muted)" }} />
              </Link>
            </div>
            {folderData.folders.slice(0, 6).map((folder) => (
              <Link
                key={folder.id}
                href={`/videos?folderId=${folder.id}`}
                className="flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-wider transition-colors group border-l-2 border-transparent hover:border-primary/20 rounded-r-md"
                style={{ color: "var(--vv-text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color || "#8b5cf6" }} />
                <span className="truncate text-[10px]">{folder.name}</span>
              </Link>
            ))}
            {folderData.folders.length > 6 && (
              <Link href="/folders" className="block px-3 py-1 text-[9px] uppercase tracking-widest hover:text-primary transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--vv-text-muted)" }}>
                +{folderData.folders.length - 6} MORE →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-3 border-t" style={{ borderColor: "var(--vv-border)" }}>
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--vv-text-muted)", border: "1px solid var(--vv-border)" }}
            title="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Theme toggle when collapsed */}
      {collapsed && (
        <div className="flex justify-center pb-2">
          <button onClick={toggleTheme} className="theme-toggle" title={isDark ? "Light mode" : "Dark mode"}>
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* User */}
      <div className="flex-shrink-0 border-t p-3" style={{ borderColor: "var(--vv-border)" }}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-border)", color: "var(--vv-text-muted)" }}>
                {(user?.firstName || user?.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={logout} className="text-muted-foreground hover:text-red-400 transition-colors" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-border)", color: "var(--vv-text-muted)" }}>
                  {(user?.firstName || user?.username || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate" style={{ fontFamily: "'Raleway', sans-serif", color: "var(--vv-text-muted)" }}>
                  {user?.firstName || user?.username || "USER"}
                </span>
                <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--vv-text-muted)" }}>
                  FREE_PLAN
                </span>
              </div>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-red-400 transition-colors p-1 flex-shrink-0" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
