import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  useWindowDimensions,
  Animated,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { api } from "@/services/api";
import type { Video, Stats, RecentAiOutput } from "@/types/api";
import { Skeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { VideoCard } from "@/components/VideoCard";
import { SaveToVaultModal } from "@/components/SaveToVaultModal";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const PINK   = "#ec4899";
const AMBER  = "#f59e0b";

const STAT_CONFIG = [
  { label: "Videos",   code: "01", icon: "film"    as FeatherIconName, accent: PURPLE, key: "totalVideos" },
  { label: "Folders",  code: "02", icon: "folder"  as FeatherIconName, accent: CYAN,   key: "totalFolders" },
  { label: "Notes",    code: "03", icon: "edit-3"  as FeatherIconName, accent: GREEN,  key: "totalNotes" },
  { label: "AI Outputs",code: "04",icon: "cpu"     as FeatherIconName, accent: PINK,   key: "totalAiOutputs" },
  { label: "Starred",  code: "05", icon: "heart"   as FeatherIconName, accent: AMBER,  key: "totalFavorites" },
  { label: "Tags",     code: "06", icon: "tag"     as FeatherIconName, accent: "#8b8bf6", key: "totalTags" },
];

const AI_TYPE_META: Record<string, { label: string; icon: FeatherIconName; color: string }> = {
  summary:    { label: "Summary",     icon: "file-text",  color: PURPLE },
  flashcards: { label: "Flashcards",  icon: "book-open",  color: CYAN },
  mcq:        { label: "MCQ",         icon: "help-circle",color: GREEN },
  studynotes: { label: "Study Notes", icon: "list",       color: AMBER },
  transcript: { label: "Transcript",  icon: "message-square", color: PINK },
  chat:       { label: "AI Chat",     icon: "message-circle", color: "#6366f1" },
};

/* ── Animated number counter ── */
function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 900, useNativeDriver: false }).start();
  }, [value]);
  return (
    <Animated.Text style={[styles.etchedValue, { color }]}>
      {anim.interpolate({ inputRange: [0, value || 1], outputRange: ["00", value.toString().padStart(2, "0")] }) as any}
    </Animated.Text>
  );
}

/* ── Stat card — etched-slab style matching web design system ── */
function EtchedStatCard({
  label, code, value, icon, accent, delay,
}: { label: string; code: string; value: number; icon: FeatherIconName; accent: string; delay: number }) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.08, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay }}
      style={[styles.etchedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Etch highlight overlay */}
      <LinearGradient
        colors={["rgba(255,255,255,0.07)", "transparent", "rgba(0,0,0,0.3)"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.etchedTop}>
        <Text style={styles.etchedCode}>{code}</Text>
        <Feather name={icon} size={14} color={accent} style={{ opacity: 0.6 }} />
      </View>
      <Text style={[styles.etchedLabel, { color: accent + "99" }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.etchedValue, { color: colors.foreground }]}>
        {value.toString().padStart(2, "0")}
      </Text>
      <Animated.View style={[styles.etchedGlow, { backgroundColor: accent, opacity: pulse }]} />
    </MotiView>
  );
}

