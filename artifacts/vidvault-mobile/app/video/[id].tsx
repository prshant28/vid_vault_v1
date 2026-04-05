import React, { useState, useRef, useCallback } from "react";
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
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import WebView from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { Skeleton } from "@/components/SkeletonLoader";
import type { Video, Note, Tag, AiOutput } from "@/types/api";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const SCREEN_WIDTH = Dimensions.get("window").width;
const PLAYER_HEIGHT = SCREEN_WIDTH * (9 / 16);

const PURPLE = "#8b5cf6";
const CYAN = "#06b6d4";
const GREEN = "#10b981";
const ORANGE = "#f59e0b";
const PINK = "#ec4899";
const BLUE = "#3b82f6";

const AI_TOOLS: Array<{
  type: string;
  label: string;
  icon: FeatherIconName;
  color: string;
  desc: string;
}> = [
  { type: "summary", label: "Summary", icon: "file-text", color: CYAN, desc: "Concise overview of key points" },
  { type: "key_insights", label: "Key Insights", icon: "zap", color: ORANGE, desc: "Top actionable takeaways" },
  { type: "mcq", label: "Quiz (MCQ)", icon: "check-circle", color: GREEN, desc: "Test your understanding" },
  { type: "ppt_outline", label: "PPT Outline", icon: "monitor", color: BLUE, desc: "Slide deck structure" },
  { type: "flashcards", label: "Flashcards", icon: "layers", color: PINK, desc: "Spaced repetition cards" },
  { type: "notes", label: "Study Notes", icon: "book-open", color: PURPLE, desc: "Organised bullet notes" },
];

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

/* ─── YouTube WebView Player ─── */
function YouTubePlayer({ ytId, onOpenExternal }: { ytId: string; onOpenExternal: () => void }) {
  const [error, setError] = useState(false);

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="referrer" content="no-referrer-when-downgrade">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;overflow:hidden}.wrap{position:absolute;inset:0}iframe{width:100%;height:100%;border:none}</style>
</head><body>
<div class="wrap">
  <iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1&playsinline=1"
    allow="autoplay;encrypted-media;fullscreen;picture-in-picture"
    allowfullscreen referrerpolicy="no-referrer-when-downgrade"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"></iframe>
