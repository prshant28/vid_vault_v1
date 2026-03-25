import { Search, Bell, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUI } from "@/contexts/ui-context";
import { useLocation } from "wouter";

export function TopNav() {
  const { setAiSidebarOpen, setUrlModalOpen } = useUI();
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      setLocation(`/videos?search=${encodeURIComponent(e.currentTarget.value)}`);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center w-full max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search videos, tags, or notes..." 
            className="w-full pl-10 bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl transition-all"
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          onClick={() => setUrlModalOpen(true)}
          className="rounded-xl bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Save Video
        </Button>
        
        <Button variant="ghost" size="icon" className="rounded-full relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background" />
        </Button>

        <div className="h-6 w-px bg-border/50 mx-1" />

        <Button 
          onClick={() => setAiSidebarOpen(true)}
          variant="outline"
          className="rounded-xl border-accent/20 bg-accent/5 text-accent hover:bg-accent/10 hover:border-accent/30 transition-all group"
        >
          <Sparkles className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Ask AI
        </Button>
      </div>
    </header>
  );
}
