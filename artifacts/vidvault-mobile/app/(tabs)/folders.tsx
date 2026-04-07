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

const FOLDER_COLORS = ["#6366f1", "#2563eb", "#059669", "#d97706", "#dc2626", "#db2777", "#0891b2"];

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

export default function FoldersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const dialogBtnWidth = Math.min(width - 88, 432);

  const [showModal, setShowModal]         = useState(false);
  const [folderName, setFolderName]       = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [createError, setCreateError]     = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["folders"],
    queryFn: () => api.listFolders(),
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />
      <TopAppBar
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
        <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>//ORGANIZE</Text>
        <Text style={[styles.subTitle, { color: colors.foreground }]}>Folders</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={160} style={{ width: (width - 32) / 2 }} borderRadius={colors.radius} />
          ))}
        </View>
      ) : folders.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No folders yet"
          subtitle="Create folders to organize your video library"
          actionLabel="Create Folder"
          onAction={openModal}
          code="00"
        />
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item, index }) => (
            <FolderCard
              folder={item}
              delay={index * 60}
              onPress={() => router.push(`/folder/${item.id}?name=${encodeURIComponent(item.name)}`)}
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
            {/* Etch highlight */}
            <LinearGradient
              colors={["rgba(255,255,255,0.06)", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: colors.radius }]}
              pointerEvents="none"
            />

            {/* Header */}
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconWrap, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "35" }]}>
                <Feather name="folder-plus" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.dialogTitle, { color: colors.foreground }]}>New Folder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.dialogClose}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={[styles.dialogDivider, { backgroundColor: colors.border }]} />

            {/* Name input */}
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

            {/* Color picker */}
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

            {/* Preview */}
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

            {/* Create button */}
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
  subLabel: { fontSize: 10, fontFamily: "Poppins_400Regular", letterSpacing: 2.5, marginBottom: 6 },
  subTitle: { fontSize: 40, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1, lineHeight: 48 },

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
  folderName: { fontSize: 13, fontFamily: "Poppins_600SemiBold", textAlign: "center", lineHeight: 19 },
  folderCount: { fontSize: 10, fontFamily: "Poppins_400Regular", letterSpacing: 0.5 },
  deleteBtn: { position: "absolute", top: 8, right: 8, padding: 4 },

  fab: {
    position: "absolute", right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },

  /* Centered modal */
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
  dialogHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  dialogIconWrap: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  dialogTitle: {
    flex: 1, fontSize: 18, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.3,
  },
  dialogClose: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  dialogDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: -24 },

  nameInput: {
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontFamily: "Poppins_400Regular",
    borderWidth: 1, borderRadius: 12,
  },
  errorText: { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: -8 },

  colorLabel: {
    fontSize: 9, fontFamily: "Poppins_400Regular", letterSpacing: 2,
    marginBottom: -4,
  },
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
  previewName: { flex: 1, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
});
