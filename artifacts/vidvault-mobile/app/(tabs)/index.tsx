import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { api } from "@/services/api";
import type { Video, Stats } from "@/types/api";
import { Skeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { VideoCard } from "@/components/VideoCard";
import { SaveToVaultModal } from "@/components/SaveToVaultModal";

const { width: SCREEN_W } = Dimensions.get("window");
const RECENT_CARD_W = SCREEN_W * 0.72;

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const STAT_CONFIG = [
  { label: "Total Videos", code: "01", icon: "film" as FeatherIconName, accent: "#818cf8", key: "totalVideos" },
  { label: "Folders", code: "02", icon: "folder" as FeatherIconName, accent: "#06b6d4", key: "totalFolders" },
  { label: "Tags Used", code: "03", icon: "tag" as FeatherIconName, accent: "#10b981", key: "totalTags" },
];

function EtchedStatCard({
  label, code, value, icon, accent,
}: { label: string; code: string; value: number; icon: FeatherIconName; accent: string }) {
  const colors = useColors();
  return (
    <View style={[styles.etchedCard, { backgroundColor: colors.card, borderColor: accent + "20" }]}>
      <View style={styles.etchedTop}>
        <Text style={[styles.etchedCode, { color: colors.mutedForeground }]}>{code}</Text>
        <View style={[styles.etchedIconBox, { backgroundColor: accent + "15", borderColor: accent + "30" }]}>
          <Feather name={icon} size={14} color={accent} />
        </View>
      </View>
      <Text style={[styles.etchedLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.etchedValue, { color: colors.foreground }]}>
        {value.toString().padStart(2, "0")}
      </Text>
      <View style={[styles.etchedGlow, { backgroundColor: accent, pointerEvents: "none" }]} />
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const favoriteMutation = useMutation({
    mutationFn: (videoId: string) => api.toggleFavorite(videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stats"] }),
  });

  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const recentVideos = stats?.recentVideos ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />
      <TopAppBar
        rightAction={
          <AppButton
            label="SAVE"
            icon="plus"
            size="sm"
            variant="primary"
            onPress={() => setShowSaveModal(true)}
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botInset + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[styles.greetingLabel, { color: colors.mutedForeground }]}>//SYSTEM_STATUS</Text>
          <Text style={[styles.greetingName, { color: colors.foreground }]}>
            {displayName}{"'"}s Vault
          </Text>
          <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
            KNOWLEDGE_BASE // ACTIVE
          </Text>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {[
            { icon: "cpu" as FeatherIconName, label: "AI Studio", accent: "#818cf8", onPress: () => router.push("/(tabs)/ai-studio") },
            { icon: "folder" as FeatherIconName, label: "Folders", accent: "#06b6d4", onPress: () => router.push("/(tabs)/folders") },
            { icon: "heart" as FeatherIconName, label: "Favorites", accent: "#ec4899", onPress: () => router.push("/(tabs)/videos") },
          ].map((a) => (
            <TouchableOpacity key={a.label} onPress={a.onPress} activeOpacity={0.75}
              style={[styles.quickBtn, { backgroundColor: a.accent + "12", borderColor: a.accent + "30" }]}
            >
              <View style={[styles.quickBtnIcon, { backgroundColor: a.accent + "18" }]}>
                <Feather name={a.icon} size={15} color={a.accent} />
              </View>
              <Text style={[styles.quickBtnLabel, { color: a.accent }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats — 3-col row */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VAULT OVERVIEW</Text>
            <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
          </View>
          {isLoading ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={100} style={{ flex: 1 }} borderRadius={4} />)}
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              {STAT_CONFIG.map((cfg) => (
                <View key={cfg.code} style={{ flex: 1 }}>
                  <EtchedStatCard
                    code={cfg.code}
                    label={cfg.label}
                    icon={cfg.icon}
                    accent={cfg.accent}
                    value={(stats as any)?.[cfg.key] ?? 0}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recently Added */}
        <View style={styles.sectionNoHPad}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//RECENTLY_SAVED</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest Captures</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>VIEW ALL →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={180} width={RECENT_CARD_W} borderRadius={4} />)}
            </ScrollView>
          ) : recentVideos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              decelerationRate="fast"
              snapToInterval={RECENT_CARD_W + 12}
              snapToAlignment="start"
            >
              {recentVideos.slice(0, 8).map((video: Video, index: number) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  cardWidth={RECENT_CARD_W}
                  isNew={index === 0}
                  onPress={() => router.push(`/video/${video.id}`)}
                  onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <EmptyState
                icon="film"
                title="Vault is empty"
                subtitle="Save your first YouTube video to get started"
                actionLabel="Save Video"
                onAction={() => setShowSaveModal(true)}
                code="00"
              />
            </View>
          )}
        </View>

        {/* Favorites */}
        {stats?.favoriteVideos && stats.favoriteVideos.length > 0 && (
          <View style={[styles.sectionNoHPad, { marginTop: 8 }]}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>//STARRED</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              decelerationRate="fast"
              snapToInterval={RECENT_CARD_W + 12}
              snapToAlignment="start"
            >
              {stats.favoriteVideos.slice(0, 5).map((video: Video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  cardWidth={RECENT_CARD_W}
                  onPress={() => router.push(`/video/${video.id}`)}
                  onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <SaveToVaultModal visible={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4,
  },
  saveBtnLabel: { color: "#fff", fontSize: 10, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.5 },

  quickActions: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 20, paddingBottom: 20,
  },
  quickBtn: {
    flex: 1, alignItems: "center", gap: 8,
    paddingVertical: 14, borderRadius: 10, borderWidth: 1,
  },
  quickBtnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  quickBtnLabel: { fontSize: 10, fontFamily: "Poppins_600SemiBold", letterSpacing: 0.2 },

  greeting: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  greetingLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2, marginBottom: 6 },
  greetingName: { fontSize: 26, fontFamily: "Poppins_700Bold", letterSpacing: -0.5, lineHeight: 34, marginBottom: 2 },
  greetingSub: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5 },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionNoHPad: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-between", marginBottom: 14, gap: 12,
  },
  sectionLine: { flex: 1, height: 1, marginBottom: 4 },
  sectionLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2 },
  sectionMicro: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2, marginBottom: 3 },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", letterSpacing: -0.3 },
  viewAll: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5, paddingBottom: 3 },

  etchedCard: { padding: 12, borderWidth: 1, borderRadius: 8, overflow: "hidden", minHeight: 90 },
  etchedTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
  etchedIconBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  etchedCode: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5, marginTop: 2 },
  etchedLabel: { fontSize: 9, fontFamily: "Poppins_500Medium", marginBottom: 2, lineHeight: 13 },
  etchedValue: { fontSize: 32, fontFamily: "Poppins_900Black", lineHeight: 38, letterSpacing: -1.5 },
  etchedGlow: {
    position: "absolute", bottom: -20, right: -20,
    width: 60, height: 60, borderRadius: 30, opacity: 0.08,
  },
});