/* ── Quick action button ── */
function QuickAction({
  icon, label, accent, sublabel, onPress, delay,
}: { icon: FeatherIconName; label: string; accent: string; sublabel: string; onPress: () => void; delay: number }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", delay, damping: 16, stiffness: 180 }}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[styles.quickBtn, { backgroundColor: accent + "10", borderColor: accent + "30" }]}
      >
        <View style={[styles.quickBtnIcon, { backgroundColor: accent + "18" }]}>
          <Feather name={icon} size={16} color={accent} />
        </View>
        <Text style={[styles.quickBtnLabel, { color: accent }]}>{label}</Text>
        <Text style={[styles.quickBtnSub, { color: accent + "80" }]}>{sublabel}</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Activity node (timeline dot) ── */
function ActivityNode({ video, index, onPress }: { video: Video; index: number; onPress: () => void }) {
  const colors = useColors();
  const isFirst = index === 0;
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 320, delay: 80 * index }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.activityRow}>
        <View style={styles.activityLeft}>
          <View style={[styles.activityDot, { backgroundColor: isFirst ? PURPLE : colors.border, borderColor: isFirst ? PURPLE + "50" : "transparent" }]}>
            {isFirst && (
              <MotiView
                from={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ type: "timing", duration: 1200, loop: true }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 8, backgroundColor: PURPLE }]}
              />
            )}
          </View>
          {index < 4 && <View style={[styles.activityLine, { backgroundColor: colors.border }]} />}
        </View>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: isFirst ? PURPLE + "25" : colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activityTitle, { color: colors.foreground }]} numberOfLines={1}>
              {video.title}
            </Text>
            {video.channelName && (
              <Text style={[styles.activityChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
                {video.channelName}
              </Text>
            )}
          </View>
          {isFirst && (
            <View style={[styles.newPill, { backgroundColor: PURPLE }]}>
              <Text style={styles.newPillText}>NEW</Text>
            </View>
          )}
          <Feather name="arrow-right" size={12} color={colors.mutedForeground + "80"} style={{ marginLeft: 8 }} />
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Level / XP Progress Card ── */
function LevelCard({ level, levelTitle, levelColor, xp, nextLevelXP, progressPct, isMaxLevel }: {
  level: number; levelTitle: string; levelColor: string; xp: number;
  nextLevelXP: number; progressPct: number; isMaxLevel: boolean;
}) {
  const colors = useColors();
  const barW = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const innerWidth = screenWidth - 40 - 32;

  useEffect(() => {
    Animated.timing(barW, { toValue: (isMaxLevel ? 100 : progressPct) / 100 * innerWidth, duration: 1300, delay: 400, useNativeDriver: false }).start();
  }, [progressPct, innerWidth, isMaxLevel]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay: 100 }}
      style={[styles.levelCard, { backgroundColor: colors.card, borderColor: levelColor + "40" }]}
    >
      <LinearGradient
        colors={[levelColor + "0a", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.levelTop}>
        <View>
          <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>//LEARNER_PROFILE</Text>
          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + "20", borderColor: levelColor + "40" }]}>
              <Text style={[styles.levelNum, { color: levelColor }]}>{level}</Text>
            </View>
            <View>
              <Text style={[styles.levelTitle, { color: levelColor }]}>{levelTitle}</Text>
              <Text style={[styles.levelSub, { color: colors.mutedForeground }]}>Level {level} Collector</Text>
            </View>
          </View>
        </View>
        <View style={styles.xpBlock}>
          <Text style={[styles.xpValue, { color: levelColor }]}>{xp}</Text>
          <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>XP</Text>
        </View>
      </View>
      <View style={[styles.xpTrack, { backgroundColor: colors.border + "80" }]}>
        <Animated.View style={[styles.xpFill, { width: barW }]}>
          <LinearGradient colors={[levelColor + "80", levelColor]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      <View style={styles.xpMeta}>
        <Text style={[styles.xpMetaText, { color: colors.mutedForeground }]}>{xp} XP</Text>
        <Text style={[styles.xpMetaText, { color: colors.mutedForeground }]}>
          {isMaxLevel ? "MAX LEVEL" : `${nextLevelXP} XP to next`}
        </Text>
      </View>
    </MotiView>
  );
}

