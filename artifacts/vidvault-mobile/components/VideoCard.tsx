import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

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
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");
  const w = cardWidth ?? CARD_WIDTH;

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
          borderRadius: colors.radius,
          borderColor: isDark ? "rgba(139,92,246,0.12)" : colors.border,
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={[styles.thumbnail, { borderRadius: colors.radius - 2 }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbnailPlaceholder,
              {
                borderRadius: colors.radius - 2,
                backgroundColor: isDark ? "#1a1a22" : colors.secondary,
              },
            ]}
          >
            <Feather name="film" size={28} color={isDark ? "rgba(139,92,246,0.4)" : colors.mutedForeground} />
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
          style={[
            styles.favoriteBtn,
            { backgroundColor: video.isFavorite ? "rgba(239,68,68,0.8)" : "rgba(0,0,0,0.5)" },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather
            name="heart"
            size={14}
            color="#fff"
            style={{ opacity: video.isFavorite ? 1 : 0.85 }}
          />
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  thumbnailContainer: {
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  thumbnailPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  duration: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
  },
  newBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#8b5cf6",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1,
  },
  favoriteBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    borderRadius: 14,
    padding: 5,
  },
  info: {
    padding: 10,
    gap: 3,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
    marginBottom: 2,
  },
  channel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 0.4,
  },
});
