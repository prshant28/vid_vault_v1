import { useListVideos } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Network, Tag, Film, ArrowRight, X } from "lucide-react";
import { Link } from "wouter";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const TAG_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ec4899", "#6366f1", "#f97316", "#14b8a6",
  "#3b82f6", "#84cc16", "#a855f7", "#ef4444",
];

interface NodeData {
  id: string;
  label: string;
  type: "tag" | "video";
  color: string;
  count?: number;
  thumbnail?: string;
  videoId?: string;
  x: number;
  y: number;
  r: number;
}

interface EdgeData {
  from: string;
  to: string;
  color: string;
}

function useGraphData(videos: any[]) {
  return useMemo(() => {
    if (!videos || videos.length === 0) return { nodes: [], edges: [] };

    const tagMap: Record<string, { videos: string[]; color: string }> = {};
    let colorIdx = 0;

    videos.forEach((v) => {
      (v.tags ?? []).forEach((tag: string) => {
        if (!tagMap[tag]) {
          tagMap[tag] = { videos: [], color: TAG_COLORS[colorIdx % TAG_COLORS.length] };
          colorIdx++;
        }
        tagMap[tag].videos.push(v.id);
      });
    });

    const tags = Object.entries(tagMap).filter(([, d]) => d.videos.length > 0);
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];
    const W = 800, H = 520;
    const CX = W / 2, CY = H / 2;

    if (tags.length === 0) {
      videos.slice(0, 12).forEach((v, i) => {
        const angle = (i / Math.min(videos.length, 12)) * 2 * Math.PI;
        const r = Math.min(W, H) * 0.35;
        nodes.push({
          id: v.id, label: v.title ?? "Video", type: "video", color: "#8b5cf6",
          thumbnail: v.thumbnail, videoId: v.id,
          x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r, r: 22,
        });
      });
      return { nodes, edges };
    }

    const tagAngleStep = (2 * Math.PI) / tags.length;
    const tagRadius = Math.min(W, H) * 0.32;

    const positionedVideoIds = new Set<string>();

    tags.forEach(([tag, data], ti) => {
      const tagAngle = ti * tagAngleStep - Math.PI / 2;
      const tx = CX + Math.cos(tagAngle) * tagRadius;
      const ty = CY + Math.sin(tagAngle) * tagRadius;
      const tagNodeId = `tag:${tag}`;

      nodes.push({
        id: tagNodeId, label: tag, type: "tag", color: data.color,
        count: data.videos.length,
        x: tx, y: ty, r: 28 + Math.min(data.videos.length * 3, 16),
      });

      const videoIds = data.videos.slice(0, 4);
      videoIds.forEach((vid, vi) => {
        edges.push({ from: tagNodeId, to: vid, color: data.color });

        if (!positionedVideoIds.has(vid)) {
          positionedVideoIds.add(vid);
          const videoAngle = tagAngle + (vi - (videoIds.length - 1) / 2) * 0.45;
          const vr = tagRadius * 0.52;
          const video = videos.find((v) => v.id === vid);
          nodes.push({
            id: vid,
            label: video?.title ?? "Video",
            type: "video",
            color: data.color,
            thumbnail: video?.thumbnail,
            videoId: vid,
            x: tx + Math.cos(videoAngle) * vr,
            y: ty + Math.sin(videoAngle) * vr,
            r: 18,
          });
        }
      });
    });

    videos.forEach((v) => {
      if (!positionedVideoIds.has(v.id)) {
        const angle = Math.random() * 2 * Math.PI;
        const r2 = tagRadius * 0.15 + Math.random() * tagRadius * 0.1;
        nodes.push({
          id: v.id, label: v.title ?? "Video", type: "video", color: "#6b7280",
          thumbnail: v.thumbnail, videoId: v.id,
          x: CX + Math.cos(angle) * r2, y: CY + Math.sin(angle) * r2, r: 16,
        });
      }
    });

    return { nodes, edges };
  }, [videos]);
}

