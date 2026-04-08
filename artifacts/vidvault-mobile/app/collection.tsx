import React from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { VideoCard } from "@/components/VideoCard";
import { VideoCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const PINK   = "#ec4899";

const COLLECTION_CONFIG: Record<string, {
  queryParams: Parameters<typeof api.listVideos>[0];
  color: string;
  icon: string;
  emptyTitle: string;
  emptySubtitle: string;
}> = {
  starred:  { queryParams: { favorites: true,   limit: 100 }, color: PINK,   icon: "heart",     emptyTitle: "No starred videos",     emptySubtitle: "Tap the heart icon on any video to star it"           },
  hasAi:    { queryParams: { hasAi: true,        limit: 100 }, color: PURPLE, icon: "cpu",       emptyTitle: "No AI-enhanced videos", emptySubtitle: "Generate summaries or flashcards for your videos"     },
  watched:  { queryParams: { watched: true,      limit: 100 }, color: CYAN,   icon: "eye",       emptyTitle: "No watched videos",     emptySubtitle: "Mark videos as watched from the video detail screen"  },
  recent:   { queryParams: { recentDays: 7,      limit: 100 }, color: GREEN,  icon: "clock",     emptyTitle: "Nothing saved this week", emptySubtitle: "Videos you save will appear here"                  },
};

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { type, label } = useLocalSearchParams<{ type: string; label: string }>();

  const config = COLLECTION_CONFIG[type ?? ""] ?? COLLECTION_CONFIG.starred;
  const accentColor = config.color;
  const displayLabel = decodeURIComponent(label ?? "Collection");

  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["collection", type],
    queryFn: () => api.listVideos(config.queryParams),
    staleTime: 60_000,
  });

  const favMutation = useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection", type] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const videos = data?.videos ?? [];
  const total  = data?.total ?? 0;
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  function renderItem({ item, index }: { item: any; index: number }) {
    return (
      <MotiView
        key={item.id}
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280, delay: Math.min(index * 40, 400) }}
        style={{ flex: 1, margin: 5 }}
      >
        <VideoCard
          video={item}
          onPress={() => router.push(`/video/${item.id}`)}
          onToggleFavorite={() => favMutation.mutate(item.id)}
        />
      </MotiView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.iconBadge, { backgroundColor: accentColor + "20", borderColor: accentColor + "35" }]}>
              <Feather name={config.icon as any} size={14} color={accentColor} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{displayLabel}</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Smart Collection · {isLoading ? "..." : total} video{total !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Accent rule */}
      <View style={[styles.accentRule, { backgroundColor: accentColor + "40" }]} />

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => <VideoCardSkeleton key={i} />)}
        </View>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={config.icon as any}
          title={config.emptyTitle}
          subtitle={config.emptySubtitle}
          code="00"
        />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(v) => v.id}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 14, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  iconBadge: {
    width: 30, height: 30, borderRadius: 9,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 10,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 1,
    marginTop: 1,
    paddingLeft: 38,
  },
  accentRule: { height: 1, marginHorizontal: 16, marginBottom: 2 },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingTop: 14,
    gap: 10,
  },
});
