import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
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

const PURPLE = "#8b5cf6";
const RED    = "#ef4444";

interface Tag  { id: string; name: string; color?: string | null }
interface Video { id: string; title: string; createdAt?: string; [key: string]: any }

type ViewMode = "grid" | "list";
type SortMode = "newest" | "oldest" | "az" | "za";

/* ── Filter chip ── */
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
          backgroundColor: active ? activeColor + "1e" : "#111115",
          borderColor: active ? activeColor + "55" : "#ffffff12",
        },
      ]}
      activeOpacity={0.75}
    >
      {dot && !icon && <View style={[styles.tagDot, { backgroundColor: dot }]} />}
      {icon && <Feather name={icon as any} size={10} color={active ? activeColor : colors.mutedForeground} />}
      <Text style={[styles.chipText, { color: active ? activeColor : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ── Sort option row ── */
function SortRow({
  label, icon, active, onPress, colors,
}: { label: string; icon: string; active: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        sortStyles.sortRow,
        { borderBottomColor: "#ffffff10", backgroundColor: active ? PURPLE + "12" : "transparent" },
      ]}
    >
      <View style={[sortStyles.sortIconWrap, { backgroundColor: active ? PURPLE + "20" : "#ffffff08", borderColor: active ? PURPLE + "35" : "#ffffff12" }]}>
        <Feather name={icon as any} size={13} color={active ? PURPLE : colors.mutedForeground} />
      </View>
      <Text style={[sortStyles.sortLabel, { color: active ? PURPLE : colors.foreground }]}>{label}</Text>
      {active && (
        <View style={sortStyles.activeCheck}>
          <Feather name="check" size={12} color={PURPLE} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ═══════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════ */
export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [search, setSearch]           = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewMode, setViewMode]       = useState<ViewMode>("grid");
  const [sortBy, setSortBy]           = useState<SortMode>("newest");
  const [showSortModal, setShowSortModal] = useState(false);

  /* multi-select */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelectMode = selectedIds.size > 0;
  const selectionBarAnim = useRef(new Animated.Value(0)).current;

  const enterSelection = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(new Set([id]));
    Animated.spring(selectionBarAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      if (next.size === 0) Animated.spring(selectionBarAnim, { toValue: 0, useNativeDriver: true }).start();
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    Animated.spring(selectionBarAnim, { toValue: 0, useNativeDriver: true }).start();
  }, []);

  /* queries */
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["videos", search, showFavorites, selectedTagId],
    queryFn: () => api.listVideos({ search: search || undefined, favorites: showFavorites || undefined, tagId: selectedTagId || undefined, limit: 80 }),
  });
  const { data: tagsData } = useQuery({ queryKey: ["tags"], queryFn: () => api.listTags() });

  const favMutation = useMutation({
    mutationFn: (videoId: string) => api.toggleFavorite(videoId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => api.deleteVideo(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      clearSelection();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const rawVideos: Video[] = data?.videos ?? [];
  const tags: Tag[] = tagsData?.tags ?? [];

  const SORT_OPTIONS: Array<{ key: SortMode; label: string; icon: string }> = [
    { key: "newest", label: "Newest First",  icon: "arrow-down" },
    { key: "oldest", label: "Oldest First",  icon: "arrow-up"   },
    { key: "az",     label: "A → Z",         icon: "type"       },
    { key: "za",     label: "Z → A",         icon: "type"       },
  ];
  const sortLabel = SORT_OPTIONS.find(s => s.key === sortBy)?.label ?? "Newest";

  /* sorted list */
  const videos = useMemo(() => {
    const arr = [...rawVideos];
    switch (sortBy) {
      case "oldest": return arr.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
      case "az":     return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "za":     return arr.sort((a, b) => b.title.localeCompare(a.title));
      default:       return arr.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    }
  }, [rawVideos, sortBy]);

  const toggleViewMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(v => v === "grid" ? "list" : "grid");
  }, []);

  /* ── List header ── */
  const ListHeader = useMemo(() => (
    <View style={styles.headerBlock}>
      {/* Section heading */}
      <View style={styles.subHeader}>
        <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>//VIDEO_VAULT</Text>
        <Text style={[styles.subTitle, { color: colors.foreground }]}>Library</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search vault…" />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        <FilterChip
          label="ALL" active={!showFavorites && !selectedTagId} colors={colors}
          onPress={() => { setShowFavorites(false); setSelectedTagId(null); }}
          activeColor={PURPLE}
        />
        <FilterChip
          label="FAV" active={showFavorites} colors={colors}
          onPress={() => { setShowFavorites(!showFavorites); setSelectedTagId(null); }}
          activeColor={RED} icon="heart"
        />
        {tags.map(tag => (
          <FilterChip
            key={tag.id}
            label={tag.name.toUpperCase()}
            active={selectedTagId === tag.id}
            colors={colors}
            onPress={() => { setSelectedTagId(selectedTagId === tag.id ? null : tag.id); setShowFavorites(false); }}
            activeColor={tag.color || PURPLE}
            dot={tag.color || PURPLE}
          />
        ))}
      </ScrollView>

      {/* Count row + controls */}
      {!isLoading && (
        <View style={styles.countRow}>
          {videos.length > 0 && (
            <>
              <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                {videos.length} VIDEO{videos.length !== 1 ? "S" : ""}
              </Text>
              <View style={[styles.countDivider, { backgroundColor: "#ffffff15" }]} />
              <Text style={[styles.countText, { color: PURPLE + "aa" }]}>
                {viewMode === "grid" ? "GRID" : "LIST"}
              </Text>
            </>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={toggleViewMode}
            style={[styles.iconToolBtn, { backgroundColor: "#111115", borderColor: "#ffffff12" }]}
            activeOpacity={0.75}
          >
            <Feather name={viewMode === "grid" ? "list" : "grid"} size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
          {videos.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              style={[styles.sortBtn, { backgroundColor: "#111115", borderColor: "#ffffff12" }]}
              activeOpacity={0.75}
            >
              <Feather name="sliders" size={11} color={colors.mutedForeground} />
              <Text style={[styles.countText, { color: colors.mutedForeground }]}>{sortLabel.toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  ), [colors, search, showFavorites, selectedTagId, tags, isLoading, videos.length, viewMode, sortBy, sortLabel]);

  /* ── Selection action bar ── */
  const selBarTranslate = selectionBarAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

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

      {/* ── Video list ── */}
      {isLoading ? (
        viewMode === "grid" ? (
          <FlatList
            key="skeleton-grid"
            data={[1, 2, 3, 4]}
            keyExtractor={item => String(item)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={ListHeader}
            renderItem={() => <VideoCardSkeleton />}
          />
        ) : (
          <FlatList
            key="skeleton-list"
            data={[1, 2, 3, 4, 5]}
            keyExtractor={item => String(item)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={ListHeader}
            renderItem={() => <VideoCardSkeleton listMode />}
          />
        )
      ) : videos.length === 0 ? (
        <FlatList
          key="empty"
          data={[] as any[]}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="film"
              title={search ? "No results" : "Vault is empty"}
              subtitle={search ? "Try a different search term" : "Save your first YouTube video to get started"}
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
          keyExtractor={(item: Video) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={ListHeader}
          renderItem={({ item, index }: { item: Video; index: number }) => (
            <View style={{ flex: 1 }}>
              <VideoCard
                video={item}
                isNew={index === 0 && !search && !showFavorites && !selectedTagId}
                isSelected={selectedIds.has(item.id)}
                onPress={() => isSelectMode ? toggleSelection(item.id) : router.push(`/video/${item.id}`)}
                onLongPress={() => isSelectMode ? toggleSelection(item.id) : enterSelection(item.id)}
                onToggleFavorite={() => isSelectMode ? undefined : favMutation.mutate(item.id)}
              />
            </View>
          )}
        />
      ) : (
        <FlatList
          key="videos-list"
          data={videos}
          keyExtractor={(item: Video) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }: { item: Video }) => (
            <VideoListCard
              video={item}
              isSelected={selectedIds.has(item.id)}
              onPress={() => isSelectMode ? toggleSelection(item.id) : router.push(`/video/${item.id}`)}
              onLongPress={() => isSelectMode ? toggleSelection(item.id) : enterSelection(item.id)}
              onToggleFavorite={() => isSelectMode ? undefined : favMutation.mutate(item.id)}
            />
          )}
        />
      )}

      {/* ── Multi-select action bar ── */}
      <Animated.View
        style={[
          styles.selBar,
          { bottom: botInset + 90, transform: [{ translateY: selBarTranslate }], opacity: selectionBarAnim },
        ]}
        pointerEvents={isSelectMode ? "auto" : "none"}
      >
        <LinearGradient
          colors={["#111115", "#1a1a20"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.selBarInner, { borderColor: "#ffffff12" }]}>
          <TouchableOpacity onPress={clearSelection} style={styles.selCancelBtn} activeOpacity={0.75}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.selCount, { color: colors.foreground }]}>
            {selectedIds.size} selected
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => {
              const ids = Array.from(selectedIds);
              deleteMutation.mutate(ids);
            }}
            disabled={deleteMutation.isPending}
            style={[styles.selDeleteBtn, { backgroundColor: RED + "18", borderColor: RED + "40" }]}
            activeOpacity={0.75}
          >
            <Feather name="trash-2" size={14} color={RED} />
            <Text style={[styles.selDeleteText, { color: RED }]}>DELETE</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <SaveToVaultModal visible={showSaveModal} onClose={() => setShowSaveModal(false)} />

      {/* ── Sort Modal ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={sortStyles.backdrop}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        />
        <View style={[sortStyles.sheet, { borderColor: "#ffffff12" }]}>
          {/* Etch overlay */}
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "transparent"]}
            style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
            pointerEvents="none"
          />
          <View style={sortStyles.sheetHandle} />
          <View style={sortStyles.sheetHeaderRow}>
            <View style={sortStyles.sheetIconWrap}>
              <Feather name="sliders" size={14} color={PURPLE} />
            </View>
            <Text style={[sortStyles.sheetTitle, { color: colors.foreground }]}>Sort Videos</Text>
          </View>
          <View style={sortStyles.sortList}>
            {SORT_OPTIONS.map(opt => (
              <SortRow
                key={opt.key}
                label={opt.label}
                icon={opt.icon}
                active={sortBy === opt.key}
                colors={colors}
                onPress={() => {
                  setSortBy(opt.key);
                  setShowSortModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  headerBlock: { paddingBottom: 4 },

  subHeader: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 14 },
  subLabel: {
    fontSize: 10, fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2.5, marginBottom: 6,
  },
  subTitle: {
    fontSize: 40, fontFamily: "AlegreyaSansSC_800ExtraBold",
    letterSpacing: -1, lineHeight: 48,
  },

  searchWrap: { paddingHorizontal: 10, marginBottom: 8 },

  chipsScroll: { flexGrow: 0, marginBottom: 8 },
  chipsContent: { gap: 6, paddingHorizontal: 10, paddingRight: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderWidth: 1, borderRadius: 8,
  },
  chipText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },
  tagDot: { width: 5, height: 5, borderRadius: 2.5 },

  countRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingBottom: 10, gap: 8,
  },
  countText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },
  countDivider: { width: 1, height: 10 },
  iconToolBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderRadius: 8,
  },

  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 160,
  },
  columnWrapper: { gap: 10, marginBottom: 0 },

  /* Multi-select bar */
  selBar: {
    position: "absolute", left: 10, right: 10,
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 16,
  },
  selBarInner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderRadius: 16,
  },
  selCancelBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    borderColor: "#ffffff15", backgroundColor: "#ffffff08",
    alignItems: "center", justifyContent: "center",
  },
  selCount: { fontSize: 14, fontFamily: "Poppins_600SemiBold", letterSpacing: -0.3 },
  selDeleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1,
  },
  selDeleteText: { fontSize: 11, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1 },
});

const sortStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: "#111115",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 10,
    paddingBottom: 40,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center", marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ffffff12",
  },
  sheetIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: PURPLE + "20", borderWidth: 1, borderColor: PURPLE + "35",
    alignItems: "center", justifyContent: "center",
  },
  sheetTitle: { fontSize: 16, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.2 },
  sortList: { paddingTop: 4 },
  sortRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortIconWrap: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  sortLabel: { fontSize: 15, fontFamily: "Poppins_500Medium", flex: 1 },
  activeCheck: {
    width: 26, height: 26, borderRadius: 6,
    backgroundColor: PURPLE + "18", borderWidth: 1, borderColor: PURPLE + "35",
    alignItems: "center", justifyContent: "center",
  },
});
