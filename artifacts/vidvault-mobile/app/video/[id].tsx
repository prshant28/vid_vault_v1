import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WebView from "react-native-webview";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { Skeleton } from "@/components/SkeletonLoader";
import { TagBadge } from "@/components/ui/TagBadge";
import type { Video, Note, Tag, AiOutput } from "@/types/api";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const AI_TYPES: Array<{ type: string; label: string; icon: FeatherIconName }> = [
  { type: "summary", label: "Summary", icon: "file-text" },
  { type: "key_insights", label: "Key Insights", icon: "zap" },
  { type: "notes", label: "Study Notes", icon: "book-open" },
  { type: "mcq", label: "Quiz (MCQ)", icon: "check-circle" },
  { type: "ppt_outline", label: "Outline", icon: "list" },
  { type: "flashcards", label: "Flashcards", icon: "layers" },
];

const SCREEN_WIDTH = Dimensions.get("window").width;

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function YouTubePlayer({ ytId, onOpenExternal }: { ytId: string; onOpenExternal: () => void }) {
  const colors = useColors();
  const [playerError, setPlayerError] = useState(false);
  const playerHeight = SCREEN_WIDTH * (9 / 16);
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");

  const embedHtml = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<meta name="referrer" content="no-referrer-when-downgrade">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; overflow: hidden; }
.player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
iframe { width: 100%; height: 100%; border: none; }
</style>
</head>
<body>
<div class="player">
  <iframe
    src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1&playsinline=1"
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
    allowfullscreen
    referrerpolicy="no-referrer-when-downgrade"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
  ></iframe>
