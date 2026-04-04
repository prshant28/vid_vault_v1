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
  tags?: { id: string; name: string; color?: string | null }[];
}

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export function VideoCard({ video, onPress, onToggleFavorite }: VideoCardProps) {
  const colors = useColors();
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card, borderColor: isDark ? "rgba(139,92,246,0.12)" : colors.border }]}
    >
      <View style={styles.thumbnailContainer}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.secondary }]}>
            <Feather name="film" size={28} color={isDark ? "rgba(139,92,246,0.4)" : colors.mutedForeground} />
          </View>
        )}
        {video.duration && (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}
        <TouchableOpacity onPress={handleFavorite} style={styles.favoriteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather
            name="heart"
            size={15}
            color={video.isFavorite ? "#ef4444" : "#ffffff"}
            style={video.isFavorite ? { opacity: 1 } : { opacity: 0.75 }}
          />
        </TouchableOpacity>
      </View>
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
    borderRadius: 4,
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
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
  },
  favoriteBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 3,
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
  },
  channel: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 0.3,
  },
});
