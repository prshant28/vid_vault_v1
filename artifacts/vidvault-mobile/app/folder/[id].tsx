import React from "react";
import {
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { VideoCard } from "@/components/VideoCard";
import { VideoCardSkeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { FlatList, TouchableOpacity } from "react-native";

export default function FolderDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["videos", "folder", id],
    queryFn: () => api.listVideos({ folderId: id, limit: 50 }),
    enabled: !!id,
  });

  const favMutation = useMutation({
    mutationFn: (videoId: string) => api.toggleFavorite(videoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos", "folder", id] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const videos = data?.videos ?? [];
  const folderName = decodeURIComponent(name || "Folder");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GridBackground />
      <TopAppBar
        showBack
        title={folderName}
      />

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
          icon="folder"
          title="Empty folder"
          subtitle="Add videos from your library to this folder"
        />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 24, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              onPress={() => router.push(`/video/${item.id}`)}
              onToggleFavorite={() => favMutation.mutate(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 12,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
});
