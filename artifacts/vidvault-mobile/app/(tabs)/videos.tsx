import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import Svg, { Line } from "react-native-svg";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { VideoCard } from "@/components/VideoCard";
import { VideoCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { SaveToVaultModal } from "@/components/SaveToVaultModal";
import { Dimensions } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const GRID_CELL = 56;

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

interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");

  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["videos", search, showFavorites, selectedTagId],
    queryFn: () => api.listVideos({
      search: search || undefined,
      favorites: showFavorites ? true : undefined,
      tagId: selectedTagId || undefined,
      limit: 50,
    }),
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.listTags(),
  });

  const favMutation = useMutation({
    mutationFn: (videoId: string) => api.toggleFavorite(videoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const videos = data?.videos ?? [];
  const tags: Tag[] = tagsData?.tags ?? [];
  const gridColor = isDark ? "rgba(139,92,246,0.055)" : "rgba(139,92,246,0.06)";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GridBackground color={gridColor} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: "transparent" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerEyebrow, { color: colors.mutedForeground }]}>VIDEO_VAULT</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Library</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSaveModal(true)}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Filters */}
      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search vault..." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          <TouchableOpacity
            onPress={() => { setShowFavorites(false); setSelectedTagId(null); }}
            style={[
              styles.chip,
              {
                backgroundColor: !showFavorites && !selectedTagId
                  ? colors.primary
                  : isDark ? "rgba(255,255,255,0.04)" : colors.secondary,
                borderColor: !showFavorites && !selectedTagId ? colors.primary : "transparent",
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: !showFavorites && !selectedTagId ? "#fff" : colors.mutedForeground }]}>
              ALL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowFavorites(!showFavorites); setSelectedTagId(null); }}
            style={[
              styles.chip,
              {
                backgroundColor: showFavorites
                  ? "rgba(239,68,68,0.15)"
                  : isDark ? "rgba(255,255,255,0.04)" : colors.secondary,
                borderColor: showFavorites ? "rgba(239,68,68,0.4)" : "transparent",
              },
            ]}
            activeOpacity={0.8}
          >
            <Feather name="heart" size={11} color={showFavorites ? "#ef4444" : colors.mutedForeground} />
            <Text style={[styles.chipText, { color: showFavorites ? "#ef4444" : colors.mutedForeground }]}>FAV</Text>
          </TouchableOpacity>

          {tags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              onPress={() => {
                setSelectedTagId(selectedTagId === tag.id ? null : tag.id);
                setShowFavorites(false);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: selectedTagId === tag.id
                    ? (tag.color || colors.primary) + "25"
                    : isDark ? "rgba(255,255,255,0.04)" : colors.secondary,
                  borderColor: selectedTagId === tag.id ? (tag.color || colors.primary) + "60" : "transparent",
                },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.tagDot, { backgroundColor: tag.color || colors.primary }]} />
              <Text style={[styles.chipText, { color: selectedTagId === tag.id ? (tag.color || colors.primary) : colors.mutedForeground }]}>
                {tag.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => String(item)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 100 }}
          renderItem={() => (
            <View style={{ width: "48%" }}>
              <VideoCardSkeleton />
            </View>
          )}
        />
      ) : videos.length === 0 ? (
        <EmptyState
          icon="film"
          title={search ? "No results" : "Vault is empty"}
          subtitle={search ? "Try a different search term" : "Save your first YouTube video"}
          actionLabel={search ? undefined : "Save Video"}
          onAction={search ? undefined : () => setShowSaveModal(true)}
          code={search ? "Ø" : "00"}
        />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item: { id: string }) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item, index }: { item: any; index: number }) => (
            <VideoCard
              video={item}
              isNew={index === 0 && !search && !showFavorites && !selectedTagId}
              onPress={() => router.push(`/video/${item.id}`)}
              onToggleFavorite={() => favMutation.mutate(item.id)}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowSaveModal(true)}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: botInset + 90 }]}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <SaveToVaultModal visible={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerEyebrow: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Raleway_900Black",
    letterSpacing: -0.5,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },
  controls: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 0,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
