import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
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

interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

type ViewMode = "grid" | "list";
type SortMode = "newest" | "oldest" | "az" | "za";

function FilterChip({
  label,
  active,
  onPress,
  activeColor,
  colors,
  icon,
  dot,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor: string;
  colors: any;
  icon?: string;
  dot?: string;
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
      {dot && !icon && (
        <View style={[styles.tagDot, { backgroundColor: dot }]} />
      )}
      {icon && (
        <Feather
          name={icon as any}
          size={10}
          color={active ? activeColor : colors.mutedForeground}
        />
      )}
      <Text
        style={[
          styles.chipText,
          { color: active ? activeColor : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
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
  const [sortBy, setSortBy] = useState<SortMode>("newest");
  const [showSortModal, setShowSortModal] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["videos", search, showFavorites, selectedTagId],
    queryFn: () =>
      api.listVideos({
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
  const rawVideos = data?.videos ?? [];
  const tags: Tag[] = tagsData?.tags ?? [];

  /* ── client-side sort ── */
  const videos = useMemo(() => {
    const arr = [...rawVideos];
    switch (sortBy) {
      case "oldest":
        return arr.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime(),
        );
      case "az":
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "za":
        return arr.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return arr.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        );
    }
  }, [rawVideos, sortBy]);

  const SORT_OPTIONS: Array<{ key: SortMode; label: string; icon: string }> = [
    { key: "newest", label: "Newest First", icon: "arrow-down" },
    { key: "oldest", label: "Oldest First", icon: "arrow-up" },
    { key: "az", label: "A → Z", icon: "type" },
    { key: "za", label: "Z → A", icon: "type" },
  ];
  const sortLabel =
    SORT_OPTIONS.find((s) => s.key === sortBy)?.label ?? "Newest";

  const toggleViewMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode((v) => (v === "grid" ? "list" : "grid"));
  }, []);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Section header — matches Home tab style */}
        <View style={styles.subHeader}>
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
            //VIDEO_VAULT
          </Text>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>
            Library
          </Text>
        </View>

        {/* Search + Filter chips */}
        <View style={styles.controls}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search vault…"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            <FilterChip
              label="ALL"
              active={!showFavorites && !selectedTagId}
              colors={colors}
              onPress={() => {
                setShowFavorites(false);
                setSelectedTagId(null);
              }}
              activeColor={colors.primary}
            />
            <FilterChip
              label="FAV"
              active={showFavorites}
              colors={colors}
              onPress={() => {
                setShowFavorites(!showFavorites);
                setSelectedTagId(null);
              }}
              activeColor="#ef4444"
              icon="heart"
            />
            {tags.map((tag) => (
              <FilterChip
                key={tag.id}
                label={tag.name.toUpperCase()}
                active={selectedTagId === tag.id}
                colors={colors}
                onPress={() => {
                  setSelectedTagId(selectedTagId === tag.id ? null : tag.id);
                  setShowFavorites(false);
                }}
                activeColor={tag.color || colors.primary}
                dot={tag.color || colors.primary}
              />
            ))}
          </ScrollView>
        </View>

        {/* Count row + sort button */}
        {!isLoading && videos.length > 0 && (
          <View style={styles.countRow}>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {videos.length} VIDEO{videos.length !== 1 ? "S" : ""}
            </Text>
            <View
              style={[styles.countDivider, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {viewMode === "grid" ? "GRID" : "LIST"}
            </Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              style={[
                styles.sortBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.75}
            >
              <Feather
                name="sliders"
                size={10}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.countText, { color: colors.mutedForeground }]}
              >
                {sortLabel.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [
      colors,
      search,
      showFavorites,
      selectedTagId,
      tags,
      isLoading,
      videos.length,
      viewMode,
      sortBy,
      sortLabel,
    ],
  );

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

      {isLoading ? (
        viewMode === "grid" ? (
          <FlatList
            key="skeleton-grid"
            data={[1, 2, 3, 4]}
            keyExtractor={(item) => String(item)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: botInset + 100,
            }}
            ListHeaderComponent={ListHeader}
            renderItem={() => <VideoCardSkeleton />}
          />
        ) : (
          <FlatList
            key="skeleton-list"
            data={[1, 2, 3, 4, 5]}
            keyExtractor={(item) => String(item)}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: botInset + 100,
            }}
            ListHeaderComponent={ListHeader}
            renderItem={() => <VideoCardSkeleton listMode />}
          />
        )
      ) : videos.length === 0 ? (
        <FlatList
          key="empty"
          data={[] as any[]}
          keyExtractor={(_item, index) => String(index)}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="film"
              title={search ? "No results" : "Vault is empty"}
              subtitle={
                search ? "Try a different search term" : "Save your first video"
              }
              actionLabel={search ? undefined : "Save Video"}
              onAction={search ? undefined : () => setShowSaveModal(true)}
              code={search ? "Ø" : "00"}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : viewMode === "grid" ? (
        <FlatList
          key="videos-grid"
          data={videos}
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: botInset + 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={ListHeader}
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
          key="videos-list"
          data={videos}
          keyExtractor={(item: { id: string }) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: botInset + 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }: { item: any }) => (
            <VideoListCard
              video={item}
              onPress={() => router.push(`/video/${item.id}`)}
              onToggleFavorite={() => favMutation.mutate(item.id)}
            />
          )}
        />
      )}

      <SaveToVaultModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
      />

      {/* ── Sort Modal ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={sortStyles.backdrop}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        />
        <View
          style={[
            sortStyles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={sortStyles.sheetHandle} />
          <Text style={[sortStyles.sheetTitle, { color: colors.foreground }]}>
            Sort By
          </Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => {
                setSortBy(opt.key);
                setShowSortModal(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                sortStyles.sortRow,
                {
                  borderBottomColor: colors.border,
                  backgroundColor:
                    sortBy === opt.key ? colors.primary + "10" : "transparent",
                },
              ]}
              activeOpacity={0.75}
            >
              <Feather
                name={opt.icon as any}
                size={15}
                color={
                  sortBy === opt.key ? colors.primary : colors.mutedForeground
                }
              />
              <Text
                style={[
                  sortStyles.sortLabel,
                  {
                    color:
                      sortBy === opt.key ? colors.primary : colors.foreground,
                  },
                ]}
              >
                {opt.label}
              </Text>
              {sortBy === opt.key && (
                <Feather
                  name="check"
                  size={15}
                  color={colors.primary}
                  style={{ marginLeft: "auto" as any }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  subHeader: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  subLabel: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 40,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    letterSpacing: -1,
    lineHeight: 48,
  },

  controls: { paddingHorizontal: 16, gap: 10, marginBottom: 6 },
  chipsScroll: { flexGrow: 0 },
  chipsContent: { gap: 6, paddingRight: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
  },
  tagDot: { width: 5, height: 5, borderRadius: 2.5 },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  countText: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
  },
  countDivider: { width: 1, height: 10 },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 6,
  },

  columnWrapper: { gap: 12, marginBottom: 0 },
});

const sortStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 13,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    paddingHorizontal: 20,
    paddingBottom: 12,
    opacity: 0.6,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortLabel: { fontSize: 15, fontFamily: "Poppins_500Medium" },
});
