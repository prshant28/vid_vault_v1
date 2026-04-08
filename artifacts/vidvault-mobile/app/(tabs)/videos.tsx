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
  useWindowDimensions,
  Alert,
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
import { TabFadeWrapper } from "@/components/TabFadeWrapper";

const RED   = "#ef4444";
const GREEN = "#10b981";
const CYAN  = "#06b6d4";

type ViewMode = "grid" | "list";
type SortMode = "newest" | "oldest" | "az" | "za" | "fav";

interface Tag    { id: string; name: string; color?: string | null }
interface Folder { id: string; name: string; color?: string | null; videoCount: number }
interface Video  {
  id: string; title: string; createdAt?: string;
  isFavorite?: boolean; notesCount?: number; aiOutputsCount?: number;
  folderId?: string | null; [key: string]: any;
}

type SectionHeader = { type: "section"; title: string; code: string; count: number };
type GridRow       = { type: "grid-row"; videos: Video[]; sectionKey: string; rowIdx: number };
type ListVideo     = { type: "video"; video: Video; globalIdx: number };
type StatsRow      = { type: "stats" };
type ListItem      = SectionHeader | GridRow | ListVideo | StatsRow;

/* ══════════════════════════════════════
   FILTER CHIP
══════════════════════════════════════ */
function FilterChip({ label, active, onPress, activeColor, colors, icon, dot }: {
  label: string; active: boolean; onPress: () => void;
  activeColor: string; colors: any; icon?: string; dot?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? activeColor + "1e" : colors.card, borderColor: active ? activeColor + "55" : colors.border },
      ]}
      activeOpacity={0.75}
    >
      {dot && !icon && <View style={[styles.tagDot, { backgroundColor: dot }]} />}
      {icon && <Feather name={icon as any} size={10} color={active ? activeColor : colors.mutedForeground} />}
      <Text style={[styles.chipText, { color: active ? activeColor : colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ══════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════ */
function SectionHead({ title, code, count, colors }: { title: string; code: string; count: number; colors: any }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionCode, { color: colors.mutedForeground }]}>{code}</Text>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
      <View style={[styles.sectionBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionBadgeText, { color: colors.mutedForeground }]}>{count}</Text>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════
   STATS BAR
══════════════════════════════════════ */
function StatsBar({ videos, colors }: { videos: Video[]; colors: any }) {
  const total   = videos.length;
  const favs    = videos.filter(v => v.isFavorite).length;
  const noted   = videos.filter(v => (v.notesCount ?? 0) > 0).length;
  const ai      = videos.filter(v => (v.aiOutputsCount ?? 0) > 0).length;
  const today   = videos.filter(v => {
    const d = new Date(v.createdAt ?? 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d >= t;
  }).length;

  const stats = [
    { label: "TOTAL",    val: total,  color: colors.primary },
    { label: "FAV",      val: favs,   color: RED   },
    { label: "TODAY",    val: today,  color: GREEN  },
    { label: "NOTED",    val: noted,  color: CYAN   },
  ];

  return (
    <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={["rgba(255,255,255,0.04)", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />}
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val.toString().padStart(2, "0")}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

/* ══════════════════════════════════════
   SORT ROW
══════════════════════════════════════ */
function SortRow({ label, icon, active, onPress, colors }: {
  label: string; icon: string; active: boolean; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.75}
      style={[
        sortStyles.sortRow,
        { borderBottomColor: colors.border + "80", backgroundColor: active ? colors.primary + "10" : "transparent" },
      ]}
    >
      <View style={[sortStyles.sortIconWrap, { backgroundColor: active ? colors.primary + "1e" : colors.card, borderColor: active ? colors.primary + "35" : colors.border }]}>
        <Feather name={icon as any} size={13} color={active ? colors.primary : colors.mutedForeground} />
      </View>
      <Text style={[sortStyles.sortLabel, { color: active ? colors.primary : colors.foreground }]}>{label}</Text>
      {active && (
        <View style={[sortStyles.activeCheck, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "35" }]}>
          <Feather name="check" size={12} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ══════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════ */
export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { width: screenWidth } = useWindowDimensions();
  const CARD_W = (screenWidth - 30) / 2;

  const [search, setSearch]             = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewMode, setViewMode]         = useState<ViewMode>("grid");
  const [sortBy, setSortBy]             = useState<SortMode>("newest");
  const [showSortModal, setShowSortModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  /* multi-select */
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const isSelectMode = selectedIds.size > 0;
  const selBarAnim   = useRef(new Animated.Value(0)).current;

  const enterSelection = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(new Set([id]));
    Animated.spring(selBarAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === 0) Animated.spring(selBarAnim, { toValue: 0, useNativeDriver: true }).start();
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    Animated.spring(selBarAnim, { toValue: 0, useNativeDriver: true }).start();
  }, []);

  /* queries */
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["videos", search, showFavorites, selectedTagId],
    queryFn: () => api.listVideos({ search: search || undefined, favorites: showFavorites || undefined, tagId: selectedTagId || undefined, limit: 100 }),
  });
  const { data: tagsData }    = useQuery({ queryKey: ["tags"],    queryFn: () => api.listTags()    });
  const { data: foldersData } = useQuery({ queryKey: ["folders"], queryFn: () => api.listFolders() });

  /* mutations */
  const favMutation = useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
  });

  const watchMutation = useMutation({
    mutationFn: (id: string) => api.toggleWatched(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => api.deleteVideo(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] }); qc.invalidateQueries({ queryKey: ["stats"] });
      clearSelection();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ ids, folderId }: { ids: string[]; folderId: string | null }) =>
      Promise.all(ids.map(id => api.updateVideo(id, { folderId }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] }); qc.invalidateQueries({ queryKey: ["folders"] });
      clearSelection(); setShowMoveModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const rawVideos: Video[] = data?.videos ?? [];
  const tags: Tag[]        = tagsData?.tags ?? [];
  const folders: Folder[]  = foldersData?.folders ?? [];

  const SORT_OPTIONS: Array<{ key: SortMode; label: string; icon: string }> = [
    { key: "newest", label: "Newest First", icon: "arrow-down" },
    { key: "oldest", label: "Oldest First", icon: "arrow-up"   },
    { key: "fav",    label: "Favorites",    icon: "heart"       },
    { key: "az",     label: "A → Z",        icon: "type"        },
    { key: "za",     label: "Z → A",        icon: "type"        },
  ];
  const sortLabel = SORT_OPTIONS.find(s => s.key === sortBy)?.label ?? "Newest";

  const videos = useMemo(() => {
    const arr = [...rawVideos];
    switch (sortBy) {
      case "oldest": return arr.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
      case "az":     return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "za":     return arr.sort((a, b) => b.title.localeCompare(a.title));
      case "fav":    return arr.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
      default:       return arr.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    }
  }, [rawVideos, sortBy]);

  /* ── date grouping ── */
  const groupedData = useMemo(() => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const month = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    const buckets: { title: string; code: string; filter: (v: Video) => boolean }[] = [
      { title: "Today",      code: "01", filter: v => new Date(v.createdAt ?? 0) >= today },
      { title: "This Week",  code: "02", filter: v => { const d = new Date(v.createdAt ?? 0); return d >= week && d < today; } },
      { title: "This Month", code: "03", filter: v => { const d = new Date(v.createdAt ?? 0); return d >= month && d < week; } },
      { title: "Older",      code: "04", filter: v => new Date(v.createdAt ?? 0) < month },
    ];
    return buckets
      .map(b => ({ ...b, data: videos.filter(b.filter) }))
      .filter(b => b.data.length > 0);
  }, [videos]);

  /* ── flat list items (section headers + rows) ── */
  const flatItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    items.push({ type: "stats" });
    let globalIdx = 0;
    for (const group of groupedData) {
      items.push({ type: "section", title: group.title, code: group.code, count: group.data.length });
      if (viewMode === "grid") {
        for (let i = 0; i < group.data.length; i += 2) {
          items.push({ type: "grid-row", videos: group.data.slice(i, i + 2), sectionKey: group.code, rowIdx: i });
        }
      } else {
        group.data.forEach(v => items.push({ type: "video", video: v, globalIdx: globalIdx++ }));
      }
      globalIdx += group.data.length;
    }
    return items;
  }, [groupedData, viewMode]);

  const toggleViewMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(v => v === "grid" ? "list" : "grid");
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(videos.map(v => v.id));
    setSelectedIds(allIds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [videos]);

  /* ── list header (no search bar here — kept outside FlatList to avoid remount on typing) ── */
  const ListHeader = useMemo(() => (
    <View style={styles.headerBlock}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
        <FilterChip label="ALL"  active={!showFavorites && !selectedTagId} colors={colors} onPress={() => { setShowFavorites(false); setSelectedTagId(null); }} activeColor={colors.primary} />
        <FilterChip label="FAV"  active={showFavorites}  colors={colors} onPress={() => { setShowFavorites(!showFavorites); setSelectedTagId(null); }} activeColor={RED} icon="heart" />
        {tags.map(tag => (
          <FilterChip
            key={tag.id} label={tag.name.toUpperCase()} active={selectedTagId === tag.id} colors={colors}
            onPress={() => { setSelectedTagId(selectedTagId === tag.id ? null : tag.id); setShowFavorites(false); }}
            activeColor={tag.color || colors.primary} dot={tag.color || colors.primary}
          />
        ))}
      </ScrollView>

      {!isLoading && videos.length > 0 && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {videos.length} VIDEO{videos.length !== 1 ? "S" : ""}
          </Text>
          <View style={[styles.countDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.countText, { color: colors.primary + "aa" }]}>
            {viewMode === "grid" ? "GRID" : "LIST"}
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={toggleViewMode} style={[styles.iconToolBtn, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.75}>
            <Feather name={viewMode === "grid" ? "list" : "grid"} size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSortModal(true)} style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.75}>
            <Feather name="sliders" size={11} color={colors.mutedForeground} />
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>{sortLabel.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [colors, search, showFavorites, selectedTagId, tags, isLoading, videos.length, viewMode, sortBy, sortLabel]);

  /* ── render each flat item ── */
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === "stats") {
      return videos.length > 0 ? <StatsBar videos={videos} colors={colors} /> : null;
    }
    if (item.type === "section") {
      return <SectionHead title={item.title} code={item.code} count={item.count} colors={colors} />;
    }
    if (item.type === "grid-row") {
      return (
        <View style={styles.gridRow}>
          {item.videos.map((v) => (
            <View key={v.id} style={{ width: CARD_W }}>
              <VideoCard
                video={v}
                isSelected={selectedIds.has(v.id)}
                cardWidth={CARD_W}
                onPress={() => isSelectMode ? toggleSelection(v.id) : router.push(`/video/${v.id}`)}
                onLongPress={() => isSelectMode ? toggleSelection(v.id) : enterSelection(v.id)}
                onToggleFavorite={() => isSelectMode ? undefined : favMutation.mutate(v.id)}
              />
            </View>
          ))}
          {item.videos.length === 1 && <View style={{ width: CARD_W }} />}
        </View>
      );
    }
    if (item.type === "video") {
      return (
        <VideoListCard
          video={item.video}
          isSelected={selectedIds.has(item.video.id)}
          onPress={() => isSelectMode ? toggleSelection(item.video.id) : router.push(`/video/${item.video.id}`)}
          onLongPress={() => isSelectMode ? toggleSelection(item.video.id) : enterSelection(item.video.id)}
          onToggleFavorite={() => isSelectMode ? undefined : favMutation.mutate(item.video.id)}
          onToggleWatched={() => isSelectMode ? undefined : watchMutation.mutate(item.video.id)}
        />
      );
    }
    return null;
  }, [colors, selectedIds, isSelectMode, viewMode, CARD_W, videos]);

  /* ── selection bar animation ── */
  const selBarY = selBarAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] });

  return (
    <TabFadeWrapper>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      <TopAppBar
        showImport
        showTools
        loading={isLoading}
        rightAction={
          <AppButton label="SAVE" icon="plus" size="sm" variant="primary" onPress={() => setShowSaveModal(true)} />
        }
      />

      {/* Search bar lives OUTSIDE the FlatList to avoid TextInput remounting on every keystroke */}
      <View style={styles.searchHeader}>
        <View style={styles.searchTitleRow}>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Library</Text>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search vault…" />
        </View>
      </View>

      {isLoading ? (
        <FlatList
          key="skeleton"
          data={[1, 2, 3, 4]}
          keyExtractor={item => String(item)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={ListHeader}
          renderItem={() => <VideoCardSkeleton />}
        />
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
      ) : (
        <FlatList
          key={viewMode}
          data={flatItems}
          keyExtractor={(item, i) => {
            if (item.type === "stats")    return "stats";
            if (item.type === "section")  return `sec-${item.code}`;
            if (item.type === "grid-row") return `row-${item.sectionKey}-${item.rowIdx}`;
            if (item.type === "video")    return `vid-${item.video.id}`;
            return String(i);
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={ListHeader}
          renderItem={renderItem}
        />
      )}

      {/* ── Multi-select action bar ── */}
      <Animated.View
        style={[
          styles.selBar,
          { bottom: botInset + 90, transform: [{ translateY: selBarY }], opacity: selBarAnim },
        ]}
        pointerEvents={isSelectMode ? "auto" : "none"}
      >
        <View style={[styles.selBarCard, { borderColor: colors.border }]}>
          <LinearGradient colors={[colors.card, colors.card]} style={StyleSheet.absoluteFillObject} />

          {/* Cancel + count */}
          <TouchableOpacity onPress={clearSelection} style={[styles.selIconBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.selCount, { color: colors.foreground }]}>{selectedIds.size} selected</Text>
            <Text style={[styles.selSub, { color: colors.mutedForeground }]}>Long press to add more</Text>
          </View>

          {/* Select all */}
          <TouchableOpacity
            onPress={selectedIds.size === videos.length ? clearSelection : selectAll}
            style={[styles.selActionBtn, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "15" }]}
            activeOpacity={0.75}
          >
            <Feather name={selectedIds.size === videos.length ? "minus-square" : "check-square"} size={14} color={colors.primary} />
            <Text style={[styles.selActionText, { color: colors.primary }]}>
              {selectedIds.size === videos.length ? "NONE" : "ALL"}
            </Text>
          </TouchableOpacity>

          {/* Move */}
          <TouchableOpacity
            onPress={() => setShowMoveModal(true)}
            style={[styles.selActionBtn, { borderColor: CYAN + "40", backgroundColor: CYAN + "15" }]}
            activeOpacity={0.75}
          >
            <Feather name="folder" size={14} color={CYAN} />
            <Text style={[styles.selActionText, { color: CYAN }]}>MOVE</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            onPress={() => {
              const n = selectedIds.size;
              Alert.alert("Delete Videos", `Delete ${n} video${n !== 1 ? "s" : ""}? This cannot be undone.`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(Array.from(selectedIds)) },
              ]);
            }}
            disabled={deleteMutation.isPending}
            style={[styles.selActionBtn, { borderColor: RED + "40", backgroundColor: RED + "15" }]}
            activeOpacity={0.75}
          >
            <Feather name="trash-2" size={14} color={RED} />
            <Text style={[styles.selActionText, { color: RED }]}>DEL</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <SaveToVaultModal visible={showSaveModal} onClose={() => setShowSaveModal(false)} />

      {/* ── Sort Modal ── */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={sortStyles.backdrop} activeOpacity={1} onPress={() => setShowSortModal(false)} />
        <View style={[sortStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "transparent"]}
            style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}
            pointerEvents="none"
          />
          <View style={sortStyles.sheetHandle} />
          <View style={sortStyles.sheetHeaderRow}>
            <View style={[sortStyles.sheetIconWrap, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "35" }]}>
              <Feather name="sliders" size={14} color={colors.primary} />
            </View>
            <Text style={[sortStyles.sheetTitle, { color: colors.foreground }]}>Sort Videos</Text>
          </View>
          {SORT_OPTIONS.map(opt => (
            <SortRow key={opt.key} label={opt.label} icon={opt.icon} active={sortBy === opt.key} colors={colors}
              onPress={() => { setSortBy(opt.key); setShowSortModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            />
          ))}
        </View>
      </Modal>

      {/* ── Move to Folder Modal ── */}
      <Modal visible={showMoveModal} transparent animationType="fade" onRequestClose={() => setShowMoveModal(false)} statusBarTranslucent>
        <View style={moveStyles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowMoveModal(false)} />
          <MotiView
            from={{ opacity: 0, scale: 0.93, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            style={[moveStyles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.05)", "transparent"]}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
              pointerEvents="none"
            />
            <View style={moveStyles.dialogHeader}>
              <View style={[moveStyles.dialogIcon, { backgroundColor: CYAN + "20", borderColor: CYAN + "35" }]}>
                <Feather name="folder" size={16} color={CYAN} />
              </View>
              <Text style={[moveStyles.dialogTitle, { color: colors.foreground }]}>Move to Folder</Text>
              <TouchableOpacity onPress={() => setShowMoveModal(false)}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[moveStyles.dialogSub, { color: colors.mutedForeground }]}>
              Moving {selectedIds.size} video{selectedIds.size !== 1 ? "s" : ""}
            </Text>
            <ScrollView style={moveStyles.folderList} showsVerticalScrollIndicator={false}>
              {/* "No folder" option */}
              <TouchableOpacity
                onPress={() => moveMutation.mutate({ ids: Array.from(selectedIds), folderId: null })}
                style={[moveStyles.folderRow, { borderBottomColor: colors.border }]}
                activeOpacity={0.75}
              >
                <View style={[moveStyles.folderIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name="inbox" size={16} color={colors.mutedForeground} />
                </View>
                <Text style={[moveStyles.folderName, { color: colors.foreground }]}>No Folder (Inbox)</Text>
              </TouchableOpacity>
              {folders.map(f => {
                const fc = f.color || colors.primary;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => moveMutation.mutate({ ids: Array.from(selectedIds), folderId: f.id })}
                    style={[moveStyles.folderRow, { borderBottomColor: colors.border }]}
                    activeOpacity={0.75}
                  >
                    <View style={[moveStyles.folderIcon, { backgroundColor: fc + "1e", borderColor: fc + "30" }]}>
                      <Feather name="folder" size={16} color={fc} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[moveStyles.folderName, { color: colors.foreground }]}>{f.name}</Text>
                      <Text style={[moveStyles.folderCount, { color: colors.mutedForeground }]}>{f.videoCount} videos</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
                  </TouchableOpacity>
                );
              })}
              {folders.length === 0 && (
                <View style={moveStyles.noFolders}>
                  <Feather name="folder" size={28} color={colors.mutedForeground} style={{ opacity: 0.4, marginBottom: 8 }} />
                  <Text style={[moveStyles.noFoldersText, { color: colors.mutedForeground }]}>No folders created yet</Text>
                </View>
              )}
            </ScrollView>
          </MotiView>
        </View>
      </Modal>
    </View>
    </TabFadeWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  searchHeader: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4 },
  searchTitleRow: { paddingBottom: 10 },
  headerBlock: { paddingBottom: 4 },

  subHeader: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 14 },
  subLabel: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 2.5, marginBottom: 6 },
  subTitle: { fontSize: 40, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1, lineHeight: 48 },

  searchWrap: { paddingHorizontal: 10, marginBottom: 8 },

  chipsScroll: { flexGrow: 0, marginBottom: 8 },
  chipsContent: { gap: 6, paddingHorizontal: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderWidth: 1, borderRadius: 8,
  },
  chipText: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 1.5 },
  tagDot: { width: 5, height: 5, borderRadius: 2.5 },

  countRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingBottom: 10, gap: 8,
  },
  countText: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 1.5 },
  countDivider: { width: 1, height: 10 },
  iconToolBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderRadius: 8,
  },

  /* Stats bar */
  statsBar: {
    marginHorizontal: 10, marginBottom: 16, borderRadius: 14, borderWidth: 1,
    flexDirection: "row", paddingVertical: 14, paddingHorizontal: 6, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statVal: { fontSize: 22, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1 },
  statLabel: { fontSize: 8, fontFamily: "Eczar_400Regular", letterSpacing: 1.5 },
  statsDivider: { width: 1, marginVertical: 4 },

  /* Section header */
  sectionHead: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 10, paddingTop: 4, paddingBottom: 10,
  },
  sectionCode: { fontSize: 8, fontFamily: "Eczar_400Regular", letterSpacing: 1.5 },
  sectionTitle: { fontSize: 13, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.2 },
  sectionLine: { flex: 1, height: 1 },
  sectionBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  sectionBadgeText: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 0.5 },

  listContent: { paddingHorizontal: 10, paddingBottom: 180 },
  gridRow: { flexDirection: "row", gap: 10, marginBottom: 0 },

  /* Selection bar */
  selBar: { position: "absolute", left: 10, right: 10 },
  selBarCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 16,
  },
  selIconBtn: {
    width: 34, height: 34, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  selCount: { fontSize: 13, fontFamily: "Eczar_600SemiBold", letterSpacing: -0.2 },
  selSub:   { fontSize: 9,  fontFamily: "Eczar_400Regular", letterSpacing: 0.5, opacity: 0.6 },
  selActionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  selActionText: { fontSize: 10, fontFamily: "Eczar_600SemiBold", letterSpacing: 0.8 },
});

const sortStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0,
    paddingTop: 10, paddingBottom: 40, overflow: "hidden",
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center", marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetIconWrap: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  sheetTitle: { fontSize: 16, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.2 },
  sortRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortIconWrap: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  sortLabel: { fontSize: 15, fontFamily: "Eczar_500Medium", flex: 1 },
  activeCheck: {
    width: 26, height: 26, borderRadius: 6, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
});

const moveStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 20,
  },
  dialog: {
    width: "100%", borderRadius: 20, borderWidth: 1, overflow: "hidden",
    padding: 20, gap: 12, maxHeight: "70%",
    shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 40, elevation: 24,
  },
  dialogHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  dialogIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dialogTitle: { flex: 1, fontSize: 17, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.2 },
  dialogSub: { fontSize: 11, fontFamily: "Eczar_400Regular" },
  folderList: { maxHeight: 320 },
  folderRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  folderIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  folderName: { fontSize: 14, fontFamily: "Eczar_600SemiBold" },
  folderCount: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 0.5 },
  noFolders: { paddingVertical: 32, alignItems: "center" },
  noFoldersText: { fontSize: 13, fontFamily: "Eczar_400Regular" },
});
