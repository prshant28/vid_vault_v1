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

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: FeatherIconName; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
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
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning,</Text>
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
        {isLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            {[1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Videos" value={stats?.totalVideos ?? 0} icon="film" color="#7c3aed" />
            <StatCard label="Folders" value={stats?.totalFolders ?? 0} icon="folder" color="#2563eb" />
            <StatCard label="Tags" value={stats?.totalTags ?? 0} icon="tag" color="#059669" />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recently Added</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <>
            <Skeleton height={72} style={{ marginBottom: 10 }} borderRadius={colors.radius} />
            <Skeleton height={72} style={{ marginBottom: 10 }} borderRadius={colors.radius} />
            <Skeleton height={72} borderRadius={colors.radius} />
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
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
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
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  name: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 14,
  },
  statsScroll: {
    flexDirection: "row",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
