import { Search, Plus, Sparkles } from "lucide-react";
import { useUI } from "@/contexts/ui-context";
import { useLocation } from "wouter";
import { useRef } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/": "DASHBOARD",
  "/videos": "VIDEO_VAULT",
  "/folders": "FOLDERS",
  "/ai": "AI_STUDIO",
};

export function TopNav() {
  const { setAiSidebarOpen, setUrlModalOpen } = useUI();
  const [location, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const pageTitle = PAGE_TITLES[location] || "VAULT";

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      setLocation(`/videos?search=${encodeURIComponent(e.currentTarget.value)}`);
    }
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-40 border-b transition-colors duration-300 flex-shrink-0"
      style={{ background: "var(--vv-sidebar)", borderColor: "var(--vv-border)" }}
    >
      {/* Left: breadcrumb + search */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] hidden sm:block" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--vv-text-muted)" }}>
          //{pageTitle}
        </span>
        <div className="h-4 w-px hidden sm:block" style={{ background: "var(--vv-border)" }} />
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors" style={{ color: "var(--vv-text-muted)" }} />
          <input
            ref={inputRef}
            placeholder="Search vault…"
            className="w-44 sm:w-64 h-9 bg-transparent border pl-9 pr-3 text-xs rounded-lg focus:outline-none transition-all"
            style={{
              borderColor: "var(--vv-border)",
              color: "var(--vv-text)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--vv-border)"; }}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAiSidebarOpen(true)}
          className="flex items-center gap-2 px-3 h-9 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "#8b5cf6",
            border: "1px solid rgba(139,92,246,0.25)",
            background: "rgba(139,92,246,0.06)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.25)"; }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Tools</span>
        </button>

        <button
          onClick={() => setUrlModalOpen(true)}
          className="flex items-center gap-2 px-3 h-9 text-[10px] font-bold uppercase tracking-wider text-white rounded-lg transition-all"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            boxShadow: "0 2px 12px rgba(139,92,246,0.3)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(139,92,246,0.5)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(139,92,246,0.3)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save Video</span>
        </button>
      </div>
    </header>
  );
}
