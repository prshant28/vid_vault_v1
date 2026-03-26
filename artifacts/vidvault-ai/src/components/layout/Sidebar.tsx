import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, FolderOpen, Star, Bot, Plus, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useListFolders } from "@workspace/api-client-react";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { href: "/", label: "DASHBOARD", icon: LayoutDashboard, code: "01" },
  { href: "/videos", label: "ALL VIDEOS", icon: Library, code: "02" },
  { href: "/folders", label: "FOLDERS", icon: FolderOpen, code: "03" },
  { href: "/videos?favorites=true", label: "FAVORITES", icon: Star, code: "04" },
  { href: "/ai", label: "AI STUDIO", icon: Bot, code: "05" },
];

export function Sidebar() {
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

    if (hrefQuery) {
      return currentSearch.includes(hrefQuery);
    }

    if (hrefPath === "/videos") {
      return !isFavoritesActive;
    }

    return true;
  };

  return (
    <div
      className="w-60 h-screen flex flex-col shrink-0 border-r transition-colors duration-300"
      style={{
        background: "var(--vv-sidebar)",
        borderColor: "var(--vv-border)",
      }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center justify-between px-5 border-b"
        style={{ borderColor: "var(--vv-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center font-black text-xs"
            style={{
              fontFamily: "'Alegreya Sans SC', serif",
              background: isDark ? "#ffffff" : "#0d0c14",
              color: isDark ? "#000000" : "#ffffff",
            }}
          >
            VV
          </div>
          <div>
            <span
              className="font-black uppercase tracking-[0.12em] text-sm block lp-heading"
              style={{ fontFamily: "'Alegreya Sans SC', serif" }}
            >
              VidVault
            </span>
            <span className="font-mono-ui text-[8px] text-[#444] uppercase tracking-widest">
              AI_CORE_v2.0
            </span>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <p className="px-3 mb-4 font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em]">
          NAVIGATION
        </p>

        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono-ui uppercase tracking-wider transition-all duration-200 group relative ${
                active
                  ? "border-l-2 border-[#8b5cf6] bg-[rgba(139,92,246,0.08)] pl-[10px]"
                  : "border-l-2 border-transparent"
              }`}
              style={{
                color: active
                  ? isDark ? "#ffffff" : "#0d0c14"
                  : isDark ? "#555" : "#667",
              }}
            >
              <span className="font-mono-ui text-[9px] w-4 shrink-0 text-[#333]">{item.code}</span>
              <item.icon
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  active ? "text-[#8b5cf6]" : "text-[#444] group-hover:text-[#888]"
                }`}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <div className="ml-auto w-1 h-1 rounded-full bg-[#8b5cf6]" />
              )}
            </Link>
          );
        })}

        {/* Folders */}
        {folderData?.folders && folderData.folders.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em]">
                FOLDERS
              </p>
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

      {/* User */}
      <div
        className="p-4 border-t"
        style={{ borderColor: "var(--vv-border)" }}
      >
        <div className="flex items-center justify-between p-2 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Avatar"
                className="w-8 h-8 object-cover"
                style={{ filter: "grayscale(30%)" }}
              />
            ) : (
              <div
                className="w-8 h-8 flex items-center justify-center text-xs font-black font-mono-ui"
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
            className="text-[#333] hover:text-red-500 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
