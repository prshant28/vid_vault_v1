import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, FolderOpen, Star, Bot, Plus, LogOut, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useListFolders } from "@workspace/api-client-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard, code: "01" },
  { href: "/videos", label: "ALL VIDEOS", icon: Library, code: "02" },
  { href: "/folders", label: "FOLDERS", icon: FolderOpen, code: "03" },
  { href: "/videos?favorites=true", label: "FAVORITES", icon: Star, code: "04" },
  { href: "/ai", label: "AI STUDIO", icon: Bot, code: "05" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
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

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen flex flex-col shrink-0 border-r transition-colors duration-300 overflow-hidden relative"
      style={{
        background: "var(--vv-sidebar)",
        borderColor: "var(--vv-border)",
      }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: "var(--vv-border)", padding: collapsed ? "0 0 0 18px" : "0 16px 0 20px" }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-8 h-8 flex items-center justify-center font-black text-xs shrink-0"
            style={{
              fontFamily: "'Alegreya Sans SC', serif",
              background: isDark ? "#ffffff" : "#0d0c14",
              color: isDark ? "#000000" : "#ffffff",
            }}
          >
            VV
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span
                className="font-black uppercase tracking-[0.12em] text-sm block lp-heading whitespace-nowrap"
                style={{ fontFamily: "'Alegreya Sans SC', serif" }}
              >
                VidVault
              </span>
              <span className="font-mono-ui text-[8px] text-[#444] uppercase tracking-widest whitespace-nowrap">
                AI_CORE_v2.0
              </span>
            </motion.div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={toggleTheme}
            className="theme-toggle shrink-0"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6 px-2 space-y-1 hide-scrollbar">
        {!collapsed && (
          <p className="px-3 mb-4 font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em]">
            NAVIGATION
          </p>
        )}

        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 py-2.5 text-xs font-mono-ui uppercase tracking-wider transition-all duration-200 group relative rounded-lg ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
                active
                  ? collapsed
                    ? "bg-[rgba(139,92,246,0.12)]"
                    : "border-l-2 border-[#8b5cf6] bg-[rgba(139,92,246,0.08)] pl-[10px]"
                  : collapsed
                  ? "hover:bg-white/[0.04]"
                  : "border-l-2 border-transparent hover:bg-white/[0.02]"
              }`}
              style={{
                color: active
                  ? isDark ? "#ffffff" : "#0d0c14"
                  : isDark ? "#555" : "#667",
              }}
            >
              {!collapsed && <span className="font-mono-ui text-[9px] w-4 shrink-0 text-[#333]">{item.code}</span>}
              <item.icon
                className={`shrink-0 transition-colors ${collapsed ? "w-4.5 h-4.5" : "w-3.5 h-3.5"} ${
                  active ? "text-[#8b5cf6]" : "text-[#444] group-hover:text-[#888]"
                }`}
                style={{ width: collapsed ? 18 : 14, height: collapsed ? 18 : 14 }}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && active && (
                <div className="ml-auto w-1 h-1 rounded-full bg-[#8b5cf6]" />
              )}
            </Link>
          );
        })}

        {/* Folders — only when expanded */}
        {!collapsed && folderData?.folders && folderData.folders.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em]">FOLDERS</p>
              <Link href="/folders">
                <Plus className="w-3 h-3 text-[#333] hover:text-[#8b5cf6] transition-colors cursor-pointer" />
              </Link>
            </div>
            {folderData.folders.slice(0, 6).map((folder) => (
              <Link
                key={folder.id}
                href={`/videos?folderId=${folder.id}`}
                className="flex items-center gap-3 px-3 py-2 text-[#444] hover:text-[#aaa] transition-colors group text-xs font-mono-ui border-l-2 border-transparent hover:border-white/5"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color || "#8b5cf6" }}
                />
                <span className="truncate uppercase tracking-wider text-[10px]">{folder.name}</span>
              </Link>
            ))}
            {folderData.folders.length > 6 && (
              <Link
                href="/folders"
                className="block px-3 py-1 text-[9px] font-mono-ui text-[#333] hover:text-[#8b5cf6] transition-colors uppercase tracking-widest"
              >
                +{folderData.folders.length - 6} MORE →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* User + collapse toggle */}
      <div className="border-t shrink-0" style={{ borderColor: "var(--vv-border)" }}>
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-2 transition-colors hover:bg-white/[0.03]"
          style={{ color: "var(--vv-text-muted)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* User row */}
        <div className={`p-3 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <button
              onClick={logout}
              title="Sign out"
              className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/[0.04]"
              style={{ color: "#333" }}
            >
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Avatar"
                  className="w-7 h-7 object-cover rounded"
                  style={{ filter: "grayscale(30%)" }}
                />
              ) : (
                <span className="text-xs font-black font-mono-ui">
                  {(user?.firstName || user?.username || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between p-1 hover:bg-white/[0.02] transition-colors rounded">
              <div className="flex items-center gap-3 min-w-0">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Avatar"
                    className="w-8 h-8 object-cover shrink-0"
                    style={{ filter: "grayscale(30%)" }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 flex items-center justify-center text-xs font-black font-mono-ui shrink-0"
                    style={{
                      background: isDark ? "#1a1a1c" : "#eeeef8",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
                      color: isDark ? "#888" : "#667",
                    }}
                  >
                    {(user?.firstName || user?.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-bold text-[#888] truncate"
                    style={{ fontFamily: "'Raleway', sans-serif" }}
                  >
                    {user?.firstName || user?.username || "USER"}
                  </span>
                  <span className="text-[9px] text-[#333] font-mono-ui">FREE_PLAN</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-[#333] hover:text-red-500 transition-colors p-1 shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
