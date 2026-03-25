import { useListVideos } from "@workspace/api-client-react";
import { VideoCard } from "@/components/videos/VideoCard";
import { Loader2, Library } from "lucide-react";
import { useLocation } from "wouter";

export default function Videos() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const search = searchParams.get('search');
  const folderId = searchParams.get('folderId');
  const favorites = searchParams.get('favorites') === 'true';

  const { data, isLoading } = useListVideos({
    search,
    folderId,
    favorites: favorites ? true : undefined,
    limit: 50
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-foreground">
          {favorites ? "Favorites" : search ? `Search: "${search}"` : "All Videos"}
        </h1>
        <p className="text-muted-foreground">
          {data?.total ? `${data.total} video${data.total === 1 ? '' : 's'} found` : "Browse your saved videos"}
        </p>
      </div>

      {isLoading ? (
        <div className="w-full h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.videos && data.videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card/20 rounded-3xl border border-white/5 border-dashed">
          <Library className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-display font-medium text-foreground mb-2">No videos found</h3>
          <p className="text-muted-foreground">
            {search ? "Try a different search term" : "Save a new video to see it here."}
          </p>
        </div>
      )}
    </div>
  );
}
