import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
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

const ACCENT_COLORS = ["#8b5cf6", "#06b6d4", "#10b981"];

function StatCard({ label, value, icon, color, index }: { label: string; value: number; icon: FeatherIconName; color: string; index: number }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
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
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>GOOD MORNING,</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{displayName} 👋</Text>
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
            <StatCard label="Videos" value={stats?.totalVideos ?? 0} icon="film" color={ACCENT_COLORS[0]} index={0} />
            <StatCard label="Folders" value={stats?.totalFolders ?? 0} icon="folder" color={ACCENT_COLORS[1]} index={1} />
            <StatCard label="Tags" value={stats?.totalTags ?? 0} icon="tag" color={ACCENT_COLORS[2]} index={2} />
          </View>
        )}
      </View>

      {/* Recently Added */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RECENTLY ADDED</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>SEE ALL →</Text>
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
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FAVORITES</Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontFamily: "Raleway_900Black",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
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
  seeAll: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_600SemiBold",
    letterSpacing: 1.5,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    gap: 6,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 26,
    fontFamily: "JetBrainsMono_600SemiBold",
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
  },
});
