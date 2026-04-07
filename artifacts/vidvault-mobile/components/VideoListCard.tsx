import React from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useColors";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const RED    = "#ef4444";

interface Tag { id: string; name: string; color?: string | null }

interface Video {
  id: string;
  title: string;
  thumbnail?: string | null;
  channelName?: string | null;
  duration?: string | null;
  isFavorite: boolean;
  isWatched?: boolean;
  tags?: Tag[];
  notes?: any[];
  aiOutputs?: any[];
  notesCount?: number;
  aiOutputsCount?: number;
  folderId?: string | null;
}

interface VideoListCardProps {
  video: Video;
  onPress: () => void;
  onToggleFavorite?: () => void;
  onToggleWatched?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
}

export function VideoListCard({ video, onPress, onToggleFavorite, onToggleWatched, onLongPress, isSelected }: VideoListCardProps) {
  const { colors, isDark } = useTheme();
  const noteCount = video.notesCount ?? video.notes?.length ?? 0;
  const aiCount   = video.aiOutputsCount ?? video.aiOutputs?.length ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={380}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? PURPLE + "16" : colors.card,
          borderRadius: 12,
          borderColor: isSelected ? PURPLE + "60" : colors.border,
          ...(Platform.OS === "android" ? { elevation: isSelected ? 6 : 2 } : {}),
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="film" size={18} color={colors.primary + "88"} />
          </View>
        )}
        {video.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}
        {video.isWatched && !isSelected && (
          <View style={styles.watchedBadge}>
            <Feather name="check-circle" size={12} color={GREEN} />
          </View>
        )}
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.checkCircle}>
              <Feather name="check" size={10} color="#fff" />
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        {video.channelName && (
          <Text style={[styles.channel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.channelName}
          </Text>
        )}

        {/* Meta badges row */}
        <View style={styles.metaRow}>
          {noteCount > 0 && (
            <View style={styles.metaBadge}>
              <Feather name="edit-3" size={8} color={GREEN} />
              <Text style={[styles.metaText, { color: GREEN }]}>{noteCount}</Text>
            </View>
          )}
          {aiCount > 0 && (
            <View style={styles.metaBadge}>
              <Feather name="cpu" size={8} color={CYAN} />
              <Text style={[styles.metaText, { color: CYAN }]}>{aiCount}</Text>
            </View>
          )}
          {video.tags && video.tags.length > 0 && (
            <View style={styles.metaBadge}>
              <Feather name="tag" size={8} color={PURPLE} />
              <Text style={[styles.metaText, { color: PURPLE }]}>{video.tags.length}</Text>
            </View>
          )}
        </View>

        {/* Tag pills */}
        {video.tags && video.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {video.tags.slice(0, 3).map(tag => (
              <View
                key={tag.id}
                style={[styles.tagPill, {
                  backgroundColor: (tag.color || PURPLE) + "18",
                  borderColor: (tag.color || PURPLE) + "28",
                }]}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color || PURPLE }]} />
                <Text style={[styles.tagText, { color: tag.color || PURPLE }]}>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Favorite / watched / action column */}
      <View style={styles.actions}>
        {onToggleWatched && !isSelected && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleWatched();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.favBtn, video.isWatched && { backgroundColor: GREEN + "18" }]}
          >
            <Feather name="check-circle" size={15} color={video.isWatched ? GREEN : colors.mutedForeground} />
          </TouchableOpacity>
        )}
        {onToggleFavorite && !isSelected && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleFavorite();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.favBtn,
              video.isFavorite && { backgroundColor: RED + "18" },
            ]}
          >
            <Feather name="heart" size={15} color={video.isFavorite ? RED : colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <Feather name="chevron-right" size={13} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  thumbWrap: { position: "relative", flexShrink: 0 },
  thumb: { width: 100, height: 58, borderRadius: 5 },
  thumbPlaceholder: {
    width: 100, height: 58, borderRadius: 5,
    alignItems: "center", justifyContent: "center",
  },
  durationBadge: {
    position: "absolute", bottom: 3, right: 3,
    backgroundColor: "rgba(0,0,0,0.72)", borderRadius: 2,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  durationText: { color: "#fff", fontSize: 9, fontFamily: "Poppins_400Regular" },
  watchedBadge: {
    position: "absolute", top: 3, left: 3,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10,
    padding: 2,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: PURPLE, alignItems: "center", justifyContent: "center",
  },

  content: { flex: 1, gap: 3 },
  title:   { fontSize: 13, fontFamily: "Poppins_600SemiBold", lineHeight: 18 },
  channel: { fontSize: 9, fontFamily: "Poppins_400Regular", letterSpacing: 0.3 },

  metaRow: { flexDirection: "row", gap: 8, marginTop: 1 },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 9, fontFamily: "Poppins_400Regular" },

  tagsRow: { flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 3 },
  tagPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  tagDot:  { width: 4, height: 4, borderRadius: 2 },
  tagText: { fontSize: 8, fontFamily: "Poppins_400Regular", letterSpacing: 0.3 },

  actions: { flexShrink: 0, alignItems: "center", gap: 8 },
  favBtn:  { padding: 5, borderRadius: 6 },
});
