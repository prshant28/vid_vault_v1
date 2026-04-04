import { useListFolders } from "@workspace/api-client-react";
import {
  Folder, Loader2, PlayCircle, Plus, MoreVertical,
  Pencil, Trash2, X, Check, FolderOpen,
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

const ACCENT_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ec4899", "#ef4444", "#f97316", "#3b82f6",
  "#84cc16", "#a855f7", "#14b8a6", "#6366f1",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full transition-all"
          style={{
            background: c,
            outline: value === c ? `2px solid ${c}` : "none",
            outlineOffset: 2,
            transform: value === c ? "scale(1.25)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
}

function FolderModal({
  mode,
  initialName = "",
  initialColor = "#8b5cf6",
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  initialName?: string;
  initialColor?: string;
  onSave: (name: string, color: string) => Promise<void>;
  onClose: () => void;
}) {
  const { isDark } = useTheme();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor || "#8b5cf6");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), color);
      onClose();
    } catch (err: any) {
      setSaving(false);
    }
  };

  const bg = isDark ? "#0e0e12" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "#12121a" : "#f4f3ff";
  const textCol = isDark ? "#e8e8f0" : "#0d0c14";
  const muted = isDark ? "#555568" : "#7a7a8a";

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div
          className="w-full max-w-sm"
          style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                <FolderOpen className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="font-black text-sm uppercase tracking-wide"
                style={{ fontFamily: "'Raleway', sans-serif", color: textCol }}>
                {mode === "create" ? "NEW FOLDER" : "EDIT FOLDER"}
              </p>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
              style={{ color: muted }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="font-mono-ui text-[9px] uppercase tracking-widest block mb-2" style={{ color: muted }}>
                FOLDER NAME
              </label>
              <input
                ref={inputRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                placeholder="e.g. Machine Learning, React Tutorials..."
                className="w-full h-10 text-sm px-3 rounded-lg outline-none transition-all"
                style={{
                  background: inputBg,
                  border: `1px solid ${name ? "rgba(139,92,246,0.4)" : border}`,
                  color: textCol,
                  fontFamily: "'Raleway', sans-serif",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = name ? "rgba(139,92,246,0.4)" : border; }}
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="font-mono-ui text-[9px] uppercase tracking-widest block mb-3" style={{ color: muted }}>
                FOLDER COLOR
              </label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            {/* Live preview */}
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
              style={{ background: isDark ? "#12121a" : "#f7f6ff", border: `1px solid ${border}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                <Folder className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: textCol, fontFamily: "'Raleway', sans-serif" }}>
                  {name || "Untitled Folder"}
                </p>
                <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: muted }}>
                  Preview
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${border}` }}>
            <button onClick={onClose}
              className="font-mono-ui text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg transition-colors"
              style={{ color: muted }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex items-center gap-2 px-5 py-2 font-mono-ui text-[10px] uppercase tracking-widest font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: color,
                borderRadius: 8,
                clipPath: "polygon(5% 0%, 100% 0%, 100% 70%, 95% 100%, 0% 100%, 0% 30%)",
                boxShadow: `0 4px 16px ${color}40`,
              }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

interface FolderItem {
  id: string;
  name: string;
  color?: string | null;
  videoCount: number;
}

function FolderCard({ folder, onEdit, onDelete }: {
  folder: FolderItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const accent = folder.color || "#8b5cf6";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      className="etched-slab relative overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: hovered ? `1px solid ${accent}35` : undefined,
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px ${accent}15` : undefined,
      }}
    >
      {/* Clickable folder area */}
      <Link href={`/videos?folderId=${folder.id}`} className="block p-5 pr-12">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}14`, border: `1px solid ${accent}30` }}>
            <Folder className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm uppercase lp-heading leading-tight mb-1"
              style={{ fontFamily: "'Alegreya Sans SC', serif" }}>
              {folder.name}
            </h3>
            <div className="flex items-center gap-1 font-mono-ui text-[10px] uppercase tracking-widest"
              style={{ color: accent + "80" }}>
              <PlayCircle className="w-3 h-3" />
              {folder.videoCount} {folder.videoCount === 1 ? "Video" : "Videos"}
            </div>
          </div>
        </div>
      </Link>

      {/* 3-dot menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <motion.button
          animate={{ opacity: hovered || menuOpen ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <MoreVertical className="w-3.5 h-3.5 text-[#888]" />
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-9 right-0 z-50 min-w-[150px] py-1 rounded-xl shadow-2xl"
              style={{
                background: "#18181f",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              }}
            >
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono-ui uppercase tracking-wider transition-colors hover:bg-white/[0.04] text-left"
                style={{ color: "#888" }}
              >
                <Pencil className="w-3 h-3" />
                Edit Folder
              </button>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }} />
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-mono-ui uppercase tracking-wider transition-colors hover:bg-red-500/10 text-left"
                style={{ color: "#ef4444" }}
              >
                <Trash2 className="w-3 h-3" />
                Delete Folder
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accent glow */}
      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}15, transparent)` }} />
    </div>
  );
}

export default function Folders() {
  const { data, isLoading } = useListFolders();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isDark } = useTheme();

  const [showCreate, setShowCreate] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const folders: FolderItem[] = (data?.folders as any) || [];
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const textCol = isDark ? "#e8e8f0" : "#0d0c14";
  const muted = isDark ? "#555568" : "#7a7a8a";

  const handleCreate = async (name: string, color: string) => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to create");
    toast({ title: "Folder created!", description: `"${name}" is ready.` });
    queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const handleEdit = async (name: string, color: string) => {
    if (!editingFolder) return;
    const res = await fetch(`/api/folders/${editingFolder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to update");
    toast({ title: "Folder updated!" });
    queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
  };

  const handleDelete = async () => {
    if (!deletingFolder) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/folders/${deletingFolder.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Folder deleted", description: "Your videos are still in the vault." });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDeletingFolder(null);
    } catch {
      toast({ title: "Failed to delete folder", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em]">
            //FOLDER_MANAGER
          </span>
          <h1
            className="font-black lp-heading uppercase"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontFamily: "'Alegreya Sans SC', serif" }}
          >
            Folders
          </h1>
          <p className="font-mono-ui text-[10px] text-[#333] uppercase tracking-widest">
            {folders.length} FOLDER{folders.length !== 1 ? "S" : ""} // ORGANIZED
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 font-mono-ui text-[10px] uppercase tracking-widest font-bold text-white shrink-0"
          style={{
            background: "#8b5cf6",
            borderRadius: 8,
            clipPath: "polygon(5% 0%, 100% 0%, 100% 70%, 95% 100%, 0% 100%, 0% 30%)",
            boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New</span> Folder
        </motion.button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="w-full h-[40vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#8b5cf6]" />
        </div>
      ) : folders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {folders.map((folder, i) => (
              <motion.div
                key={folder.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.05 } }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <FolderCard
                  folder={folder}
                  onEdit={() => setEditingFolder(folder)}
                  onDelete={() => setDeletingFolder(folder)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="etched-slab py-24 text-center"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <FolderOpen className="w-7 h-7 text-[#8b5cf6]" />
          </div>
          <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em] block mb-3">
            NO_FOLDERS
          </span>
          <h3 className="text-lg font-black uppercase mb-3" style={{ fontFamily: "'Alegreya Sans SC', serif" }}>
            No Folders Yet
          </h3>
          <p className="font-mono-ui text-[10px] text-[#333] max-w-xs mx-auto mb-8 leading-relaxed">
            Create folders to organize your videos by topic, course, or category.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 font-mono-ui text-[10px] uppercase tracking-widest font-bold text-white"
            style={{ background: "#8b5cf6", borderRadius: 8, clipPath: "polygon(5% 0%, 100% 0%, 100% 70%, 95% 100%, 0% 100%, 0% 30%)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Folder
          </button>
        </motion.div>
      )}

      {/* Create / Edit Modals */}
      <AnimatePresence>
        {showCreate && (
          <FolderModal
            key="create"
            mode="create"
            onSave={handleCreate}
            onClose={() => setShowCreate(false)}
          />
        )}
        {editingFolder && (
          <FolderModal
            key="edit"
            mode="edit"
            initialName={editingFolder.name}
            initialColor={editingFolder.color || "#8b5cf6"}
            onSave={handleEdit}
            onClose={() => setEditingFolder(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingFolder && (
          <>
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !deleting && setDeletingFolder(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div
                className="w-full max-w-sm"
                style={{
                  background: isDark ? "#0e0e12" : "#fff",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 16,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 py-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="font-black text-base uppercase"
                    style={{ fontFamily: "'Alegreya Sans SC', serif", color: textCol }}>
                    Delete "{deletingFolder.name}"?
                  </h3>
                  <p className="font-mono-ui text-[10px] leading-relaxed" style={{ color: muted }}>
                    The folder will be removed.
                    {deletingFolder.videoCount > 0
                      ? ` Your ${deletingFolder.videoCount} video${deletingFolder.videoCount !== 1 ? "s" : ""} will stay in your vault without a folder.`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4"
                  style={{ borderTop: `1px solid ${border}` }}>
                  <button
                    onClick={() => setDeletingFolder(null)}
                    disabled={deleting}
                    className="font-mono-ui text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg"
                    style={{ color: muted }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 font-mono-ui text-[10px] uppercase tracking-widest font-bold text-white rounded-lg transition-all disabled:opacity-50"
                    style={{ background: "#ef4444" }}
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
