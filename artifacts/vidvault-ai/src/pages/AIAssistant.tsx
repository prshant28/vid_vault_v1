import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Loader2, Youtube, Import, Library,
  Search, X, Sparkles, ArrowUpRight, Play, Trash2,
  ExternalLink, RotateCcw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

interface LibraryVideo {
  id: string;
  title: string;
  channelName?: string | null;
  thumbnail?: string | null;
  url: string;
  duration?: string | null;
}

interface YouTubeVideo {
  youtubeId: string;
  title: string;
  channel: string;
  thumbnail: string;
  description: string;
  url: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  libraryVideos?: LibraryVideo[];
  youtubeVideos?: YouTubeVideo[];
  action?: string | null;
  timestamp: Date;
}

function VideoThumb({ video }: { video: LibraryVideo }) {
  const { isDark } = useTheme();
  return (
    <a
      href={`/videos/${video.id}`}
      className="block rounded-lg overflow-hidden group transition-all hover:scale-[1.02]"
      style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}
    >
      <div className="relative" style={{ aspectRatio: "16/9", background: isDark ? "#1a1a22" : "#f0eeff" }}>
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-6 h-6 text-[#333]" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
          <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="p-2" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        <p className="text-[10px] font-semibold leading-snug line-clamp-2"
          style={{ color: isDark ? "#ccc" : "#1a1a2e", fontFamily: "'Raleway', sans-serif" }}>
          {video.title}
        </p>
        {video.channelName && (
          <p className="text-[8px] font-mono-ui uppercase tracking-wider mt-0.5" style={{ color: isDark ? "#444" : "#888" }}>
            {video.channelName}
          </p>
        )}
      </div>
    </a>
  );
}

function YouTubeThumb({ video, onImport, importing }: { video: YouTubeVideo; onImport: (v: YouTubeVideo) => void; importing: boolean }) {
  const { isDark } = useTheme();
  return (
    <div
      className="rounded-lg overflow-hidden group transition-all hover:scale-[1.02]"
      style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}
    >
      <div className="relative" style={{ aspectRatio: "16/9" }}>
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: isDark ? "#1a1a22" : "#f0eeff" }}>
            <Youtube className="w-6 h-6 text-red-500" />
          </div>
        )}
        <div className="absolute top-1 right-1">
          <span className="font-mono-ui text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: "rgba(239,68,68,0.9)", color: "#fff" }}>YT</span>
        </div>
        <a href={video.url} target="_blank" rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/25 transition-all">
          <ExternalLink className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
        </a>
      </div>
      <div className="p-2" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        <p className="text-[10px] font-semibold leading-snug line-clamp-2 mb-1"
          style={{ color: isDark ? "#ccc" : "#1a1a2e", fontFamily: "'Raleway', sans-serif" }}>
          {video.title}
        </p>
        <p className="text-[8px] font-mono-ui uppercase tracking-wider mb-2" style={{ color: isDark ? "#444" : "#888" }}>
          {video.channel}
        </p>
        <button
          onClick={() => onImport(video)}
          disabled={importing}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-[8px] font-mono-ui uppercase tracking-wider transition-all disabled:opacity-50"
          style={{ background: importing ? "#7c3aed" : "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          {importing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Import className="w-2.5 h-2.5" />}
          {importing ? "Importing..." : "Import to Vault"}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onImport, importingIds }: {
  msg: ChatMessage;
  onImport: (v: YouTubeVideo) => void;
  importingIds: Set<string>;
}) {
  const { isDark } = useTheme();
  const isUser = msg.role === "user";
  const userBg = "rgba(139,92,246,0.15)";
  const aiBg = isDark ? "#141420" : "#f5f4ff";
  const aiBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[88%] ${isUser ? "" : "w-full"}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.2)" }}>
              <Bot className="w-3 h-3 text-[#8b5cf6]" />
            </div>
            <span className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: isDark ? "#444" : "#888" }}>
              VidVault AI
            </span>
          </div>
        )}

        <div
          className="px-4 py-3 rounded-xl text-sm leading-relaxed"
          style={{
            background: isUser ? userBg : aiBg,
            border: `1px solid ${isUser ? "rgba(139,92,246,0.3)" : aiBorder}`,
            color: isDark ? "#d0d0e0" : "#1a1a2e",
            fontFamily: "'Raleway', sans-serif",
            whiteSpace: "pre-wrap",
          }}
        >
          {msg.content}
        </div>

        {/* Library videos inline */}
        {!isUser && msg.libraryVideos && msg.libraryVideos.length > 0 && (
          <div className="mt-3">
            <p className="font-mono-ui text-[8px] uppercase tracking-widest mb-2 px-1" style={{ color: isDark ? "#444" : "#888" }}>
              FROM YOUR LIBRARY ({msg.libraryVideos.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {msg.libraryVideos.map((v) => <VideoThumb key={v.id} video={v} />)}
            </div>
          </div>
        )}

        {/* YouTube results inline */}
        {!isUser && msg.youtubeVideos && msg.youtubeVideos.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Youtube className="w-3 h-3 text-red-500" />
              <p className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: isDark ? "#444" : "#888" }}>
                TOP YOUTUBE RESULTS ({msg.youtubeVideos.length})
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {msg.youtubeVideos.map((v) => (
                <YouTubeThumb
                  key={v.youtubeId}
                  video={v}
                  onImport={onImport}
                  importing={importingIds.has(v.youtubeId)}
                />
              ))}
            </div>
          </div>
        )}

        <p className="font-mono-ui text-[7px] mt-1.5 px-1" style={{ color: isDark ? "#2a2a3a" : "#bbbbc8" }}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

