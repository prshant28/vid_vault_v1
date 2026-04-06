import { useGetStats } from "@workspace/api-client-react";
import { VideoCard } from "@/components/videos/VideoCard";
import { Library, Folder, Tag, Star } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="font-mono-ui text-xs uppercase tracking-widest animate-pulse" style={{ color: "var(--vv-text-muted)" }}>
          LOADING_VAULT...
        </span>
      </div>
    );
  }

  const statCards = [
    {
      label: "TOTAL_VIDEOS",
      value: stats?.totalVideos || 0,
      icon: Library,
      code: "01",
      accent: "#8b5cf6",
    },
    {
      label: "FOLDERS",
      value: stats?.totalFolders || 0,
      icon: Folder,
      code: "02",
      accent: "#06b6d4",
    },
    {
      label: "TAGS_USED",
      value: stats?.totalTags || 0,
      icon: Tag,
      code: "03",
      accent: "#10b981",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* Header */}
      <motion.div variants={item} className="space-y-2 pt-2">
        <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--vv-text-muted)" }}>
          //SYSTEM_STATUS
        </span>
        <h1
          className="font-black lp-heading uppercase"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontFamily: "'Alegreya Sans SC', serif",
            letterSpacing: "-0.01em",
          }}
        >
          Your Vault
        </h1>
        <p className="text-sm font-mono-ui" style={{ color: "var(--vv-text-muted)" }}>
          KNOWLEDGE_BASE // ACTIVE
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.code} className="etched-slab p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--vv-text-muted)" }}>{card.code}</span>
                <card.icon className="w-4 h-4" style={{ color: card.accent + "60" }} />
              </div>
              <p
                className="font-mono-ui text-[10px] uppercase tracking-widest mb-1"
                style={{ color: card.accent + "80" }}
              >
                {card.label}
              </p>
              <p
                className="font-black lp-heading leading-none"
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                  fontFamily: "'Alegreya Sans SC', serif",
                }}
              >
                {card.value.toString().padStart(2, "0")}
              </p>
            </div>
            <div
              className="absolute bottom-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity"
              style={{ background: `radial-gradient(circle, ${card.accent}, transparent)` }}
            />
          </div>
        ))}
      </motion.div>

      {/* Recently Saved */}
      {stats?.recentVideos && stats.recentVideos.length > 0 && (
        <motion.section variants={item} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-1" style={{ color: "var(--vv-text-muted)" }}>
                //RECENTLY_SAVED
              </span>
              <h2
                className="text-lg font-black lp-heading uppercase"
                style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}
              >
                Latest Captures
              </h2>
            </div>
            <Link
              href="/videos"
              className="font-mono-ui text-[9px] hover:text-[#8b5cf6] uppercase tracking-widest transition-colors"
              style={{ color: "var(--vv-text-muted)" }}
            >
              VIEW_ALL →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.recentVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Favorites */}
      {stats?.favoriteVideos && stats.favoriteVideos.length > 0 && (
        <motion.section variants={item} className="space-y-5 pb-10">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-1" style={{ color: "var(--vv-text-muted)" }}>
                //STARRED
              </span>
              <h2
                className="text-lg font-black lp-heading uppercase flex items-center gap-2"
                style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}
              >
                <Star className="w-4 h-4 text-yellow-500" />
                Favorites
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.favoriteVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Empty State */}
      {(!stats?.recentVideos || stats.recentVideos.length === 0) && (
        <motion.div variants={item} className="etched-slab py-24 text-center">
          <Library className="w-10 h-10 mx-auto mb-5" style={{ color: "var(--vv-text-muted)" }} />
          <span className="font-mono-ui text-[10px] uppercase tracking-[0.3em] block mb-3" style={{ color: "var(--vv-text-muted)" }}>
            VAULT_EMPTY
          </span>
          <h3 className="text-xl font-black uppercase mb-3" style={{ color: "var(--vv-text)" }}>
            No Videos Yet
          </h3>
          <p className="font-mono-ui text-sm max-w-sm mx-auto" style={{ color: "var(--vv-text-desc)" }}>
            Paste a YouTube URL to begin saving videos to your knowledge vault.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
