import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUI } from "@/contexts/ui-context";
import { useAddVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link2, Loader2 } from "lucide-react";

export function UrlPasteModal() {
  const { isUrlModalOpen, setUrlModalOpen } = useUI();
  const [url, setUrl] = useState("");
  const addVideo = useAddVideo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      await addVideo.mutateAsync({ data: { url } });
      toast({ title: "Video saved successfully!", description: "It is now available in your vault." });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setUrl("");
      setUrlModalOpen(false);
    } catch (error: any) {
      toast({ 
        title: "Failed to save video", 
        description: error.message || "Please check the URL and try again.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={isUrlModalOpen} onOpenChange={setUrlModalOpen}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            Save a New Video
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Paste a YouTube URL below to add it to your Second Brain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 bg-secondary/50 border-white/10 focus-visible:ring-primary/50 text-base"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setUrlModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!url.trim() || addVideo.isPending}
              className="bg-primary hover:bg-primary/90 text-white min-w-[100px]"
            >
              {addVideo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Vault"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
