import { useGetStats } from "@workspace/api-client-react";
import type { DashboardStats } from "@workspace/api-client-react";
import { VideoCard } from "@/components/videos/VideoCard";
import {
  Library, Folder, Tag, Star, Brain, FileText, Sparkles,
  BookOpen, ListChecks, HelpCircle, MessageSquare, Film,
  Play, ChevronRight, Network, LayoutTemplate, Target, TrendingUp,
  ArrowRight, Zap,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const AI_TYPE_META: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
  summary:    { label: "Summary",     icon: FileText,      color: "#8b5cf6" },
  flashcards: { label: "Flashcards",  icon: BookOpen,      color: "#06b6d4" },
  mcq:        { label: "MCQ",         icon: HelpCircle,    color: "#10b981" },
  studynotes: { label: "Study Notes", icon: ListChecks,    color: "#f59e0b" },
  transcript: { label: "Transcript",  icon: MessageSquare, color: "#ec4899" },
  chat:       { label: "AI Chat",     icon: Brain,         color: "#6366f1" },
};

const LEVEL_COLORS: Record<number, string> = {
  1: "#6b7280", 2: "#3b82f6", 3: "#8b5cf6",
  4: "#06b6d4", 5: "#10b981", 6: "#f59e0b", 7: "#ec4899",
};

function XPBar({ pct, color }: { pct: number; color: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.transition = "width 1.2s cubic-bezier(0.4,0,0.2,1)";
      el.style.width = `${pct}%`;
    });
  }, [pct]);
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--vv-border)" }}>
      <div ref={barRef} className="h-full rounded-full" style={{ width: "0%", background: `linear-gradient(90deg, ${color}80, ${color})` }} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent, code, link }: {
  label: string; value: number; icon: React.FC<any>; accent: string; code: string; link?: string;
}) {
  const inner = (
    <div className="etched-slab p-5 relative overflow-hidden group cursor-pointer h-full">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at 70% 0%, ${accent}12, transparent 60%)` }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em]" style={{ color: "var(--vv-text-muted)" }}>{code}</span>
          <Icon className="w-3.5 h-3.5 opacity-40" style={{ color: accent }} />
        </div>
        <p className="font-mono-ui text-[9px] uppercase tracking-widest mb-1" style={{ color: accent + "90" }}>{label}</p>
        <p className="font-black lp-heading leading-none" style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontFamily: "'Alegreya Sans SC', serif" }}>
          {value.toString().padStart(2, "0")}
        </p>
      </div>
      <div className="absolute bottom-0 right-0 w-16 h-16 opacity-[0.04] group-hover:opacity-[0.09] transition-opacity" style={{ background: `radial-gradient(circle, ${accent}, transparent)` }} />
    </div>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

function WatchProgressCard({ watched, total }: { watched: number; total: number }) {
  const pct = total > 0 ? Math.min(watched / total, 1) : 0;
  return (
    <div className="etched-slab p-5 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 0% 100%, #10b98112, transparent 60%)" }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
            <span className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>Watch Progress</span>
          </div>
          <span className="font-mono-ui text-[10px] font-bold" style={{ color: "#10b981" }}>
            {watched}/{total}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--vv-border)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #10b981, #06b6d4)" }}
          />
        </div>
        <p className="font-mono-ui text-[9px]" style={{ color: "var(--vv-text-muted)" }}>
          {Math.round(pct * 100)}% of vault watched · {total - watched} remaining
        </p>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, sublabel, color, href }: {
  icon: React.FC<any>; label: string; sublabel: string; color: string; href: string;
}) {
  return (
    <Link href={href}>
      <div className="etched-slab p-4 cursor-pointer group relative overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}10, transparent)` }} />
        <div className="relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + "18", border: `1px solid ${color}25` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--vv-text)" }}>{label}</p>
          <p className="font-mono-ui text-[9px]" style={{ color: "var(--vv-text-muted)" }}>{sublabel}</p>
        </div>
        <ChevronRight className="absolute bottom-4 right-4 w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color }} />
      </div>
    </Link>
  );
}

