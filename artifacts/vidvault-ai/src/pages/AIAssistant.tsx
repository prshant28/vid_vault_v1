import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUI } from "@/contexts/ui-context";

export default function AIAssistant() {
  const { setAiSidebarOpen } = useUI();

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="glass-panel p-10 rounded-3xl max-w-xl w-full text-center relative z-10 border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 mx-auto mb-6">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-4">VidVault Global AI</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            I can search across your entire vault, find connections between different videos, and answer overarching questions.
          </p>
          <Button 
            onClick={() => setAiSidebarOpen(true)}
            size="lg" 
            className="rounded-xl h-12 px-8 bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all font-semibold"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Open Assistant Panel
          </Button>
        </div>
      </div>
    </div>
  );
}
