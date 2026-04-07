import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";

interface Tag { id: string; name: string; color?: string | null }

interface Video {
  id: string;
  title: string;
  thumbnail?: string | null;
  channelName?: string | null;
  duration?: string | null;
  isFavorite: boolean;
  isNew?: boolean;
  tags?: Tag[];
  notes?: any[];
  aiOutputs?: any[];
  notesCount?: number;
  aiOutputsCount?: number;
  folderId?: string | null;
}

interface VideoCardProps {
  video: Video;
  onPress: () => void;
  onToggleFavorite: () => void;
  onLongPress?: () => void;
  isNew?: boolean;
  isSelected?: boolean;
  cardWidth?: number;
}

export function VideoCard({ video, onPress, onToggleFavorite, onLongPress, isNew, isSelected, cardWidth }: VideoCardProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const w = cardWidth ?? (screenWidth / 2) - 15;

  const noteCount = video.notesCount ?? video.notes?.length ?? 0;
  const aiCount   = video.aiOutputsCount ?? video.aiOutputs?.length ?? 0;

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={380}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          width: w,
          backgroundColor: colors.card,
          borderColor: isSelected ? PURPLE + "70" : colors.border,
          shadowColor: "#000",
        },
        isSelected && { borderColor: PURPLE + "80", backgroundColor: PURPLE + "12" },
      ]}
    >
      {/* Etch overlay on card */}
      <LinearGradient
        colors={["rgba(255,255,255,0.05)", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
        pointerEvents="none"
      />

      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbPlaceholder, { backgroundColor: colors.muted }]}>
            <View style={[styles.placeholderInner, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "2e" }]}>
              <Feather name="film" size={20} color={colors.primary + "88"} />
            </View>
          </View>
        )}

        {/* Bottom gradient over thumbnail */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.thumbGradient}
          pointerEvents="none"
        />

        {/* Top overlay bar */}
        <View style={styles.topBar}>
          {isNew && !isSelected && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.checkCircle}>
              <Feather name="check" size={9} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }} />
          {!isSelected && (
            <TouchableOpacity
              onPress={handleFavorite}
              style={[styles.favBtn, {
                backgroundColor: video.isFavorite ? "rgba(239,68,68,0.85)" : "rgba(0,0,0,0.55)",
                borderColor: video.isFavorite ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)",
              }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="heart" size={11} color="#fff" style={{ opacity: video.isFavorite ? 1 : 0.8 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom overlay: duration + badges */}
        <View style={styles.bottomBar}>
          <View style={styles.metaBadges}>
            {noteCount > 0 && (
              <View style={[styles.metaBadge, { borderColor: GREEN + "30" }]}>
                <Feather name="edit-3" size={8} color={GREEN} />
                <Text style={[styles.metaBadgeText, { color: GREEN }]}>{noteCount}</Text>
              </View>
            )}
            {aiCount > 0 && (
              <View style={[styles.metaBadge, { borderColor: CYAN + "30" }]}>
                <Feather name="cpu" size={8} color={CYAN} />
                <Text style={[styles.metaBadgeText, { color: CYAN }]}>{aiCount}</Text>
              </View>
            )}
          </View>
          {video.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{video.duration}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        {video.channelName && (
          <Text style={[styles.channel, { color: "#505060" }]} numberOfLines={1}>
            {video.channelName}
          </Text>
        )}
        {video.tags && video.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {video.tags.slice(0, 2).map(tag => (
              <View
                key={tag.id}
                style={[styles.tagPill, {
                  backgroundColor: (tag.color || PURPLE) + "15",
                  borderColor: (tag.color || PURPLE) + "28",
                }]}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color || PURPLE }]} />
                <Text style={[styles.tagText, { color: tag.color || PURPLE }]}>{tag.name}</Text>
              </View>
            ))}
            {video.tags.length > 2 && (
              <View style={[styles.tagPill, { backgroundColor: PURPLE + "0f", borderColor: PURPLE + "20" }]}>
                <Text style={[styles.tagText, { color: PURPLE }]}>+{video.tags.length - 2}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  thumbWrap: { position: "relative" },
  thumb: { width: "100%", aspectRatio: 16 / 9 },
  thumbPlaceholder: {
    width: "100%", aspectRatio: 16 / 9,
    alignItems: "center", justifyContent: "center",
  },
  placeholderInner: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  thumbGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
  },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "flex-start",
    padding: 6,
  },
  newBadge: {
    backgroundColor: PURPLE, borderRadius: 3,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  newBadgeText: { color: "#fff", fontSize: 7, fontWeight: "700", letterSpacing: 0.8 },
  checkCircle: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: PURPLE, alignItems: "center", justifyContent: "center",
  },
  favBtn: {
    borderRadius: 12, padding: 5,
    borderWidth: 1,
  },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    padding: 6,
  },
  metaBadges: { flexDirection: "row", gap: 4 },
  metaBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  metaBadgeText: { fontSize: 8, fontWeight: "500" },
  durationBadge: {
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  durationText: { color: "#fff", fontSize: 9, fontWeight: "500" },

  info: { padding: 10, gap: 3 },
  title: { fontSize: 12, fontFamily: "Poppins_600SemiBold", lineHeight: 17 },
  channel: { fontSize: 9, fontFamily: "Poppins_400Regular", letterSpacing: 0.1 },
  tagsRow: { flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap" },
  tagPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  tagDot: { width: 4, height: 4, borderRadius: 2 },
  tagText: { fontSize: 9, fontFamily: "Poppins_400Regular" },
});
