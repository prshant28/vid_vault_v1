import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { Skeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";

const FOLDER_COLORS = ["#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#db2777", "#0891b2"];

function FolderCard({ folder, onPress, onDelete }: {
  folder: { id: string; name: string; color?: string | null; videoCount: number };
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const color = folder.color || colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.folderCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}
    >
      <View style={[styles.folderIcon, { backgroundColor: color + "20" }]}>
        <Feather name="folder" size={28} color={color} />
      </View>
      <Text style={[styles.folderName, { color: colors.foreground }]} numberOfLines={2}>{folder.name}</Text>
      <Text style={[styles.folderCount, { color: colors.mutedForeground }]}>
        {folder.videoCount} {folder.videoCount === 1 ? "video" : "videos"}
      </Text>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="trash-2" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FoldersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [createError, setCreateError] = useState("");

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: Error) => setCreateError(e.message || "Failed to create folder"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const handleDelete = (folder: { id: string; name: string }) => {
    Alert.alert("Delete Folder", `Delete "${folder.name}"? Videos inside will not be deleted.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(folder.id) },
    ]);
  };

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const folders = data?.folders ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerEyebrow, { color: colors.mutedForeground }]}>ORGANIZE</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Folders</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={140} width="47%" borderRadius={colors.radius} />
          ))}
        </View>
      ) : folders.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No folders yet"
          subtitle="Create folders to organize your video library"
          actionLabel="Create Folder"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <FolderCard
              folder={item}
              onPress={() => router.push(`/folder/${item.id}?name=${encodeURIComponent(item.name)}`)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: botInset + 90 }]}
        activeOpacity={0.85}
      >
        <Feather name="folder-plus" size={22} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderRadius: colors.radius, paddingBottom: botInset + 24 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New Folder</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <TextInput
            value={folderName}
            onChangeText={(t) => { setFolderName(t); setCreateError(""); }}
            placeholder="Folder name"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.nameInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
            autoFocus
          />
          <View style={styles.colorRow}>
            {FOLDER_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 0, borderColor: colors.foreground }]}
              />
            ))}
          </View>
          {createError ? <Text style={[styles.createError, { color: colors.destructive }]}>{createError}</Text> : null}
          <TouchableOpacity
            onPress={() => {
              if (!folderName.trim()) { setCreateError("Folder name is required"); return; }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
            style={[styles.createBtn, { backgroundColor: createMutation.isPending ? colors.primary + "80" : colors.primary, borderRadius: colors.radius }]}
            activeOpacity={0.85}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Create Folder</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Raleway_900Black",
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  folderCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  folderName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 18,
  },
  folderCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    padding: 20,
    paddingTop: 12,
    gap: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  nameInput: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  createError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  createBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
