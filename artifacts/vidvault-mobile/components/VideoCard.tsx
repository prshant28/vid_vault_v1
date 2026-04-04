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
      activeOpacity={0.88}
      style={[
        styles.card,
        {
          width: w,
          backgroundColor: colors.card,
          borderColor: isDark ? "rgba(139,92,246,0.12)" : colors.border,
        },
      ]}
    >
      {/* Thumbnail section */}
      <View style={styles.thumbnailContainer}>
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? "#1a1a22" : "#e8e4ff" }]}>
            <Feather name="film" size={26} color={isDark ? "rgba(139,92,246,0.3)" : "rgba(124,58,237,0.25)"} />
          </View>
        )}

        {/* Gradient overlay */}
        <View style={styles.gradientOverlay} />

        {/* Top-left: favorite button */}
        <TouchableOpacity
          onPress={handleFavorite}
          style={[styles.favBtn, { backgroundColor: video.isFavorite ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.55)" }]}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Feather
            name="star"
            size={12}
            color={video.isFavorite ? "#fff" : "rgba(255,255,255,0.75)"}
          />
        </TouchableOpacity>

        {/* Top-right: NEW badge */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        {/* Center: play button */}
        <View style={styles.playOverlay}>
          <View style={styles.playBtn}>
            <Feather name="play" size={16} color="#fff" />
          </View>
        </View>

        {/* Bottom: duration */}
        {video.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}
      </View>

      {/* Info section */}
      <View style={styles.infoSection}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        {video.channelName && (
          <Text style={[styles.channel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.channelName}
          </Text>
        )}

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleFavorite}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Feather
              name="heart"
              size={13}
              color={video.isFavorite ? "#ef4444" : colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Feather name="more-horizontal" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPress} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Feather name="external-link" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  thumbnailContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
    backgroundColor: "#111",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  favBtn: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 26,
    height: 26,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    position: "absolute",
    top: 6,
    right: 6,
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
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  durationBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
  },
  infoSection: {
    padding: 10,
    gap: 3,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
  channel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
});
