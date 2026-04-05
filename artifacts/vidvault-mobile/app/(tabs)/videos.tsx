import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  Alert,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
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

/* ─────────────────────────────── Types ─────────────────────────────── */
type ViewMode = "grid" | "list" | "compact";
type SortMode = "newest" | "oldest" | "az" | "za" | "most-noted" | "most-ai";
type SmartFilter = "all" | "starred" | "has-ai" | "has-notes" | "uncategorized";

interface Tag { id: string; name: string; color?: string | null }
interface Folder { id: string; name: string; color?: string | null; videoCount: number }
interface VideoItem {
  id: string; title: string; url: string;
  thumbnail?: string | null; channelName?: string | null;
  duration?: string | null; isFavorite: boolean;
  tags?: Tag[]; notes?: any[]; aiOutputs?: any[];
  notesCount?: number; aiOutputsCount?: number;
  folderId?: string | null; createdAt?: string;
}

/* ─────────────────────────────── Constants ─────────────────────────── */
const PURPLE = "#818cf8";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const RED    = "#ef4444";
const ORANGE = "#f97316";

const SORT_OPTIONS: Array<{ key: SortMode; label: string; icon: string; desc: string }> = [
  { key: "newest",     label: "Newest First",  icon: "arrow-down",  desc: "Latest saved" },
  { key: "oldest",     label: "Oldest First",  icon: "arrow-up",    desc: "Earliest saved" },
  { key: "az",         label: "A → Z",         icon: "type",        desc: "Alphabetical" },
  { key: "za",         label: "Z → A",         icon: "type",        desc: "Reverse alpha" },
  { key: "most-noted", label: "Most Notes",    icon: "edit-3",      desc: "By note count" },
  { key: "most-ai",    label: "Most AI",       icon: "cpu",         desc: "By AI outputs" },
];

const SMART_FILTERS: Array<{ key: SmartFilter; label: string; icon: string; color: string }> = [
  { key: "all",           label: "ALL",          icon: "layers",   color: PURPLE },
  { key: "starred",       label: "STARRED",      icon: "heart",    color: RED },
  { key: "has-ai",        label: "HAS AI",       icon: "cpu",      color: CYAN },
  { key: "has-notes",     label: "NOTED",        icon: "edit-3",   color: GREEN },
  { key: "uncategorized", label: "UNSORTED",     icon: "inbox",    color: ORANGE },
];

/* ─────────────────────────────── Date grouping ─────────────────────── */
function getDateGroup(dateStr?: string): string {
  if (!dateStr) return "OLDER";
  const now = new Date();
  const d = new Date(dateStr);
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 1)  return "TODAY";
  if (diff < 7)  return "THIS WEEK";
  if (diff < 30) return "THIS MONTH";
  return "OLDER";
}

/* ─────────────────────────── Animated stat number ──────────────────── */
function AnimStat({ value, label, color }: { value: number; label: string; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 700, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={statStyles.item}>
      <Animated.Text style={[statStyles.val, { color }]}>
        {anim.interpolate({ inputRange: [0, Math.max(value, 1)], outputRange: ["0", String(value)] }) as any}
      </Animated.Text>
      <Text style={statStyles.lbl}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { alignItems: "center", flex: 1 },
  val:  { fontSize: 22, fontFamily: "AlegreyaSansSC_800ExtraBold", lineHeight: 26 },
  lbl:  { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginTop: 2 },
});

/* ──────────────────────────── Filter chip ───────────────────────────── */
function Chip({ label, active, onPress, color, icon, dot }: {
  label: string; active: boolean; onPress: () => void;
  color: string; icon?: string; dot?: string;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[chipS.wrap, {
        backgroundColor: active ? color + "1e" : colors.card,
        borderColor: active ? color + "55" : colors.border,
      }]}
      activeOpacity={0.75}
    >
      {dot && !icon && <View style={[chipS.dot, { backgroundColor: dot }]} />}
      {icon && <Feather name={icon as any} size={10} color={active ? color : colors.mutedForeground} />}
      <Text style={[chipS.text, { color: active ? color : colors.mutedForeground }]}>{label}</Text>
      {active && <View style={[chipS.activeDot, { backgroundColor: color }]} />}
    </TouchableOpacity>
  );
}

