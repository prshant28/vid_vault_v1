import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Image, Platform, ActivityIndicator,
  KeyboardAvoidingView, Keyboard, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const PINK   = "#ec4899";

type Mode = "smart" | "playlist" | "discover" | "watchlater";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const MODES: Array<{ id: Mode; label: string; icon: string; color: string }> = [
  { id: "smart",     label: "Smart Save",   icon: "zap",       color: PURPLE },
  { id: "playlist",  label: "Playlist",     icon: "list",      color: CYAN   },
  { id: "discover",  label: "Discover",     icon: "search",    color: GREEN  },
  { id: "watchlater",label: "Watch Later",  icon: "clock",     color: AMBER  },
];

const WATCH_LATER_KEY = "vv_watch_later_v1";

async function addToWatchLater(video: { url: string; title: string; thumbnail?: string; channel?: string }) {
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const raw = await AsyncStorage.getItem(WATCH_LATER_KEY);
  const queue: any[] = raw ? JSON.parse(raw) : [];
  const exists = queue.some((q) => q.url === video.url);
  if (!exists) {
    queue.unshift({ ...video, addedAt: Date.now(), id: Math.random().toString(36).slice(2) });
    await AsyncStorage.setItem(WATCH_LATER_KEY, JSON.stringify(queue.slice(0, 100)));
  }
  return !exists;
}

function isPlaylistUrl(url: string) {
  return /youtube\.com\/playlist\?list=|(?:youtube\.com\/watch|youtu\.be).*list=/.test(url);
}

function isYouTubeUrl(url: string) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(url);
}