</div>
</body></html>`;

  if (error) {
    return (
      <View style={[styles.player, { alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0f" }]}>
        <View style={styles.embedErrorBox}>
          <Feather name="youtube" size={28} color="#ef4444" />
          <Text style={styles.embedErrorTitle}>Embedding Restricted</Text>
          <Text style={styles.embedErrorSub}>This video can't play here.{"\n"}Watch it on YouTube instead.</Text>
          <TouchableOpacity onPress={onOpenExternal} style={styles.embedErrorBtn} activeOpacity={0.85}>
            <Feather name="external-link" size={14} color="#fff" />
            <Text style={styles.embedErrorBtnText}>OPEN IN YOUTUBE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.player}>
      <WebView
        style={{ flex: 1, backgroundColor: "#000" }}
        source={{ html }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onHttpError={(e) => { if (e.nativeEvent.statusCode >= 400) setError(true); }}
      />
      <TouchableOpacity onPress={onOpenExternal} style={styles.ytExtBtn} activeOpacity={0.8}>
        <Feather name="youtube" size={11} color="rgba(255,255,255,0.65)" />
        <Text style={styles.ytExtText}>YouTube</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Thumbnail Player (non-YouTube) ─── */
function ThumbnailPlayer({ thumbnail, onOpenExternal }: { thumbnail?: string | null; onOpenExternal: () => void }) {
  return (
    <TouchableOpacity onPress={onOpenExternal} activeOpacity={0.92} style={styles.player}>
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#1a1a22", alignItems: "center", justifyContent: "center" }]}>
          <Feather name="film" size={40} color="rgba(139,92,246,0.3)" />
        </View>
      )}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.playOverlay}>
        <View style={styles.playCircle}>
          <Feather name="play" size={22} color="#fff" />
        </View>
        <Text style={styles.playOverlayText}>OPEN VIDEO</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ─── AI Tool Card ─── */
function AiToolCard({
  tool,
  existingOutput,
  onGenerate,
  isGenerating,
  onView,
}: {
  tool: typeof AI_TOOLS[0];
  existingOutput?: AiOutput | null;
  onGenerate: () => void;
  isGenerating: boolean;
  onView: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={existingOutput ? onView : onGenerate}
      activeOpacity={0.78}
      style={styles.toolCard}
    >
      <View style={[styles.toolIconBox, { backgroundColor: tool.color + "18", borderColor: tool.color + "30" }]}>
        <Feather name={tool.icon} size={18} color={tool.color} />
      </View>
      <View style={styles.toolInfo}>
        <Text style={styles.toolLabel}>{tool.label}</Text>
        <Text style={styles.toolDesc} numberOfLines={1}>{tool.desc}</Text>
      </View>
      {isGenerating ? (
        <ActivityIndicator size="small" color={PURPLE} style={{ marginLeft: 8 }} />
      ) : existingOutput ? (
        <View style={styles.toolDoneBtn}>
          <Feather name="check" size={12} color={GREEN} />
        </View>
      ) : (
        <TouchableOpacity onPress={onGenerate} style={styles.toolGenBtn} activeOpacity={0.85}>
          <Text style={styles.toolGenText}>Generate</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

/* ─── AI Output Viewer ─── */
function AiOutputPanel({ output, tool, onClose, onRegenerate }: {
  output: AiOutput;
  tool: typeof AI_TOOLS[0];
  onClose: () => void;
  onRegenerate: () => void;
}) {
  return (
    <View style={styles.outputPanel}>
      <View style={styles.outputPanelHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.outputPanelIcon, { backgroundColor: tool.color + "20" }]}>
            <Feather name={tool.icon} size={16} color={tool.color} />
          </View>
          <Text style={styles.outputPanelTitle}>{tool.label}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={onRegenerate} style={styles.regenBtn} activeOpacity={0.8}>
            <Feather name="refresh-cw" size={13} color={PURPLE} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.outputScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.outputText}>{output.content}</Text>
        <Text style={styles.outputDate}>
          Generated {new Date(output.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </Text>
      </ScrollView>
    </View>
  );
}

/* ─── Note Item ─── */
function NoteItem({ note, onDelete, onUpdate }: { note: Note; onDelete: () => void; onUpdate: (content: string, ts?: number | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editTs, setEditTs] = useState(
    note.timestamp != null ? `${Math.floor(note.timestamp / 60)}:${(note.timestamp % 60).toString().padStart(2, "0")}` : ""
  );

  const parseTs = (t: string): number | undefined => {
    const parts = t.split(":").map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) return parts[0] * 60 + parts[1];
    return undefined;
  };

  return (
    <View style={styles.noteCard}>
      {!editing && note.timestamp != null && (
        <View style={styles.noteTsBadge}>
          <Feather name="clock" size={9} color={PURPLE} />
          <Text style={styles.noteTsText}>{Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, "0")}</Text>
        </View>
      )}
      {editing ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={editContent}
            onChangeText={setEditContent}
            style={styles.noteEditInput}
            multiline
            autoFocus
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          <TextInput
            value={editTs}
            onChangeText={setEditTs}
            placeholder="Timestamp (1:30)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.tsInput}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => { onUpdate(editContent.trim(), editTs.trim() ? parseTs(editTs) : null); setEditing(false); }}
              style={[styles.noteActionBtn, { backgroundColor: PURPLE }]}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)} style={[styles.noteActionBtn, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_500Medium" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.noteContent}>{note.content}</Text>
          <View style={styles.noteFooter}>
            <Text style={styles.noteDate}>{new Date(note.createdAt).toLocaleDateString()}</Text>
            <View style={{ flexDirection: "row", gap: 14 }}>
              <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="edit-2" size={13} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="trash-2" size={13} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

/* ═══════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════ */
export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"ai" | "notes">("ai");
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [viewingOutput, setViewingOutput] = useState<{ output: AiOutput; tool: typeof AI_TOOLS[0] } | null>(null);
  const [newNote, setNewNote] = useState("");
  const [noteTs, setNoteTs] = useState("");

  const { data: video, isLoading } = useQuery<Video>({
    queryKey: ["video", id],
    queryFn: () => api.getVideo(id!),
    enabled: !!id,
  });

  const { data: aiOutputsData, refetch: refetchOutputs } = useQuery({
    queryKey: ["ai-outputs", id],
    queryFn: () => api.listAiOutputs(id!),
    enabled: !!id,
  });

  const favMutation = useMutation({
    mutationFn: () => api.toggleFavorite(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      qc.invalidateQueries({ queryKey: ["videos"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const generateMutation = useMutation({
    mutationFn: (type: string) => api.generateAiContent(id!, type),
    onSuccess: (data, type) => {
      refetchOutputs();
      setGeneratingType(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const tool = AI_TOOLS.find((t) => t.type === type);
      if (tool && data) setViewingOutput({ output: data, tool });
    },
    onError: (err: any) => {
      setGeneratingType(null);
      Alert.alert("Generation Failed", err.message || "Could not generate content. Check AI API key.");
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ content, timestamp }: { content: string; timestamp?: number }) =>
      api.createNote(id!, content, timestamp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      setNewNote("");
      setNoteTs("");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => api.deleteNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video", id] }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content, timestamp }: { noteId: string; content: string; timestamp?: number | null }) =>
      api.updateNote(noteId, content, timestamp),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video", id] }),
  });

  const handleGenerate = useCallback((type: string) => {
    setGeneratingType(type);
    generateMutation.mutate(type);
  }, []);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const parts = noteTs.trim().split(":").map(Number);
    const ts = parts.length === 2 && !parts.some(isNaN) ? parts[0] * 60 + parts[1] : undefined;
    addNoteMutation.mutate({ content: newNote.trim(), timestamp: ts });
  };

  const handleOpenYouTube = () => { if (video?.url) Linking.openURL(video.url); };

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const aiOutputMap: Record<string, AiOutput> = Object.fromEntries(
    ((aiOutputsData?.outputs || video?.aiOutputs) || []).map((o: AiOutput) => [o.type, o])
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
        <View style={{ height: PLAYER_HEIGHT, backgroundColor: "#13131a" }} />
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton height={22} width="80%" borderRadius={6} />
          <Skeleton height={14} width="45%" borderRadius={4} />
          <Skeleton height={44} borderRadius={12} style={{ marginTop: 8 }} />
          {[1,2,3].map((i) => <Skeleton key={i} height={68} borderRadius={10} />)}
        </View>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: "JetBrainsMono_400Regular" }}>VIDEO_NOT_FOUND</Text>
      </View>
    );
  }

  const ytId = extractYouTubeId(video.url || "");

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      {/* Nav bar */}
      <View style={[styles.nav, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Video</Text>
        <TouchableOpacity onPress={() => favMutation.mutate()} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="heart" size={20} color={video.isFavorite ? "#ef4444" : "rgba(255,255,255,0.65)"} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botInset + 28 }}>
        {/* Player */}
        {ytId && Platform.OS !== "web" ? (
          <YouTubePlayer ytId={ytId} onOpenExternal={handleOpenYouTube} />
        ) : (
          <ThumbnailPlayer thumbnail={video.thumbnail} onOpenExternal={handleOpenYouTube} />
        )}

        {/* Video info */}
        <View style={styles.infoBlock}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <View style={styles.metaRow}>
            {video.channelName && (
              <View style={styles.metaChip}>
                <Feather name="music" size={11} color={PURPLE} />
                <Text style={styles.metaChipText}>{video.channelName}</Text>
              </View>
            )}
            {video.duration && (
              <View style={styles.metaChip}>
                <Feather name="clock" size={11} color="rgba(255,255,255,0.4)" />
                <Text style={[styles.metaChipText, { color: "rgba(255,255,255,0.4)" }]}>{video.duration}</Text>
              </View>
            )}
          </View>
          {video.tags && video.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {video.tags.map((tag: Tag) => (
                <View key={tag.id} style={[styles.tagPill, { backgroundColor: (tag.color || PURPLE) + "20", borderColor: (tag.color || PURPLE) + "40" }]}>
                  <Text style={[styles.tagPillText, { color: tag.color || PURPLE }]}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(["ai", "notes"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === "ai" ? "AI INSIGHTS" : `MY NOTES${video.notes?.length ? ` (${video.notes.length})` : ""}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── AI Tab ── */}
        {activeTab === "ai" && (
          <View style={styles.section}>
            {viewingOutput ? (
              <AiOutputPanel
                output={viewingOutput.output}
                tool={viewingOutput.tool}
                onClose={() => setViewingOutput(null)}
                onRegenerate={() => {
                  setViewingOutput(null);
                  handleGenerate(viewingOutput.tool.type);
                }}
              />
            ) : (
              <>
                <Text style={styles.sectionLabel}>CHOOSE A TOOL</Text>
                <View style={styles.toolGrid}>
                  {AI_TOOLS.map((tool) => (
                    <AiToolCard
                      key={tool.type}
                      tool={tool}
                      existingOutput={aiOutputMap[tool.type]}
                      isGenerating={generatingType === tool.type}
                      onGenerate={() => handleGenerate(tool.type)}
                      onView={() => {
                        const out = aiOutputMap[tool.type];
                        if (out) setViewingOutput({ output: out, tool });
                      }}
                    />
                  ))}
                </View>
                {generatingType && (
                  <View style={styles.generatingBanner}>
                    <ActivityIndicator size="small" color={PURPLE} />
                    <Text style={styles.generatingText}>Generating with AI…</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Notes Tab ── */}
        {activeTab === "notes" && (
          <View style={styles.section}>
            {/* Add note */}
            <View style={styles.noteInputCard}>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Add a note about this video…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                style={styles.noteInput}
              />
              <View style={styles.noteInputFooter}>
                <TextInput
                  value={noteTs}
                  onChangeText={setNoteTs}
                  placeholder="Timestamp (1:30)"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.tsInput}
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity
                  onPress={handleAddNote}
                  disabled={!newNote.trim()}
                  style={[styles.noteAddBtn, { backgroundColor: newNote.trim() ? PURPLE : "rgba(255,255,255,0.06)" }]}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={18} color={newNote.trim() ? "#fff" : "rgba(255,255,255,0.3)"} />
                </TouchableOpacity>
              </View>
            </View>

            {(!video.notes || video.notes.length === 0) ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <View style={styles.emptyNoteIcon}>
                  <Feather name="edit-3" size={22} color="rgba(139,92,246,0.45)" />
                </View>
                <Text style={styles.emptyNoteText}>No notes yet</Text>
                <Text style={styles.emptyNoteSub}>Capture your thoughts above</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {video.notes.map((note: Note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onUpdate={(content, timestamp) => updateNoteMutation.mutate({ noteId: note.id, content, timestamp })}
                    onDelete={() =>
                      Alert.alert("Delete Note", "Delete this note?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => deleteNoteMutation.mutate(note.id) },
                      ])
                    }
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: "#0a0a0f",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  navBtn: { padding: 10, width: 44, alignItems: "center" },
  navTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  /* Player */
  player: {
    width: "100%",
    height: PLAYER_HEIGHT,
    backgroundColor: "#000",
    position: "relative",
  },
  ytExtBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ytExtText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 0.5,
  },
  playOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(139,92,246,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlayText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },

  /* Error */
  embedErrorBox: { alignItems: "center", gap: 12, paddingHorizontal: 32 },
  embedErrorTitle: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  embedErrorSub: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "JetBrainsMono_400Regular", textAlign: "center", lineHeight: 17 },
  embedErrorBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: "#ef4444", borderRadius: 6, marginTop: 4,
  },
  embedErrorBtnText: { color: "#fff", fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.2 },

  /* Info */
  infoBlock: { padding: 16, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" },
  videoTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#fff",
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  metaChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: PURPLE },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  tagPill: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 5, borderWidth: 1,
  },
  tagPillText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabBtnActive: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderColor: "rgba(139,92,246,0.35)",
  },
  tabBtnText: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_600SemiBold",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.2,
  },
  tabBtnTextActive: { color: PURPLE },

  /* Section */
  section: { padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 2,
    marginBottom: 2,
  },

  /* Tool Grid */
  toolGrid: { gap: 10 },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#13131a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 14,
  },
  toolIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, flexShrink: 0,
  },
  toolInfo: { flex: 1 },
  toolLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff", marginBottom: 2 },
  toolDesc: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.38)" },
  toolGenBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: PURPLE,
    borderRadius: 6,
  },
  toolGenText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "#fff", letterSpacing: 0.5 },
  toolDoneBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: GREEN + "20",
    borderWidth: 1, borderColor: GREEN + "40",
    alignItems: "center", justifyContent: "center",
  },

  /* Generating banner */
  generatingBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.2)",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  generatingText: { fontSize: 12, fontFamily: "Inter_500Medium", color: PURPLE },

  /* Output Panel */
  outputPanel: {
    backgroundColor: "#13131a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    maxHeight: 460,
  },
  outputPanelHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  outputPanelIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  outputPanelTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  regenBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  outputScroll: { padding: 16, maxHeight: 380 },
  outputText: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.82)", lineHeight: 22,
  },
  outputDate: {
    marginTop: 14, fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    color: "rgba(255,255,255,0.25)", letterSpacing: 0.5,
  },

  /* Notes */
  noteInputCard: {
    backgroundColor: "#13131a", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    padding: 14, gap: 10,
  },
  noteInput: {
    color: "#fff", fontFamily: "Inter_400Regular",
    fontSize: 14, lineHeight: 21, minHeight: 56,
    textAlignVertical: "top",
  },
  noteInputFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  tsInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10, paddingVertical: 8,
    color: "#fff", fontSize: 12,
    fontFamily: "JetBrainsMono_400Regular",
  },
  noteAddBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  noteCard: {
    backgroundColor: "#13131a", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    padding: 14, gap: 8,
  },
  noteTsBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(139,92,246,0.1)",
    borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(139,92,246,0.2)",
  },
  noteTsText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: PURPLE },
  noteContent: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  noteFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  noteDate: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.25)" },
  noteEditInput: {
    color: "#fff", fontFamily: "Inter_400Regular", fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8, padding: 10, minHeight: 60, textAlignVertical: "top",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  noteActionBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },

  /* Empty notes */
  emptyNoteIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  emptyNoteText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.5)" },
  emptyNoteSub: { fontSize: 11, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.25)", marginTop: 4 },
});
