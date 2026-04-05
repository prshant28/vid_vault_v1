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

const PURPLE = "#818cf8";
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
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");
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
      activeOpacity={0.82}
      style={[
        styles.card,
        {
          width: w,
          backgroundColor: colors.card,
          borderColor: isSelected
            ? PURPLE + "88"
            : isDark ? "rgba(129,140,248,0.14)" : colors.border,
        },
        isSelected && { backgroundColor: PURPLE + "16" },
      ]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbPlaceholder, { backgroundColor: isDark ? "#141420" : colors.secondary }]}>
            <View style={[styles.placeholderInner, {
              backgroundColor: isDark ? "rgba(129,140,248,0.08)" : "rgba(129,140,248,0.06)",
              borderColor: "rgba(129,140,248,0.18)",
            }]}>
              <Feather name="film" size={18} color="rgba(129,140,248,0.55)" />
            </View>
          </View>
        )}

        {/* Top overlay bar */}
        <View style={styles.topBar}>
          {/* NEW badge */}
          {isNew && !isSelected && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {/* Selected checkmark */}
          {isSelected && (
            <View style={styles.checkCircle}>
              <Feather name="check" size={9} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }} />
          {/* Favorite button */}
          {!isSelected && (
            <TouchableOpacity
              onPress={handleFavorite}
              style={[styles.favBtn, { backgroundColor: video.isFavorite ? "rgba(239,68,68,0.88)" : "rgba(0,0,0,0.52)" }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="heart" size={11} color="#fff" style={{ opacity: video.isFavorite ? 1 : 0.75 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom overlay: duration + badges */}
        <View style={styles.bottomBar}>
          {/* Notes / AI count badges */}
          <View style={styles.metaBadges}>
            {noteCount > 0 && (
              <View style={styles.metaBadge}>
                <Feather name="edit-3" size={8} color={GREEN} />
                <Text style={[styles.metaBadgeText, { color: GREEN }]}>{noteCount}</Text>
              </View>
            )}
            {aiCount > 0 && (
              <View style={styles.metaBadge}>
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
          <Text style={[styles.channel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.channelName}
          </Text>
        )}
        {video.tags && video.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {video.tags.slice(0, 2).map(tag => (
              <View
                key={tag.id}
                style={[styles.tagPill, {
                  backgroundColor: (tag.color || PURPLE) + "18",
                  borderColor: (tag.color || PURPLE) + "30",
                }]}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color || PURPLE }]} />
                <Text style={[styles.tagText, { color: tag.color || PURPLE }]}>{tag.name}</Text>
              </View>
            ))}
            {video.tags.length > 2 && (
              <View style={[styles.tagPill, { backgroundColor: "rgba(129,140,248,0.08)", borderColor: "rgba(129,140,248,0.18)" }]}>
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
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  thumbWrap: { position: "relative" },
  thumb: { width: "100%", aspectRatio: 16 / 9 },
  thumbPlaceholder: {
    width: "100%", aspectRatio: 16 / 9,
    alignItems: "center", justifyContent: "center",
  },
  placeholderInner: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "flex-start",
    padding: 5,
  },
  newBadge: {
    backgroundColor: PURPLE, borderRadius: 3,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  newBadgeText: { color: "#fff", fontSize: 7, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1 },
  checkCircle: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: PURPLE, alignItems: "center", justifyContent: "center",
  },
  favBtn: { borderRadius: 12, padding: 4 },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    padding: 5,
  },
  metaBadges: { flexDirection: "row", gap: 4 },
  metaBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.72)", borderRadius: 3,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  metaBadgeText: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular" },
  durationBadge: {
    backgroundColor: "rgba(0,0,0,0.72)", borderRadius: 3,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  durationText: { color: "#fff", fontSize: 9, fontFamily: "JetBrainsMono_400Regular" },

  info: { padding: 9, gap: 3 },
  title: { fontSize: 12, fontFamily: "Poppins_600SemiBold", lineHeight: 17 },
  channel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.3 },
  tagsRow: { flexDirection: "row", gap: 4, marginTop: 3, flexWrap: "wrap" },
  tagPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  tagDot: { width: 4, height: 4, borderRadius: 2 },
  tagText: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.3 },
});
