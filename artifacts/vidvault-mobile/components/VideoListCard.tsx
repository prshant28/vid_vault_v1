import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
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
}

interface VideoListCardProps {
  video: Video;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

export function VideoListCard({ video, onPress, onToggleFavorite }: VideoListCardProps) {
  const colors = useColors();
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: isDark ? "rgba(139,92,246,0.12)" : colors.border,
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailWrapper}>
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={[styles.thumbnail, { borderRadius: colors.radius - 2 }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbPlaceholder,
              {
                borderRadius: colors.radius - 2,
                backgroundColor: isDark ? "#1a1a22" : colors.secondary,
              },
            ]}
          >
            <Feather
              name="play-circle"
              size={22}
              color={isDark ? "rgba(139,92,246,0.5)" : colors.mutedForeground}
            />
          </View>
        )}
        {video.duration && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{video.duration}</Text>
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
      </View>

      {/* Favorite button */}
      {onToggleFavorite && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleFavorite();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.favBtn}
        >
          <Feather
            name="heart"
            size={16}
            color={video.isFavorite ? "#ef4444" : colors.mutedForeground}
          />
        </TouchableOpacity>
      )}
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
  thumbnailWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  thumbnail: {
    width: 96,
    height: 54,
  },
  thumbPlaceholder: {
    width: 96,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    bottom: 3,
    right: 3,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  channel: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 0.3,
  },
  favBtn: {
    padding: 4,
    flexShrink: 0,
  },
});
