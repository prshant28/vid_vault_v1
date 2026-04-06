import { useGetStats } from "@workspace/api-client-react";
import type { DashboardStats } from "@workspace/api-client-react";
import { VideoCard } from "@/components/videos/VideoCard";
import {
  Film, Star, Sparkles, FileText, ChevronRight,
  Brain, BookOpen, ListChecks, HelpCircle, MessageSquare,
  Play,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  ComposedChart, Bar, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };

const AI_META: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
  summary:    { label: "Summary",     icon: FileText,      color: "#8b5cf6" },
  flashcards: { label: "Flashcards",  icon: BookOpen,      color: "#06b6d4" },
  mcq:        { label: "MCQ",         icon: HelpCircle,    color: "#10b981" },
  studynotes: { label: "Study Notes", icon: ListChecks,    color: "#f59e0b" },
  transcript: { label: "Transcript",  icon: MessageSquare, color: "#ec4899" },
  chat:       { label: "AI Chat",     icon: Brain,         color: "#6366f1" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function XPBar({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.transition = "width 1s cubic-bezier(.4,0,.2,1)";
      el.style.width = `${pct}%`;
    });
  }, [pct]);
  return (
    <div className="h-1 rounded-full overflow-hidden flex-1" style={{ background: "var(--vv-border)" }}>
      <div ref={ref} className="h-full rounded-full" style={{ width: "0%", background: `linear-gradient(90deg,${color}80,${color})` }} />
    </div>
  );
}

function StatCard({ label, value, color, link }: { label: string; value: number | string; color: string; link?: string }) {
  const inner = (
    <div className="etched-slab p-5 group cursor-pointer relative overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at 80% 0%,${color}12,transparent 60%)` }} />
      <div className="relative z-10">
        <p className="font-mono-ui text-[8px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--vv-text-muted)" }}>{label}</p>
        <p className="font-black leading-none" style={{ fontSize: "2.4rem", fontFamily: "'Alegreya Sans SC', serif", color }}>
          {typeof value === "number" ? value.toString().padStart(2, "0") : value}
        </p>
      </div>
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-border)" }}>
      <p className="font-mono-ui text-[9px] uppercase tracking-wider mb-1.5" style={{ color: "var(--vv-text-muted)" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 font-mono-ui text-[10px]">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--vv-text)" }}>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

