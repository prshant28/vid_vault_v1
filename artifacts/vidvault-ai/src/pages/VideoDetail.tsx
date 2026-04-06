import { useParams } from "wouter";
import { useGetVideo, useGenerateAiContent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { extractYoutubeId } from "@/lib/youtube";
import {
  Loader2, Calendar, Folder as FolderIcon, Sparkles, FileText, CheckSquare,
  Presentation, Download, Trash2, Brain, Layers, BookOpen, Twitter, Zap,
  BookMarked, Target, X, StickyNote,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useCallback } from "react";
import { marked } from "marked";
import { useToast } from "@/hooks/use-toast";
import { parseQuizContent } from "@/lib/quiz-parser";
import { InteractiveQuiz } from "@/components/ai/InteractiveQuiz";
import {
  QUIZ_TEMPLATES,
  contentExportTemplate,
  notesExportTemplate,
} from "@/lib/html-templates";
import { motion, AnimatePresence } from "framer-motion";

/* ─── marked config ─────────────────────────────────────────── */
marked.setOptions({ breaks: true });

function mdToHtml(text: string): string {
  try {
    return marked.parse(text) as string;
  } catch {
    return `<p>${text}</p>`;
  }
}

/* ─── AI Tool definitions ───────────────────────────────────── */
const AI_TOOLS = [
  {
    type: "summary",
    label: "Summary",
    sub: "Concise overview",
    icon: FileText,
    gradient: "from-blue-600/20 to-blue-500/5",
    accent: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
    glow: "rgba(59,130,246,0.12)",
  },
  {
    type: "key_insights",
    label: "Key Insights",
    sub: "Powerful takeaways",
    icon: Sparkles,
    gradient: "from-violet-600/20 to-violet-500/5",
    accent: "#8b5cf6",
    border: "rgba(139,92,246,0.25)",
    glow: "rgba(139,92,246,0.12)",
  },
  {
    type: "mcq",
    label: "Quiz",
    sub: "Test knowledge",
    icon: CheckSquare,
    gradient: "from-green-600/20 to-green-500/5",
    accent: "#22c55e",
    border: "rgba(34,197,94,0.25)",
    glow: "rgba(34,197,94,0.12)",
  },
  {
    type: "flashcards",
    label: "Flashcards",
    sub: "Spaced repetition",
    icon: Layers,
    gradient: "from-pink-600/20 to-pink-500/5",
    accent: "#ec4899",
    border: "rgba(236,72,153,0.25)",
    glow: "rgba(236,72,153,0.12)",
  },
  {
    type: "notes",
    label: "Study Notes",
    sub: "Rich notes",
    icon: BookOpen,
    gradient: "from-amber-600/20 to-amber-500/5",
    accent: "#f59e0b",
    border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.12)",
  },
  {
    type: "ppt_outline",
    label: "PPT Outline",
    sub: "Slide-ready",
    icon: Presentation,
    gradient: "from-orange-600/20 to-orange-500/5",
    accent: "#f97316",
    border: "rgba(249,115,22,0.25)",
    glow: "rgba(249,115,22,0.12)",
  },
  {
    type: "blog_article",
    label: "Blog Article",
    sub: "Long-form writing",
    icon: Brain,
    gradient: "from-teal-600/20 to-teal-500/5",
    accent: "#14b8a6",
    border: "rgba(20,184,166,0.25)",
    glow: "rgba(20,184,166,0.12)",
  },
  {
    type: "action_plan",
    label: "Action Plan",
    sub: "30-60-90 days",
    icon: Target,
    gradient: "from-red-600/20 to-red-500/5",
    accent: "#ef4444",
    border: "rgba(239,68,68,0.25)",
    glow: "rgba(239,68,68,0.12)",
  },
  {
    type: "vocabulary",
    label: "Vocabulary",
    sub: "Key terms",
    icon: BookMarked,
    gradient: "from-cyan-600/20 to-cyan-500/5",
    accent: "#06b6d4",
    border: "rgba(6,182,212,0.25)",
    glow: "rgba(6,182,212,0.12)",
  },
  {
    type: "tweet_thread",
    label: "Tweet Thread",
    sub: "Share ideas",
    icon: Twitter,
    gradient: "from-sky-600/20 to-sky-500/5",
    accent: "#0ea5e9",
    border: "rgba(14,165,233,0.25)",
    glow: "rgba(14,165,233,0.12)",
  },
  {
    type: "executive_brief",
    label: "Exec Brief",
    sub: "2-min read",
    icon: Zap,
    gradient: "from-indigo-600/20 to-indigo-500/5",
    accent: "#6366f1",
    border: "rgba(99,102,241,0.25)",
    glow: "rgba(99,102,241,0.12)",
  },
];

