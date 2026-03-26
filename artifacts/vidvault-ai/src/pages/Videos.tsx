import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { VideoCard } from "@/components/videos/VideoCard";
import { Loader2, Library, Search, Star, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useListFolders } from "@workspace/api-client-react";

function useSearchParams() {
  const [location] = useLocation();
  const [params, setParams] = useState(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, [location, window.location.href]);

  useEffect(() => {
    const handler = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return params;
}

function useVideos(params: { search?: string | null; folderId?: string | null; favorites?: boolean; limit?: number }) {
  const [data, setData] = useState<{ videos: any[]; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const key = JSON.stringify(params);

  useEffect(() => {
    setIsLoading(true);
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.folderId) qs.set("folderId", params.folderId);
    if (params.favorites) qs.set("favorites", "true");
    if (params.limit) qs.set("limit", String(params.limit));

    fetch(`/api/videos?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setIsLoading(false);
      })
      .catch(() => {
        setData({ videos: [], total: 0 });
        setIsLoading(false);
      });
  }, [key]);

  return { data, isLoading };
}

export default function Videos() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search");
  const folderId = searchParams.get("folderId");
  const favorites = searchParams.get("favorites") === "true";
  const { data: foldersData } = useListFolders();

  const [searchInput, setSearchInput] = useState(urlSearch || "");
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch || "");

  useEffect(() => {
    setSearchInput(urlSearch || "");
    setDebouncedSearch(urlSearch || "");
  }, [urlSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useVideos({
    search: debouncedSearch || null,
    folderId: folderId || null,
    favorites,
    limit: 100,
  });

  const folderName = folderId
    ? foldersData?.folders?.find((f) => f.id === folderId)?.name
    : null;

  const pageTitle = favorites
    ? "FAVORITES"
    : folderName
    ? `FOLDER // ${folderName.toUpperCase()}`
    : debouncedSearch
    ? `SEARCH // "${debouncedSearch}"`
    : "ALL VIDEOS";

  const pageIcon = favorites ? <Star className="w-4 h-4 text-yellow-500" /> : <Library className="w-4 h-4 text-[#8b5cf6]" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1 pt-2">
        <span className="font-mono-ui text-[9px] text-[#333] uppercase tracking-[0.3em]">
          //VIDEO_ARCHIVE
        </span>
        <div className="flex items-center gap-3">
          {pageIcon}
          <h1
            className="text-2xl font-black lp-heading uppercase"
            style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}
          >
            {pageTitle}
          </h1>
        </div>
        <p className="font-mono-ui text-[10px] text-[#444] uppercase tracking-widest">
          {isLoading ? "LOADING..." : `${data?.total ?? 0} VIDEO${(data?.total ?? 0) === 1 ? "" : "S"}_FOUND`}
        </p>
      </div>

      {/* Search bar — only for non-favorites views */}
      {!favorites && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search videos..."
            className="w-full h-10 pl-9 pr-9 text-sm font-mono-ui rounded-lg outline-none transition-all"
            style={{
              background: "var(--vv-sidebar)",
              border: "1px solid var(--vv-border)",
              color: "var(--vv-text)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--vv-border)"; }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setDebouncedSearch(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Videos grid */}
      {isLoading ? (
        <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-7 h-7 animate-spin text-[#8b5cf6]" />
          <span className="font-mono-ui text-[10px] text-[#333] uppercase tracking-widest animate-pulse">
            FETCHING_VIDEOS...
          </span>
        </div>
      ) : data?.videos && data.videos.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={pageTitle}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10"
          >
            {data.videos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="etched-slab py-24 text-center">
          {favorites ? (
            <Star className="w-10 h-10 text-[#222] mx-auto mb-4" />
          ) : (
            <Library className="w-10 h-10 text-[#222] mx-auto mb-4" />
          )}
          <span className="font-mono-ui text-[10px] text-[#333] uppercase tracking-[0.3em] block mb-3">
            {favorites ? "NO_FAVORITES_YET" : debouncedSearch ? "NO_RESULTS" : "VAULT_EMPTY"}
          </span>
          <p className="text-[#444] font-mono-ui text-sm max-w-xs mx-auto">
            {favorites
              ? "Star any video to add it to your favorites."
              : debouncedSearch
              ? `No videos match "${debouncedSearch}". Try a different term.`
              : "Paste a YouTube URL to begin saving videos."}
          </p>
        </div>
      )}
    </div>
  );
}
