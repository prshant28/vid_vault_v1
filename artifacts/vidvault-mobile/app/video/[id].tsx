import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  Linking,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useColors } from "@/hooks/useColors";
import { TopAppBar } from "@/components/TopAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { YouTubePlayer } from "@/components/YouTubeEmbed";
import { api } from "@/services/api";
import { Skeleton } from "@/components/SkeletonLoader";
import { GridBackground } from "@/components/GridBackground";
import type { Video, Note, Tag, AiOutput } from "@/types/api";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const CARD_GAP = 10;

const PURPLE = "#818cf8";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const ORANGE = "#f59e0b";
const PINK   = "#ec4899";
const BLUE   = "#3b82f6";

const AI_TOOLS: Array<{
  type: string; label: string; icon: FeatherIconName; color: string; desc: string;
}> = [
  { type: "summary",      label: "Summary",      icon: "file-text",    color: CYAN,   desc: "Concise overview of the video content" },
  { type: "key_insights", label: "Key Insights",  icon: "zap",          color: ORANGE, desc: "Most important takeaways" },
  { type: "mcq",          label: "Quiz (MCQ)",    icon: "check-circle", color: GREEN,  desc: "Test your knowledge" },
  { type: "ppt_outline",  label: "PPT Outline",   icon: "monitor",      color: BLUE,   desc: "Slide deck structure for presentation" },
  { type: "flashcards",   label: "Flashcards",    icon: "layers",       color: PINK,   desc: "Spaced repetition review cards" },
  { type: "notes",        label: "Study Notes",   icon: "book-open",    color: PURPLE, desc: "Organised bullet study notes" },
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


/* ── Thumbnail Player (web / fallback) ── */
function ThumbnailPlayer({ thumbnail, ytId, onOpenExternal }: { thumbnail?: string | null; ytId?: string | null; onOpenExternal: () => void }) {
  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : thumbnail;
  return (
    <TouchableOpacity onPress={onOpenExternal} activeOpacity={0.93} style={styles.player}>
      {thumbUrl ? (
        <Image source={{ uri: thumbUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#1a1a22", alignItems: "center", justifyContent: "center" }]}>
          <Feather name="film" size={40} color="rgba(139,92,246,0.3)" />
        </View>
      )}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.thumbCenter}>
        <View style={styles.playCircle}>
          <Feather name="play" size={24} color="#fff" />
        </View>
      </View>
      <View style={styles.watchOnYtRow}>
        <Feather name="youtube" size={13} color="#ff0000" />
        <Text style={styles.watchOnYtText}>Watch on YouTube</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ── Quick Action Pill ── */
function QuickPill({ label, icon, color, onPress }: { label: string; icon: FeatherIconName; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.quickPill, { borderColor: color + "55", backgroundColor: color + "12" }]}
    >
      <Feather name={icon} size={10} color={color} />
      <Text style={[styles.quickPillText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ── AI Tool Card (2-column) ── */
function AiToolCard({
  tool, index, existingOutput, onGenerate, isGenerating, onView,
}: {
  tool: typeof AI_TOOLS[0]; index: number;
  existingOutput?: AiOutput | null; onGenerate: () => void;
  isGenerating: boolean; onView: () => void;
}) {
  const done = !!existingOutput;
  const num = String(index + 1).padStart(2, "0");

  return (
    <MotiView
      animate={{
        borderColor: isGenerating
          ? tool.color + "70"
          : done
          ? GREEN + "45"
          : "rgba(255,255,255,0.08)",
        opacity: 1,
      }}
      from={{ opacity: 0 }}
      transition={isGenerating ? { type: "timing", duration: 900, loop: true } : { type: "timing", duration: 300 }}
      style={styles.toolCard}
    >
      <TouchableOpacity onPress={done ? onView : onGenerate} activeOpacity={0.78} style={styles.toolCardInner}>
        {/* Number badge + icon */}
        <View style={styles.toolCardTop}>
          <Text style={[styles.toolNum, { color: tool.color + "70" }]}>{num}</Text>
          <MotiView
            animate={{ backgroundColor: isGenerating ? tool.color + "35" : tool.color + "18" }}
            transition={{ type: "timing", duration: 500 }}
            style={[styles.toolIconBox, { borderColor: tool.color + "30" }]}
          >
            {isGenerating ? (
              <MotiView
                from={{ rotate: "0deg" }}
                animate={{ rotate: "360deg" }}
                transition={{ type: "timing", duration: 1200, loop: true }}
              >
                <Feather name="cpu" size={15} color={tool.color} />
              </MotiView>
            ) : (
              <Feather name={tool.icon} size={15} color={tool.color} />
            )}
          </MotiView>
        </View>

        {/* Title + desc */}
        <Text style={styles.toolLabel} numberOfLines={1}>{tool.label}</Text>
        <Text style={styles.toolDesc} numberOfLines={2}>{tool.desc}</Text>

        {/* Footer */}
        <View style={styles.toolCardFooter}>
          {isGenerating ? (
            <MotiView
              from={{ opacity: 0.5 }} animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 700, loop: true }}
              style={[styles.generatingPill, { borderColor: tool.color + "40", backgroundColor: tool.color + "15" }]}
            >
              <Text style={[styles.generatingPillText, { color: tool.color }]}>Generating…</Text>
            </MotiView>
          ) : done ? (
            <View style={styles.viewBadge}>
              <Feather name="arrow-right" size={10} color={PURPLE} />
              <Text style={[styles.viewBadgeText, { color: PURPLE }]}>VIEW</Text>
            </View>
          ) : (
            <View style={styles.genBadge}>
              <Feather name="zap" size={10} color="#fff" />
              <Text style={styles.genBadgeText}>GENERATE</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── AI Output Panel ── */
function AiOutputPanel({ output, tool, onClose, onRegenerate }: { output: AiOutput; tool: typeof AI_TOOLS[0]; onClose: () => void; onRegenerate: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280 }}
      style={styles.outputPanel}
    >
      <View style={styles.outputPanelHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[styles.outputPanelIcon, { backgroundColor: tool.color + "22" }]}>
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
    </MotiView>
  );
}

/* ── Note Item ── */
function NoteItem({ note, onDelete, onUpdate }: {
  note: Note; onDelete: () => void; onUpdate: (content: string, ts?: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editTs, setEditTs] = useState(
    note.timestamp != null
      ? `${Math.floor(note.timestamp / 60)}:${(note.timestamp % 60).toString().padStart(2, "0")}`
      : ""
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
          <Text style={styles.noteTsText}>
            {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, "0")}
          </Text>
        </View>
      )}
      {editing ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={editContent} onChangeText={setEditContent}
            style={styles.noteEditInput} multiline autoFocus
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          <TextInput
            value={editTs} onChangeText={setEditTs}
            placeholder="Timestamp (1:30)" placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.tsInput}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => { onUpdate(editContent.trim(), editTs.trim() ? parseTs(editTs) : null); setEditing(false); }}
              style={[styles.noteActionBtn, { backgroundColor: PURPLE }]}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Poppins_600SemiBold" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditing(false)}
              style={[styles.noteActionBtn, { backgroundColor: "rgba(255,255,255,0.08)" }]}
            >
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Poppins_500Medium" }}>Cancel</Text>
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

/* ═══════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════ */
export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<"ai" | "notes">("ai");
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [viewingOutput, setViewingOutput] = useState<{ output: AiOutput; tool: typeof AI_TOOLS[0] } | null>(null);
  const [newNote, setNewNote] = useState("");
  const [noteTs, setNoteTs] = useState("");
  const [showFolderPicker, setShowFolderPicker] = useState(false);

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

  const { data: foldersData } = useQuery({
    queryKey: ["folders"],
    queryFn: () => api.listFolders(),
  });
  const folders: Array<{ id: string; name: string; color?: string | null }> = foldersData?.folders ?? [];

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
      Alert.alert("Generation Failed", err.message || "Could not generate content.");
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: (data: { folderId?: string | null }) => api.updateVideo(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      qc.invalidateQueries({ queryKey: ["videos"] });
      setShowFolderPicker(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not move video."),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: () => api.deleteVideo(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      router.back();
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not delete video."),
  });

  const handleDeleteVideo = () => {
    Alert.alert(
      "Delete Video",
      "Remove this video from your vault permanently?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteVideoMutation.mutate() },
      ]
    );
  };

  const handleMoreOptions = () => {
    Alert.alert("Video Options", "", [
      { text: "Move to Folder", onPress: () => setShowFolderPicker(true) },
      { text: "Delete Video", style: "destructive", onPress: handleDeleteVideo },
      { text: "Cancel", style: "cancel" },
    ]);
  };

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

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const aiOutputMap: Record<string, AiOutput> = Object.fromEntries(
    ((aiOutputsData as any)?.outputs || video?.aiOutputs || []).map((o: AiOutput) => [o.type, o])
  );
  const aiCount = Object.keys(aiOutputMap).length;

  // Quick action pills: tools that already have generated output
  const quickPills = AI_TOOLS.filter((t) => aiOutputMap[t.type]);

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <GridBackground />
        <View style={{ aspectRatio: 16 / 9, backgroundColor: colors.card }} />
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton height={22} width="80%" borderRadius={4} />
          <Skeleton height={14} width="45%" borderRadius={4} />
          <Skeleton height={44} borderRadius={4} style={{ marginTop: 8 }} />
          {[1, 2, 3].map((i) => <Skeleton key={i} height={68} borderRadius={4} />)}
        </View>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <GridBackground />
        <Text style={{ color: colors.mutedForeground, fontFamily: "JetBrainsMono_400Regular" }}>VIDEO_NOT_FOUND</Text>
      </View>
    );
  }

  const ytId = extractYouTubeId(video.url || "");
  const useWebView = !!ytId;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Top nav */}
      <TopAppBar
        showBack
        title={video.title}
        rightAction={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <AppButton
              icon="heart"
              size="xs"
              variant={video.isFavorite ? "danger" : "ghost"}
              onPress={() => favMutation.mutate()}
            />
            <AppButton
              icon="more-horizontal"
              size="xs"
              variant="ghost"
              onPress={handleMoreOptions}
            />
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botInset + 28 }}>

        {/* Player */}
        {useWebView ? (
          <YouTubePlayer ytId={ytId!} onOpenExternal={handleOpenYouTube} />
        ) : (
          <ThumbnailPlayer thumbnail={video.thumbnail} ytId={ytId} onOpenExternal={handleOpenYouTube} />
        )}

        {/* Info block */}
        <View style={[styles.infoBlock, { borderBottomColor: colors.border }]}>
          <Text style={[styles.videoTitle, { color: colors.foreground }]}>{video.title}</Text>

          <View style={styles.metaRow}>
            {video.channelName && (
              <View style={[styles.metaChip, { backgroundColor: PURPLE + "10", borderColor: PURPLE + "25" }]}>
                <Feather name="music" size={10} color={PURPLE} />
                <Text style={[styles.metaChipText, { color: PURPLE }]}>{video.channelName.toUpperCase()}</Text>
              </View>
            )}
            {video.duration && (
              <View style={[styles.metaChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="clock" size={10} color={colors.mutedForeground} />
                <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>{video.duration}</Text>
              </View>
            )}
            {(video as any).folder && (
              <TouchableOpacity
                onPress={() => setShowFolderPicker(true)}
                style={[styles.metaChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Feather name="folder" size={10} color={colors.mutedForeground} />
                <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>{(video as any).folder.name}</Text>
              </TouchableOpacity>
            )}
            {!(video as any).folder && (
              <TouchableOpacity
                onPress={() => setShowFolderPicker(true)}
                style={[styles.metaChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Feather name="folder-plus" size={10} color={colors.mutedForeground} />
                <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>Add to folder</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tag pills */}
          {video.tags && video.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {video.tags.map((tag: Tag) => (
                <View key={tag.id} style={[styles.tagPill, { backgroundColor: (tag.color || PURPLE) + "18", borderColor: (tag.color || PURPLE) + "35" }]}>
                  <Text style={[styles.tagPillText, { color: tag.color || PURPLE }]}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick action pills — show shortcuts to already-generated outputs */}
          {quickPills.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
              {quickPills.map((tool) => (
                <QuickPill
                  key={tool.type}
                  label={tool.label.toUpperCase()}
                  icon={tool.icon}
                  color={tool.color}
                  onPress={() => {
                    const out = aiOutputMap[tool.type];
                    if (out) { setViewingOutput({ output: out, tool }); setActiveTab("ai"); }
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(["ai", "notes"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, {
                backgroundColor: activeTab === tab ? PURPLE + "18" : colors.card,
                borderColor: activeTab === tab ? PURPLE + "40" : colors.border,
              }]}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === tab ? PURPLE : colors.mutedForeground }]}>
                {tab === "ai"
                  ? `AI INSIGHTS${aiCount > 0 ? ` (${aiCount})` : ""}`
                  : `MY NOTES${video.notes?.length ? ` (${video.notes.length})` : ""}`}
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
                onRegenerate={() => { setViewingOutput(null); handleGenerate(viewingOutput.tool.type); }}
              />
            ) : (
              <>
                <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>// AI_GENERATE</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a Tool</Text>
                <View style={styles.toolGrid}>
                  {[0, 2, 4].map((rowStart) => (
                    <View key={rowStart} style={styles.toolRow}>
                      {AI_TOOLS.slice(rowStart, rowStart + 2).map((tool, i) => (
                        <View key={tool.type} style={{ flex: 1 }}>
                          <AiToolCard
                            tool={tool}
                            index={rowStart + i}
                            existingOutput={aiOutputMap[tool.type]}
                            isGenerating={generatingType === tool.type}
                            onGenerate={() => handleGenerate(tool.type)}
                            onView={() => {
                              const out = aiOutputMap[tool.type];
                              if (out) setViewingOutput({ output: out, tool });
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
                {generatingType && (
                  <MotiView
                    from={{ opacity: 0, translateY: 6 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 300 }}
                    style={styles.generatingBanner}
                  >
                    <MotiView
                      from={{ rotate: "0deg" }}
                      animate={{ rotate: "360deg" }}
                      transition={{ type: "timing", duration: 1400, loop: true }}
                    >
                      <Feather name="cpu" size={14} color={PURPLE} />
                    </MotiView>
                    <Text style={styles.generatingText}>AI is generating your content…</Text>
                  </MotiView>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Notes Tab ── */}
        {activeTab === "notes" && (
          <View style={styles.section}>
            <View style={[styles.noteInputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={newNote} onChangeText={setNewNote}
                placeholder="Add a note about this video…"
                placeholderTextColor={colors.mutedForeground}
                multiline style={[styles.noteInput, { color: colors.foreground }]}
              />
              <View style={styles.noteInputFooter}>
                <TextInput
                  value={noteTs} onChangeText={setNoteTs}
                  placeholder="Timestamp (1:30)"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.tsInput, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                  keyboardType="numbers-and-punctuation"
                />
                <AppButton
                  icon="plus"
                  size="xs"
                  variant={newNote.trim() ? "primary" : "ghost"}
                  onPress={handleAddNote}
                  disabled={!newNote.trim()}
                />
              </View>
            </View>

            {(!video.notes || video.notes.length === 0) ? (
              <View style={{ alignItems: "center", paddingVertical: 36 }}>
                <View style={[styles.emptyNoteIcon, { backgroundColor: PURPLE + "10", borderColor: PURPLE + "20" }]}>
                  <Feather name="edit-3" size={22} color={PURPLE + "80"} />
                </View>
                <Text style={[styles.emptyNoteText, { color: colors.mutedForeground }]}>No notes yet</Text>
                <Text style={[styles.emptyNoteSub, { color: colors.mutedForeground + "80" }]}>Capture your thoughts above</Text>
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

      {/* ── Move to Folder Modal ── */}
      <Modal visible={showFolderPicker} transparent animationType="fade" onRequestClose={() => setShowFolderPicker(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFolderPicker(false)}>
          <View style={[styles.folderPickerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.folderPickerHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.folderPickerIcon, { backgroundColor: PURPLE + "15", borderColor: PURPLE + "30" }]}>
                  <Feather name="folder" size={15} color={PURPLE} />
                </View>
                <Text style={[styles.folderPickerTitle, { color: colors.foreground }]}>Move to Folder</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFolderPicker(false)}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {/* No folder option */}
              <TouchableOpacity
                onPress={() => updateVideoMutation.mutate({ folderId: null })}
                style={[styles.folderPickerItem, { borderBottomColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                <Text style={[styles.folderPickerItemText, { color: colors.mutedForeground }]}>Remove from folder</Text>
                {!(video as any).folder && (
                  <Feather name="check" size={14} color={PURPLE} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
              {folders.map((f) => {
                const dotColor = f.color || PURPLE;
                const isCurrent = (video as any).folder?.id === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => updateVideoMutation.mutate({ folderId: f.id })}
                    style={[styles.folderPickerItem, { borderBottomColor: colors.border }]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.folderColorDot, { backgroundColor: dotColor }]} />
                    <Text style={[styles.folderPickerItemText, { color: colors.foreground }]}>{f.name}</Text>
                    {isCurrent && (
                      <Feather name="check" size={14} color={PURPLE} style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {folders.length === 0 && (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Text style={[styles.folderPickerEmpty, { color: colors.mutedForeground }]}>No folders yet. Create one in the Folders tab.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ═══ STYLES ═══ */
const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Nav */
  nav: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { padding: 10, width: 44, alignItems: "center" },
  navTitle: {
    flex: 1, fontSize: 15, fontFamily: "Poppins_600SemiBold",
    textAlign: "center", letterSpacing: -0.2,
  },

  /* Player */
  player: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", position: "relative" },
  ytExtBtn: {
    position: "absolute", bottom: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  ytExtText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  thumbCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  playCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(139,92,246,0.85)",
    alignItems: "center", justifyContent: "center",
    shadowColor: PURPLE, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  watchOnYtRow: {
    position: "absolute", bottom: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  watchOnYtText: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  embedErrTitle: { color: "#fff", fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  embedErrSub: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 4 },
  embedErrBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#ef4444",
    borderRadius: 6, marginTop: 12,
  },
  embedErrBtnText: { color: "#fff", fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.2 },

  /* Info */
  infoBlock: { padding: 16, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  videoTitle: { fontSize: 17, fontFamily: "AlegreyaSansSC_700Bold", lineHeight: 26, letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1,
  },
  metaChipText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1 },
  tagPillText: { fontSize: 10, fontFamily: "Poppins_500Medium", letterSpacing: 0.3 },

  /* Quick pills */
  quickPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  quickPillText: { fontSize: 9, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.2 },

  /* Tabs */
  tabRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, borderWidth: 1 },
  tabBtnText: { fontSize: 10, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.1 },

  /* Section */
  section: { padding: 16, gap: 12 },
  sectionEyebrow: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2.5 },
  sectionTitle: { fontSize: 18, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.3, marginTop: -4, marginBottom: 4 },

  /* Tool grid */
  toolGrid: { flexDirection: "column", gap: CARD_GAP },
  toolRow: { flexDirection: "row", gap: CARD_GAP },
  toolCard: {
    backgroundColor: "#13131a", borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", minHeight: 148,
  },
  toolCardInner: { flex: 1, padding: 12, justifyContent: "space-between" },
  toolCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  toolNum: { fontSize: 11, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1 },
  toolIconBox: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  toolLabel: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#fff", letterSpacing: 0 },
  toolDesc: { fontSize: 10, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.38)", lineHeight: 14 },
  toolCardFooter: { paddingTop: 4 },
  generatingPill: {
    alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
  },
  generatingPillText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
  viewBadge: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 4, borderWidth: 1, borderColor: PURPLE + "40",
    backgroundColor: PURPLE + "12",
  },
  viewBadgeText: { fontSize: 9, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 0.5 },
  genBadge: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 4, backgroundColor: PURPLE,
  },
  genBadgeText: { fontSize: 9, fontFamily: "JetBrainsMono_600SemiBold", color: "#fff", letterSpacing: 0.5 },
  viewBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: PURPLE + "18", borderRadius: 6, borderWidth: 1, borderColor: PURPLE + "30",
  },
  viewBtnText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: PURPLE },
  genBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 5, backgroundColor: PURPLE, borderRadius: 6,
  },
  genBtnText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "#fff" },

  /* Generating banner */
  generatingBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: PURPLE + "12", borderWidth: 1, borderColor: PURPLE + "30",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  generatingText: { fontSize: 12, fontFamily: "Poppins_500Medium", color: PURPLE },

  /* Output Panel */
  outputPanel: {
    backgroundColor: "#13131a", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden", maxHeight: 480,
  },
  outputPanelHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)",
  },
  outputPanelIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  outputPanelTitle: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#fff" },
  regenBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: PURPLE + "18", borderWidth: 1, borderColor: PURPLE + "30",
    alignItems: "center", justifyContent: "center",
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center",
  },
  outputScroll: { padding: 16, maxHeight: 400 },
  outputText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.82)", lineHeight: 22 },
  outputDate: { marginTop: 14, fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.25)", letterSpacing: 0.5 },

  /* Notes */
  noteInputCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  noteInput: { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 21, minHeight: 56, textAlignVertical: "top" },
  noteInputFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  tsInput: {
    flex: 1, borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 12, fontFamily: "JetBrainsMono_400Regular",
  },
  noteAddBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  noteCard: {
    backgroundColor: "#13131a", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    padding: 14, gap: 8,
  },
  noteTsBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    backgroundColor: PURPLE + "15", borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: PURPLE + "25",
  },
  noteTsText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: PURPLE },
  noteContent: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  noteFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  noteDate: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.25)" },
  noteEditInput: {
    color: "#fff", fontFamily: "Poppins_400Regular", fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 10,
    minHeight: 60, textAlignVertical: "top", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  noteActionBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },

  emptyNoteIcon: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  emptyNoteText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  emptyNoteSub: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 4 },

  iconActionBtn: {
    width: 34, height: 34, borderRadius: 6,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },

  modalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  folderPickerBox: {
    width: "100%", maxWidth: 420, borderRadius: 14,
    borderWidth: 1, overflow: "hidden",
  },
  folderPickerHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1,
  },
  folderPickerIcon: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  folderPickerTitle: { fontSize: 14, fontFamily: "Poppins_600SemiBold", letterSpacing: -0.2 },
  folderPickerItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  folderPickerItemText: { fontSize: 14, fontFamily: "Poppins_500Medium", flex: 1 },
  folderColorDot: { width: 10, height: 10, borderRadius: 5 },
  folderPickerEmpty: { fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 20 },
});
