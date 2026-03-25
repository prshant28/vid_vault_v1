import { Bot, Sparkles, Youtube, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden selection:bg-primary/30">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <header className="h-20 px-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-white">VidVault AI</span>
        </div>
        <Button onClick={handleLogin} variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/5">
          Sign In
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center relative z-10 px-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-accent mx-auto lg:mx-0">
              <Sparkles className="w-4 h-4" />
              The ultimate learning companion
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.1]">
              Your Second Brain for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Video Knowledge</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Transform hours of YouTube content into actionable insights, flashcards, and structured notes in seconds using advanced AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Button onClick={handleLogin} size="lg" className="rounded-full w-full sm:w-auto px-8 h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all">
                Get Started for Free
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blur-3xl rounded-full" />
            <div className="relative glass-panel rounded-2xl p-6 border border-white/10 aspect-square sm:aspect-video lg:aspect-square flex flex-col justify-between overflow-hidden">
               <div className="flex gap-4">
                 <div className="w-full bg-secondary/50 rounded-lg p-4 space-y-3 border border-white/5">
                    <Youtube className="w-8 h-8 text-red-500" />
                    <div className="h-2 w-3/4 bg-white/10 rounded" />
                    <div className="h-2 w-1/2 bg-white/10 rounded" />
                 </div>
                 <div className="w-full bg-secondary/50 rounded-lg p-4 space-y-3 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <Brain className="w-8 h-8 text-primary relative z-10" />
                    <div className="h-2 w-full bg-primary/40 rounded relative z-10" />
                    <div className="h-2 w-4/5 bg-primary/40 rounded relative z-10" />
                    <div className="h-2 w-5/6 bg-primary/40 rounded relative z-10" />
                 </div>
               </div>
               <div className="mt-4 bg-background/50 rounded-xl p-4 border border-white/5">
                 <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-accent" /> AI Summary generated
                 </p>
                 <div className="space-y-2">
                   <div className="h-1.5 w-full bg-white/20 rounded" />
                   <div className="h-1.5 w-full bg-white/20 rounded" />
                   <div className="h-1.5 w-2/3 bg-white/20 rounded" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