</div>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.event === 'onError') {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: e.data.info }));
  }
});
</script>
</body>
</html>
  `;

  if (playerError) {
    return (
      <View style={[styles.playerWrapper, { height: playerHeight, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" }]}>
        <View style={{ alignItems: "center", gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", alignItems: "center", justifyContent: "center" }}>
            <Feather name="youtube" size={24} color="#ef4444" />
          </View>
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>Embedding restricted</Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "JetBrainsMono_400Regular", textAlign: "center", paddingHorizontal: 32, lineHeight: 16 }}>
              This video can't be embedded.{"\n"}Watch it directly on YouTube.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onOpenExternal}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: "#ef4444", borderRadius: 4 }}
            activeOpacity={0.85}
          >
            <Feather name="external-link" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 11, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1 }}>OPEN IN YOUTUBE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.playerWrapper, { height: playerHeight, backgroundColor: "#000" }]}>
      <WebView
        style={{ flex: 1, backgroundColor: "#000" }}
        source={{ html: embedHtml }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === "error") setPlayerError(true);
          } catch {}
        }}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 400) setPlayerError(true);
        }}
      />
      <TouchableOpacity onPress={onOpenExternal} style={styles.openExtBtn} activeOpacity={0.8}>
        <Feather name="youtube" size={13} color="rgba(255,255,255,0.7)" />
        <Text style={styles.openExtText}>Open in YouTube</Text>
      </TouchableOpacity>
    </View>
  );
}

function AiInsightCard({ type, label, icon, existingOutput, onGenerate, generatingType }: {
  type: string; label: string; icon: FeatherIconName;
  existingOutput?: AiOutput | null;
  onGenerate: (type: string) => void;
  generatingType: string | null;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const isGenerating = generatingType === type;

  return (
    <View style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => { if (existingOutput) setExpanded(!expanded); }}
        style={styles.aiCardHeader}
        activeOpacity={existingOutput ? 0.7 : 1}
      >
        <View style={[styles.aiCardIcon, { backgroundColor: colors.accent }]}>
          <Feather name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.aiCardLabel, { color: colors.foreground }]}>{label}</Text>
        <View style={{ flex: 1 }} />
        {isGenerating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : existingOutput ? (
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
        ) : (
          <TouchableOpacity
            onPress={() => onGenerate(type)}
            style={[styles.generateBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Feather name="cpu" size={12} color="#fff" />
            <Text style={styles.generateBtnText}>Generate</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {existingOutput && expanded && (
        <View style={[styles.aiCardContent, { borderTopColor: colors.border }]}>
          <Text style={[styles.aiContentText, { color: colors.foreground }]}>{existingOutput.content}</Text>
          <Text style={[styles.aiContentDate, { color: colors.mutedForeground }]}>
            Generated {new Date(existingOutput.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
}

function NoteItem({ note, onDelete, onUpdate }: { note: Note; onDelete: () => void; onUpdate: (content: string, timestamp?: number | null) => void }) {
  const colors = useColors();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editTimestamp, setEditTimestamp] = useState(
    note.timestamp != null ? `${Math.floor(note.timestamp / 60)}:${(note.timestamp % 60).toString().padStart(2, "0")}` : ""
  );

  const formatTimestamp = (secs: number | null) => {
    if (secs == null) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const parseTs = (text: string): number | undefined => {
    const parts = text.split(":").map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) return parts[0] * 60 + parts[1];
    return undefined;
  };

  const handleSave = () => {
    const ts = editTimestamp.trim() ? parseTs(editTimestamp.trim()) : null;
    onUpdate(editContent.trim(), ts ?? null);
    setEditing(false);
  };

  return (
    <View style={[styles.noteItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {!editing && note.timestamp != null && (
        <View style={[styles.timestampBadge, { backgroundColor: colors.accent }]}>
          <Feather name="clock" size={11} color={colors.primary} />
          <Text style={[styles.timestampText, { color: colors.primary }]}>
            {formatTimestamp(note.timestamp)}
          </Text>
        </View>
      )}
      {editing ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={editContent}
            onChangeText={setEditContent}
            style={[styles.noteEditInput, { color: colors.foreground, borderColor: colors.border }]}
            multiline
            autoFocus
          />
          <TextInput
            value={editTimestamp}
            onChangeText={setEditTimestamp}
            placeholder="Timestamp (1:30)"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.timestampInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={handleSave} style={[styles.editSaveBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)} style={[styles.editSaveBtn, { backgroundColor: colors.secondary }]}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={[styles.noteContent, { color: colors.foreground }]}>{note.content}</Text>
      )}
      {!editing && (
        <View style={styles.noteFooter}>
          <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
            {new Date(note.createdAt).toLocaleDateString()}
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="trash-2" size={14} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const tabScrollRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [newNote, setNewNote] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState("");
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const { data: video, isLoading } = useQuery<Video>({
    queryKey: ["video", id],
    queryFn: () => api.getVideo(id!),
    enabled: !!id,
  });

  const favMutation = useMutation({
    mutationFn: () => api.toggleFavorite(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const generateMutation = useMutation({
    mutationFn: (type: string) => api.generateAiContent(id!, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      setGeneratingType(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => setGeneratingType(null),
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ content, timestamp }: { content: string; timestamp?: number }) =>
      api.createNote(id!, content, timestamp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      setNewNote("");
      setNoteTimestamp("");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => api.deleteNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video", id] }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content, timestamp }: { noteId: string; content: string; timestamp?: number | null }) =>
      api.updateNote(noteId, content, timestamp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleGenerate = (type: string) => {
    setGeneratingType(type);
    generateMutation.mutate(type);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const ts = noteTimestamp.trim() ? parseTimestamp(noteTimestamp.trim()) : undefined;
    addNoteMutation.mutate({ content: newNote.trim(), timestamp: ts });
  };

  const parseTimestamp = (text: string): number | undefined => {
    const parts = text.split(":").map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) {
      return parts[0] * 60 + parts[1];
    }
    return undefined;
  };

  const switchTab = (idx: number) => {
    setActiveTab(idx);
    tabScrollRef.current?.scrollTo({ x: SCREEN_WIDTH * idx, y: 0, animated: true });
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveTab(pageIndex);
  };

  const handleOpenYouTube = () => {
    if (video?.url) Linking.openURL(video.url);
  };

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: topInset + 16 }}>
        <Skeleton height={SCREEN_WIDTH * 9 / 16} borderRadius={4} style={{ marginBottom: 16 }} />
        <Skeleton height={24} width="80%" style={{ marginBottom: 8 }} />
        <Skeleton height={16} width="50%" style={{ marginBottom: 24 }} />
        {[1, 2, 3].map((i) => <Skeleton key={i} height={60} borderRadius={4} style={{ marginBottom: 10 }} />)}
      </ScrollView>
    );
  }

  if (!video) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground }}>Video not found</Text>
      </View>
    );
  }

  const ytId = extractYouTubeId(video.url || "");

  const aiOutputMap: Record<string, AiOutput> = Object.fromEntries(
    (video.aiOutputs || []).map((o: AiOutput) => [o.type, o])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.navBar, { paddingTop: topInset + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>Video</Text>
        <TouchableOpacity onPress={() => favMutation.mutate()} style={styles.navBtn}>
          <Feather name="heart" size={22} color={video.isFavorite ? "#ef4444" : colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botInset + 24 }}>
        {ytId && Platform.OS !== "web" ? (
          <YouTubePlayer ytId={ytId} onOpenExternal={handleOpenYouTube} />
        ) : (
          <TouchableOpacity onPress={handleOpenYouTube} activeOpacity={0.9} style={{ position: "relative" }}>
            {video.thumbnail ? (
              <View style={[styles.thumbnailContainer, { backgroundColor: "#000" }]}>
                <View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center", backgroundColor: "#000" }]}>
                  <Feather name="play-circle" size={52} color="rgba(139,92,246,0.6)" />
                </View>
                <img
                  src={video.thumbnail}
                  style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", opacity: 0.8 } as React.CSSProperties}
                />
              </View>
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.secondary }]}>
                <Feather name="play-circle" size={48} color={colors.primary} />
              </View>
            )}
            <View style={styles.playOverlay}>
              <View style={styles.playBtnCircle}>
                <Feather name="play" size={24} color="#fff" />
              </View>
              <Text style={styles.openYtText}>Open in YouTube</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]}>{video.title}</Text>
          <View style={styles.meta}>
            {video.channelName ? (
              <View style={styles.metaItem}>
                <Feather name="user" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{video.channelName}</Text>
              </View>
            ) : null}
            {video.duration ? (
              <View style={styles.metaItem}>
                <Feather name="clock" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{video.duration}</Text>
              </View>
            ) : null}
          </View>
          {video.tags && video.tags.length > 0 && (
            <View style={styles.tags}>
              {video.tags.map((tag: Tag) => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
          {["AI Insights", `Notes${video.notes?.length ? ` (${video.notes.length})` : ""}`].map((label, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => switchTab(idx)}
              style={[
                styles.tabBtn,
                activeTab === idx && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text style={[
                styles.tabBtnText,
                {
                  color: activeTab === idx ? colors.primary : colors.mutedForeground,
                  fontFamily: activeTab === idx ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          ref={tabScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={32}
          onMomentumScrollEnd={handleScrollEnd}
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={{ width: SCREEN_WIDTH * 2 }}
        >
          <View style={[styles.tabContent, { width: SCREEN_WIDTH }]}>
            <View style={{ gap: 10 }}>
              {AI_TYPES.map(({ type, label, icon }) => (
                <AiInsightCard
                  key={type}
                  type={type}
                  label={label}
                  icon={icon}
                  existingOutput={aiOutputMap[type]}
                  onGenerate={handleGenerate}
                  generatingType={generatingType}
                />
              ))}
            </View>
          </View>

          <View style={[styles.tabContent, { width: SCREEN_WIDTH }]}>
            <View style={{ gap: 12 }}>
              <View style={[styles.noteInputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  value={newNote}
                  onChangeText={setNewNote}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={[styles.noteInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                />
                <View style={styles.noteInputFooter}>
                  <TextInput
                    value={noteTimestamp}
                    onChangeText={setNoteTimestamp}
                    placeholder="Timestamp (1:30)"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.timestampInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    keyboardType="numbers-and-punctuation"
                  />
                  <TouchableOpacity
                    onPress={handleAddNote}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    style={[styles.noteAddBtn, { backgroundColor: newNote.trim() ? colors.primary : colors.secondary }]}
                  >
                    <Feather name="plus" size={18} color={newNote.trim() ? "#fff" : colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {!video.notes || video.notes.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 24 }}>
                  <Feather name="edit-3" size={32} color={colors.mutedForeground} style={{ marginBottom: 8 }} />
                  <Text style={[styles.emptyNotesText, { color: colors.mutedForeground }]}>No notes yet. Add your thoughts above.</Text>
                </View>
              ) : null}

              {video.notes?.map((note: Note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onUpdate={(content, timestamp) =>
                    updateNoteMutation.mutate({ noteId: note.id, content, timestamp })
                  }
                  onDelete={() => {
                    Alert.alert("Delete Note", "Delete this note?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteNoteMutation.mutate(note.id) },
                    ]);
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    padding: 10,
    width: 48,
    alignItems: "center",
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  playerWrapper: {
    width: "100%",
    position: "relative",
    backgroundColor: "#000",
  },
  openExtBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  openExtText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
  },
  thumbnailContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  thumbnailPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  playBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  openYtText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "JetBrainsMono_400Regular",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  info: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    lineHeight: 25,
  },
  meta: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "JetBrainsMono_400Regular",
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: -1,
  },
  tabBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  tabContent: {
    padding: 16,
  },
  aiCard: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  aiCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCardLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 0.5,
  },
  aiCardContent: {
    borderTopWidth: 1,
    padding: 14,
    gap: 8,
  },
  aiContentText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  aiContentDate: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 0.5,
  },
  noteInputCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 10,
  },
  noteInput: {
    fontSize: 15,
    maxHeight: 100,
    padding: 0,
  },
  noteInputFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestampInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: "JetBrainsMono_400Regular",
    padding: 8,
    borderWidth: 1,
    borderRadius: 3,
  },
  noteAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  noteItem: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 4,
    gap: 8,
  },
  timestampBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
  },
  timestampText: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
  },
  noteContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteDate: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
  },
  noteEditInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderRadius: 3,
    padding: 10,
    maxHeight: 120,
  },
  editSaveBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 3,
    alignItems: "center",
  },
  emptyNotesText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