export default function Home() {
  const { data: stats, isLoading } = useGetStats();
  const { user } = useAuth();
  const name = user?.firstName || user?.username || "Scholar";
  const s = stats ?? ({} as DashboardStats);

  const totalVideos    = s.totalVideos    ?? 0;
  const totalWatched   = s.totalWatched   ?? 0;
  const totalAiOutputs = s.totalAiOutputs ?? 0;
  const totalNotes     = s.totalNotes     ?? 0;
  const totalFavorites = s.totalFavorites ?? 0;
  const totalTags      = s.totalTags      ?? 0;
  const xp             = s.xp            ?? 0;
  const level          = s.level         ?? 1;
  const levelTitle     = s.levelTitle    ?? "Novice";
  const levelColor     = s.levelColor    ?? "#6b7280";
  const progressPct    = s.progressPct   ?? 0;
  const nextLevelXP    = s.nextLevelXP   ?? 100;
  const isMaxLevel     = s.isMaxLevel    ?? false;
  const byType         = s.aiOutputsByType ?? [];
  const byTypeTotal    = byType.reduce((a, b) => a + b.count, 0);
  const daily          = s.dailyActivity  ?? [];
  const recentVideos   = s.recentVideos  ?? [];
  const recentAi       = s.recentAiOutputs ?? [];

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="font-mono-ui text-[10px] uppercase tracking-[0.3em] animate-pulse" style={{ color: "var(--vv-text-muted)" }}>
          LOADING...
        </span>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-12">

      {/* ── GREETING ── */}
      <motion.div variants={fadeUp} className="pt-2">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-1" style={{ color: "var(--vv-text-muted)" }}>{dateStr}</p>
            <h1 className="font-black lp-heading" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontFamily: "'Alegreya Sans SC', serif" }}>
              {greeting()}, {name}
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: levelColor + "15", border: `1px solid ${levelColor}30` }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: levelColor + "25", color: levelColor, fontFamily: "'Alegreya Sans SC', serif" }}>{level}</div>
              <span className="font-mono-ui text-[9px] uppercase tracking-wider font-bold" style={{ color: levelColor }}>{levelTitle}</span>
            </div>
            <Link href="/videos">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-ui text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                style={{ background: "#8b5cf6", color: "#fff" }}>
                <Play className="w-3 h-3" />
                Add Video
              </div>
            </Link>
          </div>
        </div>

        {/* XP strip */}
        <div className="flex items-center gap-3 mt-4">
          <span className="font-mono-ui text-[9px] flex-shrink-0" style={{ color: levelColor }}>{xp} XP</span>
          <XPBar pct={isMaxLevel ? 100 : progressPct} color={levelColor} />
          <span className="font-mono-ui text-[9px] flex-shrink-0" style={{ color: "var(--vv-text-muted)" }}>
            {isMaxLevel ? "MAX" : `${nextLevelXP} XP`}
          </span>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Videos Saved" value={totalVideos}    color="#8b5cf6" link="/videos" />
        <StatCard label="Watched"      value={totalWatched}   color="#10b981" />
        <StatCard label="AI Outputs"   value={totalAiOutputs} color="#ec4899" link="/ai" />
        <StatCard label="Notes"        value={totalNotes}     color="#f59e0b" />
      </motion.div>

      {/* ── ACTIVITY CHART ── */}
      <motion.div variants={fadeUp} className="etched-slab p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-0.5" style={{ color: "var(--vv-text-muted)" }}>7-Day Activity</p>
            <p className="font-mono-ui text-[11px] font-bold" style={{ color: "var(--vv-text)" }}>
              Videos saved &amp; AI outputs this week
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#8b5cf680" }} />
              <span className="font-mono-ui text-[8px] uppercase tracking-wider" style={{ color: "var(--vv-text-muted)" }}>Videos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ec4899" }} />
              <span className="font-mono-ui text-[8px] uppercase tracking-wider" style={{ color: "var(--vv-text-muted)" }}>AI</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={daily} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--vv-border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "var(--vv-text-muted)" }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: "var(--vv-text-muted)" }}
              axisLine={false} tickLine={false} allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--vv-border)", opacity: 0.4 }} />
            <Bar dataKey="videos" name="Videos" fill="#8b5cf6" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
            <Area
              dataKey="ai" name="AI Outputs" fill="#ec499915" stroke="#ec4999"
              strokeWidth={1.5} dot={false} type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── PROGRESS + AI BREAKDOWN ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Watch Progress */}
        <div className="etched-slab p-5">
          <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-4" style={{ color: "var(--vv-text-muted)" }}>Watch Progress</p>
          <div className="flex items-end justify-between mb-3">
            <p className="font-black" style={{ fontSize: "2rem", fontFamily: "'Alegreya Sans SC', serif", color: "#10b981" }}>
              {totalVideos > 0 ? Math.round((totalWatched / totalVideos) * 100) : 0}%
            </p>
            <p className="font-mono-ui text-[10px]" style={{ color: "var(--vv-text-muted)" }}>
              {totalWatched} / {totalVideos} videos
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--vv-border)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalVideos > 0 ? (totalWatched / totalVideos) * 100 : 0}%` }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#10b981,#06b6d4)" }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--vv-border)" }}>
            {[
              { label: "Favorites", value: totalFavorites, color: "#f59e0b" },
              { label: "Tags",      value: totalTags,      color: "#06b6d4" },
              { label: "Folders",   value: s.totalFolders ?? 0, color: "#8b5cf6" },
            ].map((m) => (
              <div key={m.label}>
                <p className="font-black text-lg leading-none mb-0.5" style={{ fontFamily: "'Alegreya Sans SC', serif", color: m.color }}>{m.value}</p>
                <p className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Breakdown */}
        <div className="etched-slab p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--vv-text-muted)" }}>AI Breakdown</p>
            <Link href="/ai">
              <span className="font-mono-ui text-[9px] uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: "#8b5cf6" }}>STUDIO →</span>
            </Link>
          </div>
          {byType.length > 0 ? (
            <div className="space-y-3">
              {byType.map((t) => {
                const meta = AI_META[t.type] ?? { label: t.type, icon: Brain, color: "#8b5cf6" };
                const pct = byTypeTotal > 0 ? (t.count / byTypeTotal) * 100 : 0;
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <meta.icon className="w-3 h-3 flex-shrink-0" style={{ color: meta.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>{meta.label}</span>
                        <span className="font-mono-ui text-[9px] font-bold" style={{ color: meta.color }}>{t.count}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--vv-border)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ background: meta.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-center">
              <Sparkles className="w-5 h-5 mb-2 opacity-15" style={{ color: "#ec4899" }} />
              <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>No AI outputs yet</p>
              <Link href="/ai">
                <span className="font-mono-ui text-[9px] mt-2 inline-block hover:opacity-70 transition-opacity" style={{ color: "#8b5cf6" }}>
                  Open AI Studio →
                </span>
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── RECENT AI ACTIVITY ── */}
      {recentAi.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--vv-text-muted)" }}>Recent AI Activity</p>
            <Link href="/ai">
              <span className="font-mono-ui text-[9px] uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: "var(--vv-text-muted)" }}>SEE ALL →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentAi.map((out) => {
              const meta = AI_META[out.type] ?? { label: out.type, icon: Brain, color: "#8b5cf6" };
              const diff = Date.now() - new Date(out.createdAt).getTime();
              const mins = Math.floor(diff / 60000);
              const ago = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
              return (
                <Link key={out.id} href={`/videos/${out.videoId}`}>
                  <div className="etched-slab p-3.5 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at 0% 50%,${meta.color}08,transparent)` }} />
                    <div className="flex items-start gap-3 relative z-10">
                      {out.videoThumbnail && (
                        <img src={out.videoThumbnail} alt="" className="w-10 h-7 rounded object-cover flex-shrink-0 opacity-75" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <meta.icon className="w-2.5 h-2.5" style={{ color: meta.color }} />
                          <span className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
                        </div>
                        <p className="font-mono-ui text-[10px] truncate" style={{ color: "var(--vv-text)" }}>{out.videoTitle}</p>
                        <p className="font-mono-ui text-[8px] mt-0.5" style={{ color: "var(--vv-text-muted)" }}>{ago}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0 mt-0.5" style={{ color: "var(--vv-text-muted)" }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── RECENTLY SAVED ── */}
      {recentVideos.length > 0 ? (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--vv-text-muted)" }}>Recently Saved</p>
            <Link href="/videos">
              <span className="font-mono-ui text-[9px] uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: "var(--vv-text-muted)" }}>VIEW ALL →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentVideos.slice(0, 8).map((video, i) => (
              <motion.div key={video.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        /* Empty state */
        <motion.div variants={fadeUp} className="etched-slab py-20 text-center">
          <Film className="w-8 h-8 mx-auto mb-4 opacity-10" style={{ color: "#8b5cf6" }} />
          <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--vv-text-muted)" }}>Vault Empty</p>
          <h3 className="font-black text-xl uppercase mb-2" style={{ fontFamily: "'Alegreya Sans SC', serif" }}>No Videos Yet</h3>
          <p className="font-mono-ui text-sm max-w-xs mx-auto mb-5" style={{ color: "var(--vv-text-desc)" }}>
            Paste a YouTube URL to start building your knowledge vault.
          </p>
          <Link href="/videos">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono-ui text-[10px] uppercase tracking-wider font-bold" style={{ background: "#8b5cf6", color: "#fff" }}>
              <Play className="w-3 h-3" /> Save Your First Video
            </span>
          </Link>
        </motion.div>
      )}

    </motion.div>
  );
}
