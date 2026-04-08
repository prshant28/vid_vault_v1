import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Platform, Keyboard, KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";

const CYAN   = "#06b6d4";
const PURPLE = "#6366f1";
const GREEN  = "#10b981";

const SUGGESTIONS = [
  "What concepts repeat across my saved videos?",
  "Compare the key takeaways from my videos",
  "Which of my videos contradict each other?",
  "Give me a unified summary of everything I've saved",
  "What topics do my videos cover most deeply?",
  "What gaps are there in my knowledge based on my library?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  sourceCount?: number;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
  const colors = useColors();
  return (
    <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: CYAN + "18", borderColor: CYAN + "30" }]}>
        <Feather name="layers" size={11} color={CYAN} />
      </View>
      <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 480, loop: true, delay: i * 160 }}
            style={[styles.dot, { backgroundColor: CYAN }]}
          />
        ))}
      </View>
      <Text style={[styles.typingLabel, { color: colors.mutedForeground }]}>Analysing vault…</Text>
    </View>
  );
}

function Bubble({ message }: { message: Message }) {
  const colors = useColors();
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleWrapper, isUser ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: CYAN + "18", borderColor: CYAN + "30" }]}>
          <Feather name="layers" size={11} color={CYAN} />
        </View>
      )}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        style={{ maxWidth: "84%", gap: 4 }}
      >
        <View style={[
          styles.bubble,
          isUser
            ? { backgroundColor: CYAN, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
        ]}>
          <Text style={[styles.bubbleText, { color: isUser ? "#fff" : colors.foreground }]}>
            {message.content}
          </Text>
        </View>
        <View style={[styles.bubbleFooter, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{formatTime(message.ts)}</Text>
          {!isUser && message.sourceCount != null && message.sourceCount > 0 && (
            <View style={[styles.sourcePill, { backgroundColor: CYAN + "10", borderColor: CYAN + "25" }]}>
              <Feather name="database" size={8} color={CYAN} />
              <Text style={[styles.sourceText, { color: CYAN }]}>{message.sourceCount} VIDEOS</Text>
            </View>
          )}
        </View>
      </MotiView>
      {isUser && (
        <View style={[styles.avatar, { backgroundColor: CYAN }]}>
          <Feather name="user" size={11} color="#fff" />
        </View>
      )}
    </View>
  );
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  ts: Date.now(),
  content: "Ask me anything about your entire video vault. I can draw connections across all your saved videos, find recurring themes, compare ideas, and synthesize insights you might have missed.",
};

export default function CrossVideoAIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const scrollToBottom = useCallback(() => {
    flatRef.current?.scrollToEnd({ animated: true });
  }, []);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;
    setInput("");
    setShowSuggestions(false);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = { id: Date.now().toString(), role: "user", ts: Date.now(), content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setTimeout(scrollToBottom, 80);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      const res = await api.crossVideoChat(text, history);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        ts: Date.now(),
        content: res.message,
        sourceCount: res.sourceCount,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        ts: Date.now(),
        content: "Something went wrong. Please try again.",
      }]);
    } finally {
      setIsSending(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [input, isSending, messages, scrollToBottom]);

  const botInset = insets.bottom + (Platform.OS === "web" ? 84 : Platform.OS === "ios" ? 60 : 56);

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
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>AI Features</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Cross-Vault AI</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: CYAN + "12", borderColor: CYAN + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: CYAN }]} />
          <Text style={[styles.statusText, { color: CYAN }]}>VAULT</Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: CYAN + "08", borderColor: CYAN + "20" }]}>
        <Feather name="layers" size={13} color={CYAN} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Draws answers from <Text style={{ color: CYAN }}>all your AI outputs</Text> — summaries, notes, and insights across every video.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollToBottom()}
            renderItem={({ item }) => <Bubble message={item} />}
            ListFooterComponent={isSending ? <TypingDots /> : null}
          />

          {/* Suggestion chips */}
          {showSuggestions && (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 280 }}
              style={styles.suggestionsWrap}
            >
              <Text style={[styles.suggestionsLabel, { color: colors.mutedForeground }]}>TRY ASKING</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => send(s)}
                    style={[styles.chip, { backgroundColor: colors.card, borderColor: CYAN + "35" }]}
                    activeOpacity={0.75}
                  >
                    <Feather name="corner-down-right" size={9} color={CYAN} />
                    <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={2}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>
          )}

          {/* Input bar */}
          <View style={[styles.inputBar, {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: botInset,
          }]}>
            <View style={[styles.inputRow, {
              backgroundColor: colors.card,
              borderColor: input.length > 0 ? CYAN + "55" : colors.border,
            }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Ask about your entire vault…"
                placeholderTextColor={colors.mutedForeground}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={600}
                returnKeyType="send"
                onSubmitEditing={() => send()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={() => send()}
                disabled={!input.trim() || isSending}
                style={[styles.sendBtn, {
                  backgroundColor: input.trim() && !isSending ? CYAN : colors.secondary,
                }]}
                activeOpacity={0.8}
              >
                <Feather name="send" size={14} color={input.trim() && !isSending ? "#fff" : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 1.2 },

  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: 16, marginBottom: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Eczar_400Regular", lineHeight: 18 },

  listContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12, gap: 12 },

  bubbleWrapper: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  avatar: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  bubble: { padding: 11, borderRadius: 14 },
  bubbleText: { fontSize: 14, fontFamily: "Eczar_400Regular", lineHeight: 21 },
  bubbleFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 9, fontFamily: "Eczar_400Regular" },
  sourcePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  sourceText: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 0.5 },

  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginLeft: 14 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  typingLabel: { fontSize: 11, fontFamily: "Eczar_400Regular" },

  suggestionsWrap: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  suggestionsLabel: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 1.5 },
  chip: { flexDirection: "row", alignItems: "flex-start", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, maxWidth: "100%" },
  chipText: { flex: 1, fontSize: 12, fontFamily: "Eczar_400Regular", lineHeight: 17 },

  inputBar: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  input: { flex: 1, fontSize: 14, fontFamily: "Eczar_400Regular", maxHeight: 100, paddingVertical: 2 },
  sendBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
