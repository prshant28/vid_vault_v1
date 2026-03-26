import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Link2, ListMusic, Loader2, ArrowUpRight,
  Youtube, Globe, CheckCircle2, Edit2, Check,
} from "lucide-react";
import { useUI } from "@/contexts/ui-context";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

type Phase = "idle" | "loading" | "preview";
type VideoType = "video" | "playlist" | "web";

interface Preview {
  title: string;
  thumbnail: string | null;
  type: VideoType;
  domain: string;
  favicon: string | null;
}

function TypeBadge({ type }: { type: VideoType }) {
  const configs: Record<VideoType, { label: string; color: string; bg: string }> = {
    video:    { label: "VIDEO",    color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    playlist: { label: "PLAYLIST", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    web:      { label: "WEB VIDEO", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  };
  const c = configs[type];
  return (
    <span
      className="font-mono-ui text-[9px] uppercase tracking-widest px-2 py-0.5 rounded"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}30` }}
    >
      {c.label}
    </span>
  );
}

export function UrlPasteModal() {
  const { isUrlModalOpen, setUrlModalOpen } = useUI();
  const { isDark } = useTheme();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isPlaylist = /youtube\.com\/playlist\?list=|youtube\.com\/watch\?.*list=/.test(url);

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || !trimmed.startsWith("http")) {
      setPhase("idle");
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPhase("loading");
      try {
        if (isPlaylist) {
          setPreview({
            title: "YouTube Playlist",
            thumbnail: null,
            type: "playlist",
            domain: "youtube.com",
            favicon: "https://www.google.com/s2/favicons?sz=64&domain=youtube.com",
          });
          setEditTitle("YouTube Playlist");
          setPhase("preview");
          return;
        }

        const res = await fetch(`/api/preview?url=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error("Preview failed");
        const data = await res.json();

        let title = data.title || data.domain || trimmed;

        if (data.type === "youtube" && data.videoId) {
          try {
            const oe = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${data.videoId}&format=json`
            );
            if (oe.ok) {
              const od = await oe.json();
              title = od.title || title;
            }
          } catch {}
        }

        setPreview({
          title,
          thumbnail: data.image || null,
          type: data.type === "youtube" ? "video" : "web",
          domain: data.domain,
          favicon: data.favicon || null,
        });
        setEditTitle(title);
        setPhase("preview");
      } catch {
        setPhase("idle");
        toast({ title: "Could not fetch preview", description: "URL may be invalid or private", variant: "destructive" });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [url, isPlaylist]);

  const handleClose = () => {
    setUrlModalOpen(false);
    setUrl("");
    setPhase("idle");
    setPreview(null);
    setEditTitle("");
    setFolderName("");
    setEditingTitle(false);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!url.trim()) return;
    setSaving(true);
    try {
      if (isPlaylist) {
        const res = await fetch("/api/videos/playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, folderName: folderName || undefined }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Import failed");
        }
        const data = await res.json();
        toast({ title: "Playlist imported!", description: `${data.videos.length} videos added to "${data.folder.name}"` });
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      } else {
        const res = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, title: editTitle || undefined }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to save");
        }
        toast({ title: "Video saved to vault!", description: editTitle || "Your video is ready." });
        queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      }
      handleClose();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message || "Please check the URL", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isUrlModalOpen) return null;

  const bg = isDark ? "#0e0e12" : "#ffffff";
  const borderCol = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const surfaceCol = isDark ? "#18181f" : "#f8f7ff";
  const textPrimary = isDark ? "#e8e8f0" : "#0d0c14";
  const textMuted = isDark ? "#555568" : "#7a7a8a";
  const inputBg = isDark ? "#12121a" : "#f4f3ff";
  const inputBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  return (
    <AnimatePresence>
      {isUrlModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50"
            style={{ background: isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div
              className="w-full max-w-lg relative"
              style={{
                background: bg,
                border: `1px solid ${borderCol}`,
                borderRadius: 16,
                boxShadow: isDark
                  ? "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)"
                  : "0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(139,92,246,0.06)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4"
                style={{ borderBottom: `1px solid ${borderCol}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.12)", borderRadius: 8, border: "1px solid rgba(139,92,246,0.25)" }}>
                    <Link2 className="w-4 h-4 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-wide"
                      style={{ fontFamily: "'Raleway', sans-serif", color: textPrimary }}>
                      SAVE TO VAULT
                    </p>
                    <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: textMuted }}>
                      {phase === "preview" && preview
                        ? isPlaylist ? "PLAYLIST_DETECTED" : `${preview.type.toUpperCase()}_DETECTED`
                        : "PASTE_URL_BELOW"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/[0.06]"
                  style={{ color: textMuted }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {/* URL Input */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    autoFocus
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or any video URL"
                    className="w-full h-11 text-sm font-mono-ui pl-4 pr-10 rounded-lg outline-none transition-all"
                    style={{
                      background: inputBg,
                      border: `1px solid ${url ? "rgba(139,92,246,0.35)" : inputBorder}`,
                      color: textPrimary,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = url ? "rgba(139,92,246,0.35)" : inputBorder; }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {phase === "loading" && <Loader2 className="w-4 h-4 text-[#8b5cf6] animate-spin" />}
                    {phase === "preview" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                </div>

                {/* Preview Card */}
                <AnimatePresence mode="wait">
                  {phase === "preview" && preview && !isPlaylist && (
                    <motion.div
                      key="preview-video"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${borderCol}` }}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full" style={{ aspectRatio: "16/9", background: surfaceCol }}>
                        {preview.thumbnail ? (
                          <img
                            src={preview.thumbnail}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                            {preview.favicon && (
                              <img src={preview.favicon} alt="" className="w-8 h-8 rounded-lg"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                            )}
                            <Globe className="w-8 h-8" style={{ color: textMuted }} />
                          </div>
                        )}
                        {/* Overlay with type badge */}
                        <div className="absolute inset-0" style={{
                          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)"
                        }} />
                        <div className="absolute top-2 left-2">
                          <TypeBadge type={preview.type} />
                        </div>
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-white font-semibold text-sm leading-snug line-clamp-2"
                            style={{ fontFamily: "'Raleway', sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                            {preview.title}
                          </p>
                          <p className="text-white/60 font-mono-ui text-[9px] uppercase tracking-widest mt-0.5">
                            {preview.domain}
                          </p>
                        </div>
                      </div>

                      {/* Editable Title */}
                      <div className="px-4 py-3" style={{ background: surfaceCol }}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: textMuted }}>
                            TITLE (EDITABLE)
                          </label>
                          <button
                            onClick={() => {
                              setEditingTitle(!editingTitle);
                              if (!editingTitle) setTimeout(() => titleInputRef.current?.focus(), 50);
                            }}
                            className="flex items-center gap-1 font-mono-ui text-[8px] uppercase tracking-wider transition-colors"
                            style={{ color: editingTitle ? "#8b5cf6" : textMuted }}
                          >
                            {editingTitle ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                            {editingTitle ? "Done" : "Edit"}
                          </button>
                        </div>
                        {editingTitle ? (
                          <input
                            ref={titleInputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-sm font-semibold px-2 py-1 rounded outline-none"
                            style={{
                              background: isDark ? "#0e0e12" : "#ffffff",
                              border: `1px solid rgba(139,92,246,0.4)`,
                              color: textPrimary,
                              fontFamily: "'Raleway', sans-serif",
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") setEditingTitle(false); }}
                          />
                        ) : (
                          <p className="text-sm font-semibold leading-snug" style={{ color: textPrimary, fontFamily: "'Raleway', sans-serif" }}>
                            {editTitle || preview.title}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Playlist Preview */}
                  {phase === "preview" && isPlaylist && (
                    <motion.div
                      key="preview-playlist"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Playlist badge */}
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
                        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)" }}>
                        <div className="w-9 h-9 flex items-center justify-center rounded-lg"
                          style={{ background: "rgba(139,92,246,0.15)" }}>
                          <ListMusic className="w-4 h-4 text-[#8b5cf6]" />
                        </div>
                        <div>
                          <p className="font-black text-sm" style={{ color: textPrimary, fontFamily: "'Raleway', sans-serif" }}>
                            YouTube Playlist
                          </p>
                          <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: textMuted }}>
                            All videos will be imported as a folder
                          </p>
                        </div>
                        <TypeBadge type="playlist" />
                      </div>

                      {/* Folder name input */}
                      <div>
                        <label className="font-mono-ui text-[9px] uppercase tracking-widest block mb-2" style={{ color: textMuted }}>
                          FOLDER NAME (OPTIONAL)
                        </label>
                        <input
                          value={folderName}
                          onChange={(e) => setFolderName(e.target.value)}
                          placeholder="Leave empty to use playlist title"
                          className="w-full h-10 text-sm px-3 rounded-lg outline-none transition-all"
                          style={{
                            background: inputBg,
                            border: `1px solid ${inputBorder}`,
                            color: textPrimary,
                            fontFamily: "'Raleway', sans-serif",
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = inputBorder; }}
                        />
                        <p className="font-mono-ui text-[8px] mt-1.5 uppercase tracking-wider" style={{ color: textMuted }}>
                          Leave blank to auto-use the YouTube playlist title
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderTop: `1px solid ${borderCol}` }}
              >
                <button
                  onClick={handleClose}
                  className="font-mono-ui text-[10px] uppercase tracking-widest transition-colors px-3 py-2 rounded-lg"
                  style={{ color: textMuted }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = textPrimary; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = textMuted; }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={!url.trim() || phase !== "preview" || saving}
                  className="flex items-center gap-2 px-5 py-2.5 font-mono-ui text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: saving ? "#7c3aed" : "#8b5cf6",
                    color: "#ffffff",
                    borderRadius: 8,
                    clipPath: "polygon(6% 0%, 100% 0%, 100% 70%, 94% 100%, 0% 100%, 0% 30%)",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving && url.trim() && phase === "preview")
                      (e.currentTarget as HTMLButtonElement).style.background = "#7c3aed";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = saving ? "#7c3aed" : "#8b5cf6";
                  }}
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isPlaylist ? (
                    <>
                      <ListMusic className="w-3.5 h-3.5" />
                      Import Playlist
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Save to Vault
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
