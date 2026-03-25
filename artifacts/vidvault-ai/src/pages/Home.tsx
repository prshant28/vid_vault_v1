import { useGetStats } from "@workspace/api-client-react";
import { VideoCard } from "@/components/videos/VideoCard";
import { Library, Folder, Tag, PlayCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">Here's what's happening in your vault today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <Library className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Videos</p>
            <p className="text-4xl font-display font-bold text-foreground mt-1">{stats?.totalVideos || 0}</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center mb-4 text-accent">
              <Folder className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Folders</p>
            <p className="text-4xl font-display font-bold text-foreground mt-1">{stats?.totalFolders || 0}</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all duration-500" />
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 text-green-500">
              <Tag className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Tags Used</p>
            <p className="text-4xl font-display font-bold text-foreground mt-1">{stats?.totalTags || 0}</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all duration-500" />
        </div>
      </div>

      {stats?.recentVideos && stats.recentVideos.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              Recently Saved
            </h2>
            <Link href="/videos" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stats.recentVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {stats?.favoriteVideos && stats.favoriteVideos.length > 0 && (
        <section className="space-y-4 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Your Favorites
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stats.favoriteVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {(!stats?.recentVideos || stats.recentVideos.length === 0) && (
        <div className="text-center py-20 bg-card/20 rounded-3xl border border-white/5 border-dashed">
          <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-display font-medium text-foreground mb-2">Your vault is empty</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start building your second brain by saving your first YouTube video.
          </p>
        </div>
      )}
    </div>
  );
}