function AiTypeRow({ type, count, total }: { type: string; count: number; total: number }) {
  const meta = AI_TYPE_META[type] ?? { label: type, icon: Brain, color: "#8b5cf6" };
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <meta.icon className="w-3 h-3 flex-shrink-0" style={{ color: meta.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>{meta.label}</span>
          <span className="font-mono-ui text-[9px] font-bold" style={{ color: meta.color }}>{count}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--vv-border)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: meta.color }}
          />
        </div>
      </div>
    </div>
  );
}

function WelcomeBanner({ name, totalVideos, totalAiOutputs }: { name: string; totalVideos: number; totalAiOutputs: number }) {
  const featureCards = [
    { icon: Brain,          label: "Smart Learning",   desc: "AI-powered study tools", color: "#8b5cf6", href: "/ai" },
    { icon: TrendingUp,     label: "Track Progress",   desc: "Monitor your goals",      color: "#06b6d4", href: "/" },
    { icon: Network,        label: "Knowledge Graph",  desc: "Map your concepts",       color: "#10b981", href: "/knowledge-graph" },
    { icon: LayoutTemplate, label: "Template Library", desc: "Export in your style",    color: "#f59e0b", href: "/templates" },
  ];
  return (
    <div className="etched-slab relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 0% 50%, #8b5cf620, transparent 50%), radial-gradient(ellipse at 100% 50%, #06b6d420, transparent 50%)" }} />
      <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6">
        <div className="flex-1 flex flex-col justify-center">
          <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-3" style={{ color: "var(--vv-text-muted)" }}>//KNOWLEDGE_SYSTEM · ACTIVE</span>
          <h2 className="font-black lp-heading uppercase mb-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em", color: "var(--vv-text)" }}>
            Welcome back,<br />
            <span style={{ color: "#8b5cf6" }}>{name}</span>
          </h2>
          <p className="font-mono-ui text-[11px] mb-5 max-w-xs" style={{ color: "var(--vv-text-desc)" }}>
            Continue your learning journey with personalized AI tools and a second brain that grows with you.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/videos">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono-ui text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer" style={{ background: "#8b5cf6", color: "#fff" }}>
                <Zap className="w-3.5 h-3.5" />
                Start Learning
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
            <Link href="/ai">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono-ui text-[10px] uppercase tracking-wider transition-all cursor-pointer" style={{ border: "1px solid var(--vv-border)", color: "var(--vv-text-muted)" }}>
                AI Studio →
              </div>
            </Link>
          </div>
          {totalVideos > 0 && (
            <p className="font-mono-ui text-[9px] mt-3" style={{ color: "var(--vv-text-muted)" }}>
              {totalVideos} video{totalVideos !== 1 ? "s" : ""} saved · {totalAiOutputs} AI output{totalAiOutputs !== 1 ? "s" : ""} generated
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="grid grid-cols-2 gap-2.5 w-full md:w-[280px]">
            {featureCards.map((fc) => (
              <Link key={fc.label} href={fc.href}>
                <div className="p-3.5 rounded-xl cursor-pointer group transition-all relative overflow-hidden" style={{ background: "var(--vv-bg)", border: "1px solid var(--vv-border)" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at 50% 0%, ${fc.color}12, transparent)` }} />
                  <div className="relative z-10">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: fc.color + "20" }}>
                      <fc.icon className="w-3.5 h-3.5" style={{ color: fc.color }} />
                    </div>
                    <p className="font-mono-ui text-[9px] font-bold uppercase tracking-wider leading-tight" style={{ color: "var(--vv-text)" }}>{fc.label}</p>
                    <p className="font-mono-ui text-[8px] mt-0.5" style={{ color: "var(--vv-text-muted)" }}>{fc.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningToolCard({ icon: Icon, label, desc, color, href, stat, statLabel }: {
  icon: React.FC<any>; label: string; desc: string; color: string; href: string; stat?: string | number; statLabel?: string;
}) {
  return (
    <Link href={href}>
      <div className="etched-slab p-5 cursor-pointer group relative overflow-hidden h-full">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at 70% 0%, ${color}12, transparent 60%)` }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "18", border: `1px solid ${color}25` }}>
              <Icon className="w-4.5 h-4.5" style={{ color }} />
            </div>
            {stat !== undefined && (
              <div className="text-right">
                <p className="font-black lp-heading text-xl leading-none" style={{ color, fontFamily: "'Alegreya Sans SC', serif" }}>{stat}</p>
                <p className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>{statLabel}</p>
              </div>
            )}
          </div>
          <p className="font-mono-ui text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--vv-text)" }}>{label}</p>
          <p className="font-mono-ui text-[10px] leading-relaxed" style={{ color: "var(--vv-text-desc)" }}>{desc}</p>
        </div>
        <ChevronRight className="absolute bottom-4 right-4 w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color }} />
      </div>
    </Link>
  );
}

