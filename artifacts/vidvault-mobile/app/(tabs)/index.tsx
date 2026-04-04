import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import Svg, { Line } from "react-native-svg";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import type { Video, Stats } from "@/types/api";
import { Skeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { VideoCard } from "@/components/VideoCard";
import { SaveToVaultModal } from "@/components/SaveToVaultModal";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const GRID_CELL = 56;
const RECENT_CARD_W = SCREEN_W * 0.72;

function GridBackground({ color }: { color: string }) {
  const cols = Math.ceil(SCREEN_W / GRID_CELL) + 1;
  const rows = Math.ceil(SCREEN_H / GRID_CELL) + 1;
  return (
    <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: cols }).map((_, i) => (
        <Line key={`v${i}`} x1={i * GRID_CELL} y1={0} x2={i * GRID_CELL} y2={SCREEN_H} stroke={color} strokeWidth={1} />
      ))}
      {Array.from({ length: rows }).map((_, i) => (
        <Line key={`h${i}`} x1={0} y1={i * GRID_CELL} x2={SCREEN_W} y2={i * GRID_CELL} stroke={color} strokeWidth={1} />
      ))}
    </Svg>
  );
}

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const STAT_CONFIG = [
  { label: "TOTAL_VIDEOS", code: "01", icon: "film" as FeatherIconName, accent: "#8b5cf6", key: "totalVideos" },
  { label: "FOLDERS", code: "02", icon: "folder" as FeatherIconName, accent: "#06b6d4", key: "totalFolders" },
  { label: "TAGS_USED", code: "03", icon: "tag" as FeatherIconName, accent: "#10b981", key: "totalTags" },
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
          borderColor: "rgba(139,92,246,0.10)",
        },
      ]}
    >
      <View style={styles.etchedTop}>
        <Text style={[styles.etchedCode, { color: colors.mutedForeground }]}>{code}</Text>
        <Feather name={icon} size={15} color={accent + "55"} />
      </View>
      <Text style={[styles.etchedLabel, { color: accent + "99" }]}>{label}</Text>
      <Text style={[styles.etchedValue, { color: colors.foreground }]}>
        {value.toString().padStart(2, "0")}
      </Text>
      <View style={[styles.etchedGlow, { backgroundColor: accent }]} pointerEvents="none" />
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [showSaveModal, setShowSaveModal] = useState(false);

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

  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");
  const gridColor = isDark ? "rgba(139,92,246,0.055)" : "rgba(139,92,246,0.06)";

  const recentVideos = stats?.recentVideos ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GridBackground color={gridColor} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botInset + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>//SYSTEM_STATUS</Text>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {displayName}{"'"}s Vault
            </Text>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
              KNOWLEDGE_BASE // ACTIVE
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowSaveModal(true)}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.saveBtnLabel}>SAVE</Text>
          </TouchableOpacity>
        </View>

        {/* Stat Cards — full-width vertical stack */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OVERVIEW</Text>
            <View style={[styles.sectionLine, { backgroundColor: "rgba(139,92,246,0.15)" }]} />
          </View>

          {isLoading ? (
            <View style={{ gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={110} borderRadius={4} />
              ))}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {STAT_CONFIG.map((cfg) => (
                <EtchedStatCard
                  key={cfg.code}
                  code={cfg.code}
                  label={cfg.label}
                  icon={cfg.icon}
                  accent={cfg.accent}
                  value={(stats as any)?.[cfg.key] ?? 0}
                />
              ))}
            </View>
          )}
        </View>

        {/* Recently Added — horizontal scroll */}
        <View style={styles.sectionNoHPad}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//RECENTLY_SAVED</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest Captures</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
              <Text style={[styles.viewAll, { color: colors.mutedForeground }]}>VIEW_ALL →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={180} width={RECENT_CARD_W} borderRadius={4} />
              ))}
            </ScrollView>
          ) : recentVideos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              decelerationRate="fast"
              snapToInterval={RECENT_CARD_W + 12}
              snapToAlignment="start"
            >
              {recentVideos.slice(0, 8).map((video: Video, index: number) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  cardWidth={RECENT_CARD_W}
                  isNew={index === 0}
                  onPress={() => router.push(`/video/${video.id}`)}
                  onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <EmptyState
                icon="film"
                title="Vault is empty"
                subtitle="Save your first YouTube video to get started"
                actionLabel="Save Video"
                onAction={() => setShowSaveModal(true)}
                code="00"
              />
            </View>
          )}
        </View>

        {/* Favorites section */}
        {stats?.favoriteVideos && stats.favoriteVideos.length > 0 && (
          <View style={[styles.sectionNoHPad, { marginTop: 8 }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//STARRED</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              decelerationRate="fast"
              snapToInterval={RECENT_CARD_W + 12}
              snapToAlignment="start"
            >
              {stats.favoriteVideos.slice(0, 5).map((video: Video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  cardWidth={RECENT_CARD_W}
                  onPress={() => router.push(`/video/${video.id}`)}
                  onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <SaveToVaultModal visible={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
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
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  saveBtnLabel: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionNoHPad: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    marginBottom: 4,
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
    fontSize: 18,
    fontFamily: "Raleway_900Black",
    letterSpacing: -0.3,
  },
  viewAll: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
    paddingBottom: 3,
  },

  etchedCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
    minHeight: 100,
  },
  etchedTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
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
    marginBottom: 6,
  },
  etchedValue: {
    fontSize: 44,
    fontFamily: "Raleway_900Black",
    lineHeight: 48,
    letterSpacing: -2,
  },
  etchedGlow: {
    position: "absolute",
    bottom: -24,
    right: -24,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.05,
  },
});
