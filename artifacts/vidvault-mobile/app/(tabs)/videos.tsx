import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { VideoCard } from "@/components/VideoCard";
import { VideoListCard } from "@/components/VideoListCard";
import { VideoCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { SaveToVaultModal } from "@/components/SaveToVaultModal";

const { width: SCREEN_W } = Dimensions.get("window");

interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

type ViewMode = "grid" | "list";

function FilterChip({
  label, active, onPress, activeColor, colors, icon, dot,
}: {
  label: string; active: boolean; onPress: () => void;
  activeColor: string; colors: any; icon?: string; dot?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? activeColor + "20" : colors.card,
          borderColor: active ? activeColor + "55" : colors.border,
        },
      ]}
      activeOpacity={0.75}
    >
      {dot && !icon && <View style={[styles.tagDot, { backgroundColor: dot }]} />}
      {icon && <Feather name={icon as any} size={10} color={active ? activeColor : colors.mutedForeground} />}
      <Text style={[styles.chipText, { color: active ? activeColor : colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["videos", search, showFavorites, selectedTagId],
    queryFn: () => api.listVideos({
      search: search || undefined,
      favorites: showFavorites ? true : undefined,
      tagId: selectedTagId || undefined,
      limit: 60,
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

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const videos = data?.videos ?? [];
  const tags: Tag[] = tagsData?.tags ?? [];

  const toggleViewMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode((v) => (v === "grid" ? "list" : "grid"));
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      <TopAppBar
        rightAction={
          <View style={styles.headerRight}>
            <AppButton
              icon={viewMode === "grid" ? "list" : "grid"}
              size="xs"
              variant="ghost"
              onPress={toggleViewMode}
            />
            <AppButton
              label="SAVE"
              icon="plus"
              size="sm"
              variant="primary"
              onPress={() => setShowSaveModal(true)}
            />
          </View>
        }
      />

      {/* Subtitle */}
      <View style={styles.subHeader}>
        <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>//VIDEO_VAULT</Text>
        <Text style={[styles.subTitle, { color: colors.foreground }]}>Library</Text>
      </View>

      {/* Search + Filter chips */}
      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search vault…" />
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}
        >
          <FilterChip
            label="ALL" active={!showFavorites && !selectedTagId} colors={colors}
            onPress={() => { setShowFavorites(false); setSelectedTagId(null); }}
            activeColor={colors.primary}
          />
          <FilterChip
            label="FAV" active={showFavorites} colors={colors}
            onPress={() => { setShowFavorites(!showFavorites); setSelectedTagId(null); }}
            activeColor="#ef4444" icon="heart"
          />
          {tags.map((tag) => (
            <FilterChip
              key={tag.id} label={tag.name.toUpperCase()}
              active={selectedTagId === tag.id} colors={colors}
              onPress={() => { setSelectedTagId(selectedTagId === tag.id ? null : tag.id); setShowFavorites(false); }}
              activeColor={tag.color || colors.primary}
              dot={tag.color || colors.primary}
            />
          ))}
        </ScrollView>
      </View>

      {!isLoading && videos.length > 0 && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {videos.length} VIDEO{videos.length !== 1 ? "S" : ""}
          </Text>
          <View style={[styles.countDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {viewMode === "grid" ? "GRID" : "LIST"}
          </Text>
        </View>
      )}

      {isLoading ? (
        viewMode === "grid" ? (
          <FlatList
            data={[1, 2, 3, 4]} keyExtractor={(item) => String(item)}
            numColumns={2} columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 100 }}
            renderItem={() => <View style={{ width: "48%" }}><VideoCardSkeleton /></View>}
          />
        ) : (
          <FlatList
            data={[1, 2, 3, 4, 5]} keyExtractor={(item) => String(item)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 100 }}
            renderItem={() => <VideoCardSkeleton listMode />}
          />
        )
      ) : videos.length === 0 ? (
        <EmptyState
          icon="film"
          title={search ? "No results" : "Vault is empty"}
          subtitle={search ? "Try a different search term" : "Save your first video"}
          actionLabel={search ? undefined : "Save Video"}
          onAction={search ? undefined : () => setShowSaveModal(true)}
          code={search ? "Ø" : "00"}
        />
      ) : viewMode === "grid" ? (
        <FlatList
          data={videos} keyExtractor={(item: { id: string }) => item.id}
          numColumns={2} columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching} onRefresh={refetch}
          renderItem={({ item, index }: { item: any; index: number }) => (
            <VideoCard
              video={item}
              isNew={index === 0 && !search && !showFavorites && !selectedTagId}
              onPress={() => router.push(`/video/${item.id}`)}
              onToggleFavorite={() => favMutation.mutate(item.id)}
            />
          )}
        />
      ) : (
        <FlatList
          data={videos} keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching} onRefresh={refetch}
          renderItem={({ item }: { item: any }) => (
            <VideoListCard
              video={item}
              onPress={() => router.push(`/video/${item.id}`)}
              onToggleFavorite={() => favMutation.mutate(item.id)}
            />
          )}
        />
      )}

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
  root: { flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewToggleBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4 },
  saveBtnText: { color: "#fff", fontSize: 10, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.5 },

  subHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  subLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2, marginBottom: 3 },
  subTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },

  controls: { paddingHorizontal: 16, gap: 10, marginBottom: 6 },
  chipsScroll: { flexGrow: 0 },
  chipsContent: { gap: 6, paddingRight: 4 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 6 },
  chipText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },
  tagDot: { width: 5, height: 5, borderRadius: 2.5 },

  countRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  countText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },
  countDivider: { width: 1, height: 10 },

  columnWrapper: { gap: 12, marginBottom: 0 },

  fab: {
    position: "absolute", right: 20, width: 52, height: 52, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#8b5cf6", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
