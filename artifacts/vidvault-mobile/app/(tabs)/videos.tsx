import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
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

interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

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
    },
  });

  const addMutation = useMutation({
    mutationFn: (url: string) => api.addVideo(url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setShowAddModal(false);
      setAddUrl("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: Error) => {
      setAddError(e.message || "Failed to add video");
    },
  });

  const handleAdd = useCallback(async () => {
    if (!addUrl.trim()) {
      setAddError("Please paste a YouTube URL");
      return;
    }
    setAddError("");
    setAddLoading(true);
    try {
      await addMutation.mutateAsync(addUrl.trim());
    } finally {
      setAddLoading(false);
    }
  }, [addUrl, addMutation]);

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const videos = data?.videos ?? [];
  const tags: Tag[] = tagsData?.tags ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerEyebrow, { color: colors.mutedForeground }]}>VIDEO_VAULT</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Library</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search videos..." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          <TouchableOpacity
            onPress={() => { setShowFavorites(false); setSelectedTagId(null); }}
            style={[styles.chip, { backgroundColor: !showFavorites && !selectedTagId ? colors.primary : colors.secondary, borderRadius: 100 }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: !showFavorites && !selectedTagId ? colors.primaryForeground : colors.foreground }]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowFavorites(!showFavorites); setSelectedTagId(null); }}
            style={[styles.chip, { backgroundColor: showFavorites ? colors.primary : colors.secondary, borderRadius: 100 }]}
            activeOpacity={0.8}
          >
            <Feather name="heart" size={12} color={showFavorites ? colors.primaryForeground : colors.foreground} style={{ marginRight: 4 }} />
            <Text style={[styles.chipText, { color: showFavorites ? colors.primaryForeground : colors.foreground }]}>Favorites</Text>
          </TouchableOpacity>

          {tags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              onPress={() => {
                setSelectedTagId(selectedTagId === tag.id ? null : tag.id);
                setShowFavorites(false);
              }}
              style={[styles.chip, {
                backgroundColor: selectedTagId === tag.id ? (tag.color || colors.primary) : colors.secondary,
                borderRadius: 100,
              }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: selectedTagId === tag.id ? "#fff" : colors.foreground }]}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: "48%" }}>
              <VideoCardSkeleton />
            </View>
          ))}
        </View>
      ) : videos.length === 0 ? (
        <EmptyState
          icon="film"
          title={search ? "No results found" : "No videos yet"}
          subtitle={search ? "Try a different search term" : "Tap the + button to save your first YouTube video"}
          actionLabel={search ? undefined : "Add Video"}
          onAction={search ? undefined : () => setShowAddModal(true)}
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
          renderItem={({ item }: { item: { id: string; title: string; thumbnail?: string | null; channelName?: string | null; duration?: string | null; isFavorite: boolean } }) => (
            <VideoCard
              video={item}
              onPress={() => router.push(`/video/${item.id}`)}
              onToggleFavorite={() => favMutation.mutate(item.id)}
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: botInset + 90 }]}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderRadius: colors.radius, paddingBottom: botInset + 24 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add YouTube Video</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
              Paste a YouTube URL to save it to your library
            </Text>
            <TextInput
              value={addUrl}
              onChangeText={(t) => { setAddUrl(t); setAddError(""); }}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.urlInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
            />
            {addError ? (
              <Text style={[styles.addError, { color: colors.destructive }]}>{addError}</Text>
            ) : null}
            <TouchableOpacity
              onPress={handleAdd}
              disabled={addLoading}
              style={[styles.addBtn, { backgroundColor: addLoading ? colors.primary + "80" : colors.primary, borderRadius: colors.radius }]}
              activeOpacity={0.85}
            >
              {addLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addBtnText}>Save Video</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  controls: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    padding: 20,
    paddingTop: 12,
    gap: 14,
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
  sheetSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  urlInput: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  addError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
