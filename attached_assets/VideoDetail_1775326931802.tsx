import { useParams } from "wouter";
import { useGetVideo, useGenerateAiContent } from "@workspace/api-client-react";
import { extractYoutubeId } from "@/lib/youtube";
import {
  Loader2, Calendar, Folder as FolderIcon, Sparkles,
  FileText, CheckSquare, Presentation, Lightbulb,
  BookOpen, FlaskConical, AlignLeft, Brain,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const AI_TOOLS = [
  {
    type: "summary",
    label: "Summary",
    code: "01",
    icon: AlignLeft,
    accent: "#8b5cf6",
    description: "Concise overview of the video content",
  },
  {
    type: "key_insights",
    label: "Key Insights",
    code: "02",
    icon: Lightbulb,
    accent: "#06b6d4",
    description: "Most important takeaways",
  },
  {
    type: "mcq",
    label: "Quiz (MCQ)",
    code: "03",
    icon: CheckSquare,
    accent: "#10b981",
    description: "Test your knowledge",
  },
  {
    type: "ppt_outline",
    label: "PPT Outline",
    code: "04",
    icon: Presentation,
    accent: "#f59e0b",
    description: "Slide structure for presentation",
  },
  {
    type: "flashcards",
    label: "Flashcards",
    code: "05",
    icon: BookOpen,
    accent: "#ec4899",
    description: "Q&A cards for study",
  },
  {
    type: "study_notes",
    label: "Study Notes",
    code: "06",
    icon: Brain,
    accent: "#f97316",
    description: "Detailed notes for revision",
  },
];

function AiToolCard({
  tool,
  onClick,
  loading,
  active,
}: {
  tool: typeof AI_TOOLS[0];
  onClick: () => void;
  loading: boolean;
  active: boolean;
}) {
  const Icon = tool.icon;
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading}
      className="etched-slab p-4 relative overflow-hidden group text-left w-full"
      style={{
        border: active
          ? `1px solid ${tool.accent}50`
          : "1px solid rgba(255,255,255,0.04)",
        opacity: loading && !active ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono-ui text-[8px] text-[#333] uppercase tracking-[0.3em]">{tool.code}</span>
          {active && loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: tool.accent }} />
          ) : (
            <Icon className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity"
              style={{ color: tool.accent }} />
          )}
        </div>
        <p className="font-mono-ui text-[9px] uppercase tracking-widest mb-1"
          style={{ color: tool.accent + "99" }}>
          {tool.label}
        </p>
        <p className="font-mono-ui text-[8px] text-[#333] leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>
      <div
        className="absolute bottom-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle, ${tool.accent}20, transparent)` }}
      />
    </motion.button>
  );
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading } = useGetVideo(id || "");
  const [activeTab, setActiveTab] = useState<"notes" | "ai">("ai");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const generateMutation = useGenerateAiContent();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#8b5cf6]" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-20 font-mono-ui text-[#333] text-xs uppercase tracking-widest">
        VIDEO_NOT_FOUND
      </div>
    );
  }

  const ytId = extractYoutubeId(video.url);

  const handleGenerate = async (type: string) => {
    setActiveTool(type);
    try {
      await generateMutation.mutateAsync({ videoId: video.id, data: { type } as any });
      toast({ title: "Generated successfully!" });
    } catch {
      toast({ title: "AI generation failed", description: "Please ensure OpenAI is configured.", variant: "destructive" });
    } finally {
      setActiveTool(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      {/* ── Left: Player & Info ── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Video player */}
        <div className="rounded-2xl overflow-hidden aspect-video shadow-2xl"
          style={{ background: "#0a0a0b", border: "1px solid rgba(255,255,255,0.06)" }}>
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#333]">
              <FlaskConical className="w-8 h-8" />
              <span className="font-mono-ui text-[10px] uppercase tracking-widest">INVALID_VIDEO_URL</span>
            </div>
          )}
        </div>

        {/* Title & meta */}
        <div className="space-y-4">
          <h1
            className="font-black lp-heading leading-tight"
            style={{
              fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
              fontFamily: "'Alegreya Sans SC', serif",
            }}
          >
            {video.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {video.channelName && (
              <span className="font-mono-ui text-[10px] uppercase tracking-widest text-[#555]">
                {video.channelName}
              </span>
            )}
            {video.publishedAt && (
              <span className="flex items-center gap-1 font-mono-ui text-[10px] text-[#333] uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                {format(new Date(video.publishedAt), "MMM d, yyyy")}
              </span>
            )}
            {video.folderName && (
              <span className="flex items-center gap-1 font-mono-ui text-[10px] text-[#8b5cf6] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)" }}>
                <FolderIcon className="w-2.5 h-2.5" />
                {video.folderName}
              </span>
            )}
          </div>

          {video.description && (
            <div
              className="p-4 rounded-xl text-sm text-[#444] whitespace-pre-wrap max-h-36 overflow-y-auto hide-scrollbar"
              style={{ background: "#0e0e12", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              {video.description}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: AI & Notes ── */}
      <div className="flex flex-col lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]">
        {/* Tab switcher */}
        <div className="flex p-1 rounded-xl mb-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {(["ai", "notes"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 font-mono-ui text-[10px] uppercase tracking-widest rounded-lg transition-all"
              style={{
                background: activeTab === tab ? "rgba(139,92,246,0.12)" : "transparent",
                color: activeTab === tab ? "#8b5cf6" : "#444",
                border: activeTab === tab ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
              }}
            >
              {tab === "ai" ? "AI Insights" : "My Notes"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {/* ── AI tab ── */}
          {activeTab === "ai" && (
            <div className="space-y-5">
              {/* Tool header */}
              <div>
                <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em] block mb-1">
                  //AI_GENERATE
                </span>
                <p className="font-black lp-heading text-sm uppercase"
                  style={{ fontFamily: "'Alegreya Sans SC', serif" }}>
                  Choose a Tool
                </p>
              </div>

              {/* Tool cards grid — same etched-slab style as Home stats */}
              <div className="grid grid-cols-2 gap-3">
                {AI_TOOLS.map(tool => (
                  <AiToolCard
                    key={tool.type}
                    tool={tool}
                    onClick={() => handleGenerate(tool.type)}
                    loading={generateMutation.isPending}
                    active={activeTool === tool.type}
                  />
                ))}
              </div>

              {/* Generated outputs */}
              {video.aiOutputs && video.aiOutputs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em] block">
                    //GENERATED_OUTPUTS
                  </span>
                  {video.aiOutputs.map(output => {
                    const tool = AI_TOOLS.find(t => t.type === output.type);
                    return (
                      <div
                        key={output.id}
                        className="rounded-xl p-4"
                        style={{ background: "#0e0e12", border: `1px solid ${tool ? tool.accent + "20" : "rgba(255,255,255,0.05)"}` }}
                      >
                        <div className="flex items-center gap-2 mb-3 pb-2"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          {tool && <tool.icon className="w-3 h-3" style={{ color: tool.accent }} />}
                          <h4 className="font-mono-ui text-[9px] uppercase tracking-widest"
                            style={{ color: tool ? tool.accent : "#555" }}>
                            {output.type.replace(/_/g, " ")}
                          </h4>
                        </div>
                        <div className="text-sm text-[#888] whitespace-pre-wrap leading-relaxed"
                          style={{ fontFamily: "'Raleway', sans-serif" }}>
                          {output.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(!video.aiOutputs || video.aiOutputs.length === 0) && !generateMutation.isPending && (
                <div className="text-center py-10">
                  <Sparkles className="w-6 h-6 mx-auto mb-3 text-[#222]" />
                  <p className="font-mono-ui text-[9px] text-[#333] uppercase tracking-widest">
                    SELECT_A_TOOL_ABOVE
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Notes tab ── */}
          {activeTab === "notes" && (
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex-1 space-y-3">
                {video.notes?.map(note => (
                  <div key={note.id} className="rounded-xl p-4"
                    style={{ background: "#0e0e12", border: "1px solid rgba(255,255,255,0.05)" }}>
                    {note.timestamp !== null && (
                      <span className="font-mono-ui text-[9px] text-[#8b5cf6] uppercase tracking-widest block mb-2">
                        {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                    <p className="text-sm text-[#888]" style={{ fontFamily: "'Raleway', sans-serif" }}>
                      {note.content}
                    </p>
                  </div>
                ))}
                {(!video.notes || video.notes.length === 0) && (
                  <div className="text-center py-10">
                    <p className="font-mono-ui text-[9px] text-[#333] uppercase tracking-widest">
                      NO_NOTES_YET
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <textarea
                  className="w-full rounded-xl p-3 text-sm resize-none outline-none transition-all font-mono-ui text-[#888]"
                  style={{
                    background: "#0e0e12",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  placeholder="Take a note..."
                  rows={3}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                />
                <div className="flex justify-end mt-2">
                  <button
                    className="font-mono-ui text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg text-white"
                    style={{
                      background: "#8b5cf6",
                      clipPath: "polygon(5% 0%, 100% 0%, 100% 70%, 95% 100%, 0% 100%, 0% 30%)",
                    }}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