function GraphSVG({ nodes, edges, selectedId, onSelect }: {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const W = 800, H = 520;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ cursor: "default" }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-sm">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {nodes.filter(n => n.type === "video" && n.thumbnail).map(n => (
          <clipPath key={`clip-${n.id}`} id={`clip-${n.id}`}>
            <circle cx={n.x} cy={n.y} r={n.r - 2} />
          </clipPath>
        ))}
      </defs>

      {edges.map((e, i) => {
        const from = nodes.find(n => n.id === e.from);
        const to = nodes.find(n => n.id === e.to);
        if (!from || !to) return null;
        const isSelected = selectedId === e.from || selectedId === e.to;
        return (
          <line
            key={i}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={e.color}
            strokeWidth={isSelected ? 1.5 : 0.7}
            strokeOpacity={isSelected ? 0.7 : 0.25}
            strokeDasharray={isSelected ? "none" : "4,4"}
          />
        );
      })}

      {nodes.map((n) => {
        const isSelected = selectedId === n.id;
        const isConnected = edges.some(e => (e.from === selectedId && e.to === n.id) || (e.to === selectedId && e.from === n.id));
        const dimmed = selectedId && !isSelected && !isConnected;
        return (
          <g
            key={n.id}
            onClick={() => onSelect(n.id)}
            style={{ cursor: "pointer", opacity: dimmed ? 0.25 : 1, transition: "opacity 0.2s" }}
          >
            {n.type === "tag" ? (
              <>
                <circle
                  cx={n.x} cy={n.y} r={n.r + 4}
                  fill={n.color} fillOpacity={isSelected ? 0.15 : 0.07}
                  filter={isSelected ? "url(#glow)" : undefined}
                />
                <circle
                  cx={n.x} cy={n.y} r={n.r}
                  fill={n.color} fillOpacity={0.18}
                  stroke={n.color} strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isSelected ? 1 : 0.6}
                />
                <text x={n.x} y={n.y - 3} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fill: n.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  {n.label.length > 10 ? n.label.slice(0, 9) + "…" : n.label}
                </text>
                {n.count !== undefined && (
                  <text x={n.x} y={n.y + 10} textAnchor="middle"
                    style={{ fontSize: 7, fontFamily: "'JetBrains Mono', monospace", fill: n.color, opacity: 0.7 }}>
                    {n.count} video{n.count !== 1 ? "s" : ""}
                  </text>
                )}
              </>
            ) : (
              <>
                <circle
                  cx={n.x} cy={n.y} r={n.r + 3}
                  fill={n.color} fillOpacity={isSelected ? 0.2 : 0.06}
                  filter={isSelected ? "url(#glow-sm)" : undefined}
                />
                <circle
                  cx={n.x} cy={n.y} r={n.r}
                  fill={n.thumbnail ? "#0a0a0b" : n.color}
                  fillOpacity={n.thumbnail ? 1 : 0.15}
                  stroke={n.color} strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isSelected ? 1 : 0.4}
                />
                {n.thumbnail && (
                  <image
                    href={n.thumbnail}
                    x={n.x - n.r + 2} y={n.y - n.r + 2}
                    width={(n.r - 2) * 2} height={(n.r - 2) * 2}
                    clipPath={`url(#clip-${n.id})`}
                    preserveAspectRatio="xMidYMid slice"
                    style={{ opacity: isSelected ? 1 : 0.7 }}
                  />
                )}
                {!n.thumbnail && (
                  <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fill: n.color, opacity: 0.8 }}>
                    ▶
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function KnowledgeGraph() {
  const { data: videoData } = useListVideos({ limit: 80 });
  const videos = videoData?.videos ?? [];
  const { nodes, edges } = useGraphData(videos);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedId);
  const connectedNodes = selectedId
    ? edges
        .filter(e => e.from === selectedId || e.to === selectedId)
        .map(e => e.from === selectedId ? e.to : e.from)
        .map(id => nodes.find(n => n.id === id))
        .filter(Boolean) as NodeData[]
    : [];

  const tagNodes = nodes.filter(n => n.type === "tag");
  const videoNodes = nodes.filter(n => n.type === "video");

  const handleSelect = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-12">
      <motion.div variants={item} className="pt-2">
        <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-1" style={{ color: "var(--vv-text-muted)" }}>
          //KNOWLEDGE_GRAPH · CONCEPT_MAP
        </span>
        <h1 className="font-black lp-heading uppercase mb-2" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
          Knowledge Graph
        </h1>
        <p className="font-mono-ui text-sm max-w-xl" style={{ color: "var(--vv-text-desc)" }}>
          Visual map of how your videos connect through shared topics and tags. Click any node to explore connections.
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-3 gap-3 sm:grid-cols-3">
        {[
          { label: "Topics", value: tagNodes.length, color: "#8b5cf6", icon: Tag },
          { label: "Videos", value: videoNodes.length, color: "#06b6d4", icon: Film },
          { label: "Connections", value: edges.length, color: "#10b981", icon: Network },
        ].map((s) => (
          <div key={s.label} className="etched-slab p-4 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-2" style={{ color: s.color }} />
            <p className="font-black lp-heading text-2xl leading-none" style={{ color: s.color, fontFamily: "'Alegreya Sans SC', serif" }}>{s.value}</p>
            <p className="font-mono-ui text-[9px] uppercase tracking-widest mt-1" style={{ color: "var(--vv-text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="flex gap-4 flex-col lg:flex-row">
        <div className="flex-1 etched-slab overflow-hidden relative" style={{ minHeight: 400 }}>
          {videos.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <Network className="w-10 h-10 mb-4 opacity-20" style={{ color: "#8b5cf6" }} />
              <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--vv-text-muted)" }}>NO_DATA</p>
              <p className="font-mono-ui text-sm mb-4" style={{ color: "var(--vv-text-desc)" }}>Save some videos and add tags to see your knowledge graph.</p>
              <Link href="/videos">
                <span className="font-mono-ui text-[11px] uppercase tracking-wider" style={{ color: "#8b5cf6" }}>
                  Add Videos →
                </span>
              </Link>
            </div>
          ) : (
            <GraphSVG nodes={nodes} edges={edges} selectedId={selectedId} onSelect={handleSelect} />
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: "#8b5cf6", border: "1px solid #8b5cf6" }} />
              <span className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>TAG</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ border: "1px solid #06b6d4" }} />
              <span className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>VIDEO</span>
            </div>
          </div>

          {selectedId && (
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ background: "var(--vv-bg)", border: "1px solid var(--vv-border)", color: "var(--vv-text-muted)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-full lg:w-64 space-y-3">
          {selectedNode ? (
            <div className="etched-slab p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--vv-text-muted)" }}>
                  {selectedNode.type === "tag" ? "//TAG_NODE" : "//VIDEO_NODE"}
                </p>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: selectedNode.color }} />
              </div>
              {selectedNode.thumbnail && (
                <img src={selectedNode.thumbnail} alt="" className="w-full h-24 object-cover rounded-lg mb-3 opacity-80" />
              )}
              <p className="font-mono-ui text-[11px] font-bold mb-1 leading-snug" style={{ color: "var(--vv-text)" }}>
                {selectedNode.label}
              </p>
              {selectedNode.type === "tag" && (
                <p className="font-mono-ui text-[9px] mb-3" style={{ color: "var(--vv-text-muted)" }}>
                  {selectedNode.count} connected video{selectedNode.count !== 1 ? "s" : ""}
                </p>
              )}
              {selectedNode.type === "video" && selectedNode.videoId && (
                <Link href={`/videos/${selectedNode.videoId}`}>
                  <span className="font-mono-ui text-[9px] uppercase tracking-wider flex items-center gap-1 mt-2" style={{ color: selectedNode.color }}>
                    Open Video <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              )}
              {connectedNodes.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--vv-border)" }}>
                  <p className="font-mono-ui text-[8px] uppercase tracking-widest mb-2" style={{ color: "var(--vv-text-muted)" }}>Connected</p>
                  <div className="space-y-1.5">
                    {connectedNodes.slice(0, 5).map(n => (
                      <div key={n.id} className="flex items-center gap-2 cursor-pointer" onClick={() => handleSelect(n.id)}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: n.color }} />
                        <span className="font-mono-ui text-[9px] truncate" style={{ color: "var(--vv-text-muted)" }}>
                          {n.type === "tag" ? "#" : ""}{n.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="etched-slab p-4">
              <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--vv-text-muted)" }}>//TOP_TOPICS</p>
              <div className="space-y-2">
                {tagNodes.slice(0, 8).map((n, i) => (
                  <div
                    key={n.id}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors"
                    style={{ background: "var(--vv-bg)" }}
                    onClick={() => handleSelect(n.id)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: n.color }} />
                    <span className="flex-1 font-mono-ui text-[10px] truncate" style={{ color: "var(--vv-text)" }}>#{n.label}</span>
                    <span className="font-mono-ui text-[8px]" style={{ color: n.color }}>{n.count}</span>
                  </div>
                ))}
                {tagNodes.length === 0 && (
                  <p className="font-mono-ui text-[10px] text-center py-4" style={{ color: "var(--vv-text-muted)" }}>
                    Add tags to videos to see topics here
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="etched-slab p-4">
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--vv-text-muted)" }}>//INSTRUCTIONS</p>
            <div className="space-y-2">
              {[
                "Click any node to explore",
                "Tag nodes show video clusters",
                "Lines = shared connections",
                "Add tags to build the graph",
              ].map((tip, i) => (
                <p key={i} className="font-mono-ui text-[9px] flex items-start gap-2" style={{ color: "var(--vv-text-muted)" }}>
                  <span style={{ color: "#8b5cf6" }}>›</span> {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
