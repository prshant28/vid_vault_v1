import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { marked } from "marked";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, Copy, Printer, FileText, RefreshCw,
  Sparkles, CheckSquare, Layers, BookOpen, Presentation,
  Brain, Target, BookMarked, Twitter, Zap, Check, X,
  Languages,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { contentExportTemplate, QUIZ_TEMPLATES } from "@/lib/html-templates";
import { parseQuizContent } from "@/lib/quiz-parser";
import { InteractiveQuiz } from "@/components/ai/InteractiveQuiz";
import { AnimatePresence } from "framer-motion";

marked.setOptions({ breaks: true });

function mdToHtml(t: string): string {
  try {
    const result = marked.parse(t, { async: false });
    return typeof result === "string" ? result : `<p>${t}</p>`;
  } catch { return `<p>${t}</p>`; }
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; accent: string; border: string }> = {
  summary:        { label: "Summary",        icon: FileText,    accent: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  key_insights:   { label: "Key Insights",   icon: Sparkles,    accent: "#8b5cf6", border: "rgba(139,92,246,0.25)" },
  mcq:            { label: "Quiz",           icon: CheckSquare, accent: "#22c55e", border: "rgba(34,197,94,0.25)" },
  flashcards:     { label: "Flashcards",     icon: Layers,      accent: "#ec4899", border: "rgba(236,72,153,0.25)" },
  notes:          { label: "Study Notes",    icon: BookOpen,    accent: "#f59e0b", border: "rgba(245,158,11,0.25)" },
  ppt_outline:    { label: "PPT Outline",    icon: Presentation,accent: "#f97316", border: "rgba(249,115,22,0.25)" },
  blog_article:   { label: "Blog Article",   icon: Brain,       accent: "#14b8a6", border: "rgba(20,184,166,0.25)" },
  action_plan:    { label: "Action Plan",    icon: Target,      accent: "#ef4444", border: "rgba(239,68,68,0.25)" },
  vocabulary:     { label: "Vocabulary",     icon: BookMarked,  accent: "#06b6d4", border: "rgba(6,182,212,0.25)" },
  tweet_thread:   { label: "Tweet Thread",   icon: Twitter,     accent: "#0ea5e9", border: "rgba(14,165,233,0.25)" },
  executive_brief:{ label: "Executive Brief",icon: Zap,         accent: "#6366f1", border: "rgba(99,102,241,0.25)" },
};

const LANGS = [
  { code: "en", label: "EN", full: "English" },
  { code: "hi", label: "हिं", full: "Hindi" },
];

const LANG_KEY = "vv_ai_language";

function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openPrintWindow(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 300);
    });
  } else {
    const a = document.createElement("a");
    a.href = url; a.download = "report.html"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function QuizTemplatePicker({ onSelect, onClose }: { onSelect: (id: number) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
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

function LangToggle({ lang, onChange }: { lang: string; onChange: (l: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg overflow-hidden p-0.5" style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}>
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          title={`Generate in ${l.full}`}
          className="px-2 py-1 rounded-md text-[9px] font-mono-ui uppercase tracking-wider transition-all"
          style={{
            background: lang === l.code ? "#8b5cf6" : "transparent",
            color: lang === l.code ? "#fff" : "var(--vv-text-muted)",
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export default function AiOutputView() {
  const { id: videoId, type } = useParams<{ id: string; type: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [lang, setLang] = useState<string>(() => {
    try { return localStorage.getItem(LANG_KEY) || "en"; } catch { return "en"; }
  });

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [`/api/videos/${videoId}/ai/outputs/type/${type}`],
    queryFn: async () => {
      const resp = await fetch(`/api/videos/${videoId}/ai/outputs/type/${type}`);
      if (!resp.ok) throw new Error("Failed to load");
      return resp.json() as Promise<{ video: any; output: any | null }>;
    },
    enabled: !!videoId && !!type,
  });

  const meta = TYPE_META[type] || { label: type, icon: FileText, accent: "#8b5cf6", border: "rgba(139,92,246,0.25)" };
  const Icon = meta.icon;
  const videoTitle = data?.video?.title || "Video";
  const channelName = data?.video?.channelName || "";
  const output = data?.output;
  const contentHtml = output ? mdToHtml(output.content) : "";
  const isQuiz = type === "mcq";
  const parsedQuiz = isQuiz && output ? parseQuizContent(output.content) : null;
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const safeFilename = videoTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 40);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output.content);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    if (!output) return;
    downloadMarkdown(output.content, `${safeFilename}_${type}.md`);
    toast({ title: "Downloaded as Markdown" });
  };

  const handleDownloadHtml = (tplId?: number) => {
    if (!output) return;
    if (isQuiz && parsedQuiz && parsedQuiz.questions.length > 0) {
      const tpl = QUIZ_TEMPLATES.find(t => t.id === (tplId ?? 4)) ?? QUIZ_TEMPLATES[3];
      const html = tpl.fn({ title: videoTitle, videoTitle, channelName, questions: parsedQuiz.questions, generatedAt: now });
      downloadHtml(html, `${safeFilename}_quiz_${tpl.name.replace(/ /g, "_")}.html`);
      toast({ title: `Downloaded: ${tpl.name}` });
      setShowTemplatePicker(false);
    } else {
      const html = contentExportTemplate({ title: videoTitle, videoTitle, channelName, content: output.content, contentHtml, type: output.type, generatedAt: now });
      downloadHtml(html, `${safeFilename}_${type}.html`);
      toast({ title: "Downloaded as HTML Report" });
    }
  };

  const handleHtmlClick = () => {
    if (!output) return;
    if (isQuiz && parsedQuiz && parsedQuiz.questions.length > 0) {
      setShowTemplatePicker(true);
    } else {
      handleDownloadHtml();
    }
  };

  const handlePrint = () => {
    if (!output) return;
    const html = contentExportTemplate({
      title: videoTitle, videoTitle, channelName,
      content: output.content, contentHtml,
      type: output.type, generatedAt: now,
    });
    openPrintWindow(html);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const resp = await fetch(`/api/videos/${videoId}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, language: lang }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Generation failed");
      }
      await refetch();
      const langLabel = lang === "hi" ? " (Hindi)" : "";
      toast({ title: "Regenerated!", description: `${meta.label}${langLabel} has been refreshed.` });
    } catch (err: any) {
      toast({ title: "Failed to regenerate", description: err.message, variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
    <AnimatePresence>
      {showTemplatePicker && (
        <QuizTemplatePicker
          onSelect={id => handleDownloadHtml(id)}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </AnimatePresence>
    <div className="min-h-screen" style={{ background: "var(--vv-bg)" }}>
      {/* ── Header bar ── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3 border-b"
        style={{ background: "var(--vv-sidebar)", borderColor: "var(--vv-border)", backdropFilter: "blur(12px)" }}
      >
        <button
          onClick={() => navigate(`/videos/${videoId}`)}
          className="flex items-center gap-1.5 text-xs font-mono-ui uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground"
          style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${meta.accent}18`, border: `1px solid ${meta.border}` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: meta.accent }} />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-mono-ui uppercase tracking-widest" style={{ color: meta.accent }}>
              {meta.label}
            </div>
            <div className="text-sm font-semibold text-foreground truncate hidden sm:block">{videoTitle}</div>
          </div>
        </div>

        {/* Language toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Languages className="w-3 h-3 text-muted-foreground hidden sm:block" />
          <LangToggle lang={lang} onChange={setLang} />
        </div>

        {/* Export toolbar */}
        {output && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[10px] font-mono-ui uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)", color: copied ? "#22c55e" : "var(--vv-text-muted)" }}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 text-[10px] font-mono-ui uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
              title="Download as Markdown"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">.md</span>
            </button>
            <button
              onClick={handleHtmlClick}
              className="flex items-center gap-1.5 text-[10px] font-mono-ui uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
              title={isQuiz ? "Choose quiz template" : "Download HTML report"}
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">.html</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-[10px] font-mono-ui uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all text-muted-foreground hover:text-foreground"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
              title="Print / Save as PDF"
            >
              <Printer className="w-3 h-3" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 text-[10px] font-mono-ui uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: regenerating ? "rgba(139,92,246,0.1)" : "var(--vv-surface)", border: `1px solid ${regenerating ? "rgba(139,92,246,0.3)" : "var(--vv-card-border)"}`, color: regenerating ? "#a78bfa" : "var(--vv-text-muted)" }}
              title={`Regenerate in ${lang === "hi" ? "Hindi" : "English"}`}
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{regenerating ? "Generating…" : "Regenerate"}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 rounded" style={{ background: "var(--vv-surface)", width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        ) : !output ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: `${meta.accent}18`, border: `1px solid ${meta.border}` }}
            >
              <Icon className="w-7 h-7" style={{ color: meta.accent }} />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{meta.label} not generated yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Go back and click the tool card to generate this content.</p>
            <button
              onClick={() => navigate(`/videos/${videoId}`)}
              className="text-sm px-5 py-2 rounded-xl font-medium"
              style={{ background: "#8b5cf6", color: "#fff" }}
            >
              ← Back to Video
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title block */}
            <div className="pb-4 border-b" style={{ borderColor: "var(--vv-border)" }}>
              <div className="text-[9px] font-mono-ui uppercase tracking-[0.3em] mb-1" style={{ color: meta.accent }}>
                // {meta.label}
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground leading-tight">{videoTitle}</h1>
              {channelName && (
                <p className="text-sm text-muted-foreground mt-1">{channelName}</p>
              )}
              <p className="text-[10px] font-mono-ui text-muted-foreground mt-2">
                Generated {new Date(output.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* Quiz toggle */}
            {isQuiz && parsedQuiz && parsedQuiz.questions.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuiz(q => !q)}
                  className="flex items-center gap-2 text-xs font-mono-ui uppercase tracking-wider px-4 py-2 rounded-lg transition-all"
                  style={{
                    background: showQuiz ? "#22c55e18" : "var(--vv-surface)",
                    border: `1px solid ${showQuiz ? "rgba(34,197,94,0.3)" : "var(--vv-card-border)"}`,
                    color: showQuiz ? "#4ade80" : "var(--vv-text-muted)",
                  }}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {showQuiz ? "Exit Quiz Mode" : "Take Interactive Quiz"}
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className="rounded-2xl p-5 sm:p-8"
              style={{ background: "var(--vv-card-bg)", border: `1px solid ${meta.border}`, borderLeft: `3px solid ${meta.accent}` }}
            >
              {showQuiz && parsedQuiz ? (
                <InteractiveQuiz questions={parsedQuiz.questions} />
              ) : (
                <div
                  className="prose prose-sm sm:prose max-w-none leading-relaxed
                    prose-headings:font-display prose-headings:font-bold
                    prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                    prose-strong:font-semibold
                    prose-code:text-xs prose-code:font-mono prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-ul:space-y-1.5 prose-ol:space-y-1.5
                    prose-blockquote:border-l-2 prose-blockquote:border-primary/40 prose-blockquote:not-italic
                    prose-hr:border-border/30"
                  style={{ color: "var(--vv-text)" }}
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              )}
            </div>

            {/* Bottom export bar */}
            <div
              className="rounded-xl p-4 flex flex-wrap items-center gap-2"
              style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-card-border)" }}
            >
              <span className="text-[9px] font-mono-ui uppercase tracking-wider text-muted-foreground mr-1">Export:</span>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all hover:border-primary/40 hover:text-foreground text-muted-foreground" style={{ borderColor: "var(--vv-card-border)" }}>
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} Copy Text
              </button>
              <button onClick={handleDownloadMd} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all hover:border-primary/40 hover:text-foreground text-muted-foreground" style={{ borderColor: "var(--vv-card-border)" }}>
                <Download className="w-3 h-3" /> Markdown
              </button>
              <button onClick={handleHtmlClick} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all hover:border-primary/40 hover:text-foreground text-muted-foreground" style={{ borderColor: "var(--vv-card-border)" }}>
                <Download className="w-3 h-3" /> {isQuiz ? "HTML Quiz" : "HTML Report"}
              </button>
              <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all hover:border-primary/40 hover:text-foreground text-muted-foreground" style={{ borderColor: "var(--vv-card-border)" }}>
                <Printer className="w-3 h-3" /> Print / PDF
              </button>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[9px] font-mono-ui uppercase tracking-wider text-muted-foreground">Regenerate in:</span>
                <LangToggle lang={lang} onChange={setLang} />
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
                  style={{ borderColor: regenerating ? "rgba(139,92,246,0.4)" : "var(--vv-card-border)", color: regenerating ? "#a78bfa" : "var(--vv-text-muted)" }}
                >
                  <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
                  {regenerating ? "Generating…" : "Regenerate"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}
