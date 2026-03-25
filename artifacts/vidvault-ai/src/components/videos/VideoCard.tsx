import { Play, Sparkles, FolderDown, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUI } from "@/contexts/ui-context";
import { Link, useLocation } from "wouter";
import { Video } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToggleFavorite } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const { setAiSidebarOpen, setActiveVideoId } = useUI();
  const [, setLocation] = useLocation();
  const toggleFavorite = useToggleFavorite();
  const queryClient = useQueryClient();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite.mutateAsync({ videoId: video.id });
    queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
  };

  const handleAiClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveVideoId(video.id);
    setAiSidebarOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col bg-card/40 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-primary/40 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]">
      <div className="relative aspect-video w-full overflow-hidden bg-secondary">
        {video.thumbnail ? (
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out" 
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No thumbnail
          </div>
        )}
        
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md text-xs font-medium text-white rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.duration}
          </div>
        )}

        <button 
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Star className={`w-4 h-4 ${video.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
        </button>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          <Button 
            size="icon" 
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:scale-110 transition-transform" 
            onClick={() => setLocation(`/videos/${video.id}`)}
          >
            <Play className="w-5 h-5 ml-1 fill-current"/>
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="w-12 h-12 rounded-full border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-transform bg-transparent" 
            onClick={handleAiClick}
          >
            <Sparkles className="w-5 h-5 text-accent"/>
          </Button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold line-clamp-2 text-foreground text-sm leading-tight cursor-pointer hover:text-primary transition-colors" onClick={() => setLocation(`/videos/${video.id}`)}>
          {video.title}
        </h3>
        
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
          {video.channelName || 'Unknown Channel'}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4">
          {video.folderName ? (
            <Badge variant="secondary" className="text-[10px] bg-secondary/50 text-secondary-foreground font-normal hover:bg-secondary/70 cursor-pointer">
              <FolderDown className="w-3 h-3 mr-1" />
              {video.folderName}
            </Badge>
          ) : (
            <div />
          )}
          
          <div className="flex gap-1">
            {video.tags?.slice(0,2).map(t => (
              <div key={t.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || 'var(--primary)' }} title={t.name} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
