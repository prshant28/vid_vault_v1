import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
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
    <View style={[styles.aiCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
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
    <View style={[styles.noteItem, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
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
            style={[styles.noteEditInput, { color: colors.foreground, borderColor: colors.border, borderRadius: 8 }]}
            multiline
            autoFocus
          />
          <TextInput
            value={editTimestamp}
            onChangeText={setEditTimestamp}
            placeholder="Timestamp (1:30)"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.timestampInput, { color: colors.foreground, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.secondary }]}
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
        <Skeleton height={220} borderRadius={colors.radius} style={{ marginBottom: 16 }} />
        <Skeleton height={24} width="80%" style={{ marginBottom: 8 }} />
        <Skeleton height={16} width="50%" style={{ marginBottom: 24 }} />
        {[1, 2, 3].map((i) => <Skeleton key={i} height={60} borderRadius={colors.radius} style={{ marginBottom: 10 }} />)}
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
        <TouchableOpacity onPress={handleOpenYouTube} activeOpacity={0.9}>
          {video.thumbnail ? (
            <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
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

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]}>{video.title}</Text>
          <View style={styles.meta}>
            {video.channelName ? (
              <View style={styles.metaItem}>
                <Feather name="user" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{video.channelName}</Text>
              </View>
            ) : null}
            {video.duration ? (
              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color={colors.mutedForeground} />
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
              <View style={[styles.noteInputCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
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
                    style={[styles.timestampInput, { color: colors.foreground, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.secondary }]}
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
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  openYtText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  info: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 27,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
    fontSize: 15,
  },
  tabContent: {
    padding: 16,
  },
  aiCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  aiCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  aiCardLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  noteInputCard: {
    borderWidth: 1,
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
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    padding: 8,
    borderWidth: 1,
  },
  noteAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  noteItem: {
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  timestampBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  timestampText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  noteContent: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  noteFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  emptyNotesText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  noteEditInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    borderWidth: 1,
    padding: 8,
    minHeight: 60,
  },
  editSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
});
