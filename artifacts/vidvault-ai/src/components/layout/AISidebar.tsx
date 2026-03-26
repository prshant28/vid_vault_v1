import { X, Sparkles, Send, FileText, LayoutList, CheckSquare, Layers } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUI } from "@/contexts/ui-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAiChat, useGenerateAiContent, useGetVideo } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function AISidebar() {
  const { isAiSidebarOpen, setAiSidebarOpen, activeVideoId } = useUI();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: 'Hi there! I am your VidVault AI. How can I help you extract insights today?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useAiChat();
  const generateMutation = useGenerateAiContent();
  const { data: activeVideo } = useGetVideo(activeVideoId || "", { query: { enabled: !!activeVideoId }});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || chatMutation.isPending) return;
    
    const userMsg = query;
    setQuery("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await chatMutation.mutateAsync({
        data: {
          message: userMsg,
          videoId: activeVideoId,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.message }]);
    } catch (e) {
      toast({ title: "Failed to send message", variant: "destructive" });
      setMessages(prev => prev.slice(0, -1)); // Revert
    }
  };

  const handleQuickAction = async (type: "summary" | "notes" | "ppt_outline" | "mcq" | "flashcards" | "key_insights") => {
    if (!activeVideoId) {
      toast({ title: "Please select a video first", variant: "destructive" });
      return;
    }
    
    setMessages(prev => [...prev, { role: 'user', content: `Generate ${type.replace('_', ' ')} for the current video.` }]);
    
    try {
      const res = await generateMutation.mutateAsync({
        videoId: activeVideoId,
        data: { type }
      });
      setMessages(prev => [...prev, { role: 'ai', content: `Here is your ${type.replace('_', ' ')}:\n\n${res.content}` }]);
    } catch (e) {
      toast({ title: "Failed to generate content", variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      {isAiSidebarOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/20 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setAiSidebarOpen(false)}
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[400px] z-50 flex flex-col"
            style={{
              background: "#080809",
              borderLeft: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div>
                <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em] block mb-1">
                  //AI_STUDIO
                </span>
                <h3 className="font-black text-white text-sm uppercase tracking-wider">
                  {activeVideo ? activeVideo.title.substring(0, 25) + "…" : "VidVault AI"}
                </h3>
              </div>
              <button
                onClick={() => setAiSidebarOpen(false)}
                className="text-[#333] hover:text-white transition-colors p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            {activeVideoId && (
              <div className="px-4 py-3 border-b grid grid-cols-2 gap-2" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {[
                  { label: "SUMMARY", action: "summary" as const, icon: FileText },
                  { label: "INSIGHTS", action: "key_insights" as const, icon: Sparkles },
                  { label: "QUIZ_MCQ", action: "mcq" as const, icon: CheckSquare },
                  { label: "PPT_OUTLINE", action: "ppt_outline" as const, icon: LayoutList },
                ].map(({ label, action, icon: Icon }) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-2 px-3 py-2.5 text-[#555] hover:text-white transition-all group font-mono-ui text-[9px] uppercase tracking-widest"
                    style={{
                      background: "#0f0f10",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.3)";
                      (e.currentTarget as HTMLElement).style.color = "#8b5cf6";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.color = "#555";
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="w-5 h-5 mr-2 mt-1 shrink-0 flex items-center justify-center font-mono-ui font-black text-[#8b5cf6] text-[8px]"
                      style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      AI
                    </div>
                  )}
                  <div
                    className="max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      padding: "10px 14px",
                      background: msg.role === "user" ? "#8b5cf6" : "#111113",
                      color: msg.role === "user" ? "#fff" : "#aaa",
                      border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.04)",
                      fontFamily: msg.role === "ai" ? "'JetBrains Mono', monospace" : "inherit",
                      fontSize: msg.role === "ai" ? "0.75rem" : "0.875rem",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {(chatMutation.isPending || generateMutation.isPending) && (
                <div className="flex justify-start">
                  <div className="flex gap-1.5 px-4 py-3" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-1.5 h-1.5 bg-[#8b5cf6] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#8b5cf6] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#8b5cf6] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ASK ANYTHING..."
                  className="flex-1 h-10 bg-transparent border text-white text-xs font-mono-ui uppercase tracking-widest px-3 placeholder:text-[#222] focus:outline-none transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || chatMutation.isPending}
                  className="w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-30 transition-all"
                  style={{
                    background: "#8b5cf6",
                    clipPath: "polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)",
                  }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
