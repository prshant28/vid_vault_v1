import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Platform, Alert, Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";

const CYAN   = "#06b6d4";
const PURPLE = "#6366f1";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";

const QUEUE_KEY = "vv_watch_later_v1";

interface WatchItem {
  id: string;
  url: string;
  youtubeId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  addedAt: number;
  saving?: boolean;
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function cdnThumb(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
}

async function loadQueue(): Promise<WatchItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function saveQueue(items: WatchItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function QueueCard({ item, onSave, onRemove }: { item: WatchItem; onSave: () => void; onRemove: () => void }) {
  const colors = useColors();
  const date = new Date(item.addedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: 40, height: 0 }}
      transition={{ type: "timing", duration: 260 }}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Cyan accent left bar */}
      <View style={[styles.cardBar, { backgroundColor: CYAN }]} />

      <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
        {item.channelName ? (
          <Text style={[styles.cardChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.channelName}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          <View style={[styles.datePill, { backgroundColor: CYAN + "10", borderColor: CYAN + "25" }]}>
            <Feather name="clock" size={8} color={CYAN} />
            <Text style={[styles.datePillText, { color: CYAN }]}>Added {date}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onSave}
            disabled={item.saving}
            style={[styles.saveBtn, { backgroundColor: item.saving ? colors.secondary : GREEN }]}
            activeOpacity={0.8}
          >
            <Feather name={item.saving ? "loader" : "download"} size={12} color="#fff" />
            <Text style={styles.saveBtnText}>{item.saving ? "Saving…" : "Save to Vault"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onRemove}
            style={[styles.removeBtn, { borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <Feather name="trash-2" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
}

export default function WatchLaterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [queue, setQueue] = useState<WatchItem[]>([]);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadQueue().then((q) => { setQueue(q); setLoaded(true); });
  }, []);

  const persist = useCallback((items: WatchItem[]) => {
    setQueue(items);
    saveQueue(items);
  }, []);

  const addUrl = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const ytId = extractYouTubeId(trimmed);
    if (!ytId) {
      setFetchError("Paste a valid YouTube URL (youtube.com/watch?v=…)");
      return;
    }
    if (queue.some((q) => q.youtubeId === ytId)) {
      setFetchError("Already in your Watch Later queue");
      return;
    }
    setFetching(true);
    setFetchError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let title = "YouTube Video";
    let channelName = "";
    let thumbnail = cdnThumb(ytId);
    let duration: number | null = null;

    try {
      const meta = await api.previewVideo(trimmed);
      if (meta.title) title = meta.title;
      if (meta.channelName) channelName = meta.channelName;
      if (meta.thumbnail) thumbnail = meta.thumbnail;
      if (meta.duration) duration = meta.duration;
    } catch {}

    const item: WatchItem = {
      id: `${Date.now()}_${ytId}`,
      url: trimmed,
      youtubeId: ytId,
      title,
      channelName,
      thumbnail,
      addedAt: Date.now(),
    };
    persist([item, ...queue]);
    setUrl("");
    setFetching(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [url, queue, persist]);

  const removeItem = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    persist(queue.filter((q) => q.id !== id));
  }, [queue, persist]);