const SUGGESTIONS = [
  "Find me top 10 videos about machine learning",
  "What's in my saved library?",
  "Find top videos about React and TypeScript",
  "Search my library for programming videos",
  "Find top 10 videos about data science",
];

export default function AIAssistant() {
  const { isDark } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [libraryVideos, setLibraryVideos] = useState<LibraryVideo[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const bg = isDark ? "#09090c" : "#f2f0ff";
  const panel = isDark ? "#0e0e14" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const inputBg = isDark ? "#12121a" : "#f8f7ff";
  const textPrimary = isDark ? "#e8e8f0" : "#0d0c14";
  const textMuted = isDark ? "#444" : "#888";

  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/videos?limit=100");
      if (res.ok) {
        const data = await res.json();
        setLibraryVideos(data.videos || []);
      }
    } catch {}
    setLibraryLoading(false);
  }, []);

  useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredLibrary = librarySearch
    ? libraryVideos.filter((v) =>
        v.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        (v.channelName || "").toLowerCase().includes(librarySearch.toLowerCase())
      )
    : libraryVideos;

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setInput("");
    setSending(true);

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/global-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "AI request failed");
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.message,
        libraryVideos: data.libraryVideos || [],
        youtubeVideos: data.youtubeVideos || [],
        action: data.action,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.message || "Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleImport = async (video: YouTubeVideo) => {
    setImportingIds((prev) => new Set(prev).add(video.youtubeId));
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: video.url, title: video.title }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to import");
      }
      toast({ title: "Video imported!", description: `"${video.title}" added to your vault.` });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      fetchLibrary();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(video.youtubeId);
        return next;
      });
    }
  };

  return (
    <div
      className="flex h-[calc(100vh-4rem)] gap-0 rounded-xl overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8"
      style={{ border: `1px solid ${border}` }}
    >
      {/* ── LEFT: Chat panel ── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ background: panel, borderRight: `1px solid ${border}` }}>
        {/* Chat header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ borderColor: border }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <Bot className="w-3.5 h-3.5 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide lp-heading"
                style={{ fontFamily: "'Alegreya Sans SC', serif" }}>
                VidVault AI Studio
              </p>
              <p className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: textMuted }}>
                POWERED_BY_AI // YOUTUBE_SEARCH_ENABLED
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1 font-mono-ui text-[8px] uppercase tracking-wider px-2 py-1 rounded transition-all"
              style={{ color: textMuted, border: `1px solid ${border}` }}
              title="Clear chat"
            >
              <Trash2 className="w-2.5 h-2.5" />
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center gap-6"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <Sparkles className="w-7 h-7 text-[#8b5cf6]" />
                </div>
                <h2 className="text-lg font-black lp-heading uppercase mb-2"
                  style={{ fontFamily: "'Alegreya Sans SC', serif" }}>
                  Ask About Any Topic
                </h2>
                <p className="text-sm max-w-xs mx-auto" style={{ color: textMuted, fontFamily: "'Raleway', sans-serif" }}>
                  I can search your library and find top YouTube videos on any topic you mention.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-[9px] font-mono-ui uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${border}`,
                      color: isDark ? "#555" : "#888",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#8b5cf6"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = border; (e.currentTarget as HTMLButtonElement).style.color = isDark ? "#555" : "#888"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              onImport={handleImport}
              importingIds={importingIds}
            />
          ))}

          {sending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.2)" }}>
                <Bot className="w-3 h-3 text-[#8b5cf6]" />
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me to find videos on any topic, or ask about your library..."
              rows={2}
              className="flex-1 resize-none text-sm font-mono-ui px-4 py-3 rounded-xl outline-none transition-all"
              style={{
                background: inputBg,
                border: `1px solid ${border}`,
                color: textPrimary,
                maxHeight: 120,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = border; }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-40 shrink-0"
              style={{ background: "#8b5cf6" }}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="font-mono-ui text-[7px] mt-2 text-center" style={{ color: isDark ? "#222" : "#ccc" }}>
            ENTER to send · SHIFT+ENTER for new line
          </p>
        </div>
      </div>

      {/* ── RIGHT: Library panel ── */}
      <div className="hidden lg:flex flex-col w-80 shrink-0" style={{ background: isDark ? "#0a0a0e" : "#f8f7ff" }}>
        {/* Library header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-2">
            <Library className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <p className="font-mono-ui text-[9px] uppercase tracking-widest lp-heading">
              MY LIBRARY
            </p>
            <span className="font-mono-ui text-[7px] px-1.5 py-0.5 rounded"
              style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
              {libraryVideos.length}
            </span>
          </div>
          <button onClick={fetchLibrary} className="text-[#333] hover:text-[#8b5cf6] transition-colors" title="Refresh">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Library search */}
        <div className="px-3 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: textMuted }} />
            <input
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Filter library..."
              className="w-full h-8 pl-7 pr-7 text-[11px] font-mono-ui rounded-lg outline-none"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textPrimary }}
            />
            {librarySearch && (
              <button onClick={() => setLibrarySearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: textMuted }}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Library grid */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 hide-scrollbar">
          {libraryLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#8b5cf6]" />
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <Library className="w-8 h-8 text-[#222]" />
              <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: textMuted }}>
                {librarySearch ? "NO_MATCHES" : "VAULT_EMPTY"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {filteredLibrary.map((video) => (
                <a
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="block rounded-lg overflow-hidden group transition-all hover:scale-[1.02]"
                  style={{ border: `1px solid ${border}` }}
                  onClick={(e) => {
                    e.preventDefault();
                    const msg = `Tell me about the video: "${video.title}"`;
                    sendMessage(msg);
                  }}
                  title={`Ask AI about "${video.title}"`}
                >
                  <div className="relative" style={{ aspectRatio: "16/9", background: isDark ? "#1a1a22" : "#f0eeff" }}>
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-[#333]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-1.5" style={{ background: isDark ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <p className="text-[9px] font-semibold line-clamp-2 leading-snug"
                      style={{ color: isDark ? "#aaa" : "#1a1a2e", fontFamily: "'Raleway', sans-serif" }}>
                      {video.title}
                    </p>
                    {video.channelName && (
                      <p className="text-[7px] font-mono-ui uppercase tracking-wider mt-0.5" style={{ color: isDark ? "#333" : "#aaa" }}>
                        {video.channelName}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Library footer */}
        <div className="px-3 py-2 shrink-0" style={{ borderTop: `1px solid ${border}` }}>
          <p className="font-mono-ui text-[7px] uppercase tracking-widest text-center" style={{ color: isDark ? "#222" : "#ccc" }}>
            CLICK A VIDEO TO ASK AI ABOUT IT
          </p>
        </div>
      </div>
    </div>
  );
}
