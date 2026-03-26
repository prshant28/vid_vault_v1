import { Play, Sparkles, Star, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useUI } from "@/contexts/ui-context";
import { useLocation } from "wouter";
import { Video } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToggleFavorite } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const { setAiSidebarOpen, setActiveVideoId } = useUI();
  const [, setLocation] = useLocation();
  const toggleFavorite = useToggleFavorite();
  const queryClient = useQueryClient();
  const [hovered, setHovered] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite.mutateAsync({ videoId: video.id });
    queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation(`/videos/${video.id}`)}
      className="group cursor-pointer flex flex-col"
      style={{
        background: "#111113",
        border: `1px solid ${hovered ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.05)"}`,
        transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 30px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.05)"
          : "inset 1px 1px 0 rgba(255,255,255,0.03), inset -1px -1px 0 rgba(0,0,0,0.4)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#0a0a0b]">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="object-cover w-full h-full transition-transform duration-500"
            style={{ transform: hovered ? "scale(1.06)" : "scale(1)", filter: "grayscale(10%)" }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-[#1a1a1c]" />
          </div>
        )}

        {/* Duration */}
        {video.duration && (
          <div
            className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-mono-ui text-white flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.85)" }}
          >
            <Clock className="w-2.5 h-2.5" />
            {video.duration}
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 left-2 p-1.5 transition-opacity"
          style={{
            background: "rgba(0,0,0,0.7)",
            opacity: hovered || video.isFavorite ? 1 : 0,
          }}
        >
          <Star
            className={`w-3 h-3 ${video.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-[#666]"}`}
          />
        </button>

        {/* Hover overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center gap-3"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLocation(`/videos/${video.id}`); }}
            className="w-11 h-11 flex items-center justify-center transition-all"
            style={{
              background: "#fff",
              clipPath: "polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)",
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#8b5cf6"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "#fff"}
          >
            <Play className="w-4 h-4 text-black fill-black" />
          </button>
          <button
            onClick={handleAiClick}
            className="w-11 h-11 flex items-center justify-center border border-[rgba(139,92,246,0.4)] transition-all hover:bg-[rgba(139,92,246,0.2)]"
            style={{
              background: "rgba(139,92,246,0.1)",
              clipPath: "polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)",
            }}
          >
            <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="font-bold text-sm line-clamp-2 leading-tight mb-2 transition-colors uppercase tracking-tight"
          style={{ color: hovered ? "#fff" : "#aaa" }}
        >
          {video.title}
        </h3>

        <p className="text-[10px] font-mono-ui text-[#333] mb-3 truncate uppercase tracking-wider">
          {video.channelName || "UNKNOWN_CHANNEL"}
        </p>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {video.tags.slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="font-mono-ui text-[8px] uppercase tracking-widest px-2 py-0.5"
                style={{
                  color: "#8b5cf6",
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              >
                {t.name}
              </span>
            ))}
            {video.tags.length > 2 && (
              <span className="font-mono-ui text-[8px] text-[#333]">+{video.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Folder */}
        {video.folderName && (
          <div className="mt-auto pt-2 border-t border-white/[0.04]">
            <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-widest truncate">
              /{video.folderName}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
