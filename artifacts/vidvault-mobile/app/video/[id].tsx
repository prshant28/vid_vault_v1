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
  Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polygon } from "react-native-svg";
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

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const ORANGE = "#f59e0b";
const PINK   = "#ec4899";
const BLUE   = "#3b82f6";

const AI_TOOLS: Array<{
  type: string; label: string; icon: FeatherIconName; color: string; desc: string;
}> = [
  { type: "summary",        label: "Summary",        icon: "file-text",    color: CYAN,   desc: "Concise overview of the video content" },
  { type: "key_insights",   label: "Key Insights",   icon: "zap",          color: ORANGE, desc: "Most important takeaways" },
  { type: "mcq",            label: "Quiz (MCQ)",     icon: "check-circle", color: GREEN,  desc: "Test your knowledge with 10 MCQs" },
  { type: "flashcards",     label: "Flashcards",     icon: "layers",       color: PINK,   desc: "15 spaced-repetition cards" },
  { type: "notes",          label: "Study Notes",    icon: "book-open",    color: PURPLE, desc: "Organised bullet study notes" },
  { type: "action_plan",    label: "Action Plan",    icon: "target",       color: GREEN,  desc: "30-60-90 day implementation plan" },
  { type: "tweet_thread",   label: "Tweet Thread",   icon: "twitter",      color: BLUE,   desc: "Shareable 10-tweet thread" },
  { type: "blog_article",   label: "Blog Article",   icon: "edit",         color: ORANGE, desc: "700-900 word blog post" },
  { type: "vocabulary",     label: "Vocabulary",     icon: "book",         color: CYAN,   desc: "Key terms and definitions" },
  { type: "executive_brief",label: "Exec Brief",     icon: "briefcase",    color: PINK,   desc: "2-minute executive summary" },
  { type: "ppt_outline",    label: "PPT Outline",    icon: "monitor",      color: PURPLE, desc: "8-12 slide deck structure" },
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

/* ── AI Tool Card (etched-slab, matches web app) ── */
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
          ? tool.color + "55"
          : done
          ? tool.color + "45"
          : "rgba(255,255,255,0.04)",
        opacity: 1,
      }}
      from={{ opacity: 0 }}
      transition={isGenerating ? { type: "timing", duration: 900, loop: true } : { type: "timing", duration: 300 }}
      style={styles.toolCard}
    >
      <TouchableOpacity onPress={done ? onView : onGenerate} activeOpacity={0.85} style={styles.toolCardInner}>

        {/* Etch overlay — simulates web's inset rgba(255,255,255,0.07) top-left + rgba(0,0,0,0.5) bottom-right */}
        <LinearGradient
          colors={["rgba(255,255,255,0.07)", "transparent", "rgba(0,0,0,0.35)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Bottom-right accent glow — visible when done or generating */}
        {(done || isGenerating) && (
          <View style={styles.toolGlowCorner} pointerEvents="none">
            <View style={[styles.toolGlowCircle, { backgroundColor: tool.color + "28" }]} />
          </View>
        )}

        {/* Number code (top-left) + bare icon (top-right) — exact web layout */}
        <View style={styles.toolCardTop}>
          <Text style={styles.toolNum}>{num}</Text>
          <MotiView
            animate={{ opacity: isGenerating ? 1.0 : done ? 0.85 : 0.4 }}
            transition={{ type: "timing", duration: 400 }}
          >
            {isGenerating ? (
              <MotiView
                from={{ rotate: "0deg" }}
                animate={{ rotate: "360deg" }}
                transition={{ type: "timing", duration: 1200, loop: true }}
              >
                <Feather name="cpu" size={14} color={tool.color} />
              </MotiView>
            ) : (
              <Feather name={tool.icon} size={14} color={tool.color} />
            )}
          </MotiView>
        </View>

        {/* Tool name — mono, tiny, uppercase, tool color at 60% */}
        <Text style={[styles.toolLabel, { color: tool.color + "99" }]} numberOfLines={1}>
          {tool.label}
        </Text>

        {/* Description — mono, 8px, very muted */}
        <Text style={styles.toolDesc} numberOfLines={2}>{tool.desc}</Text>

        {/* Footer badge */}
        <View style={styles.toolCardFooter}>
          {isGenerating ? (
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 600, loop: true }}
            >
              <ToolBadge label="WORKING…" icon="cpu" color={tool.color} />
            </MotiView>
          ) : done ? (
            <ToolBadge label="VIEW" icon="arrow-right" color={tool.color} />
          ) : (
            <ToolBadge label="GENERATE" icon="zap" color={tool.color} dimmed />
          )}
        </View>

        {/* Glow pulse ring on generating */}
        {isGenerating && (
          <MotiView
            from={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 0.6, scale: 1.0 }}
            transition={{ type: "timing", duration: 900, loop: true }}
            style={[StyleSheet.absoluteFillObject, {
              borderRadius: 14, borderWidth: 1.5, borderColor: tool.color,
              pointerEvents: "none",
            } as any]}
          />
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Tool Badge (cut-corner style matching AppButton) ── */
function ToolBadge({ label, icon, color, dimmed }: { label: string; icon: FeatherIconName; color: string; dimmed?: boolean }) {
  const h = 26;
  const cut = 6;
  const approxW = label.length * 7.2 + 34;
  const fillColor = dimmed ? color + "0a" : color + "1c";
  const strokeColor = dimmed ? color + "28" : color + "55";
  const pts = `${cut},0 ${approxW},0 ${approxW},${h - cut} ${approxW - cut},${h} 0,${h} 0,${cut}`;
  return (
    <View style={{ width: approxW, height: h }}>
      <Svg width={approxW} height={h} style={StyleSheet.absoluteFillObject}>
        <Polygon points={pts} fill={fillColor} stroke={strokeColor} strokeWidth={1} />
      </Svg>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <Feather name={icon} size={8} color={dimmed ? color + "99" : color} />
        <Text style={{ fontSize: 8, fontFamily: "JetBrainsMono_600SemiBold", color: dimmed ? color + "99" : color, letterSpacing: 1 }}>{label}</Text>
      </View>
    </View>
  );
}

/* ── AI Output Panel (full-screen) ── */
function AiOutputPanel({ output, tool, videoTitle, onClose, onRegenerate }: {
  output: AiOutput; tool: typeof AI_TOOLS[0];
  videoTitle?: string; onClose: () => void; onRegenerate: () => void;
}) {
  const insets = useSafeAreaInsets();
  const wordCount = output.content.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(wordCount / 200));
  const generatedDate = new Date(output.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${videoTitle || "Video"} — ${tool.label}\n\n${output.content}\n\nGenerated by VidVault AI`,
        title: `${tool.label} — ${videoTitle || "Video"}`,
      });
    } catch { }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: 24 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 280 }}
      style={{ flex: 1, backgroundColor: "#09090e" }}
    >
      {/* Header bar */}
      <View style={[styles.outputFullHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={styles.outputBackRow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={15} color={tool.color} />
          <Text style={[styles.outputBackLabel, { color: tool.color }]}>TOOLS</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={onRegenerate} style={styles.outputIconBtn} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="refresh-cw" size={14} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.outputIconBtn} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="share-2" size={14} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tool identity + stats */}
      <View style={[styles.outputToolHeader, { borderBottomColor: "rgba(255,255,255,0.06)" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <View style={[styles.outputToolIcon, { backgroundColor: tool.color + "22", borderColor: tool.color + "30" }]}>
            <Feather name={tool.icon} size={20} color={tool.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.outputToolName}>{tool.label}</Text>
            {videoTitle ? <Text style={styles.outputToolSub} numberOfLines={1}>{videoTitle}</Text> : null}
          </View>
        </View>
        <View style={{ gap: 5, alignItems: "flex-end" }}>
          <View style={[styles.outputStatChip, { borderColor: tool.color + "35", backgroundColor: tool.color + "10" }]}>
            <Text style={[styles.outputStatText, { color: tool.color }]}>{wordCount} words</Text>
          </View>
          <View style={[styles.outputStatChip, { borderColor: "rgba(255,255,255,0.08)" }]}>
            <Text style={[styles.outputStatText, { color: "rgba(255,255,255,0.3)" }]}>{readMins} min read</Text>
          </View>
        </View>
      </View>

      {/* Generated date strip */}
      <View style={styles.outputDateStrip}>
        <Feather name="calendar" size={9} color="rgba(255,255,255,0.2)" />
        <Text style={styles.outputDateText}>Generated {generatedDate}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.outputFullText}>{output.content}</Text>
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

  const [activeTab, setActiveTab] = useState<"ai" | "notes" | "chat">("ai");
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [viewingOutput, setViewingOutput] = useState<{ output: AiOutput; tool: typeof AI_TOOLS[0] } | null>(null);
  const [newNote, setNewNote] = useState("");
  const [noteTs, setNoteTs] = useState("");
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  /* Chat state */
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; id: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  const { data: video, isLoading, isError, refetch: refetchVideo } = useQuery<Video>({
    queryKey: ["video", id],
    queryFn: () => api.getVideo(id!),
    enabled: !!id,
    retry: 1,
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

  const { data: allTagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.listTags(),
  });
  const allTags: Tag[] = allTagsData?.tags ?? [];

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
    mutationFn: (data: { folderId?: string | null; title?: string }) => api.updateVideo(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["video", id] });
      qc.invalidateQueries({ queryKey: ["videos"] });
      setShowFolderPicker(false);
      setEditingTitle(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not update video."),
  });

  const addTagMutation = useMutation({
    mutationFn: (tagId: string) => api.addTagToVideo(id!, tagId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["video", id] }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => api.removeTagFromVideo(id!, tagId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["video", id] }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
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
      { text: "Edit Title", onPress: () => { setTitleValue(video?.title ?? ""); setEditingTitle(true); } },
      { text: "Manage Tags", onPress: () => setShowTagPicker(true) },
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

  const quickAnalyzeMutation = useMutation({
    mutationFn: () => api.quickAnalyzeVideo(id!),
    onSuccess: () => {
      refetchOutputs();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert("Analysis Failed", err.message || "Could not analyse video."),
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      api.videoChat(message, id!, chatMessages.map((m) => ({ role: m.role, content: m.content }))),
    onMutate: (message: string) => {
      const userMsg = { role: "user" as const, content: message, id: Date.now().toString() };
      setChatMessages((prev) => [...prev, userMsg]);
      setChatInput("");
    },
    onSuccess: (data: any) => {
      const reply = data?.message || "Sorry, I couldn't generate a response.";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply, id: Date.now().toString() + "_ai" }]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: () => {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't connect to AI right now.", id: Date.now().toString() + "_err" }]);
    },
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
        <TopAppBar showBack title="Loading…" />
        {/* Video player skeleton */}
        <MotiView
          from={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 900, loop: true }}
          style={{ aspectRatio: 16 / 9, backgroundColor: colors.card, marginHorizontal: 0 }}
        />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} scrollEnabled={false}>
          {/* Title + meta */}
          <Skeleton height={24} width="85%" borderRadius={6} />
          <Skeleton height={14} width="50%" borderRadius={4} style={{ marginTop: 2 }} />
          {/* Quick action pills skeleton */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={28} width={72} borderRadius={14} />)}
          </View>
          {/* Description skeleton */}
          <Skeleton height={52} borderRadius={8} style={{ marginTop: 4 }} />
          {/* AI tool cards skeleton - 3 columns */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={76} width="30%" borderRadius={10} />
            ))}
          </View>
          {/* Notes skeleton */}
          <Skeleton height={20} width="35%" borderRadius={4} style={{ marginTop: 8 }} />
          {[1, 2].map((i) => <Skeleton key={i} height={72} borderRadius={8} />)}
        </ScrollView>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <GridBackground />
        <TopAppBar showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 4, borderWidth: 1,
            borderColor: colors.border, backgroundColor: colors.card,
            alignItems: "center", justifyContent: "center",
          }}>
            <Feather name="film" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 22, color: colors.foreground, textAlign: "center" }}>
            {isError ? "Failed to load" : "Video not found"}
          </Text>
          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
            {isError
              ? "Could not fetch this video. Check your connection and try again."
              : "This video may have been deleted or belongs to a different account."}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            {isError && (
              <AppButton label="RETRY" icon="refresh-cw" size="sm" variant="primary" onPress={() => refetchVideo()} />
            )}
            <AppButton label="BACK" icon="arrow-left" size="sm" variant="ghost" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  const ytId = extractYouTubeId(video.url || "");
  const useWebView = !!ytId;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {viewingOutput ? (
        <AiOutputPanel
          output={viewingOutput.output}
          tool={viewingOutput.tool}
          videoTitle={video?.title}
          onClose={() => setViewingOutput(null)}
          onRegenerate={() => { setViewingOutput(null); handleGenerate(viewingOutput.tool.type); }}
        />
      ) : (
        <>

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
          {/* Title — tap to edit */}
          {editingTitle ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <TextInput
                value={titleValue}
                onChangeText={setTitleValue}
                style={[styles.titleInput, { color: colors.foreground, borderColor: PURPLE + "60", backgroundColor: colors.card }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => { if (titleValue.trim()) updateVideoMutation.mutate({ title: titleValue.trim() }); else setEditingTitle(false); }}
              />
              <TouchableOpacity onPress={() => { if (titleValue.trim()) updateVideoMutation.mutate({ title: titleValue.trim() }); }} activeOpacity={0.8}>
                <Feather name="check" size={18} color={PURPLE} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingTitle(false)} activeOpacity={0.8}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setTitleValue(video.title); setEditingTitle(true); }} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <Text style={[styles.videoTitle, { color: colors.foreground, flex: 1 }]}>{video.title}</Text>
              <Feather name="edit-2" size={14} color={colors.mutedForeground + "80"} style={{ marginTop: 4 }} />
            </TouchableOpacity>
          )}

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
            {video.folderName ? (
              <TouchableOpacity
                onPress={() => setShowFolderPicker(true)}
                style={[styles.metaChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Feather name="folder" size={10} color={PURPLE} />
                <Text style={[styles.metaChipText, { color: PURPLE }]}>{video.folderName}</Text>
              </TouchableOpacity>
            ) : (
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

          {/* Tag pills + Add Tag chip */}
          <View style={[styles.tagsRow, { flexWrap: "wrap" }]}>
            {(video.tags ?? []).map((tag: Tag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => Alert.alert(`Remove tag "${tag.name}"?`, "", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Remove", style: "destructive", onPress: () => removeTagMutation.mutate(tag.id) },
                ])}
                style={[styles.tagPill, { backgroundColor: (tag.color || PURPLE) + "18", borderColor: (tag.color || PURPLE) + "35" }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.tagPillText, { color: tag.color || PURPLE }]}>{tag.name}</Text>
                <Feather name="x" size={9} color={tag.color || PURPLE} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowTagPicker(true)}
              style={[styles.tagPill, { backgroundColor: colors.card, borderColor: colors.border, borderStyle: "dashed" }]}
              activeOpacity={0.75}
            >
              <Feather name="tag" size={9} color={colors.mutedForeground} />
              <Text style={[styles.tagPillText, { color: colors.mutedForeground }]}>Add Tag</Text>
            </TouchableOpacity>
          </View>

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
          {([
            { key: "ai",    label: `AI TOOLS${aiCount > 0 ? ` (${aiCount})` : ""}`, icon: "cpu"       },
            { key: "chat",  label: "AI CHAT",    icon: "message-circle" },
            { key: "notes", label: `NOTES${video.notes?.length ? ` (${video.notes.length})` : ""}`, icon: "edit-3" },
          ] as const).map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={[styles.tabBtn, {
                backgroundColor: activeTab === key ? PURPLE + "18" : colors.card,
                borderColor: activeTab === key ? PURPLE + "40" : colors.border,
                flex: 1,
              }]}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name={icon} size={10} color={activeTab === key ? PURPLE : colors.mutedForeground} />
                <Text style={[styles.tabBtnText, { color: activeTab === key ? PURPLE : colors.mutedForeground }]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── AI Tab ── */}
        {activeTab === "ai" && (
          <View style={styles.section}>
            <>
                {/* Quick Analyze Banner */}
                {aiCount === 0 && (
                  <TouchableOpacity
                    onPress={() => quickAnalyzeMutation.mutate()}
                    disabled={quickAnalyzeMutation.isPending}
                    activeOpacity={0.85}
                    style={[styles.quickAnalyzeBtn, { borderColor: CYAN + "45", backgroundColor: CYAN + "0f" }]}
                  >
                    <LinearGradient
                      colors={["rgba(6,182,212,0.08)", "transparent"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                      pointerEvents="none"
                    />
                    {quickAnalyzeMutation.isPending ? (
                      <MotiView from={{ rotate: "0deg" }} animate={{ rotate: "360deg" }} transition={{ type: "timing", duration: 1200, loop: true }}>
                        <Feather name="cpu" size={16} color={CYAN} />
                      </MotiView>
                    ) : (
                      <Feather name="zap" size={16} color={CYAN} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.quickAnalyzeTitle, { color: CYAN }]}>
                        {quickAnalyzeMutation.isPending ? "Analysing with AI…" : "Quick Analyse"}
                      </Text>
                      <Text style={[styles.quickAnalyzeSub, { color: colors.mutedForeground }]}>
                        Generate Summary + Key Insights instantly
                      </Text>
                    </View>
                    {!quickAnalyzeMutation.isPending && <Feather name="chevron-right" size={14} color={CYAN + "80"} />}
                  </TouchableOpacity>
                )}

                <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>// AI_TOOLS</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {aiCount > 0 ? `${aiCount} Generated` : "Choose a Tool"}
                </Text>
                <View style={styles.toolGrid}>
                  {Array.from({ length: Math.ceil(AI_TOOLS.length / 2) }, (_, rowIdx) => rowIdx * 2).map((rowStart) => (
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
                      {rowStart + 1 >= AI_TOOLS.length && AI_TOOLS.length % 2 !== 0 && <View style={{ flex: 1 }} />}
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
          </View>
        )}

        {/* ── Chat Tab ── */}
        {activeTab === "chat" && (
          <View style={[styles.section, { minHeight: 400 }]}>
            <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>// AI_CHAT</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Chat About This Video</Text>

            {/* Chat messages */}
            <View style={{ gap: 10, marginBottom: 12 }}>
              {chatMessages.length === 0 && (
                <View style={[styles.chatEmptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="message-circle" size={24} color={PURPLE + "60"} />
                  <Text style={[styles.chatEmptyTitle, { color: colors.foreground }]}>Ask anything about this video</Text>
                  <Text style={[styles.chatEmptySub, { color: colors.mutedForeground }]}>AI has context about the video title, channel, and description</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4, justifyContent: "center" }}>
                    {["Summarise this video", "What are the key takeaways?", "Who is this video for?"].map((q) => (
                      <TouchableOpacity
                        key={q}
                        onPress={() => { setChatInput(q); }}
                        style={[styles.chatSuggestion, { backgroundColor: PURPLE + "12", borderColor: PURPLE + "30" }]}
                        activeOpacity={0.75}
                      >
                        <Text style={{ color: PURPLE, fontSize: 11, fontFamily: "Poppins_500Medium" }}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    msg.role === "user"
                      ? { alignSelf: "flex-end", backgroundColor: PURPLE, borderBottomRightRadius: 4 }
                      : { alignSelf: "flex-start", backgroundColor: colors.card, borderColor: colors.border, borderBottomLeftRadius: 4 },
                  ]}
                >
                  {msg.role === "assistant" && (
                    <View style={styles.chatAiLabel}>
                      <Feather name="cpu" size={9} color={CYAN} />
                      <Text style={{ color: CYAN, fontSize: 8, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1 }}>GEMINI</Text>
                    </View>
                  )}
                  <Text style={[styles.chatBubbleText, { color: msg.role === "user" ? "#fff" : colors.foreground }]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
              {chatMutation.isPending && (
                <MotiView
                  from={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "timing", duration: 600, loop: true }}
                  style={[styles.chatBubble, { alignSelf: "flex-start", backgroundColor: colors.card, borderColor: PURPLE + "30" }]}
                >
                  <Feather name="cpu" size={12} color={PURPLE} />
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Poppins_400Regular" }}>Thinking…</Text>
                </MotiView>
              )}
            </View>

            {/* Input */}
            <View style={[styles.chatInputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about this video…"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.chatInput, { color: colors.foreground }]}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={() => { if (chatInput.trim()) chatMutation.mutate(chatInput.trim()); }}
                disabled={!chatInput.trim() || chatMutation.isPending}
                style={[styles.chatSendBtn, { backgroundColor: chatInput.trim() ? PURPLE : colors.border }]}
                activeOpacity={0.8}
              >
                <Feather name="send" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
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
        </>
      )}

      {/* ── Tag Picker Modal ── */}
      <Modal visible={showTagPicker} transparent animationType="fade" onRequestClose={() => setShowTagPicker(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTagPicker(false)}>
          <View style={[styles.folderPickerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.folderPickerHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.folderPickerIcon, { backgroundColor: PURPLE + "15", borderColor: PURPLE + "30" }]}>
                  <Feather name="tag" size={15} color={PURPLE} />
                </View>
                <Text style={[styles.folderPickerTitle, { color: colors.foreground }]}>Manage Tags</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTagPicker(false)}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {allTags.length === 0 ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Text style={[styles.folderPickerEmpty, { color: colors.mutedForeground }]}>No tags yet. Create tags in the Profile tab.</Text>
                </View>
              ) : (
                allTags.map((tag) => {
                  const videoTagIds = (video?.tags ?? []).map((t: Tag) => t.id);
                  const isAttached = videoTagIds.includes(tag.id);
                  const dotColor = tag.color || PURPLE;
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => isAttached ? removeTagMutation.mutate(tag.id) : addTagMutation.mutate(tag.id)}
                      style={[styles.folderPickerItem, { borderBottomColor: colors.border }]}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.folderColorDot, { backgroundColor: dotColor }]} />
                      <Text style={[styles.folderPickerItemText, { color: colors.foreground }]}>{tag.name}</Text>
                      {isAttached
                        ? <Feather name="check-circle" size={16} color={PURPLE} style={{ marginLeft: "auto" as any }} />
                        : <Feather name="circle" size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" as any }} />
                      }
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
                {!video.folderName && (
                  <Feather name="check" size={14} color={PURPLE} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
              {folders.map((f) => {
                const dotColor = f.color || PURPLE;
                const isCurrent = video.folderId === f.id;
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
  titleInput: {
    flex: 1, fontSize: 16, fontFamily: "AlegreyaSansSC_700Bold",
    lineHeight: 24, letterSpacing: -0.3,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1.5, borderRadius: 6,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1,
  },
  metaChipText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, borderWidth: 1 },
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
  sectionTitle: {
    fontSize: 14, fontFamily: "AlegreyaSansSC_800ExtraBold",
    letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2, marginBottom: 8,
  },

  /* Tool grid — exact etched-slab from web CSS */
  toolGrid: { flexDirection: "column", gap: CARD_GAP },
  toolRow: { flexDirection: "row", gap: CARD_GAP },
  toolCard: {
    backgroundColor: "#111115",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff12",
    minHeight: 142,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  toolCardInner: { flex: 1, padding: 14, justifyContent: "space-between" },
  toolCardTop: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 10,
  },
  toolNum: {
    fontSize: 9, fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5, color: "rgba(255,255,255,0.2)",
  },
  toolLabel: {
    fontSize: 11, fontFamily: "JetBrainsMono_600SemiBold",
    letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5,
  },
  toolDesc: {
    fontSize: 9, fontFamily: "JetBrainsMono_400Regular",
    color: "#505060", lineHeight: 14, letterSpacing: 0.2,
  },
  toolCardFooter: { paddingTop: 8 },

  /* Glow corner (web etched-slab radial gradient effect) */
  toolGlowCorner: {
    position: "absolute", bottom: 0, right: 0,
    width: 72, height: 72,
  },
  toolGlowCircle: {
    width: 72, height: 72, borderRadius: 36,
    transform: [{ translateX: 16 }, { translateY: 16 }],
  },
  generatingPill: {
    alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
  },
  generatingPillText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
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

  /* Output Panel — full-screen */
  outputFullHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)",
  },
  outputBackRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  outputBackLabel: { fontSize: 10, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.5 },
  outputIconBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center", justifyContent: "center",
  },
  outputToolHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  outputToolIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  outputToolName: { fontSize: 17, fontFamily: "Poppins_600SemiBold", color: "#fff" },
  outputToolSub: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.3)", marginTop: 2 },
  outputStatChip: {
    borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  outputStatText: { fontSize: 9, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 0.5 },
  outputDateStrip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  outputDateText: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", color: "rgba(255,255,255,0.22)", letterSpacing: 0.4 },
  outputFullText: { fontSize: 13.5, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.84)", lineHeight: 23, letterSpacing: 0.2 },

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

  quickAnalyzeBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 14,
    marginBottom: 14, overflow: "hidden",
  },
  quickAnalyzeTitle: { fontSize: 13, fontFamily: "Poppins_600SemiBold", letterSpacing: -0.2 },
  quickAnalyzeSub: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 1 },

  chatEmptyCard: {
    borderRadius: 14, borderWidth: 1, padding: 24,
    alignItems: "center", gap: 8,
  },
  chatEmptyTitle: { fontSize: 14, fontFamily: "Poppins_600SemiBold", textAlign: "center" },
  chatEmptySub: { fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 17 },
  chatSuggestion: {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chatBubble: {
    maxWidth: "85%", borderRadius: 14, padding: 12, gap: 4,
    borderWidth: 1, borderColor: "transparent",
  },
  chatAiLabel: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  chatBubbleText: { fontSize: 13, fontFamily: "Poppins_400Regular", lineHeight: 20 },
  chatInputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 10,
  },
  chatInput: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular", maxHeight: 120, lineHeight: 20 },
  chatSendBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
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
