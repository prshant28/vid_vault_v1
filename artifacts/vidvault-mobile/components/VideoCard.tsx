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

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}
    >
      <View style={styles.thumbnailContainer}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={[styles.thumbnail, { borderRadius: colors.radius - 2 }]} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { borderRadius: colors.radius - 2, backgroundColor: colors.secondary }]}>
            <Feather name="film" size={28} color={colors.mutedForeground} />
          </View>
        )}
        {video.duration && (
          <View style={[styles.duration, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        )}
        <TouchableOpacity onPress={handleFavorite} style={styles.favoriteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather
            name="heart"
            size={16}
            color={video.isFavorite ? "#ef4444" : "#ffffff"}
            style={video.isFavorite ? { opacity: 1 } : { opacity: 0.8 }}
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
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  favoriteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 16,
    padding: 5,
  },
  info: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    marginBottom: 4,
  },
  channel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
