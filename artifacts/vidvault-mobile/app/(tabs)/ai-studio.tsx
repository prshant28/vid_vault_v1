import React, { useState, useRef, useCallback } from "react";
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  videos?: VideoResult[];
  libraryVideos?: LibraryVideo[];
}

interface VideoResult {
  youtubeId: string;
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
}

interface LibraryVideo {
  id: string;
  title: string;
  thumbnail?: string | null;
  channelName?: string | null;
  url: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your VidVault AI assistant. Ask me to find YouTube videos, search your library, or get insights about any topic.",
};

function VideoResultCard({ video, onImport }: { video: VideoResult; onImport: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.videoCard, { backgroundColor: colors.secondary, borderRadius: colors.radius, borderColor: colors.border }]}>
      {video.thumbnail ? (
        <Image source={{ uri: video.thumbnail }} style={[styles.videoThumb, { borderRadius: 6 }]} resizeMode="cover" />
      ) : null}
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.foreground, fontFamily: "Poppins_600SemiBold" }]} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={[styles.videoChannel, { color: colors.mutedForeground, fontFamily: "Poppins_400Regular" }]} numberOfLines={1}>
          {video.channel}
        </Text>
      </View>
      <TouchableOpacity onPress={onImport} style={[styles.importBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
        <Feather name="download" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function LibraryVideoCard({ video }: { video: LibraryVideo }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/video/${video.id}`)}
      style={[styles.videoCard, { backgroundColor: colors.secondary, borderRadius: colors.radius, borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      {video.thumbnail ? (
        <Image source={{ uri: video.thumbnail }} style={[styles.videoThumb, { borderRadius: 6 }]} resizeMode="cover" />
      ) : null}
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.foreground, fontFamily: "Poppins_600SemiBold" }]} numberOfLines={2}>
          {video.title}
        </Text>
        {video.channelName && (
          <Text style={[styles.videoChannel, { color: colors.mutedForeground, fontFamily: "Poppins_400Regular" }]} numberOfLines={1}>
            {video.channelName}
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function MessageBubble({ message, onImportVideo }: { message: Message; onImportVideo: (url: string) => void }) {
  const colors = useColors();
  const isUser = message.role === "user";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280 }}
    >
      <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.accent, borderRadius: 14 }]}>
            <Feather name="cpu" size={14} color={colors.primary} />
          </View>
        )}
        <View style={{ maxWidth: "85%", gap: 6 }}>
          <View style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary, borderRadius: colors.radius, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderRadius: colors.radius, borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 },
          ]}>
            <Text style={[styles.bubbleText, { color: isUser ? colors.primaryForeground : colors.foreground, fontFamily: "Poppins_400Regular" }]}>
              {message.content}
            </Text>
          </View>
          {message.videos && message.videos.length > 0 && (
            <View style={{ gap: 6 }}>
              {message.videos.map((v) => (
                <VideoResultCard key={v.youtubeId} video={v} onImport={() => onImportVideo(v.url)} />
              ))}
            </View>
          )}
          {message.libraryVideos && message.libraryVideos.length > 0 && (
            <View style={{ gap: 6 }}>
              {message.libraryVideos.map((v) => <LibraryVideoCard key={v.id} video={v} />)}
            </View>
          )}
        </View>
      </View>
    </MotiView>
  );
}

export default function AIStudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const addVideoMutation = useMutation({
    mutationFn: (url: string) => api.addVideo(url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    Keyboard.dismiss();

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsSending(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await api.globalChat(text, history);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.message,
        videos: res.youtubeVideos || [],
        libraryVideos: res.libraryVideos || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages]);

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
      <GridBackground />
      <TopAppBar />

      {/* Studio heading */}
      <View style={styles.subHeader}>
        <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>//AI_STUDIO</Text>
        <Text style={[styles.subTitle, { color: colors.foreground }]}>AI Studio</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <MessageBubble message={item} onImportVideo={(url) => addVideoMutation.mutate(url)} />
        )}
        ListFooterComponent={
          isSending ? (
            <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: botInset + 16 }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about videos..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.input, { color: colors.foreground, fontFamily: "Poppins_400Regular" }]}
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={send}
            disabled={!input.trim() || isSending}
            style={[styles.sendBtn, { backgroundColor: input.trim() && !isSending ? colors.primary : colors.secondary }]}
            activeOpacity={0.85}
          >
            <Feather name="send" size={18} color={input.trim() && !isSending ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  subLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2, marginBottom: 3 },
  subTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },

  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  avatar: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  bubble: { paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typingBubble: { alignSelf: "flex-start", borderWidth: 1, padding: 12, borderRadius: 12, marginTop: 4 },

  inputBar: { borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 16 },
  inputWrapper: { flexDirection: "row", alignItems: "flex-end", borderWidth: 1, padding: 8 },
  input: { flex: 1, fontSize: 15, paddingHorizontal: 8, paddingVertical: 6, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  videoCard: { flexDirection: "row", alignItems: "center", padding: 10, gap: 10, borderWidth: 1 },
  videoThumb: { width: 72, height: 40 },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 13, lineHeight: 17, marginBottom: 2 },
  videoChannel: { fontSize: 11 },
  importBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
