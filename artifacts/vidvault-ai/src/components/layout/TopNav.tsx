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
      className="h-14 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-40 border-b"
      style={{
        background: "#080809",
        borderColor: "rgba(255,255,255,0.05)",
      }}
    >
      {/* Page title */}
      <div className="flex items-center gap-4">
        <span className="font-mono-ui text-[10px] text-[#333] hidden sm:block">
          //{pageTitle}
        </span>
        <div
          className="h-4 w-px hidden sm:block"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#333] group-focus-within:text-[#8b5cf6] transition-colors" />
          <input
            ref={inputRef}
            placeholder="SEARCH VAULT..."
            className="w-48 sm:w-64 h-9 bg-transparent border pl-9 pr-3 text-[#666] text-xs font-mono-ui uppercase tracking-widest focus:outline-none focus:text-white placeholder:text-[#2a2a2a] transition-colors"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            }}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAiSidebarOpen(true)}
          className="flex items-center gap-2 px-3 h-9 text-[10px] font-mono-ui uppercase tracking-widest text-[#8b5cf6] border border-[rgba(139,92,246,0.2)] hover:bg-[rgba(139,92,246,0.08)] hover:border-[rgba(139,92,246,0.4)] transition-all"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">AI_TOOLS</span>
        </button>

        <button
          onClick={() => setUrlModalOpen(true)}
          className="flex items-center gap-2 px-3 h-9 text-[10px] font-mono-ui uppercase tracking-widest text-black font-bold transition-all"
          style={{
            background: "#ffffff",
            clipPath: "polygon(8% 0px, 100% 0px, 100% 70%, 92% 100%, 0px 100%, 0px 30%)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#8b5cf6";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
            (e.currentTarget as HTMLButtonElement).style.color = "#000";
          }}
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">SAVE</span>
        </button>
      </div>
    </header>
  );
}
