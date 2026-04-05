import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { MotiView } from "moti";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { AppButton } from "@/components/ui/AppButton";

const PURPLE = "#818cf8";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  videos?: VideoResult[];
  libraryVideos?: LibraryVideo[];
}

interface VideoResult {
  youtubeId: string; title: string; channel: string;
  thumbnail: string; url: string;
}

interface LibraryVideo {
  id: string; title: string;
  thumbnail?: string | null; channelName?: string | null; url: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  ts: Date.now(),
  content: "Hi! I'm your VidVault AI assistant. Ask me to find YouTube videos, search your library, or get insights about any topic.",
};

const QUICK_PROMPTS = [
  { label: "Find videos", icon: "search" as const, text: "Find me top videos about " },
  { label: "My library", icon: "book-open" as const, text: "Search my library for " },
  { label: "Trending", icon: "trending-up" as const, text: "What are trending videos about " },
  { label: "Explain topic", icon: "zap" as const, text: "Explain the topic of " },
];

/* ── Video result card ── */
function VideoResultCard({ video, onImport }: { video: VideoResult; onImport: () => void }) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 250 }}
      style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {video.thumbnail ? (
        <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.videoThumb, { backgroundColor: PURPLE + "15", alignItems: "center", justifyContent: "center" }]}>
          <Feather name="youtube" size={18} color={PURPLE} />
        </View>
      )}
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        <View style={styles.videoMeta}>
          <Feather name="youtube" size={9} color="#ff0000" />
          <Text style={[styles.videoChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.channel}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onImport} style={[styles.importBtn, { backgroundColor: PURPLE }]} activeOpacity={0.8}>
        <Feather name="plus" size={13} color="#fff" />
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Library video card ── */
function LibraryVideoCard({ video }: { video: LibraryVideo }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/video/${video.id}`)}
      style={[styles.videoCard, { backgroundColor: colors.card, borderColor: CYAN + "30" }]}
      activeOpacity={0.8}
    >
      {video.thumbnail ? (
        <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.videoThumb, { backgroundColor: CYAN + "12", alignItems: "center", justifyContent: "center" }]}>
          <Feather name="film" size={18} color={CYAN} />
        </View>
      )}
      <View style={styles.videoInfo}>
        <View style={[styles.libraryBadge, { backgroundColor: CYAN + "12", borderColor: CYAN + "25" }]}>
          <Text style={[styles.libraryBadgeText, { color: CYAN }]}>LIBRARY</Text>
        </View>
        <Text style={[styles.videoTitle, { color: colors.foreground }]} numberOfLines={2}>
          {video.title}
        </Text>
        {video.channelName && (
          <Text style={[styles.videoChannel, { color: colors.mutedForeground }]} numberOfLines={1}>
            {video.channelName}
          </Text>
        )}
      </View>
      <Feather name="arrow-right" size={14} color={CYAN + "80"} />
    </TouchableOpacity>
  );
}

/* ── Typing dots ── */
function TypingDots() {
  const colors = useColors();
  return (
    <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.aiAvatarSm, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "30" }]}>
        <Feather name="cpu" size={10} color={PURPLE} />
      </View>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 500, loop: true, delay: i * 160 }}
            style={[styles.dot, { backgroundColor: PURPLE }]}
          />
        ))}
      </View>
      <Text style={[styles.typingLabel, { color: colors.mutedForeground }]}>AI is thinking…</Text>
    </View>
  );
}

/* ── Timestamp formatter ── */
function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Message bubble ── */
function MessageBubble({ message, onImportVideo }: { message: Message; onImportVideo: (url: string) => void }) {
  const colors = useColors();
  const isUser = message.role === "user";

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
      {!isUser && (
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={[styles.aiAvatar, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "35" }]}
        >
          <Feather name="cpu" size={13} color={PURPLE} />
        </MotiView>
      )}

      <MotiView
        from={{ opacity: 0, translateY: 10, scale: 0.96 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        style={{ maxWidth: "82%", gap: 6 }}
      >
        <View style={[
          styles.bubble,
          isUser
            ? { backgroundColor: PURPLE, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
        ]}>
          <Text style={[
            styles.bubbleText,
            { color: isUser ? "#fff" : colors.foreground },
          ]}>
            {message.content}
          </Text>
        </View>

        {/* Video results */}
        {message.videos && message.videos.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
              {message.videos.length} YOUTUBE RESULT{message.videos.length > 1 ? "S" : ""}
            </Text>
            {message.videos.map((v) => (
              <VideoResultCard key={v.youtubeId} video={v} onImport={() => onImportVideo(v.url)} />
            ))}
          </View>
        )}

        {/* Library results */}
        {message.libraryVideos && message.libraryVideos.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
              {message.libraryVideos.length} FROM YOUR LIBRARY
            </Text>
            {message.libraryVideos.map((v) => <LibraryVideoCard key={v.id} video={v} />)}
          </View>
        )}

        {/* Timestamp */}
        <Text style={[styles.timeLabel, { color: colors.mutedForeground, alignSelf: isUser ? "flex-end" : "flex-start" }]}>
          {formatTime(message.ts)}
          {isUser && (
            <Text>  <Feather name="check" size={9} color={colors.mutedForeground} /></Text>
          )}
        </Text>
      </MotiView>

      {isUser && (
        <View style={[styles.userAvatar, { backgroundColor: PURPLE }]}>
          <Feather name="user" size={12} color="#fff" />
        </View>
      )}
    </View>
  );
}

/* ═══════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════ */
export default function AIStudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);

  const addVideoMutation = useMutation({
    mutationFn: (url: string) => api.addVideo(url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;
    setInput("");
    setShowPrompts(false);
    Keyboard.dismiss();

    const userMsg: Message = { id: Date.now().toString(), role: "user", ts: Date.now(), content: text };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsSending(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await api.globalChat(text, history);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        ts: Date.now(),
        content: res.message,
        videos: res.youtubeVideos || [],
        libraryVideos: res.libraryVideos || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        ts: Date.now(),
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setIsSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [input, isSending, messages]);

  const botInset = insets.bottom > 0 ? insets.bottom : Platform.OS === "web" ? 20 : 12;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Fixed top */}
      <TopAppBar />

      {/* Section header */}
      <View style={styles.studioHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerEyebrow, { color: colors.mutedForeground }]}>//AI_STUDIO</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Studio</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: GREEN + "12", borderColor: GREEN + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: GREEN }]} />
          <Text style={[styles.statusText, { color: GREEN }]}>ONLINE</Text>
        </View>
      </View>

      {/* Model badge */}
      <View style={styles.modelRow}>
        <View style={[styles.modelBadge, { backgroundColor: PURPLE + "10", borderColor: PURPLE + "25" }]}>
          <Feather name="zap" size={9} color={PURPLE} />
          <Text style={[styles.modelText, { color: PURPLE }]}>VidVault AI  ·  Gemini Pro</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setMessages([WELCOME_MESSAGE]); setShowPrompts(true); }}
          style={[styles.clearBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.75}
        >
          <Feather name="trash-2" size={11} color={colors.mutedForeground} />
          <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Chat + Input in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble message={item} onImportVideo={(url) => addVideoMutation.mutate(url)} />
          )}
          ListFooterComponent={isSending ? <TypingDots /> : null}
        />

        {/* Quick prompt chips — shown before first message */}
        {showPrompts && (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 280 }}
            style={styles.promptsRow}
          >
            {QUICK_PROMPTS.map((p) => (
              <TouchableOpacity
                key={p.label}
                onPress={() => setInput(p.text)}
                style={[styles.promptChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Feather name={p.icon} size={10} color={PURPLE} />
                <Text style={[styles.promptChipText, { color: colors.foreground }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </MotiView>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: botInset,
        }]}>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={input}
              onChangeText={(t) => { setInput(t); if (t.length > 0) setShowPrompts(false); }}
              placeholder="Ask about videos, topics, or your library…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.textInput, { color: colors.foreground }]}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
            />
            <AppButton
              icon="arrow-up"
              size="xs"
              variant={input.trim() && !isSending ? "primary" : "ghost"}
              loading={isSending}
              disabled={!input.trim() || isSending}
              onPress={() => send()}
            />
          </View>
          <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
            {input.length > 0 ? `${input.length} chars` : "Powered by VidVault AI"}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  studioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  headerLeft: { gap: 2 },
  headerEyebrow: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 40, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1, lineHeight: 48 },

  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1.2 },

  modelRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 10,
  },
  modelBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1,
  },
  modelText: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },
  clearBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1,
  },
  clearText: { fontSize: 10, fontFamily: "Poppins_500Medium" },

  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, gap: 14 },

  /* Message bubbles */
  bubbleWrapper: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userWrapper: { justifyContent: "flex-end" },
  assistantWrapper: { justifyContent: "flex-start" },

  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
    marginBottom: 18,
  },
  aiAvatarSm: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  userAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
  },

  bubble: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
  },
  bubbleText: { fontSize: 14, lineHeight: 21, fontFamily: "Poppins_400Regular" },
  timeLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.3 },

  resultsLabel: {
    fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5,
    marginBottom: 2,
  },

  /* Typing indicator */
  typingBubble: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  dotsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  typingLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5 },

  /* Quick prompts */
  promptsRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  promptChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  promptChipText: { fontSize: 12, fontFamily: "Poppins_500Medium" },

  /* Input bar */
  inputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10, paddingHorizontal: 16,
    gap: 6,
  },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end",
    borderWidth: 1, borderRadius: 16,
    paddingLeft: 14, paddingRight: 6, paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular",
    paddingVertical: 6, maxHeight: 96, minHeight: 32,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  inputHint: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 0.5, textAlign: "center" },

  /* Video cards */
  videoCard: {
    flexDirection: "row", alignItems: "center",
    padding: 10, gap: 10, borderWidth: 1, borderRadius: 10,
  },
  videoThumb: { width: 72, height: 44, borderRadius: 6 },
  videoInfo: { flex: 1, gap: 3 },
  videoMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  videoTitle: { fontSize: 12, lineHeight: 17, fontFamily: "Poppins_600SemiBold" },
  videoChannel: { fontSize: 10, fontFamily: "Poppins_400Regular" },
  importBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  libraryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, marginBottom: 2,
  },
  libraryBadgeText: { fontSize: 8, fontFamily: "JetBrainsMono_600SemiBold", letterSpacing: 1 },
});
