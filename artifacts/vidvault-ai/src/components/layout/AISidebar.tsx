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
            initial={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
            animate={{ x: 0, boxShadow: "-20px 0 40px rgba(0,0,0,0.3)" }}
            exit={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-card/95 backdrop-blur-2xl border-l border-white/5 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground leading-none">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeVideo ? `Context: ${activeVideo.title.substring(0, 30)}...` : "Global Context"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAiSidebarOpen(false)} className="rounded-full hover:bg-secondary">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 hide-scrollbar">
              {activeVideoId && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start bg-secondary/30 border-white/5 hover:bg-secondary" onClick={() => handleQuickAction('summary')}>
                    <FileText className="w-4 h-4 mr-2 text-primary" /> Summary
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start bg-secondary/30 border-white/5 hover:bg-secondary" onClick={() => handleQuickAction('key_insights')}>
                    <Sparkles className="w-4 h-4 mr-2 text-accent" /> Key Insights
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start bg-secondary/30 border-white/5 hover:bg-secondary" onClick={() => handleQuickAction('mcq')}>
                    <CheckSquare className="w-4 h-4 mr-2 text-green-500" /> Quiz MCQs
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start bg-secondary/30 border-white/5 hover:bg-secondary" onClick={() => handleQuickAction('ppt_outline')}>
                    <LayoutList className="w-4 h-4 mr-2 text-orange-500" /> PPT Outline
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-secondary/50 text-foreground rounded-tl-sm border border-white/5'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {(chatMutation.isPending || generateMutation.isPending) && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/50 rounded-2xl rounded-tl-sm p-4 border border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-100" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 border-t border-border/50 bg-background/50">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full pr-12 rounded-full bg-secondary/50 border-transparent focus-visible:ring-primary/30 h-12"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!query.trim() || chatMutation.isPending}
                  className="absolute right-1 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