/* ── Recent AI Output Card ── */
function RecentAiItemCard({ output, index }: { output: RecentAiOutput; index: number }) {
  const colors = useColors();
  const meta = AI_TYPE_META[output.type] ?? { label: output.type, icon: "cpu" as FeatherIconName, color: PURPLE };
  const date = new Date(output.createdAt);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;

  const thumbUri = output.videoThumbnail || null;

  return (
    <MotiView
      from={{ opacity: 0, translateX: 10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 320, delay: 60 * index }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/video/${output.videoId}` as any)}
        style={[styles.aiCard, { backgroundColor: colors.card, borderColor: meta.color + "25" }]}
      >
        {/* Thumbnail */}
        <View style={styles.aiCardThumb}>
          <View style={{ width: 72, height: 50, borderRadius: 6, backgroundColor: colors.secondary, overflow: "hidden" }}>
            {thumbUri ? (
              <Image
                source={{ uri: thumbUri }}
                style={{ width: 72, height: 50 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: meta.color + "15" }}>
                <Feather name={meta.icon} size={18} color={meta.color + "80"} />
              </View>
            )}
            {/* Tool badge overlay */}
            <View style={{ position: "absolute", bottom: 3, right: 3, backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
              <Text style={{ fontSize: 7, fontFamily: "JetBrainsMono_600SemiBold", color: meta.color, letterSpacing: 0.5 }}>
                {meta.label.split(" ")[0].toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={2} style={{ fontSize: 12, fontFamily: "Poppins_500Medium", lineHeight: 16, color: colors.foreground }}>
            {output.videoTitle}
          </Text>
          {/* YouTube-style channel row */}
          {output.channelName && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: meta.color + "30", alignItems: "center", justifyContent: "center" }}>
                <Feather name="user" size={7} color={meta.color} />
              </View>
              <Text style={{ fontSize: 9, fontFamily: "Poppins_400Regular", color: colors.mutedForeground }} numberOfLines={1}>
                {output.channelName}
              </Text>
            </View>
          )}
          {/* Type pill + time */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: meta.color + "12", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: meta.color + "30" }}>
              <Feather name={meta.icon} size={8} color={meta.color} />
              <Text style={{ fontSize: 8, fontFamily: "JetBrainsMono_600SemiBold", color: meta.color, letterSpacing: 0.8 }}>{meta.label.toUpperCase()}</Text>
            </View>
            <Text style={{ fontSize: 9, fontFamily: "JetBrainsMono_400Regular", color: colors.mutedForeground + "80", letterSpacing: 0.3 }}>{timeAgo}</Text>
          </View>
        </View>

        <Feather name="chevron-right" size={12} color={colors.mutedForeground + "50"} />
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Watch Progress bar ── */
function WatchProgressBar({ watched, total }: { watched: number; total: number }) {
  const colors = useColors();
  const width = useWindowDimensions().width - 40;
  const pct = total > 0 ? Math.min(watched / total, 1) : 0;
  const barW = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barW, { toValue: pct * (width - 32), duration: 1200, delay: 600, useNativeDriver: false }).start();
  }, [pct, width]);

  const pctLabel = total > 0 ? `${Math.round(pct * 100)}%` : "0%";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay: 500 }}
      style={[styles.intelBar, { backgroundColor: colors.card, borderColor: GREEN + "22" }]}
    >
      <View style={styles.intelTop}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MotiView
            from={{ opacity: 0.4 }} animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 800, loop: true }}
            style={[styles.intelDot, { backgroundColor: GREEN }]}
          />
          <Text style={[styles.intelLabel, { color: colors.mutedForeground }]}>WATCH PROGRESS</Text>
        </View>
        <Text style={[styles.intelCount, { color: GREEN }]}>{watched}/{total} watched</Text>
      </View>
      <View style={[styles.intelTrack, { backgroundColor: colors.border + "80" }]}>
        <Animated.View style={[styles.intelFill, { width: barW }]}>
          <LinearGradient
            colors={[GREEN, CYAN]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={[styles.intelSub, { color: colors.mutedForeground }]}>
        {pctLabel} of your vault watched · keep going!
      </Text>
    </MotiView>
  );
}

/* ═══════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════ */
export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { width: screenWidth } = useWindowDimensions();
  const CARD_W = screenWidth - 40;
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const favoriteMutation = useMutation({
    mutationFn: (videoId: string) => api.toggleFavorite(videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stats"] }),
  });

  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const recentVideos: Video[] = stats?.recentVideos ?? [];
  const favoriteVideos: Video[] = stats?.favoriteVideos ?? [];
  const recentAiOutputs: RecentAiOutput[] = stats?.recentAiOutputs ?? [];
  const totalWatched = stats?.totalWatched ?? 0;
  const totalVideos = stats?.totalVideos ?? 0;
  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const levelTitle = stats?.levelTitle ?? "Novice";
  const levelColor = stats?.levelColor ?? "#6b7280";
  const progressPct = stats?.progressPct ?? 0;
  const nextLevelXP = stats?.nextLevelXP ?? 100;
  const isMaxLevel = stats?.isMaxLevel ?? false;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* ── Ambient glow behind header ── */}
      <MotiView
        from={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 1200 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[PURPLE + "18", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      <TopAppBar
        rightAction={
          <AppButton
            label="SAVE"
            icon="plus"
            size="sm"
            variant="primary"
            onPress={() => setShowSaveModal(true)}
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botInset + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PURPLE} />}
      >
        {/* ── Hero Greeting ── */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={styles.greeting}
        >
          <View style={styles.greetingTopRow}>
            <Text style={[styles.greetingLabel, { color: colors.mutedForeground }]}>//SYSTEM_STATUS</Text>
            <View style={styles.statusBadge}>
              <MotiView
                from={{ opacity: 0.3 }} animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 700, loop: true }}
                style={[styles.statusDot, { backgroundColor: GREEN }]}
              />
              <Text style={[styles.statusText, { color: GREEN }]}>ACTIVE</Text>
            </View>
          </View>
          <Text style={[styles.greetingName, { color: colors.foreground }]}>
            {displayName}{"'"}s Vault
          </Text>
          <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
            KNOWLEDGE_BASE // OPERATIONAL
          </Text>
        </MotiView>

        {/* ── Level / XP Card ── */}
        <View style={styles.sectionPad}>
          {isLoading ? (
            <Skeleton height={120} borderRadius={14} />
          ) : (
            <LevelCard
              level={level} levelTitle={levelTitle} levelColor={levelColor}
              xp={xp} nextLevelXP={nextLevelXP} progressPct={progressPct} isMaxLevel={isMaxLevel}
            />
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActions}>
          <QuickAction icon="cpu" label="AI Studio" sublabel="Generate" accent={PURPLE} delay={100} onPress={() => router.push("/(tabs)/ai-studio")} />
          <QuickAction icon="folder" label="Folders" sublabel="Organize" accent={CYAN} delay={160} onPress={() => router.push("/(tabs)/folders")} />
          <QuickAction icon="heart" label="Favorites" sublabel="Starred" accent={PINK} delay={220} onPress={() => router.push("/(tabs)/videos")} />
        </View>

        {/* ── Watch Progress bar ── */}
        <View style={styles.sectionPad}>
          <WatchProgressBar watched={totalWatched} total={totalVideos} />
        </View>

        {/* ── Stats 2×2 grid ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VAULT METRICS</Text>
            <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
          </View>
          {isLoading ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={100} style={{ width: (screenWidth - 50) / 2 }} borderRadius={4} />
              ))}
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {STAT_CONFIG.map((cfg, i) => (
                <View key={cfg.code} style={{ width: (screenWidth - 50) / 2 }}>
                  <EtchedStatCard
                    code={cfg.code}
                    label={cfg.label}
                    icon={cfg.icon}
                    accent={cfg.accent}
                    delay={i * 80}
                    value={(stats as any)?.[cfg.key] ?? 0}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Recent AI Activity ── */}
        {recentAiOutputs.length > 0 && (
          <View style={styles.section}>
            <MotiView
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 380, delay: 150 }}
              style={styles.sectionHeader2}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//RECENT_INTELLIGENCE</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Activity</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/ai-studio")} activeOpacity={0.7}>
                <Text style={[styles.viewAll, { color: PURPLE }]}>STUDIO →</Text>
              </TouchableOpacity>
            </MotiView>
            <View style={{ gap: 8 }}>
              {recentAiOutputs.slice(0, 5).map((output, i) => (
                <RecentAiItemCard key={output.id} output={output} index={i} />
              ))}
            </View>
          </View>
        )}

        {/* ── Recent Captures — vertical full-width ── */}
        <View style={styles.section}>
          <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 380, delay: 200 }}
            style={styles.sectionHeader2}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//RECENTLY_SAVED</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest Captures</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
              <Text style={[styles.viewAll, { color: PURPLE }]}>VIEW ALL →</Text>
            </TouchableOpacity>
          </MotiView>

          {isLoading ? (
            <View style={{ gap: 10 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={170} borderRadius={4} />)}
            </View>
          ) : recentVideos.length > 0 ? (
            <View style={{ gap: 0 }}>
              {recentVideos.slice(0, 5).map((video: Video, index: number) => (
                <MotiView
                  key={video.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 340, delay: index * 70 }}
                >
                  <VideoCard
                    video={video}
                    cardWidth={CARD_W}
                    isNew={index === 0}
                    onPress={() => router.push(`/video/${video.id}`)}
                    onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                  />
                </MotiView>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="film"
              title="Vault is empty"
              subtitle="Save your first YouTube video to get started"
              actionLabel="Save Video"
              onAction={() => setShowSaveModal(true)}
              code="00"
            />
          )}
        </View>

        {/* ── Activity Timeline ── */}
        {recentVideos.length > 0 && (
          <View style={styles.section}>
            <MotiView
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 380, delay: 300 }}
              style={styles.sectionHeader2}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//ACTIVITY_FEED</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Timeline</Text>
              </View>
            </MotiView>
            <View style={{ paddingLeft: 4 }}>
              {recentVideos.slice(0, 5).map((video, index) => (
                <ActivityNode
                  key={video.id}
                  video={video}
                  index={index}
                  onPress={() => router.push(`/video/${video.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Favorites ── */}
        {favoriteVideos.length > 0 && (
          <View style={styles.section}>
            <MotiView
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 380, delay: 350 }}
              style={styles.sectionHeader2}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//STARRED</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
                <Text style={[styles.viewAll, { color: PINK }]}>VIEW ALL →</Text>
              </TouchableOpacity>
            </MotiView>
            <View style={{ gap: 0 }}>
              {favoriteVideos.slice(0, 4).map((video: Video, index) => (
                <MotiView
                  key={video.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 340, delay: index * 70 }}
                >
                  <VideoCard
                    video={video}
                    cardWidth={CARD_W}
                    onPress={() => router.push(`/video/${video.id}`)}
                    onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                  />
                </MotiView>
              ))}
            </View>
          </View>
        )}

        {/* ── Vault tagline ── */}
        <MotiView
          from={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 600, delay: 800 }}
          style={styles.tagline}
        >
          <LinearGradient
            colors={[PURPLE + "00", PURPLE + "15", PURPLE + "00"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
          />
          <Text style={[styles.taglineText, { color: colors.mutedForeground }]}>
            VIDVAULT AI // BUILD YOUR KNOWLEDGE VAULT
          </Text>
        </MotiView>
      </ScrollView>

      <SaveToVaultModal visible={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  ambientGlow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 280,
    zIndex: 0,
  },

  greeting: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  greetingTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  greetingLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2.5 },
  greetingName: { fontSize: 38, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1, lineHeight: 46, marginBottom: 6 },
  greetingSub: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },

  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: "#10b98115", borderWidth: 1, borderColor: "#10b98130" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.5 },

  quickActions: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 20, paddingBottom: 20,
  },
  quickBtn: {
    flex: 1, alignItems: "center", gap: 5,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  quickBtnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  quickBtnLabel: { fontSize: 10, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.2 },
  quickBtnSub: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },

  sectionPad: { paddingHorizontal: 20, marginBottom: 20 },
  section: { paddingHorizontal: 20, marginBottom: 28 },

  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginBottom: 14,
  },
  sectionHeader2: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-between", marginBottom: 14, gap: 12,
  },
  sectionLine: { flex: 1, height: 1 },
  sectionLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2 },
  sectionMicro: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2, marginBottom: 3 },
  sectionTitle: { fontSize: 20, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.4 },
  viewAll: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5, paddingBottom: 3 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  etchedCard: {
    padding: 14, borderWidth: 1, borderRadius: 14, overflow: "hidden", minHeight: 110,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  etchedTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  etchedCode: {
    fontSize: 8, fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5, color: "rgba(255,255,255,0.2)",
  },
  etchedLabel: {
    fontSize: 9, fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2, marginBottom: 4, textTransform: "uppercase",
  },
  etchedValue: { fontSize: 36, fontFamily: "AlegreyaSansSC_800ExtraBold", lineHeight: 42, letterSpacing: -2 },
  etchedGlow: {
    position: "absolute", bottom: -24, right: -24,
    width: 72, height: 72, borderRadius: 36,
  },

  intelBar: { borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#ffffff12", backgroundColor: "#111115", overflow: "hidden" },
  intelTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  intelDot: { width: 7, height: 7, borderRadius: 3.5 },
  intelLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.8 },
  intelCount: { fontSize: 11, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 0.5 },
  intelTrack: { height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 8 },
  intelFill: { height: "100%", borderRadius: 2, overflow: "hidden" },
  intelSub: { fontSize: 9, fontFamily: "Poppins_400Regular", letterSpacing: 0.3 },

  activityRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 0 },
  activityLeft: { width: 24, alignItems: "center" },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 14, borderWidth: 2, zIndex: 1, overflow: "visible" },
  activityLine: { flex: 1, width: 1, minHeight: 28 },
  activityCard: {
    flex: 1, marginLeft: 10, marginBottom: 10,
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1, padding: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  activityTitle: { fontSize: 12, fontFamily: "Poppins_600SemiBold", lineHeight: 17 },
  activityChannel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.3, marginTop: 1 },
  newPill: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  newPillText: { color: "#fff", fontSize: 7, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1 },

  tagline: { marginHorizontal: 20, padding: 14, borderRadius: 8, alignItems: "center", overflow: "hidden" },
  taglineText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2.5 },

  levelCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 7,
  },
  levelTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  levelLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2, marginBottom: 8 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelBadge: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  levelNum: { fontSize: 18, fontFamily: "AlegreyaSansSC_800ExtraBold", lineHeight: 22 },
  levelTitle: { fontSize: 13, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.2 },
  levelSub: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
  xpBlock: { alignItems: "flex-end" },
  xpValue: { fontSize: 32, fontFamily: "AlegreyaSansSC_800ExtraBold", lineHeight: 36, letterSpacing: -1 },
  xpLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2 },
  xpTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  xpFill: { height: "100%", borderRadius: 3, overflow: "hidden" },
  xpMeta: { flexDirection: "row", justifyContent: "space-between" },
  xpMetaText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },

  aiCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  aiCardThumb: { flexShrink: 0 },
  aiCardTypeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  aiCardType: { fontSize: 8, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.5 },
  aiCardTitle: { fontSize: 12, fontFamily: "Poppins_500Medium", lineHeight: 17 },
  aiCardTime: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.3, marginTop: 2 },
});
