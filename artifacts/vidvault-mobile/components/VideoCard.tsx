import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Video {
  id: string;
  title: string;
  thumbnail?: string | null;
  channelName?: string | null;
  duration?: string | null;
  isFavorite: boolean;
  isNew?: boolean;
  tags?: { id: string; name: string; color?: string | null }[];
}

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  onToggleFavorite: () => void;
  isNew?: boolean;
  cardWidth?: number;
}

export function VideoCard({ video, onPress, onToggleFavorite, isNew, cardWidth }: VideoCardProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");
  // Full-width card: screen minus 10px padding on each side
  const computedCardWidth = screenWidth - 20;
  const w = cardWidth ?? computedCardWidth;

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          width: w,
          backgroundColor: colors.card,
          borderColor: isDark ? "rgba(129,140,248,0.14)" : colors.border,
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? "#141420" : colors.secondary }]}>
            <View style={[styles.placeholderInner, {
              backgroundColor: isDark ? "rgba(129,140,248,0.08)" : "rgba(129,140,248,0.06)",
              borderColor: "rgba(129,140,248,0.18)",
            }]}>
              <Feather name="film" size={20} color="rgba(129,140,248,0.55)" />
            </View>
          </View>
        )}

        {/* Duration badge */}
        {video.duration && (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}

        {/* NEW badge */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        {/* Favorite button */}
        <TouchableOpacity
          onPress={handleFavorite}
          style={[styles.favoriteBtn, { backgroundColor: video.isFavorite ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.55)" }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={12} color="#fff" style={{ opacity: video.isFavorite ? 1 : 0.8 }} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        {video.channelName && (
          <Text style={[styles.channel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.channelName}
          </Text>
        )}
        {video.tags && video.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {video.tags.slice(0, 2).map((tag) => (
              <View
                key={tag.id}
                style={[styles.tagPill, {
                  backgroundColor: (tag.color || "#818cf8") + "18",
                  borderColor: (tag.color || "#818cf8") + "28",
                }]}
              >
                <Text style={[styles.tagText, { color: tag.color || "#818cf8" }]}>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  thumbnailContainer: { position: "relative" },
  thumbnail: { width: "100%", aspectRatio: 16 / 9 },
  thumbnailPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderInner: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  duration: {
    position: "absolute", bottom: 5, right: 5,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2,
  },
  durationText: { color: "#fff", fontSize: 9, fontFamily: "JetBrainsMono_400Regular" },
  newBadge: {
    position: "absolute", top: 5, left: 5,
    backgroundColor: "#818cf8",
    borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2,
  },
  newBadgeText: { color: "#fff", fontSize: 8, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1 },
  favoriteBtn: {
    position: "absolute", top: 5, right: 5,
    borderRadius: 12, padding: 5,
  },
  info: { padding: 10, gap: 4 },
  title: { fontSize: 13, fontFamily: "Poppins_600SemiBold", lineHeight: 19 },
  channel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.3 },
  tagsRow: { flexDirection: "row", gap: 4, marginTop: 2, flexWrap: "wrap" },
  tagPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  tagText: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
});