/* ─── Preview card shown after fetching metadata ─── */
function PreviewCard({ meta, color }: {
  meta: { title?: string; channelName?: string; thumbnail?: string; duration?: number };
  color: string;
}) {
  const colors = useColors();
  const dur = meta.duration
    ? `${Math.floor(meta.duration / 60)}:${String(meta.duration % 60).padStart(2, "0")}`
    : null;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280 }}
      style={[styles.previewCard, { backgroundColor: colors.card, borderColor: color + "40" }]}
    >
      <LinearGradient
        colors={[color + "0d", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
        pointerEvents="none"
      />
      {meta.thumbnail ? (
        <Image source={{ uri: meta.thumbnail }} style={styles.previewThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.previewThumb, { backgroundColor: color + "18", alignItems: "center", justifyContent: "center" }]}>
          <Feather name="youtube" size={22} color={color} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.previewTitle, { color: colors.foreground }]} numberOfLines={2}>
          {meta.title || "Loading…"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {meta.channelName && (
            <Text style={[styles.previewSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {meta.channelName}
            </Text>
          )}
          {dur && (
            <View style={[styles.durBadge, { backgroundColor: color + "18", borderColor: color + "30" }]}>
              <Text style={[styles.durText, { color }]}>{dur}</Text>
            </View>
          )}
        </View>
      </View>
    </MotiView>
  );
}

/* ─── Tag chip ─── */
function TagChip({ name, color }: { name: string; color: string }) {
  return (
    <View style={[styles.tagChip, { backgroundColor: color + "14", borderColor: color + "35" }]}>
      <Feather name="tag" size={9} color={color} />
      <Text style={[styles.tagLabel, { color }]}>{name}</Text>
    </View>
  );
}

/* ─── YouTube result card in Discover mode ─── */
function DiscoverCard({
  video, onAdd, adding,
}: {
  video: { youtubeId: string; title: string; channel: string; thumbnail: string; url: string };
  onAdd: () => void;
  adding: boolean;
}) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 240 }}
      style={[styles.discoverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {video.thumbnail ? (
        <Image source={{ uri: video.thumbnail }} style={styles.discoverThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.discoverThumb, { backgroundColor: PURPLE + "15", alignItems: "center", justifyContent: "center" }]}>
          <Feather name="youtube" size={16} color={PURPLE} />
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.discoverTitle, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather name="youtube" size={9} color="#ff0000" />
          <Text style={[styles.discoverChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.channel}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onAdd}
        disabled={adding}
        style={[styles.addBtn, { backgroundColor: adding ? GREEN + "60" : PURPLE }]}
        activeOpacity={0.8}
      >
        {adding
          ? <ActivityIndicator size={12} color="#fff" />
          : <Feather name={adding ? "check" : "download"} size={13} color="#fff" />
        }
      </TouchableOpacity>
    </MotiView>
  );
}

export function UniversalImportModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [mode, setMode] = useState<Mode>("smart");
  const [url, setUrl] = useState("");
  const [folderName, setFolderName] = useState("");
  const [preview, setPreview] = useState<{ title?: string; channelName?: string; thumbnail?: string; duration?: number } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; tags?: string[]; videoId?: string } | null>(null);
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverResults, setDiscoverResults] = useState<any[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [addingVideoId, setAddingVideoId] = useState<string | null>(null);

  const TAG_COLORS = [PURPLE, CYAN, GREEN, AMBER, PINK];

  const reset = useCallback(() => {
    setUrl(""); setFolderName(""); setPreview(null); setPreviewing(false);
    setSaving(false); setResult(null); setDiscoverQuery(""); setDiscoverResults([]);
    setDiscovering(false); setAddingVideoId(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleModeSwitch = useCallback((m: Mode) => {
    setMode(m);
    reset();
  }, [reset]);

  /* ── Preview a URL ── */
  const handlePreview = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed || (!isYouTubeUrl(trimmed) && !isPlaylistUrl(trimmed))) return;
    Keyboard.dismiss();
    setPreviewing(true);
    setPreview(null);
    try {
      const data = await api.previewVideo(trimmed);
      setPreview({ title: data.title, channelName: data.channelName, thumbnail: data.thumbnail, duration: data.duration });
    } catch {
      setPreview({ title: "YouTube Video", channelName: undefined });
    } finally {
      setPreviewing(false);
    }
  }, [url]);

  /* ── Smart Import ── */
  const handleSmartImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    setResult(null);
    try {
      const data = await api.smartImport(trimmed, folderName.trim() || undefined);
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.type === "playlist") {
        setResult({
          success: true,
          message: `Playlist imported! ${data.imported} videos → "${data.folder?.name}"`,
          tags: [],
        });
      } else {
        setResult({
          success: true,
          message: `"${data.video?.title?.slice(0, 40)}…" saved with ${data.appliedTags.length} AI tags`,
          tags: data.appliedTags.map((t) => t.name),
          videoId: data.video?.id,
        });
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResult({ success: false, message: e.message || "Import failed. Check the URL and try again." });
    } finally {
      setSaving(false);
    }
  }, [url, folderName, qc]);

  /* ── Playlist Import ── */
  const handlePlaylistImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    setResult(null);
    try {
      const data = await api.importPlaylist(trimmed, folderName.trim() || undefined);
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({
        success: true,
        message: `${data.imported} videos imported into folder "${data.folder.name}"`,
      });
    } catch (e: any) {
      setResult({ success: false, message: e.message || "Playlist import failed." });
    } finally {
      setSaving(false);
    }
  }, [url, folderName, qc]);

  /* ── Watch Later ── */
  const handleWatchLater = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      let meta = preview;
      if (!meta && isYouTubeUrl(trimmed)) {
        try { meta = await api.previewVideo(trimmed); } catch {}
      }
      const added = await addToWatchLater({
        url: trimmed,
        title: meta?.title || trimmed,
        thumbnail: meta?.thumbnail,
        channel: meta?.channelName,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult({ success: true, message: added ? "Added to Watch Later queue!" : "Already in your Watch Later queue." });
    } catch {
      setResult({ success: false, message: "Failed to add to queue." });
    } finally {
      setSaving(false);
    }
  }, [url, preview]);

  /* ── Discover (YouTube search) ── */
  const handleDiscover = useCallback(async () => {
    const q = discoverQuery.trim();
    if (!q) return;
    Keyboard.dismiss();
    setDiscovering(true);
    setDiscoverResults([]);
    try {
      const data = await api.youtubeSearch(q, 5);
      setDiscoverResults(data.videos || []);
    } catch {
      Alert.alert("Search failed", "Could not search YouTube. Try again later.");
    } finally {
      setDiscovering(false);
    }
  }, [discoverQuery]);

  /* ── Add a discovered video ── */
  const handleAddDiscovered = useCallback(async (video: { youtubeId: string; url: string; title: string }) => {
    setAddingVideoId(video.youtubeId);
    try {
      await api.addVideo(video.url);
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setAddingVideoId(null);
  }, [qc]);

  const activeMode = MODES.find((m) => m.id === mode)!;
  const accentColor = activeMode.color;
  const detectIsPlaylist = isPlaylistUrl(url.trim());
  const detectIsVideo = isYouTubeUrl(url.trim());

  const urlHint = mode === "playlist"
    ? "Paste YouTube playlist URL…"
    : mode === "watchlater"
    ? "Paste any YouTube URL…"
    : "Paste YouTube video or playlist URL…";

  const canImport = url.trim().length > 5 && !saving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          {/* ── Handle ── */}
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.headerIcon, { backgroundColor: accentColor + "18", borderColor: accentColor + "35" }]}>
                <Feather name={activeMode.icon as any} size={16} color={accentColor} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>Import & Discover</Text>
                <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                  {mode === "smart" ? "AI saves, tags & organizes for you"
                    : mode === "playlist" ? "Import entire playlist into a folder"
                    : mode === "discover" ? "Find YouTube videos to add to your vault"
                    : "Queue for later — commit when ready"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { borderColor: colors.border, backgroundColor: colors.card }]} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* ── Mode switcher ── */}
          <View style={styles.modeTabs}>
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => handleModeSwitch(m.id)}
                  style={[styles.modeTab, active && { backgroundColor: m.color + "18", borderColor: m.color + "50" }, !active && { borderColor: colors.border }]}
                  activeOpacity={0.75}
                >
                  <Feather name={m.icon as any} size={12} color={active ? m.color : colors.mutedForeground} />
                  <Text style={[styles.modeTabText, { color: active ? m.color : colors.mutedForeground }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}
          >
            {/* ─── SMART / PLAYLIST / WATCHLATER modes ─── */}
            {mode !== "discover" && (
              <>
                {/* URL input */}
                <View style={[styles.inputWrap, { borderColor: url.trim() ? accentColor + "60" : colors.border, backgroundColor: colors.card }]}>
                  <Feather name="link" size={14} color={accentColor} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={urlHint}
                    placeholderTextColor={colors.mutedForeground}
                    value={url}
                    onChangeText={(t) => { setUrl(t); setPreview(null); setResult(null); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="done"
                    onSubmitEditing={handlePreview}
                  />
                  {url.length > 0 && (
                    <TouchableOpacity onPress={() => { setUrl(""); setPreview(null); setResult(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="x-circle" size={15} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* URL type pill */}
                {url.trim().length > 5 && (
                  <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: 200 }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {detectIsPlaylist && (
                        <View style={[styles.typePill, { backgroundColor: CYAN + "14", borderColor: CYAN + "35" }]}>
                          <Feather name="list" size={9} color={CYAN} />
                          <Text style={[styles.typePillText, { color: CYAN }]}>Playlist URL</Text>
                        </View>
                      )}
                      {detectIsVideo && !detectIsPlaylist && (
                        <View style={[styles.typePill, { backgroundColor: PURPLE + "14", borderColor: PURPLE + "35" }]}>
                          <Feather name="youtube" size={9} color={PURPLE} />
                          <Text style={[styles.typePillText, { color: PURPLE }]}>YouTube Video</Text>
                        </View>
                      )}
                    </View>
                  </MotiView>
                )}

                {/* Folder name (optional for smart + playlist) */}
                {(mode === "smart" || mode === "playlist") && (
                  <View style={[styles.inputWrap, { borderColor: folderName.trim() ? AMBER + "60" : colors.border, backgroundColor: colors.card }]}>
                    <Feather name="folder" size={14} color={AMBER} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder={mode === "playlist" ? "Folder name (auto-detected if empty)…" : "Folder name (optional)…"}
                      placeholderTextColor={colors.mutedForeground}
                      value={folderName}
                      onChangeText={setFolderName}
                      returnKeyType="done"
                    />
                  </View>
                )}

                {/* Preview fetch button */}
                {(detectIsVideo || detectIsPlaylist) && !preview && !previewing && !result && (
                  <TouchableOpacity
                    onPress={handlePreview}
                    style={[styles.previewBtn, { borderColor: accentColor + "40", backgroundColor: accentColor + "0e" }]}
                    activeOpacity={0.75}
                  >
                    <Feather name="eye" size={13} color={accentColor} />
                    <Text style={[styles.previewBtnText, { color: accentColor }]}>Preview</Text>
                  </TouchableOpacity>
                )}
                {previewing && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size={14} color={accentColor} />
                    <Text style={[styles.hintText, { color: colors.mutedForeground }]}>Fetching preview…</Text>
                  </View>
                )}

                {/* Preview card */}
                {preview && <PreviewCard meta={preview} color={accentColor} />}

                {/* Smart import AI hint */}
                {mode === "smart" && !result && (
                  <View style={[styles.aiHintCard, { backgroundColor: PURPLE + "0c", borderColor: PURPLE + "20" }]}>
                    <Feather name="cpu" size={12} color={PURPLE} />
                    <Text style={[styles.aiHintText, { color: colors.mutedForeground }]}>
                      AI will suggest 3 tags and organize this into your vault automatically
                    </Text>
                  </View>
                )}

                {/* Success / Error result */}
                {result && (
                  <MotiView
                    from={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "timing", duration: 280 }}
                    style={[styles.resultCard, {
                      backgroundColor: result.success ? GREEN + "0e" : "#ef4444" + "0e",
                      borderColor: result.success ? GREEN + "35" : "#ef4444" + "35",
                    }]}
                  >
                    <Feather name={result.success ? "check-circle" : "alert-circle"} size={16} color={result.success ? GREEN : "#ef4444"} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={[styles.resultText, { color: result.success ? GREEN : "#ef4444" }]}>{result.message}</Text>
                      {result.tags && result.tags.length > 0 && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                          {result.tags.map((t, i) => (
                            <TagChip key={t} name={t} color={TAG_COLORS[i % TAG_COLORS.length]} />
                          ))}
                        </View>
                      )}
                    </View>
                    {result.success && result.videoId && (
                      <TouchableOpacity
                        onPress={() => { handleClose(); router.push(`/video/${result.videoId}` as any); }}
                        style={[styles.openBtn, { backgroundColor: GREEN }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.openBtnText}>Open</Text>
                      </TouchableOpacity>
                    )}
                  </MotiView>
                )}

                {/* ── Action button ── */}
                {!result && (
                  <TouchableOpacity
                    onPress={mode === "playlist" ? handlePlaylistImport : mode === "watchlater" ? handleWatchLater : handleSmartImport}
                    disabled={!canImport}
                    style={[styles.importBtn, { backgroundColor: canImport ? accentColor : accentColor + "40" }]}
                    activeOpacity={0.82}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size={16} />
                    ) : (
                      <>
                        <Feather name={mode === "smart" ? "zap" : mode === "playlist" ? "download" : "clock"} size={15} color="#fff" />
                        <Text style={styles.importBtnText}>
                          {mode === "smart" ? "AI Import & Tag"
                            : mode === "playlist" ? "Import Playlist"
                            : "Add to Watch Later"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {result?.success && (
                  <TouchableOpacity
                    onPress={() => { reset(); }}
                    style={[styles.importBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: accentColor + "50" }]}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={15} color={accentColor} />
                    <Text style={[styles.importBtnText, { color: accentColor }]}>Import Another</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* ─── DISCOVER mode ─── */}
            {mode === "discover" && (
              <>
                <Text style={[styles.discoverHint, { color: colors.mutedForeground }]}>
                  Search YouTube for videos and add them directly to your vault.
                </Text>

                <View style={[styles.inputWrap, { borderColor: discoverQuery.trim() ? GREEN + "60" : colors.border, backgroundColor: colors.card }]}>
                  <Feather name="search" size={14} color={GREEN} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="e.g. React Native tutorial, Machine Learning…"
                    placeholderTextColor={colors.mutedForeground}
                    value={discoverQuery}
                    onChangeText={setDiscoverQuery}
                    returnKeyType="search"
                    onSubmitEditing={handleDiscover}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleDiscover}
                  disabled={!discoverQuery.trim() || discovering}
                  style={[styles.importBtn, { backgroundColor: discoverQuery.trim() ? GREEN : GREEN + "40" }]}
                  activeOpacity={0.82}
                >
                  {discovering ? (
                    <ActivityIndicator color="#fff" size={16} />
                  ) : (
                    <>
                      <Feather name="youtube" size={15} color="#fff" />
                      <Text style={styles.importBtnText}>Search YouTube</Text>
                    </>
                  )}
                </TouchableOpacity>

                {discoverResults.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                      {discoverResults.length} results — tap + to add to vault
                    </Text>
                    {discoverResults.map((video) => (
                      <DiscoverCard
                        key={video.youtubeId}
                        video={video}
                        onAdd={() => handleAddDiscovered(video)}
                        adding={addingVideoId === video.youtubeId}
                      />
                    ))}
                  </>
                )}

                {discovering && (
                  <View style={{ alignItems: "center", paddingVertical: 24 }}>
                    <ActivityIndicator color={GREEN} />
                    <Text style={[styles.hintText, { color: colors.mutedForeground, marginTop: 8 }]}>Searching YouTube…</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerIcon: {
    width: 38, height: 38, borderRadius: 12, alignItems: "center",
    justifyContent: "center", borderWidth: 1,
  },
  headerTitle: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 18, lineHeight: 20 },
  headerSub: { fontFamily: "Eczar_400Regular", fontSize: 11, lineHeight: 15, marginTop: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 10, alignItems: "center",
    justifyContent: "center", borderWidth: 1,
  },
  modeTabs: {
    flexDirection: "row", paddingHorizontal: 20, paddingBottom: 12,
    gap: 8, flexWrap: "wrap",
  },
  modeTab: {
    flexDirection: "row", alignItems: "center", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1,
    gap: 5,
  },
  modeTabText: { fontFamily: "Eczar_600SemiBold", fontSize: 11, flexShrink: 0 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", borderRadius: 14,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11,
  },
  input: { flex: 1, fontFamily: "Eczar_400Regular", fontSize: 13, padding: 0 },
  previewCard: {
    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14,
    borderWidth: 1, padding: 12, overflow: "hidden",
  },
  previewThumb: { width: 64, height: 48, borderRadius: 8 },
  previewTitle: { fontFamily: "Eczar_600SemiBold", fontSize: 12, lineHeight: 17 },
  previewSub: { fontFamily: "Eczar_400Regular", fontSize: 10, flex: 1 },
  durBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1 },
  durText: { fontFamily: "Eczar_600SemiBold", fontSize: 9 },
  tagChip: {
    flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1,
  },
  tagLabel: { fontFamily: "Eczar_600SemiBold", fontSize: 10 },
  typePill: {
    flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
  },
  typePillText: { fontFamily: "Eczar_600SemiBold", fontSize: 9 },
  aiHintCard: {
    flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10,
    padding: 12, borderWidth: 1,
  },
  aiHintText: { fontFamily: "Eczar_400Regular", fontSize: 11, flex: 1, lineHeight: 16 },
  resultCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  resultText: { fontFamily: "Eczar_600SemiBold", fontSize: 12, lineHeight: 18 },
  openBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  openBtnText: { fontFamily: "Eczar_700Bold", fontSize: 11, color: "#fff" },
  importBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  importBtnText: { fontFamily: "Eczar_700Bold", fontSize: 14, color: "#fff" },
  previewBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 10, paddingVertical: 9, borderWidth: 1,
  },
  previewBtnText: { fontFamily: "Eczar_600SemiBold", fontSize: 12 },
  discoverHint: { fontFamily: "Eczar_400Regular", fontSize: 12, lineHeight: 18 },
  discoverCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 10,
  },
  discoverThumb: { width: 70, height: 52, borderRadius: 8 },
  discoverTitle: { fontFamily: "Eczar_600SemiBold", fontSize: 12, lineHeight: 17 },
  discoverChannel: { fontFamily: "Eczar_400Regular", fontSize: 10 },
  addBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontFamily: "Eczar_400Regular", fontSize: 10, letterSpacing: 0.5 },
  hintText: { fontFamily: "Eczar_400Regular", fontSize: 11 },
});