function RecentAiCard({ output }: { output: DashboardStats["recentAiOutputs"][0] }) {
  const meta = AI_TYPE_META[output.type] ?? { label: output.type, icon: Brain, color: "#8b5cf6" };
  const date = new Date(output.createdAt);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
  return (
    <Link href={`/videos/${output.videoId}`}>
      <div className="etched-slab p-3.5 cursor-pointer group relative overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(ellipse at 0% 50%, ${meta.color}08, transparent)` }} />
        <div className="flex items-start gap-3 relative z-10">
          {output.videoThumbnail && (
            <img src={output.videoThumbnail} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0 opacity-80" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <meta.icon className="w-2.5 h-2.5" style={{ color: meta.color }} />
              <span className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <p className="font-mono-ui text-[10px] truncate" style={{ color: "var(--vv-text)" }}>{output.videoTitle}</p>
            <p className="font-mono-ui text-[8px] mt-0.5" style={{ color: "var(--vv-text-muted)" }}>{timeAgo}</p>
          </div>
          <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity mt-1" style={{ color: "var(--vv-text-muted)" }} />
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { data: stats, isLoading } = useGetStats();
  const { user } = useAuth();
  const displayName = user?.firstName || user?.username || "Scholar";

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <span className="font-mono-ui text-xs uppercase tracking-widest animate-pulse" style={{ color: "var(--vv-text-muted)" }}>
          LOADING_VAULT...
        </span>
      </div>
    );
  }

  const s = stats ?? ({} as DashboardStats);
  const totalVideos    = s.totalVideos    ?? 0;
  const totalFolders   = s.totalFolders   ?? 0;
  const totalTags      = s.totalTags      ?? 0;
  const totalFavorites = s.totalFavorites ?? 0;
  const totalWatched   = s.totalWatched   ?? 0;
  const totalNotes     = s.totalNotes     ?? 0;
  const totalAiOutputs = s.totalAiOutputs ?? 0;
  const xp             = s.xp            ?? 0;
  const level          = s.level         ?? 1;
  const levelTitle     = s.levelTitle    ?? "Novice";
  const levelColor     = s.levelColor    ?? LEVEL_COLORS[level] ?? "#6b7280";
  const progressPct    = s.progressPct   ?? 0;
  const nextLevelXP    = s.nextLevelXP   ?? 100;
  const isMaxLevel     = s.isMaxLevel    ?? false;
  const byType         = s.aiOutputsByType ?? [];
  const byTypeTotal    = byType.reduce((a, b) => a + b.count, 0);

  const statCards = [
    { label: "Videos",     value: totalVideos,    icon: Film,     accent: "#8b5cf6", code: "01", link: "/videos" },
    { label: "Folders",    value: totalFolders,   icon: Folder,   accent: "#06b6d4", code: "02", link: "/folders" },
    { label: "Tags",       value: totalTags,      icon: Tag,      accent: "#10b981", code: "03", link: "/videos" },
    { label: "Starred",    value: totalFavorites, icon: Star,     accent: "#f59e0b", code: "04", link: "/videos?favorites=true" },
    { label: "AI Outputs", value: totalAiOutputs, icon: Sparkles, accent: "#ec4899", code: "05", link: "/ai" },
    { label: "Notes",      value: totalNotes,     icon: FileText, accent: "#6366f1", code: "06" },
  ];

  const quickActions = [
    { icon: Play,     label: "Save Video",    sublabel: "Add a YouTube link",   color: "#8b5cf6", href: "/videos" },
    { icon: Sparkles, label: "AI Studio",     sublabel: "Generate insights",    color: "#ec4899", href: "/ai" },
    { icon: Library,  label: "My Library",    sublabel: "Browse all videos",    color: "#06b6d4", href: "/videos" },
    { icon: Folder,   label: "Folders",       sublabel: "Organize your vault",  color: "#10b981", href: "/folders" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">

      {/* ── Welcome Banner ── */}
      <motion.div variants={item} className="pt-2">
        <WelcomeBanner name={displayName} totalVideos={totalVideos} totalAiOutputs={totalAiOutputs} />
      </motion.div>

      {/* ── Level Card + Side Cards ── */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level / XP card */}
        <div className="md:col-span-2 etched-slab p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at 100% 0%, ${levelColor}1a, transparent 60%)` }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-2" style={{ color: "var(--vv-text-muted)" }}>//LEARNER_PROFILE</span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg" style={{ background: levelColor + "20", border: `1px solid ${levelColor}40`, color: levelColor, fontFamily: "'Alegreya Sans SC', serif" }}>
                    {level}
                  </div>
                  <div>
                    <p className="font-mono-ui text-sm font-bold uppercase tracking-wider" style={{ color: levelColor }}>{levelTitle}</p>
                    <p className="font-mono-ui text-[9px]" style={{ color: "var(--vv-text-muted)" }}>Level {level} Knowledge Collector</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black lp-heading leading-none" style={{ fontSize: "2.5rem", fontFamily: "'Alegreya Sans SC', serif", color: levelColor }}>{xp}</p>
                <p className="font-mono-ui text-[9px]" style={{ color: "var(--vv-text-muted)" }}>XP EARNED</p>
              </div>
            </div>
            <XPBar pct={isMaxLevel ? 100 : progressPct} color={levelColor} />
            <div className="flex justify-between mt-1.5 mb-4">
              <span className="font-mono-ui text-[8px]" style={{ color: "var(--vv-text-muted)" }}>{xp} XP current</span>
              <span className="font-mono-ui text-[8px]" style={{ color: "var(--vv-text-muted)" }}>
                {isMaxLevel ? "MAX LEVEL REACHED" : `${nextLevelXP} XP to next level`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: "var(--vv-border)" }}>
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "var(--vv-text-muted)" }}>Save Videos</p>
                <p className="font-mono-ui text-xs font-bold" style={{ color: "var(--vv-text)" }}>+{totalVideos * 10} XP</p>
                <p className="font-mono-ui text-[8px]" style={{ color: "var(--vv-text-muted)" }}>10 XP / video</p>
              </div>
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "var(--vv-text-muted)" }}>AI Work</p>
                <p className="font-mono-ui text-xs font-bold" style={{ color: "var(--vv-text)" }}>+{totalAiOutputs * 20} XP</p>
                <p className="font-mono-ui text-[8px]" style={{ color: "var(--vv-text-muted)" }}>20 XP / output</p>
              </div>
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "var(--vv-text-muted)" }}>Take Notes</p>
                <p className="font-mono-ui text-xs font-bold" style={{ color: "var(--vv-text)" }}>+{totalNotes * 15} XP</p>
                <p className="font-mono-ui text-[8px]" style={{ color: "var(--vv-text-muted)" }}>15 XP / note</p>
              </div>
            </div>
          </div>
        </div>

        {/* Watch Progress stacked */}
        <div className="flex flex-col gap-4">
          <WatchProgressCard watched={totalWatched} total={totalVideos} />
          <div className="etched-slab p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-0.5" style={{ color: "var(--vv-text-muted)" }}>//AI_BREAKDOWN</span>
                <p className="font-mono-ui text-[10px] font-bold" style={{ color: "var(--vv-text)" }}>AI Activity</p>
              </div>
              <Link href="/ai"><span className="font-mono-ui text-[9px] uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: "#8b5cf6" }}>STUDIO →</span></Link>
            </div>
            {byType.length > 0 ? (
              <div className="space-y-3">
                {byType.map((t) => <AiTypeRow key={t.type} type={t.type} count={t.count} total={byTypeTotal} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Sparkles className="w-5 h-5 mb-2 opacity-20" style={{ color: "#ec4899" }} />
                <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>No outputs yet</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <motion.div variants={item}>
        <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-3" style={{ color: "var(--vv-text-muted)" }}>//VAULT_METRICS</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card) => (
            <motion.div key={card.code} whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div variants={item}>
        <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-3" style={{ color: "var(--vv-text-muted)" }}>//QUICK_ACTIONS</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((qa) => (
            <motion.div key={qa.label} whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
              <QuickActionCard {...qa} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Learning Tools ── */}
      <motion.div variants={item}>
        <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-3" style={{ color: "var(--vv-text-muted)" }}>//LEARNING_TOOLS</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LearningToolCard
            icon={Network}
            label="Knowledge Graph"
            desc="Visualize connections between your videos and topics in an interactive concept map."
            color="#10b981"
            href="/knowledge-graph"
            stat={s.totalTags ?? 0}
            statLabel="Topics"
          />
          <LearningToolCard
            icon={LayoutTemplate}
            label="Template Library"
            desc="Export your AI outputs in 8+ professional formats — Cornell Notes, Mind Maps, and more."
            color="#f59e0b"
            href="/templates"
            stat="8+"
            statLabel="Templates"
          />
          <LearningToolCard
            icon={Target}
            label="AI Study Plan"
            desc="Generate a personalized study plan based on your vault content and learning patterns."
            color="#6366f1"
            href="/ai"
            stat={s.totalAiOutputs ?? 0}
            statLabel="Generated"
          />
          <LearningToolCard
            icon={Sparkles}
            label="AI Studio"
            desc="Create summaries, flashcards, MCQs, study notes, and interactive quizzes from any video."
            color="#ec4899"
            href="/ai"
            stat={s.totalVideos ?? 0}
            statLabel="Videos"
          />
        </div>
      </motion.div>

      {/* ── Recent AI Activity ── */}
      {(s.recentAiOutputs ?? []).length > 0 && (
        <motion.section variants={item} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-0.5" style={{ color: "var(--vv-text-muted)" }}>//RECENT_INTELLIGENCE</span>
              <h2 className="text-lg font-black lp-heading uppercase flex items-center gap-2" style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
                <Sparkles className="w-4 h-4" style={{ color: "#ec4899" }} />
                AI Activity
              </h2>
            </div>
            <Link href="/ai"><span className="font-mono-ui text-[9px] hover:opacity-70 uppercase tracking-widest transition-opacity" style={{ color: "var(--vv-text-muted)" }}>STUDIO →</span></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(s.recentAiOutputs ?? []).map((output, i) => (
              <motion.div key={output.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <RecentAiCard output={output} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Recently Saved ── */}
      {(s.recentVideos ?? []).length > 0 && (
        <motion.section variants={item} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-0.5" style={{ color: "var(--vv-text-muted)" }}>//RECENTLY_CAPTURED</span>
              <h2 className="text-lg font-black lp-heading uppercase" style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>Latest Captures</h2>
            </div>
            <Link href="/videos">
              <span className="font-mono-ui text-[9px] hover:opacity-70 uppercase tracking-widest transition-opacity" style={{ color: "var(--vv-text-muted)" }}>VIEW_ALL →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(s.recentVideos ?? []).slice(0, 8).map((video, i) => (
              <motion.div key={video.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Favorites ── */}
      {(s.favoriteVideos ?? []).length > 0 && (
        <motion.section variants={item} className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-0.5" style={{ color: "var(--vv-text-muted)" }}>//STARRED</span>
              <h2 className="text-lg font-black lp-heading uppercase flex items-center gap-2" style={{ fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
                <Star className="w-4 h-4 text-yellow-500" />
                Favorites
              </h2>
            </div>
            <Link href="/videos?favorites=true">
              <span className="font-mono-ui text-[9px] hover:opacity-70 uppercase tracking-widest transition-opacity" style={{ color: "var(--vv-text-muted)" }}>VIEW_ALL →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(s.favoriteVideos ?? []).slice(0, 4).map((video, i) => (
              <motion.div key={video.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <VideoCard video={video} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── Empty State ── */}
      {(!s.recentVideos || s.recentVideos.length === 0) && (
        <motion.div variants={item} className="etched-slab py-24 text-center">
          <Library className="w-10 h-10 mx-auto mb-5" style={{ color: "var(--vv-text-muted)" }} />
          <span className="font-mono-ui text-[10px] uppercase tracking-[0.3em] block mb-3" style={{ color: "var(--vv-text-muted)" }}>VAULT_EMPTY</span>
          <h3 className="text-xl font-black uppercase mb-3" style={{ color: "var(--vv-text)" }}>No Videos Yet</h3>
          <p className="font-mono-ui text-sm max-w-sm mx-auto" style={{ color: "var(--vv-text-desc)" }}>
            Paste a YouTube URL to begin saving videos to your knowledge vault.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