const TYPE_LABELS: Record<string, string> = {
  summary: "Summary", key_insights: "Key Insights", mcq: "Quiz",
  flashcards: "Flashcards", notes: "Study Notes", ppt_outline: "PPT Outline",
  blog_article: "Blog Article", action_plan: "Action Plan", vocabulary: "Vocabulary",
  tweet_thread: "Tweet Thread", executive_brief: "Executive Brief",
};

/* ─── Download helper ───────────────────────────────────────── */
function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── Template picker modal ─────────────────────────────────── */
function QuizTemplatePicker({ onSelect, onClose }: { onSelect: (tplId: number) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto hide-scrollbar"
        style={{ background: "var(--vv-card-bg)", border: "1px solid var(--vv-card-border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[9px] font-mono-ui uppercase tracking-widest text-muted-foreground mb-1">// EXPORT</div>
            <h3 className="font-display font-bold text-lg text-foreground">Choose Quiz Template</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {QUIZ_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl.id)}
              className="text-left p-3 rounded-xl border transition-all hover:border-primary/40 hover:bg-primary/5 group"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
            >
              <div className="text-[9px] font-mono-ui uppercase tracking-wider text-muted-foreground mb-1">Template {tpl.id}</div>
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{tpl.name}</div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Content card ──────────────────────────────────────────── */
function AiOutputCard({
  output,
  tool,
  videoTitle,
  channelName,
  onDelete,
}: {
  output: any;
  tool: typeof AI_TOOLS[0] | undefined;
  videoTitle: string;
  channelName?: string;
  onDelete: (id: string) => void;
}) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const isQuiz = output.type === "mcq";
  const parsedQuiz = isQuiz ? parseQuizContent(output.content) : null;
  const contentHtml = mdToHtml(output.content);
  const accent = tool?.accent || "#8b5cf6";
  const border = tool?.border || "rgba(139,92,246,0.2)";
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleDownload = (tplId?: number) => {
    if (isQuiz && parsedQuiz && parsedQuiz.questions.length > 0) {
      const tpl = QUIZ_TEMPLATES.find(t => t.id === (tplId ?? 4)) ?? QUIZ_TEMPLATES[3];
      const html = tpl.fn({
        title: videoTitle,
        videoTitle,
        channelName,
        questions: parsedQuiz.questions,
        generatedAt: now,
      });
      downloadHtml(html, `${videoTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}_quiz_${tpl.name.replace(/ /g, "_")}.html`);
    } else {
      const html = contentExportTemplate({
        title: videoTitle,
        videoTitle,
        channelName,
        content: output.content,
        contentHtml,
        type: output.type,
        generatedAt: now,
      });
      downloadHtml(html, `${videoTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}_${output.type}.html`);
    }
    setShowTemplatePicker(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--vv-card-bg)", border: `1px solid ${border}`, borderLeft: `3px solid ${accent}` }}
      >
        {/* Card header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          style={{ borderBottom: expanded ? `1px solid var(--vv-border)` : "none" }}
          onClick={() => setExpanded(e => !e)}
        >
          {tool && (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${accent}18`, border: `1px solid ${border}` }}>
              <tool.icon className="w-3.5 h-3.5" style={{ color: accent }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-mono-ui uppercase tracking-widest block" style={{ color: accent }}>
              {TYPE_LABELS[output.type] || output.type.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            {isQuiz && parsedQuiz && parsedQuiz.questions.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setShowQuiz(q => !q); setExpanded(true); }}
                className="flex items-center gap-1 text-[9px] font-mono-ui uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: showQuiz ? "#22c55e18" : "var(--vv-surface)", border: `1px solid ${showQuiz ? 'rgba(34,197,94,0.3)' : 'var(--vv-card-border)'}`, color: showQuiz ? "#4ade80" : "var(--vv-text-muted)" }}
              >
                {showQuiz ? <><X className="w-2.5 h-2.5" /> Exit</> : <><CheckSquare className="w-2.5 h-2.5" /> Take Quiz</>}
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); isQuiz ? setShowTemplatePicker(true) : handleDownload(); }}
              className="p-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
              title="Download HTML"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(output.id); }}
              className="p-1.5 rounded-lg transition-all text-muted-foreground hover:text-red-400"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card body */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-4">
                {showQuiz && isQuiz && parsedQuiz ? (
                  <InteractiveQuiz questions={parsedQuiz.questions} />
                ) : (
                  <div
                    className="prose prose-sm max-w-none leading-relaxed
                      prose-headings:font-display prose-headings:font-bold
                      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                      prose-strong:font-semibold
                      prose-code:text-xs prose-code:font-mono prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                      prose-ul:space-y-1
                      prose-blockquote:border-l-2 prose-blockquote:border-primary/40 prose-blockquote:not-italic
                      prose-hr:border-border/30"
                    style={{ color: "var(--vv-text)" }}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Template picker modal */}
      <AnimatePresence>
        {showTemplatePicker && (
          <QuizTemplatePicker
            onSelect={tplId => handleDownload(tplId)}
            onClose={() => setShowTemplatePicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Shared AI Outputs + Notes panel ──────────────────────── */
function AiNotesPanel({
  video, activeTab, setActiveTab, generatingType, noteText, setNoteText,
  handleDelete, handleDownloadNotes, isMobile = false,
}: {
  video: any;
  activeTab: "notes" | "ai";
  setActiveTab: (t: "notes" | "ai") => void;
  generatingType: string | null;
  noteText: string;
  setNoteText: (t: string) => void;
  handleDelete: (id: string) => void;
  handleDownloadNotes: () => void;
  isMobile?: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [savingNote, setSavingNote] = useState(false);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await fetch(`/api/videos/${video.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim(), timestamp: null }),
      });
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${video.id}`] });
      toast({ title: "Note saved" });
    } catch {
      toast({ title: "Failed to save note", variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className={`flex flex-col ${isMobile ? "gap-3" : "h-full gap-3"}`}>
      {/* Tab switcher */}
      <div className="flex p-1 rounded-xl" style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}>
        <button
          onClick={() => setActiveTab("ai")}
          className="flex-1 py-2 text-xs font-mono-ui uppercase tracking-wider rounded-lg transition-all"
          style={{
            background: activeTab === "ai" ? "#8b5cf6" : "transparent",
            color: activeTab === "ai" ? "#fff" : "var(--vv-text-muted)",
          }}
        >
          AI Outputs {(video.aiOutputs?.length ?? 0) > 0 && `(${video.aiOutputs!.length})`}
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className="flex-1 py-2 text-xs font-mono-ui uppercase tracking-wider rounded-lg transition-all"
          style={{
            background: activeTab === "notes" ? "#8b5cf6" : "transparent",
            color: activeTab === "notes" ? "#fff" : "var(--vv-text-muted)",
          }}
        >
          My Notes {(video.notes?.length ?? 0) > 0 && `(${video.notes!.length})`}
        </button>
      </div>

      {/* Tab content */}
      <div
        className={`rounded-2xl hide-scrollbar ${isMobile ? "max-h-[70vh] overflow-y-auto" : "flex-1 overflow-y-auto"}`}
        style={{ background: "var(--vv-bg)", border: "1px solid var(--vv-border)" }}
      >
        {/* AI Outputs */}
        {activeTab === "ai" && (
          <div className="p-3 space-y-3">
            {generatingType && (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-foreground">Generating {TYPE_LABELS[generatingType]}…</div>
                  <div className="text-[10px] text-muted-foreground font-mono-ui">AI is processing your video</div>
                </div>
              </div>
            )}
            {(video.aiOutputs?.length ?? 0) === 0 && !generatingType ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground/60 mb-1">No AI content yet</p>
                <p className="text-xs text-muted-foreground">Tap any tool card to generate insights</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(video.aiOutputs || []).map((output: any) => (
                  <AiOutputCard
                    key={output.id}
                    output={output}
                    tool={AI_TOOLS.find(t => t.type === output.type)}
                    videoTitle={video.title}
                    channelName={video.channelName || undefined}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {activeTab === "notes" && (
          <div className={`flex flex-col ${isMobile ? "" : "h-full"} p-3`}>
            <div className={`space-y-2 overflow-y-auto hide-scrollbar ${isMobile ? "max-h-64" : "flex-1"}`}>
              {(video.notes || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <StickyNote className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground/60 mb-1">No notes yet</p>
                  <p className="text-xs text-muted-foreground">Jot down ideas below</p>
                </div>
              ) : (
                (video.notes || []).map((note: any) => (
                  <div key={note.id}
                    className="rounded-xl p-3 relative"
                    style={{ background: "var(--vv-card-bg)", border: "1px solid var(--vv-card-border)", borderLeft: "3px solid rgba(139,92,246,0.4)" }}>
                    {note.timestamp !== null && (
                      <span className="inline-flex items-center text-[10px] font-mono-ui text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded mb-2">
                        {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                    <p className="text-sm text-foreground/85 leading-relaxed">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Note input */}
            <div className="pt-3 mt-2 border-t" style={{ borderColor: "var(--vv-border)" }}>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="w-full bg-transparent border rounded-xl text-sm resize-none px-3 py-2.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-colors"
                style={{ borderColor: "var(--vv-card-border)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--vv-card-border)")}
                placeholder="Take a note…"
                rows={3}
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveNote();
                }}
              />
              <div className="flex items-center justify-between mt-2">
                {(video.notes?.length ?? 0) > 0 && (
                  <button
                    onClick={handleDownloadNotes}
                    className="flex items-center gap-1.5 text-[10px] font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}
                  >
                    <Download className="w-3 h-3" /> Export
                  </button>
                )}
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim() || savingNote}
                  className="ml-auto text-xs px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-30 flex items-center gap-1.5"
                  style={{ background: "#8b5cf6", color: "#fff" }}
                >
                  {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading } = useGetVideo(id || "");
  const [activeTab, setActiveTab] = useState<"notes" | "ai">("ai");
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const generateMutation = useGenerateAiContent();
  const queryClient = useQueryClient();

  const handleGenerate = useCallback(async (type: string) => {
    if (!video) return;
    setGeneratingType(type);
    try {
      await generateMutation.mutateAsync({ videoId: video.id, data: { type: type as any } });
      toast({ title: "Generated!", description: `${TYPE_LABELS[type] || type} is ready.` });
    } catch {
      toast({ title: "Generation failed", description: "Check your AI configuration.", variant: "destructive" });
    } finally {
      setGeneratingType(null);
    }
  }, [video, generateMutation, toast]);

  const handleDelete = useCallback(async (outputId: string) => {
    if (!video) return;
    try {
      await fetch(`/api/videos/${video.id}/ai/outputs/${outputId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${video.id}`] });
      toast({ title: "Deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }, [video, queryClient, toast]);

  const handleDownloadNotes = () => {
    if (!video) return;
    const html = notesExportTemplate({
      videoTitle: video.title,
      channelName: video.channelName || undefined,
      notes: (video.notes || []).map(n => ({ content: n.content, timestamp: n.timestamp ?? null })),
    });
    downloadHtml(html, `${video.title.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}_notes.html`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return <div className="text-center py-20 text-muted-foreground">Video not found.</div>;
  }

  const ytId = extractYoutubeId(video.url);
  const aiOutputMap: Record<string, any> = {};
  (video.aiOutputs || []).forEach(o => { aiOutputMap[o.type] = o; });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-500">
      {/* ── Left column: Player + info + AI tools ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video player */}
        <div className="rounded-xl overflow-hidden aspect-video shadow-2xl" style={{ background: "var(--vv-surface)" }}>
          {ytId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Invalid Video URL</div>
          )}
        </div>

        {/* Video info */}
        <div className="space-y-2.5">
          <h1 className="text-lg sm:text-xl font-display font-bold text-foreground leading-tight">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground/80 text-sm">{video.channelName}</span>
            {video.publishedAt && (
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="w-3 h-3" />
                {format(new Date(video.publishedAt), "MMM d, yyyy")}
              </span>
            )}
            {video.folderName && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-secondary/60">
                <FolderIcon className="w-3 h-3" /> {video.folderName}
              </span>
            )}
          </div>
          {video.description && (
            <div
              className="rounded-xl p-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-24 overflow-y-auto hide-scrollbar leading-relaxed"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
            >
              {video.description}
            </div>
          )}
        </div>

        {/* ── AI Tool Cards ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[9px] font-mono-ui uppercase tracking-[0.3em] text-muted-foreground">//AI_STUDIO</div>
            <div className="flex-1 h-px" style={{ background: "var(--vv-border)" }} />
            {generatingType && (
              <span className="text-[9px] font-mono-ui text-primary animate-pulse flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Generating {TYPE_LABELS[generatingType]}…
              </span>
            )}
          </div>
          {/* Scrollable on very small screens */}
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2">
            {AI_TOOLS.map(tool => {
              const isGenerating = generatingType === tool.type;
              const hasOutput = !!aiOutputMap[tool.type];
              const Icon = tool.icon;

              return (
                <button
                  key={tool.type}
                  onClick={() => handleGenerate(tool.type)}
                  disabled={!!generatingType}
                  className="relative group flex flex-col items-start gap-1.5 p-2.5 sm:p-3 rounded-xl text-left transition-all duration-200 overflow-hidden touch-manipulation"
                  style={{
                    background: hasOutput ? `linear-gradient(135deg, ${tool.accent}12, var(--vv-card-bg))` : "var(--vv-card-bg)",
                    border: `1px solid ${hasOutput ? tool.border : 'var(--vv-card-border)'}`,
                    opacity: generatingType && !isGenerating ? 0.45 : 1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!generatingType) {
                      (e.currentTarget as HTMLElement).style.borderColor = tool.border;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${tool.glow}`;
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = hasOutput ? tool.border : 'var(--vv-card-border)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 30% 50%, ${tool.glow}, transparent 70%)` }} />

                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center relative z-10 flex-shrink-0"
                    style={{ background: `${tool.accent}18`, border: `1px solid ${tool.border}` }}>
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: tool.accent }} />
                    ) : (
                      <Icon className="w-3.5 h-3.5" style={{ color: tool.accent }} />
                    )}
                  </div>

                  <div className="relative z-10 min-w-0">
                    <div className="text-[11px] sm:text-xs font-semibold text-foreground/90 leading-tight truncate">{tool.label}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{tool.sub}</div>
                  </div>

                  {hasOutput && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: tool.accent }} />
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 rounded-xl border animate-pulse" style={{ borderColor: tool.accent, opacity: 0.4 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── On mobile: AI outputs + Notes shown inline below tools ── */}
        <div className="lg:hidden">
          <AiNotesPanel
            video={video}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            generatingType={generatingType}
            noteText={noteText}
            setNoteText={setNoteText}
            handleDelete={handleDelete}
            handleDownloadNotes={handleDownloadNotes}
            isMobile
          />
        </div>
      </div>

      {/* ── Right column: sticky panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col lg:h-[calc(100vh-6rem)] lg:sticky lg:top-24">
        <AiNotesPanel
          video={video}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          generatingType={generatingType}
          noteText={noteText}
          setNoteText={setNoteText}
          handleDelete={handleDelete}
          handleDownloadNotes={handleDownloadNotes}
        />
      </div>
    </div>
  );
}
