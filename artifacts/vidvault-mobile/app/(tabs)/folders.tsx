import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  Alert,
  ScrollView,
  useWindowDimensions,
  Image,
  ActivityIndicator,
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
import { Skeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { PlaylistImportModal } from "@/components/PlaylistImportModal";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const PINK   = "#ec4899";

const FOLDER_COLORS = ["#6366f1", "#2563eb", "#059669", "#d97706", "#dc2626", "#db2777", "#0891b2"];

const SMART_COLLECTIONS = [
  { type: "starred", label: "Starred",   icon: "heart",   color: PINK,   desc: "Your favorite videos" },
  { type: "hasAi",   label: "Has AI",    icon: "cpu",     color: PURPLE, desc: "Videos with AI content" },
  { type: "watched", label: "Watched",   icon: "eye",     color: CYAN,   desc: "Videos you've seen" },
  { type: "recent",  label: "This Week", icon: "clock",   color: GREEN,  desc: "Saved in last 7 days" },
] as const;

/* ── Smart Collection Card ── */
function SmartCard({ col, statVal }: { col: typeof SMART_COLLECTIONS[number]; statVal?: number }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/collection?type=${col.type}&label=${encodeURIComponent(col.label)}`)}
      style={[styles.smartCard, { backgroundColor: colors.card, borderColor: col.color + "28" }]}
    >
      <LinearGradient
        colors={[col.color + "12", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
        pointerEvents="none"
      />
      <View style={{ height: 3, backgroundColor: col.color, borderTopLeftRadius: 14, borderTopRightRadius: 14, position: "absolute", top: 0, left: 0, right: 0 }} />
      <View style={[styles.smartIconWrap, { backgroundColor: col.color + "1a", borderColor: col.color + "30" }]}>
        <Feather name={col.icon as any} size={20} color={col.color} />
      </View>
      <Text style={[styles.smartLabel, { color: colors.foreground }]}>{col.label}</Text>
      <Text style={[styles.smartDesc, { color: colors.mutedForeground }]}>{col.desc}</Text>
      {statVal != null && (
        <View style={[styles.smartCount, { backgroundColor: col.color + "18", borderColor: col.color + "30" }]}>
          <Text style={[styles.smartCountText, { color: col.color }]}>{statVal}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={12} color={col.color + "70"} style={{ position: "absolute", bottom: 10, right: 10 }} />
    </TouchableOpacity>
  );
}

/* ── Folder Card ── */
function FolderCard({ folder, onPress, onDelete, delay }: {
  folder: { id: string; name: string; color?: string | null; videoCount: number };
  onPress: () => void;
  onDelete: () => void;
  delay: number;
}) {
  const colors = useColors();
  const color = folder.color || colors.primary;
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", delay, damping: 16, stiffness: 160 }}
      style={{ flex: 1 }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.folderCard, { backgroundColor: colors.card, borderColor: color + "28" }]}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.05)", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={[styles.folderIcon, { backgroundColor: color + "1a", borderWidth: 1, borderColor: color + "30" }]}>
          <Feather name="folder" size={26} color={color} />
        </View>
        <Text style={[styles.folderName, { color: colors.foreground }]} numberOfLines={2}>{folder.name}</Text>
        <View style={styles.folderMeta}>
          <Feather name="film" size={10} color={colors.mutedForeground} />
          <Text style={[styles.folderCount, { color: colors.mutedForeground }]}>
            {folder.videoCount} {folder.videoCount === 1 ? "video" : "videos"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="trash-2" size={13} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
        </TouchableOpacity>
        <View style={[styles.folderAccentBar, { backgroundColor: color }]} />
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Folder Detail Sheet ── */
type FolderInfo = { id: string; name: string; color?: string | null; videoCount: number };

function FolderDetailSheet({
  folder,
  onClose,
  onDeleted,
}: {
  folder: FolderInfo | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName]   = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["folder-videos", folder?.id],
    queryFn: () => api.listVideos({ folderId: folder!.id }),
    enabled: !!folder,
  });

  const renameMutation = useMutation({
    mutationFn: () => api.updateFolder(folder!.id, { name: newName.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["folder-videos", folder?.id] });
      setRenaming(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteFolder(folder!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onDeleted();
    },
  });

  const confirmDelete = () => {
    Alert.alert(
      "Delete Folder",
      `Delete "${folder?.name}"? Videos inside will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  const color = folder?.color || PURPLE;
  const videos = data?.videos ?? [];

  if (!folder) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={[
          sheetStyles.sheet,
          { backgroundColor: colors.card, borderColor: color + "30", paddingBottom: insets.bottom + 20 },
        ]}>
          <LinearGradient
            colors={[color + "12", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
            pointerEvents="none"
          />

          {/* Handle */}
          <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={sheetStyles.sheetHeader}>
            <View style={[sheetStyles.folderIconWrap, { backgroundColor: color + "1a", borderColor: color + "35" }]}>
              <Feather name="folder" size={22} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              {renaming ? (
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  style={[sheetStyles.renameInput, { color: colors.foreground, borderColor: color + "50", backgroundColor: colors.background }]}
                  onBlur={() => { if (!newName.trim()) setRenaming(false); }}
                />
              ) : (
                <Text style={[sheetStyles.sheetTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {folder.name}
                </Text>
              )}
              <Text style={[sheetStyles.sheetSub, { color: colors.mutedForeground }]}>
                {folder.videoCount} {folder.videoCount === 1 ? "video" : "videos"}
              </Text>
            </View>

            {renaming ? (
              <TouchableOpacity
                onPress={() => { if (newName.trim()) renameMutation.mutate(); else setRenaming(false); }}
                style={[sheetStyles.iconBtn, { backgroundColor: color + "18", borderColor: color + "30" }]}
              >
                {renameMutation.isPending
                  ? <ActivityIndicator size="small" color={color} />
                  : <Feather name="check" size={16} color={color} />
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => { setNewName(folder.name); setRenaming(true); }}
                style={[sheetStyles.iconBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Feather name="edit-2" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={confirmDelete}
              style={[sheetStyles.iconBtn, { backgroundColor: "#ef444414", borderColor: "#ef444430" }]}
            >
              <Feather name="trash-2" size={14} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={[sheetStyles.iconBtn, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Accent */}
          <View style={[sheetStyles.sheetAccent, { backgroundColor: color }]} />

          {/* Videos */}
          {isLoading ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator color={color} />
            </View>
          ) : videos.length === 0 ? (
            <View style={sheetStyles.emptySheet}>
              <View style={[sheetStyles.emptyIconWrap, { backgroundColor: color + "14", borderColor: color + "25" }]}>
                <Feather name="film" size={28} color={color} />
              </View>
              <Text style={[sheetStyles.emptyTitle, { color: colors.foreground }]}>No videos here yet</Text>
              <Text style={[sheetStyles.emptySub, { color: colors.mutedForeground }]}>
                Add videos to "{folder.name}" from the Videos tab
              </Text>
            </View>
          ) : (
            <FlatList
              data={videos}
              keyExtractor={(v) => v.id}
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onClose(); router.push(`/video/${item.id}`); }}
                  activeOpacity={0.82}
                  style={[sheetStyles.videoRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={sheetStyles.thumb} />
                  ) : (
                    <View style={[sheetStyles.thumb, { backgroundColor: color + "18", alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="film" size={14} color={color} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[sheetStyles.videoTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.channelName && (
                      <Text style={[sheetStyles.videoChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.channelName}
                      </Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function FoldersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const dialogBtnWidth = Math.min(width - 88, 432);

  const [showModal, setShowModal]           = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [folderName, setFolderName]         = useState("");
  const [selectedColor, setSelectedColor]   = useState(FOLDER_COLORS[0]);
  const [createError, setCreateError]       = useState("");
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["folders"],
    queryFn: () => api.listFolders(),
  });

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => api.createFolder(folderName.trim(), selectedColor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setShowModal(false);
      setFolderName("");
      setSelectedColor(FOLDER_COLORS[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: Error) => setCreateError(e.message || "Failed to create folder"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const handleDelete = (folder: { id: string; name: string }) => {
    Alert.alert(
      "Delete Folder",
      `Delete "${folder.name}"? Videos inside will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(folder.id) },
      ],
    );
  };

  const openModal = () => {
    setFolderName("");
    setSelectedColor(FOLDER_COLORS[0]);
    setCreateError("");
    setShowModal(true);
  };

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const folders = data?.folders ?? [];

  const smartStatMap: Record<string, number | undefined> = {
    starred: statsData?.totalFavorites,
    watched: statsData?.totalWatched,
    hasAi:   undefined,
    recent:  undefined,
  };

  /* ── Smart Collections header (used as FlatList ListHeaderComponent) ── */
  const ListHeader = () => (
    <View style={{ paddingBottom: 6 }}>
      {/* Smart Collections section */}
      <View style={styles.sectionHead}>
        <View style={[styles.sectionDot, { backgroundColor: PURPLE }]} />
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SMART COLLECTIONS</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 4 }}
        style={{ marginBottom: 20 }}
      >
        {SMART_COLLECTIONS.map((col) => (
          <SmartCard key={col.type} col={col} statVal={smartStatMap[col.type]} />
        ))}
      </ScrollView>

      {/* Import Playlist banner */}
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => setShowImportModal(true)}
        style={[styles.importBanner, { backgroundColor: colors.card, borderColor: CYAN + "35" }]}
      >
        <LinearGradient
          colors={[CYAN + "10", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
          pointerEvents="none"
        />
        <View style={[styles.importIconWrap, { backgroundColor: CYAN + "18", borderColor: CYAN + "30" }]}>
          <Feather name="download-cloud" size={18} color={CYAN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.importTitle, { color: colors.foreground }]}>Bulk Playlist Import</Text>
          <Text style={[styles.importSub, { color: colors.mutedForeground }]}>
            Paste a YouTube playlist URL → save all videos at once
          </Text>
        </View>
        <View style={[styles.importBadge, { backgroundColor: CYAN + "18", borderColor: CYAN + "35" }]}>
          <Text style={[styles.importBadgeText, { color: CYAN }]}>NEW</Text>
        </View>
        <Feather name="chevron-right" size={16} color={CYAN + "80"} />
      </TouchableOpacity>

      {/* Folders section header */}
      {folders.length > 0 && (
        <View style={[styles.sectionHead, { marginTop: 20 }]}>
          <View style={[styles.sectionDot, { backgroundColor: AMBER }]} />
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR FOLDERS</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>{folders.length}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />
      <TopAppBar
        showImport
        showTools
        rightAction={
          <AppButton
            label="NEW"
            icon="folder-plus"
            size="sm"
            variant="primary"
            onPress={openModal}
          />
        }
      />

      <View style={styles.subHeader}>
        <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Organize</Text>
        <Text style={[styles.subTitle, { color: colors.foreground }]}>Folders</Text>
      </View>

      {isLoading ? (
        <>
          <ListHeader />
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={160} style={{ width: (width - 32) / 2 }} borderRadius={colors.radius} />
            ))}
          </View>
        </>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={folders.length > 0 ? styles.columnWrapper : undefined}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <EmptyState
              icon="folder"
              title="No folders yet"
              subtitle="Create folders to organize your video library"
              actionLabel="Create Folder"
              onAction={openModal}
              code="00"
            />
          }
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item, index }) => (
            <FolderCard
              folder={item}
              delay={index * 60}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedFolder(item); }}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={openModal}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: botInset + 90 }]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.primary + "dd", colors.primary]}
          style={StyleSheet.absoluteFillObject}
        />
        <Feather name="folder-plus" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Playlist Import Modal */}
      <PlaylistImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Inline Folder Detail Sheet */}
      <FolderDetailSheet
        folder={selectedFolder}
        onClose={() => setSelectedFolder(null)}
        onDeleted={() => setSelectedFolder(null)}
      />

      {/* ── CENTERED Create Folder Modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <MotiView
            from={{ opacity: 0, scale: 0.92, translateY: 12 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.06)", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: colors.radius }]}
              pointerEvents="none"
            />

            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconWrap, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "35" }]}>
                <Feather name="folder-plus" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.dialogTitle, { color: colors.foreground }]}>New Folder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.dialogClose}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.dialogDivider, { backgroundColor: colors.border }]} />

            <TextInput
              value={folderName}
              onChangeText={(t) => { setFolderName(t); setCreateError(""); }}
              placeholder="Folder name"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: createError ? "#ef444450" : colors.border,
                },
              ]}
              autoFocus
            />
            {createError ? (
              <Text style={[styles.errorText, { color: "#ef4444" }]}>{createError}</Text>
            ) : null}

            <Text style={[styles.colorLabel, { color: colors.mutedForeground }]}>FOLDER COLOR</Text>
            <View style={styles.colorRow}>
              {FOLDER_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => { setSelectedColor(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotSelected,
                    selectedColor === c && { borderColor: colors.foreground },
                  ]}
                >
                  {selectedColor === c && (
                    <Feather name="check" size={12} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {folderName.trim().length > 0 && (
              <View style={[styles.previewRow, { backgroundColor: selectedColor + "12", borderColor: selectedColor + "25" }]}>
                <View style={[styles.previewIcon, { backgroundColor: selectedColor + "20" }]}>
                  <Feather name="folder" size={16} color={selectedColor} />
                </View>
                <Text style={[styles.previewName, { color: selectedColor }]} numberOfLines={1}>
                  {folderName.trim()}
                </Text>
              </View>
            )}

            <AppButton
              label="CREATE FOLDER"
              icon="folder-plus"
              size="md"
              variant="primary"
              width={dialogBtnWidth}
              loading={createMutation.isPending}
              disabled={createMutation.isPending || !folderName.trim()}
              onPress={() => {
                if (!folderName.trim()) { setCreateError("Folder name is required"); return; }
                createMutation.mutate();
              }}
            />
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  subHeader: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 14 },
  subLabel: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 2.5, marginBottom: 6 },
  subTitle: { fontSize: 40, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1, lineHeight: 48 },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2.5,
  },
  countBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  countText: { fontSize: 10, fontFamily: "Eczar_600SemiBold" },

  smartCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    paddingTop: 16,
    gap: 6,
    position: "relative",
    overflow: "hidden",
  },
  smartIconWrap: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  smartLabel: { fontSize: 13, fontFamily: "Eczar_600SemiBold" },
  smartDesc:  { fontSize: 10, fontFamily: "Eczar_400Regular", lineHeight: 14, opacity: 0.8 },
  smartCount: {
    alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
    marginTop: 2,
  },
  smartCountText: { fontSize: 11, fontFamily: "Eczar_600SemiBold" },

  importBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    overflow: "hidden",
    position: "relative",
  },
  importIconWrap: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  importTitle: { fontSize: 14, fontFamily: "Eczar_600SemiBold" },
  importSub:   { fontSize: 10, fontFamily: "Eczar_400Regular", lineHeight: 14, opacity: 0.8, marginTop: 2 },
  importBadge: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  importBadgeText: { fontSize: 8, fontFamily: "Eczar_600SemiBold", letterSpacing: 1 },

  skeletonGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 10, gap: 12,
  },
  columnWrapper: { gap: 10, marginBottom: 10 },

  folderCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    padding: 16, alignItems: "center", gap: 8,
    position: "relative", overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    minHeight: 160,
  },
  folderAccentBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 3, borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
  },
  folderIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  folderMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  folderName: { fontSize: 13, fontFamily: "Eczar_600SemiBold", textAlign: "center", lineHeight: 19 },
  folderCount: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 0.5 },
  deleteBtn: { position: "absolute", top: 8, right: 8, padding: 4 },

  fab: {
    position: "absolute", right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dialog: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },
  dialogHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  dialogIconWrap: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  dialogTitle: { flex: 1, fontSize: 18, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.3 },
  dialogClose: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dialogDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: -24 },
  nameInput: {
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontFamily: "Eczar_400Regular",
    borderWidth: 1, borderRadius: 12,
  },
  errorText: { fontSize: 12, fontFamily: "Eczar_400Regular", marginTop: -8 },
  colorLabel: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 2, marginBottom: -4 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  colorDotSelected: { borderWidth: 3, transform: [{ scale: 1.1 }] },
  previewRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  previewIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  previewName: { flex: 1, fontSize: 13, fontFamily: "Eczar_600SemiBold" },
});

/* Folder Detail Sheet styles */
const sheetStyles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35, shadowRadius: 24, elevation: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  sheetAccent: {
    height: 2, marginHorizontal: 16, borderRadius: 2, marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4,
  },
  folderIconWrap: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  sheetTitle: { fontSize: 18, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.3 },
  sheetSub: { fontSize: 11, fontFamily: "Eczar_400Regular", marginTop: 1 },
  renameInput: {
    fontSize: 15, fontFamily: "Eczar_400Regular",
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 2,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  videoRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 10,
  },
  thumb: {
    width: 72, height: 46, borderRadius: 8,
  },
  videoTitle: { fontSize: 12, fontFamily: "Eczar_600SemiBold", lineHeight: 17 },
  videoChannel: { fontSize: 10, fontFamily: "Eczar_400Regular" },
  emptySheet: {
    paddingVertical: 32, paddingHorizontal: 24, alignItems: "center", gap: 10,
  },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 18, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontFamily: "AlegreyaSansSC_700Bold" },
  emptySub: { fontSize: 12, fontFamily: "Eczar_400Regular", textAlign: "center", lineHeight: 18, opacity: 0.8 },
});
