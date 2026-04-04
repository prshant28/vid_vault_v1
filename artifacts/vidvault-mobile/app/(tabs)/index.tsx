import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import type { Video, Stats } from "@/types/api";
import { Skeleton, StatCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { VideoListCard } from "@/components/VideoListCard";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const STAT_CONFIG = [
  { label: "TOTAL_VIDEOS", code: "01", icon: "film" as FeatherIconName, accent: "#8b5cf6" },
  { label: "FOLDERS", code: "02", icon: "folder" as FeatherIconName, accent: "#06b6d4" },
  { label: "TAGS_USED", code: "03", icon: "tag" as FeatherIconName, accent: "#10b981" },
];

function EtchedStatCard({
  label,
  code,
  value,
  icon,
  accent,
}: {
  label: string;
  code: string;
  value: number;
  icon: FeatherIconName;
  accent: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.etchedCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top row: code number + icon */}
      <View style={styles.etchedTop}>
        <Text style={[styles.etchedCode, { color: colors.mutedForeground }]}>{code}</Text>
        <Feather name={icon} size={14} color={accent + "60"} />
      </View>

      {/* Accent label */}
      <Text style={[styles.etchedLabel, { color: accent + "99" }]}>{label}</Text>

      {/* Large value */}
      <Text style={[styles.etchedValue, { color: colors.foreground }]}>
        {value.toString().padStart(2, "0")}
      </Text>

      {/* Radial glow decoration */}
      <View
        style={[
          styles.etchedGlow,
          { backgroundColor: accent },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const favoriteMutation = useMutation({
    mutationFn: (videoId: string) => api.toggleFavorite(videoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";
  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: botInset + 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>//SYSTEM_STATUS</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{displayName}{"'"}s Vault</Text>
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>KNOWLEDGE_BASE // ACTIVE</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/videos")}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OVERVIEW</Text>
          <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
        </View>
        {isLoading ? (
          <View style={styles.statsGrid}>
            {[1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {STAT_CONFIG.map((cfg, i) => (
              <EtchedStatCard
                key={cfg.code}
                code={cfg.code}
                label={cfg.label}
                icon={cfg.icon}
                accent={cfg.accent}
                value={
                  i === 0
                    ? stats?.totalVideos ?? 0
                    : i === 1
                    ? stats?.totalFolders ?? 0
                    : stats?.totalTags ?? 0
                }
              />
            ))}
          </View>
        )}
      </View>

      {/* Recently Added */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//RECENTLY_SAVED</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest Captures</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
            <Text style={[styles.viewAll, { color: colors.mutedForeground }]}>VIEW_ALL →</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <>
            <Skeleton height={72} style={{ marginBottom: 10 }} borderRadius={4} />
            <Skeleton height={72} style={{ marginBottom: 10 }} borderRadius={4} />
            <Skeleton height={72} borderRadius={4} />
          </>
        ) : stats?.recentVideos && stats.recentVideos.length > 0 ? (
          stats.recentVideos.slice(0, 5).map((video: Video) => (
            <VideoListCard
              key={video.id}
              video={video}
              onPress={() => router.push(`/video/${video.id}`)}
              onToggleFavorite={() => favoriteMutation.mutate(video.id)}
            />
          ))
        ) : (
          <EmptyState
            icon="film"
            title="No videos yet"
            subtitle="Add your first YouTube video to get started"
            actionLabel="Add Video"
            onAction={() => router.push("/(tabs)/videos")}
          />
        )}
      </View>

      {stats?.favoriteVideos && stats.favoriteVideos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//STARRED</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
            </View>
            <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
          </View>
          {stats.favoriteVideos.slice(0, 3).map((video: Video) => (
            <VideoListCard
              key={video.id}
              video={video}
              onPress={() => router.push(`/video/${video.id}`)}
              onToggleFavorite={() => favoriteMutation.mutate(video.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginBottom: 6,
  },
  name: {
    fontSize: 26,
    fontFamily: "Raleway_900Black",
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },
  sectionMicro: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Raleway_900Black",
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
    paddingBottom: 2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },

  /* Etched slab card — mirrors web etched-slab style */
  etchedCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
    gap: 4,
    minHeight: 110,
  },
  etchedTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  etchedCode: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },
  etchedLabel: {
    fontSize: 8,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  etchedValue: {
    fontSize: 38,
    fontFamily: "Raleway_900Black",
    lineHeight: 42,
    letterSpacing: -1,
  },
  etchedGlow: {
    position: "absolute",
    bottom: -20,
    right: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.05,
  },
});
