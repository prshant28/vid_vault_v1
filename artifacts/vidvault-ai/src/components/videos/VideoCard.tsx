import { Play, Sparkles, Star, Clock, ExternalLink } from "lucide-react";
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setLocation(`/videos/${video.id}`)}
      className="group cursor-pointer flex flex-col overflow-hidden"
      style={{
        background: "#0f0f12",
        border: `1px solid ${hovered ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 14,
        transition: "all 0.3s cubic-bezier(0.2, 0, 0.2, 1)",
        transform: hovered ? "translateY(-6px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.12), 0 0 60px rgba(139,92,246,0.08)"
          : "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden" style={{ borderRadius: "14px 14px 0 0", background: "#0a0a0b" }}>
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="object-cover w-full h-full"
            style={{
              transition: "transform 0.5s cubic-bezier(0.2, 0, 0.2, 1)",
              transform: hovered ? "scale(1.08)" : "scale(1)",
              filter: hovered ? "brightness(0.7)" : "brightness(0.85) grayscale(8%)",
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-10 h-10 text-[#1a1a1c]" />
          </div>
        )}

        {/* Purple gradient overlay on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(139,92,246,0.2) 0%, transparent 60%)" }}
        />

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 text-[10px] font-mono-ui text-white flex items-center gap-1"
            style={{ background: "rgba(0,0,0,0.85)", borderRadius: 6, backdropFilter: "blur(4px)" }}>
            <Clock className="w-2.5 h-2.5" />
            {video.duration}
          </div>
        )}

        {/* Favorite */}
        <motion.button
          onClick={handleFavorite}
          animate={{ opacity: hovered || video.isFavorite ? 1 : 0, scale: hovered || video.isFavorite ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
          className="absolute top-2 left-2 p-1.5"
          style={{ background: "rgba(0,0,0,0.75)", borderRadius: 8, backdropFilter: "blur(4px)" }}
        >
          <Star className={`w-3.5 h-3.5 ${video.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-[#777]"}`} />
        </motion.button>

        {/* Hover overlay buttons */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center gap-3"
        >
          <motion.button
            onClick={e => { e.stopPropagation(); setLocation(`/videos/${video.id}`); }}
            animate={{ y: hovered ? 0 : 10, scale: hovered ? 1 : 0.9 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="w-12 h-12 flex items-center justify-center shadow-xl"
            style={{
              background: "#fff",
              borderRadius: 10,
              clipPath: "polygon(12% 0,100% 0,100% 88%,88% 100%,0 100%,0 12%)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#8b5cf6"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
          >
            <Play className="w-5 h-5 text-black fill-black" />
          </motion.button>

          <motion.button
            onClick={handleAiClick}
            animate={{ y: hovered ? 0 : 10, scale: hovered ? 1 : 0.9 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="w-12 h-12 flex items-center justify-center"
            style={{
              background: "rgba(139,92,246,0.18)",
              border: "1px solid rgba(139,92,246,0.5)",
              borderRadius: 10,
              clipPath: "polygon(12% 0,100% 0,100% 88%,88% 100%,0 100%,0 12%)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.35)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.18)"}
          >
            <Sparkles className="w-5 h-5 text-[#a78bfa]" />
          </motion.button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="font-bold text-sm leading-snug mb-2 tracking-tight line-clamp-2 transition-colors duration-200"
          style={{ color: hovered ? "#fff" : "#bbb", fontFamily: "'Raleway', sans-serif" }}
        >
          {video.title}
        </h3>

        <p className="text-[11px] font-mono-ui text-[#383838] mb-3 truncate uppercase tracking-wider">
          {video.channelName || "UNKNOWN_CHANNEL"}
        </p>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {video.tags.slice(0, 2).map(t => (
              <span key={t.id} className="font-mono-ui text-[9px] uppercase tracking-widest px-2 py-0.5"
                style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 5 }}>
                {t.name}
              </span>
            ))}
            {video.tags.length > 2 && (
              <span className="font-mono-ui text-[9px] text-[#333]">+{video.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {video.folderName ? (
            <span className="font-mono-ui text-[10px] text-[#333] uppercase tracking-widest truncate">
              /{video.folderName}
            </span>
          ) : (
            <span />
          )}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 4 }}
            transition={{ duration: 0.2 }}
          >
            <ExternalLink className="w-3 h-3 text-[#8b5cf6]" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