  const saveToVault = useCallback(async (item: WatchItem) => {
    setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, saving: true } : q));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.addVideo(item.url);
      const updated = queue.filter((q) => q.id !== item.id);
      persist(updated);
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, saving: false } : q));
      Alert.alert("Error", e.message || "Failed to save video. Please try again.");
    }
  }, [queue, persist, qc]);

  const saveAll = useCallback(() => {
    Alert.alert(
      "Save All to Vault",
      `Add all ${queue.length} videos to your vault?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save All", onPress: () => queue.forEach((item) => saveToVault(item)) },
      ]
    );
  }, [queue, saveToVault]);

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />
      <TopAppBar />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Vault</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Watch Later</Text>
        </View>
        {queue.length > 1 && (
          <TouchableOpacity
            onPress={saveAll}
            style={[styles.saveAllBtn, { backgroundColor: GREEN + "14", borderColor: GREEN + "30" }]}
            activeOpacity={0.75}
          >
            <Feather name="download" size={12} color={GREEN} />
            <Text style={[styles.saveAllText, { color: GREEN }]}>Save All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* URL Input */}
      <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: CYAN + "35" }]}>
        <View style={[styles.inputRow, { borderColor: fetchError ? "#ef4444" : (url.length > 0 ? CYAN + "60" : colors.border), backgroundColor: colors.background }]}>
          <Feather name="youtube" size={16} color={url.length > 0 ? CYAN : colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Paste a YouTube URL…"
            placeholderTextColor={colors.mutedForeground}
            value={url}
            onChangeText={(t) => { setUrl(t); setFetchError(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={addUrl}
          />
          {url.length > 0 && (
            <TouchableOpacity onPress={() => { setUrl(""); setFetchError(null); }}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        {fetchError && (
          <Text style={styles.errorText}>{fetchError}</Text>
        )}
        <TouchableOpacity
          onPress={addUrl}
          disabled={!url.trim() || fetching}
          style={[styles.addBtn, { backgroundColor: url.trim() && !fetching ? CYAN : colors.secondary }]}
          activeOpacity={0.8}
        >
          {fetching ? (
            <MotiView
              from={{ rotate: "0deg" }}
              animate={{ rotate: "360deg" }}
              transition={{ type: "timing", duration: 900, loop: true }}
            >
              <Feather name="loader" size={14} color="#fff" />
            </MotiView>
          ) : (
            <Feather name="plus" size={14} color="#fff" />
          )}
          <Text style={styles.addBtnText}>{fetching ? "Fetching…" : "Add to Queue"}</Text>
        </TouchableOpacity>
      </View>

      {/* Count row */}
      {loaded && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {queue.length} VIDEO{queue.length !== 1 ? "S" : ""} IN QUEUE
          </Text>
        </View>
      )}

      {/* Empty */}
      {loaded && queue.length === 0 ? (
        <View style={styles.emptyCenter}>
          <View style={[styles.emptyIcon, { backgroundColor: CYAN + "12", borderColor: CYAN + "25" }]}>
            <Feather name="clock" size={28} color={CYAN} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your Queue Is Empty</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            Paste any YouTube URL above to add videos here before deciding to save them to your vault.
          </Text>
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 20, paddingTop: 4, gap: 10 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <QueueCard
              item={item}
              onSave={() => saveToVault(item)}
              onRemove={() => removeItem(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 1.5, textTransform: "uppercase" },
  title: { fontSize: 22, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: 0.3 },
  saveAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  saveAllText: { fontSize: 11, fontFamily: "Eczar_400Regular" },

  inputCard: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 14, borderWidth: 1, gap: 10 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  input: { flex: 1, fontSize: 14, fontFamily: "Eczar_400Regular" },
  errorText: { fontSize: 11, fontFamily: "Eczar_400Regular", color: "#ef4444", paddingHorizontal: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 11, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontFamily: "AlegreyaSansSC_700Bold", color: "#fff" },

  countRow: { paddingHorizontal: 16, marginBottom: 8 },
  countText: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 1 },

  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  emptyTitle: { fontSize: 18, fontFamily: "AlegreyaSansSC_700Bold", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Eczar_400Regular", textAlign: "center", lineHeight: 20 },

  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden", flexDirection: "row", alignItems: "stretch" },
  cardBar: { width: 3 },
  thumb: { width: 80, height: 60, alignSelf: "center", margin: 12, borderRadius: 6 },
  cardBody: { flex: 1, paddingVertical: 12, paddingRight: 12, gap: 4 },
  cardTitle: { fontSize: 13, fontFamily: "AlegreyaSansSC_700Bold", lineHeight: 18 },
  cardChannel: { fontSize: 11, fontFamily: "Eczar_400Regular" },
  cardMeta: { flexDirection: "row", gap: 6, marginTop: 2 },
  datePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  datePillText: { fontSize: 9, fontFamily: "Eczar_400Regular" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 11, fontFamily: "AlegreyaSansSC_700Bold", color: "#fff" },
  removeBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