const chipS = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1, borderRadius: 6 },
  dot:  { width: 5, height: 5, borderRadius: 2.5 },
  text: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },
  activeDot: { width: 4, height: 4, borderRadius: 2, marginLeft: 2 },
});

/* ─────────────────────── Compact video row ────────────────────────── */
function CompactRow({ video, onPress, onToggleFavorite, isSelected, onLongPress }: {
  video: VideoItem; onPress: () => void; onToggleFavorite: () => void;
  isSelected?: boolean; onLongPress?: () => void;
}) {
  const colors = useColors();
  const noteCount = video.notesCount ?? video.notes?.length ?? 0;
  const aiCount   = video.aiOutputsCount ?? video.aiOutputs?.length ?? 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[compactS.row, {
        backgroundColor: isSelected ? PURPLE + "18" : colors.card,
        borderColor: isSelected ? PURPLE + "55" : "rgba(129,140,248,0.1)",
      }]}
    >
      {isSelected && (
        <View style={compactS.checkCircle}>
          <Feather name="check" size={10} color="#fff" />
        </View>
      )}
      <View style={compactS.colorBar}>
        {video.tags?.[0]?.color ? (
          <View style={{ flex: 1, backgroundColor: video.tags[0].color, borderRadius: 2 }} />
        ) : (
          <View style={{ flex: 1, backgroundColor: PURPLE + "40", borderRadius: 2 }} />
        )}
      </View>
      <View style={compactS.info}>
        <Text style={[compactS.title, { color: colors.foreground }]} numberOfLines={1}>{video.title}</Text>
        <View style={compactS.metaRow}>
          {video.channelName && (
            <Text style={[compactS.channel, { color: colors.mutedForeground }]} numberOfLines={1}>{video.channelName}</Text>
          )}
          {noteCount > 0 && (
            <View style={compactS.badge}>
              <Feather name="edit-3" size={7} color={GREEN} />
              <Text style={[compactS.badgeText, { color: GREEN }]}>{noteCount}</Text>
            </View>
          )}
          {aiCount > 0 && (
            <View style={compactS.badge}>
              <Feather name="cpu" size={7} color={CYAN} />
              <Text style={[compactS.badgeText, { color: CYAN }]}>{aiCount}</Text>
            </View>
          )}
          {video.duration && (
            <View style={compactS.badge}>
              <Text style={[compactS.badgeText, { color: colors.mutedForeground }]}>{video.duration}</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleFavorite(); }}
        style={compactS.favBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="heart" size={14} color={video.isFavorite ? RED : colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const compactS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 6, marginBottom: 6, gap: 10 },
  checkCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center" },
  colorBar: { width: 3, height: 36, borderRadius: 2 },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 13, fontFamily: "Poppins_600SemiBold", lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  channel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", flex: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 3 },
  badgeText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular" },
  favBtn: { padding: 4 },
});

/* ─────────────────────── Group header ────────────────────────────── */
function GroupHeader({ label }: { label: string }) {
  return (
    <View style={groupS.wrap}>
      <View style={groupS.line} />
      <Text style={groupS.label}>{label}</Text>
      <View style={groupS.line} />
    </View>
  );
}

