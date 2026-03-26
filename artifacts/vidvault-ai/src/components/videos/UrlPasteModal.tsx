import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUI } from "@/contexts/ui-context";
import { useAddVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link2, Loader2, ListMusic } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UrlPasteModal() {
  const { isUrlModalOpen, setUrlModalOpen } = useUI();
  const [url, setUrl] = useState("");
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const addVideo = useAddVideo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Detect if URL is a playlist
  const isPlaylist = useMemo(() => {
    return /youtube\.com\/playlist\?list=|youtube\.com\/watch\?.*list=/.test(url);
  }, [url]);

  const handleAddVideo = async (e: React.FormEvent) => {
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
        variant: "destructive",
      });
    }
  };

  const handlePlaylistImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/videos/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          folderName: folderName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import playlist");
      }

      const data = await res.json();
      toast({
        title: "Playlist imported successfully!",
        description: `${data.videos.length} videos added to "${data.folder.name}"`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      setUrl("");
      setFolderName("");
      setUrlModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to import playlist",
        description: error.message || "Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isUrlModalOpen} onOpenChange={setUrlModalOpen}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
        {isPlaylist ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <ListMusic className="w-6 h-6 text-primary" />
                Import Playlist
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                We'll extract all videos and organize them in a new folder.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePlaylistImport} className="space-y-6 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Playlist URL</label>
                <Input
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 bg-secondary/50 border-white/10 focus-visible:ring-primary/50 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Folder Name (optional)</label>
                <Input
                  placeholder="Leave empty to use playlist title"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="h-12 bg-secondary/50 border-white/10 focus-visible:ring-primary/50 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  If left blank, we'll use the YouTube playlist title
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => {
                  setUrlModalOpen(false);
                  setUrl("");
                  setFolderName("");
                }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!url.trim() || loading}
                  className="bg-primary hover:bg-primary/90 text-white min-w-[100px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    "Import Playlist"
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <Link2 className="w-6 h-6 text-primary" />
                Save a New Video
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Paste a YouTube video URL or playlist link below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddVideo} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Input
                  autoFocus
                  placeholder="https://www.youtube.com/watch?v=... or playlist?list=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 bg-secondary/50 border-white/10 focus-visible:ring-primary/50 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Detected as: {url.includes("youtube.com") ? "YouTube URL" : "Paste a YouTube link"}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => {
                  setUrlModalOpen(false);
                  setUrl("");
                }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!url.trim() || addVideo.isPending}
                  className="bg-primary hover:bg-primary/90 text-white min-w-[100px]"
                >
                  {addVideo.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Video"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