const groupS = StyleSheet.create({
  wrap:  { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 6, gap: 10 },
  line:  { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(129,140,248,0.18)" },
  label: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", color: "rgba(129,140,248,0.55)", letterSpacing: 2 },
});

/* ─────────────────────── Main Screen ──────────────────────────────── */
export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();
  const { width: screenW } = useWindowDimensions();
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  /* ── State ── */
  const [search, setSearch]                 = useState("");
  const [smartFilter, setSmartFilter]       = useState<SmartFilter>("all");
  const [selectedTagId, setSelectedTagId]   = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode]             = useState<ViewMode>("grid");
  const [sortBy, setSortBy]                 = useState<SortMode>("newest");
  const [showSortModal, setShowSortModal]   = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSaveModal, setShowSaveModal]   = useState(false);
  const [showBulkSheet, setShowBulkSheet]   = useState(false);
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const multiSelectMode = selectedIds.size > 0;

  /* ── Queries ── */
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["videos", search],
    queryFn: () => api.listVideos({ search: search || undefined, limit: 100 }),
  });
  const { data: tagsData }    = useQuery({ queryKey: ["tags"],    queryFn: () => api.listTags() });
  const { data: foldersData } = useQuery({ queryKey: ["folders"], queryFn: () => api.listFolders() });

  const favMutation = useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVideo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const rawVideos: VideoItem[] = data?.videos ?? [];
  const tags: Tag[]     = tagsData?.tags ?? [];
  const folders: Folder[] = foldersData?.folders ?? [];

  /* ── Client-side filter + sort ── */
  const videos = useMemo(() => {
    let arr = [...rawVideos];
    // Smart filter
    if (smartFilter === "starred")       arr = arr.filter(v => v.isFavorite);
    if (smartFilter === "has-ai")        arr = arr.filter(v => (v.aiOutputsCount ?? v.aiOutputs?.length ?? 0) > 0);
    if (smartFilter === "has-notes")     arr = arr.filter(v => (v.notesCount ?? v.notes?.length ?? 0) > 0);
    if (smartFilter === "uncategorized") arr = arr.filter(v => !v.folderId && (!v.tags || v.tags.length === 0));
    // Tag filter
    if (selectedTagId) arr = arr.filter(v => v.tags?.some(t => t.id === selectedTagId));
    // Folder filter
    if (selectedFolderId) arr = arr.filter(v => v.folderId === selectedFolderId);
    // Sort
    switch (sortBy) {
      case "oldest":     arr.sort((a,b) => new Date(a.createdAt??0).getTime() - new Date(b.createdAt??0).getTime()); break;
      case "az":         arr.sort((a,b) => a.title.localeCompare(b.title)); break;
      case "za":         arr.sort((a,b) => b.title.localeCompare(a.title)); break;
      case "most-noted": arr.sort((a,b) => (b.notes?.length??0) - (a.notes?.length??0)); break;
      case "most-ai":    arr.sort((a,b) => (b.aiOutputs?.length??0) - (a.aiOutputs?.length??0)); break;
      default:           arr.sort((a,b) => new Date(b.createdAt??0).getTime() - new Date(a.createdAt??0).getTime()); break;
    }
    return arr;
  }, [rawVideos, smartFilter, selectedTagId, selectedFolderId, sortBy]);

  /* ── Computed stats (from visible videos) ── */
  const totalNotes   = useMemo(() => videos.reduce((s,v) => s + (v.notesCount ?? v.notes?.length ?? 0), 0), [videos]);
  const totalAi      = useMemo(() => videos.reduce((s,v) => s + (v.aiOutputsCount ?? v.aiOutputs?.length ?? 0), 0), [videos]);
  const totalFavs    = useMemo(() => videos.filter(v => v.isFavorite).length, [videos]);

  /* ── Active filter count ── */
  const activeFilterCount = [
    selectedTagId != null, selectedFolderId != null,
    smartFilter !== "all",
  ].filter(Boolean).length;

  /* ── Grouped data for list/compact mode ── */
  const groupedData = useMemo(() => {
    if (viewMode === "grid") return [];
    const groups: { group: string; items: VideoItem[] }[] = [];
    const groupMap = new Map<string, VideoItem[]>();
    const ORDER = ["TODAY", "THIS WEEK", "THIS MONTH", "OLDER"];
    videos.forEach(v => {
      const g = getDateGroup(v.createdAt);
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(v);
    });
    ORDER.forEach(g => {
      if (groupMap.has(g)) groups.push({ group: g, items: groupMap.get(g)! });
    });
    return groups;
  }, [videos, viewMode]);

  /* ── Flat data with group headers for list/compact ── */
  type ListItem = { type: "header"; label: string } | { type: "item"; video: VideoItem };
  const flatListData = useMemo((): ListItem[] => {
    if (viewMode === "grid") return [];
    const out: ListItem[] = [];
    groupedData.forEach(({ group, items }) => {
      out.push({ type: "header", label: group });
      items.forEach(v => out.push({ type: "item", video: v }));
    });
    return out;
  }, [groupedData, viewMode]);

  /* ── Multi-select helpers ── */
  const toggleSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const exitMultiSelect = () => setSelectedIds(new Set());

  const handleBulkFavorite = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) { await favMutation.mutateAsync(id).catch(() => {}); }
    exitMultiSelect();
    setShowBulkSheet(false);
  };

  const handleBulkDelete = () => {
    Alert.alert(
      "Delete Selected",
      `Permanently delete ${selectedIds.size} video${selectedIds.size !== 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive", onPress: async () => {
            const ids = Array.from(selectedIds);
            for (const id of ids) { await deleteMutation.mutateAsync(id).catch(() => {}); }
            exitMultiSelect();
            setShowBulkSheet(false);
          },
        },
      ]
    );
  };

  /* ── Sort label ── */
  const sortLabel = SORT_OPTIONS.find(s => s.key === sortBy)?.label ?? "Newest";

  /* ── ListHeader ── */
  const ListHeader = (
    <View>
      {/* Section header */}
      <View style={s.sectionHead}>
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>//VIDEO_VAULT</Text>
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Library</Text>
      </View>

      {/* Stats bar */}
      {!isLoading && videos.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350 }}
        >
          <LinearGradient
            colors={["rgba(129,140,248,0.07)", "rgba(6,182,212,0.04)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[s.statsBar, { borderColor: "rgba(129,140,248,0.14)" }]}
          >
            <AnimStat value={videos.length} label="VIDEOS"  color={PURPLE} />
            <View style={s.statDivider} />
            <AnimStat value={totalFavs}    label="STARRED"  color={RED} />
            <View style={s.statDivider} />
            <AnimStat value={totalNotes}   label="NOTES"    color={GREEN} />
            <View style={s.statDivider} />
            <AnimStat value={totalAi}      label="AI OUTS"  color={CYAN} />
          </LinearGradient>
        </MotiView>
      )}

      {/* Search */}
      <View style={s.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search library…" />
      </View>

      {/* Smart filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipContent}>
        {SMART_FILTERS.map(f => (
          <Chip key={f.key} label={f.label} active={smartFilter === f.key}
            color={f.color} icon={f.icon}
            onPress={() => { setSmartFilter(f.key); setSelectedTagId(null); }}
          />
        ))}
      </ScrollView>

      {/* Tag chips */}
      {tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipContent}>
          {tags.map(tag => (
            <Chip key={tag.id} label={"#" + tag.name.toUpperCase()} active={selectedTagId === tag.id}
              color={tag.color || PURPLE} dot={tag.color || PURPLE}
              onPress={() => { setSelectedTagId(selectedTagId === tag.id ? null : tag.id); setSmartFilter("all"); }}
            />
          ))}
        </ScrollView>
      )}

      {/* Folder pills */}
      {folders.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipContent}>
          <Chip label="ALL FOLDERS" active={selectedFolderId === null}
            color={CYAN} icon="layers"
            onPress={() => setSelectedFolderId(null)}
          />
          {folders.map(f => (
            <Chip key={f.id} label={f.name.toUpperCase()} active={selectedFolderId === f.id}
              color={f.color || CYAN} dot={f.color || CYAN}
              onPress={() => setSelectedFolderId(selectedFolderId === f.id ? null : f.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Count row + view mode + sort */}
      {!isLoading && videos.length > 0 && (
        <View style={s.countRow}>
          <Text style={[s.countText, { color: colors.mutedForeground }]}>
            {videos.length} VIDEO{videos.length !== 1 ? "S" : ""}
          </Text>
          {activeFilterCount > 0 && (
            <View style={[s.filterBadge, { backgroundColor: PURPLE }]}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />

          {/* View mode toggle */}
          <View style={[s.viewToggle, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {(["grid", "list", "compact"] as ViewMode[]).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode(m); }}
                style={[s.viewBtn, viewMode === m && { backgroundColor: PURPLE + "28" }]}
              >
                <Feather
                  name={m === "grid" ? "grid" : m === "list" ? "list" : "align-justify"}
                  size={11} color={viewMode === m ? PURPLE : colors.mutedForeground}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort button */}
          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            style={[s.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <Feather name="sliders" size={10} color={colors.mutedForeground} />
            <Text style={[s.countText, { color: colors.mutedForeground }]}>
              {sortLabel.split(" ")[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /* ── Multi-select top bar ── */
  const MultiBar = multiSelectMode ? (
    <View style={[s.multiBar, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "33" }]}>
      <TouchableOpacity onPress={exitMultiSelect} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="x" size={16} color={PURPLE} />
      </TouchableOpacity>
      <Text style={[s.multiText, { color: PURPLE }]}>{selectedIds.size} SELECTED</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={() => setSelectedIds(new Set(videos.map(v => v.id)))}
        style={[s.multiAction, { borderColor: PURPLE + "44" }]}
      >
        <Text style={[s.multiActionText, { color: PURPLE }]}>ALL</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowBulkSheet(true)}
        style={[s.multiAction, { borderColor: PURPLE + "44", backgroundColor: PURPLE + "22" }]}
      >
        <Feather name="more-horizontal" size={13} color={PURPLE} />
        <Text style={[s.multiActionText, { color: PURPLE }]}>ACTIONS</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  /* ── Render grid item ── */
  const renderGridItem = useCallback(({ item, index }: { item: VideoItem; index: number }) => (
    <VideoCard
      video={item}
      isNew={index === 0 && !search && smartFilter === "all" && !selectedTagId && !selectedFolderId}
      isSelected={selectedIds.has(item.id)}
      onPress={() => {
        if (multiSelectMode) { toggleSelect(item.id); return; }
        router.push(`/video/${item.id}`);
      }}
      onLongPress={() => toggleSelect(item.id)}
      onToggleFavorite={() => favMutation.mutate(item.id)}
    />
  ), [selectedIds, multiSelectMode, search, smartFilter, selectedTagId, selectedFolderId]);

  /* ── Render list/compact item ── */
  const renderFlatItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === "header") return <GroupHeader label={item.label} />;
    const v = item.video;
    if (viewMode === "compact") {
      return (
        <CompactRow
          video={v}
          isSelected={selectedIds.has(v.id)}
          onPress={() => { if (multiSelectMode) { toggleSelect(v.id); return; } router.push(`/video/${v.id}`); }}
          onLongPress={() => toggleSelect(v.id)}
          onToggleFavorite={() => favMutation.mutate(v.id)}
        />
      );
    }
    return (
      <VideoListCard
        video={v}
        isSelected={selectedIds.has(v.id)}
        onPress={() => { if (multiSelectMode) { toggleSelect(v.id); return; } router.push(`/video/${v.id}`); }}
        onLongPress={() => toggleSelect(v.id)}
        onToggleFavorite={() => favMutation.mutate(v.id)}
      />
    );
  }, [viewMode, selectedIds, multiSelectMode]);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      <TopAppBar
        rightAction={
          <View style={s.topRight}>
            <AppButton label="SAVE" icon="plus" size="sm" variant="primary" onPress={() => setShowSaveModal(true)} />
          </View>
        }
      />

      {MultiBar}

      {isLoading ? (
        <FlatList
          key="skeleton-grid"
          data={[1,2,3,4]}
          keyExtractor={(item) => String(item)}
          numColumns={2}
          columnWrapperStyle={s.colWrapper}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: botInset + 100 }}
          ListHeaderComponent={ListHeader}
          renderItem={() => <VideoCardSkeleton />}
        />
      ) : videos.length === 0 ? (
        <FlatList
          key="empty"
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="film"
              title={search ? "No results" : activeFilterCount > 0 ? "No matches" : "Vault is empty"}
              subtitle={
                search ? "Try a different search term"
                : activeFilterCount > 0 ? "Clear filters to see all videos"
                : "Save your first video to the vault"
              }
              actionLabel={search || activeFilterCount > 0 ? "Clear Filters" : "Save Video"}
              onAction={() => {
                if (search || activeFilterCount > 0) {
                  setSearch(""); setSmartFilter("all"); setSelectedTagId(null); setSelectedFolderId(null);
                } else {
                  setShowSaveModal(true);
                }
              }}
              code={search ? "Ø" : "00"}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      ) : viewMode === "grid" ? (
        <FlatList
          key="grid"
          data={videos}
          keyExtractor={(v) => v.id}
          numColumns={2}
          columnWrapperStyle={s.colWrapper}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={ListHeader}
          renderItem={renderGridItem}
        />
      ) : (
        <FlatList
          key={viewMode}
          data={flatListData}
          keyExtractor={(item, i) => item.type === "header" ? `hdr-${item.label}` : item.video.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={ListHeader}
          renderItem={renderFlatItem}
        />
      )}

      <SaveToVaultModal visible={showSaveModal} onClose={() => setShowSaveModal(false)} />

      {/* ── Sort Modal ── */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={modalS.backdrop} activeOpacity={1} onPress={() => setShowSortModal(false)} />
        <View style={[modalS.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={modalS.handle} />
          <Text style={[modalS.sheetTitle, { color: colors.mutedForeground }]}>// SORT_BY</Text>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => { setSortBy(opt.key); setShowSortModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[modalS.row, { borderBottomColor: colors.border, backgroundColor: sortBy === opt.key ? PURPLE + "12" : "transparent" }]}
              activeOpacity={0.75}
            >
              <View style={[modalS.iconBox, { borderColor: sortBy === opt.key ? PURPLE + "44" : colors.border }]}>
                <Feather name={opt.icon as any} size={12} color={sortBy === opt.key ? PURPLE : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[modalS.rowLabel, { color: sortBy === opt.key ? colors.foreground : colors.foreground }]}>{opt.label}</Text>
                <Text style={[modalS.rowDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
              </View>
              {sortBy === opt.key && <Feather name="check" size={14} color={PURPLE} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* ── Bulk Actions Sheet ── */}
      <Modal visible={showBulkSheet} transparent animationType="slide" onRequestClose={() => setShowBulkSheet(false)}>
        <TouchableOpacity style={modalS.backdrop} activeOpacity={1} onPress={() => setShowBulkSheet(false)} />
        <View style={[modalS.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={modalS.handle} />
          <Text style={[modalS.sheetTitle, { color: colors.mutedForeground }]}>
            // BULK_ACTIONS — {selectedIds.size} SELECTED
          </Text>
          <TouchableOpacity
            onPress={handleBulkFavorite}
            style={[modalS.row, { borderBottomColor: colors.border }]}
            activeOpacity={0.75}
          >
            <View style={[modalS.iconBox, { borderColor: RED + "44" }]}>
              <Feather name="heart" size={12} color={RED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[modalS.rowLabel, { color: colors.foreground }]}>Toggle Favorites</Text>
              <Text style={[modalS.rowDesc, { color: colors.mutedForeground }]}>Star/unstar selected videos</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBulkDelete}
            style={[modalS.row, { borderBottomColor: colors.border }]}
            activeOpacity={0.75}
          >
            <View style={[modalS.iconBox, { borderColor: RED + "44" }]}>
              <Feather name="trash-2" size={12} color={RED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[modalS.rowLabel, { color: RED }]}>Delete Selected</Text>
              <Text style={[modalS.rowDesc, { color: colors.mutedForeground }]}>Permanently remove {selectedIds.size} video{selectedIds.size !== 1 ? "s" : ""}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { exitMultiSelect(); setShowBulkSheet(false); }}
            style={[modalS.row, { borderBottomColor: "transparent" }]}
            activeOpacity={0.75}
          >
            <View style={[modalS.iconBox, { borderColor: colors.border }]}>
              <Feather name="x" size={12} color={colors.mutedForeground} />
            </View>
            <Text style={[modalS.rowLabel, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* ─────────────────── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  sectionHead: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
  sectionLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2.5, marginBottom: 4 },
  sectionTitle: { fontSize: 40, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1, lineHeight: 48 },

  statsBar: {
    marginHorizontal: 14, marginBottom: 12, borderRadius: 8, borderWidth: 1,
    flexDirection: "row", alignItems: "center", paddingVertical: 14,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: "rgba(129,140,248,0.15)" },

  searchWrap: { paddingHorizontal: 14, marginBottom: 8 },
  chipScroll: { flexGrow: 0, marginBottom: 8 },
  chipContent: { gap: 6, paddingHorizontal: 14, paddingRight: 6 },

  countRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  countText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },
  filterBadge: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  filterBadgeText: { fontSize: 8, fontFamily: "JetBrainsMono_600SemiBold", color: "#fff" },

  viewToggle: { flexDirection: "row", borderWidth: 1, borderRadius: 6, overflow: "hidden" },
  viewBtn: { paddingHorizontal: 9, paddingVertical: 6 },

  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderRadius: 6,
  },

  colWrapper: { gap: 10, paddingHorizontal: 0 },

  multiBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 14, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1,
  },
  multiText: { fontSize: 10, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.5 },
  multiAction: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1,
  },
  multiActionText: { fontSize: 9, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1 },
});

const modalS = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderWidth: 1, borderBottomWidth: 0,
    paddingTop: 12, paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.13)",
    alignSelf: "center", marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2,
    paddingHorizontal: 20, paddingBottom: 10,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  rowDesc:  { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5, opacity: 0.7, marginTop: 1 },
});
