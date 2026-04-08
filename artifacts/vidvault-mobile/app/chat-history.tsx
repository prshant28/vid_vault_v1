import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Platform, Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";

const HISTORY_KEY = "ai-studio-history-v1";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface ChatSession {
  id: string;
  ts: number;
  preview: string;
  messages: Message[];
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ConversationView({ messages }: { messages: Message[] }) {
  const colors = useColors();
  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      {messages.filter(m => m.id !== "welcome").map((m) => (
        <View
          key={m.id}
          style={[
            styles.convBubble,
            m.role === "user"
              ? { backgroundColor: PURPLE + "18", borderColor: PURPLE + "30", alignSelf: "flex-end" }
              : { backgroundColor: colors.card, borderColor: colors.border, alignSelf: "flex-start" },
          ]}
        >
          <View style={styles.convBubbleHeader}>
            <View style={[styles.rolePill, { backgroundColor: m.role === "user" ? PURPLE + "22" : CYAN + "18" }]}>
              <Feather name={m.role === "user" ? "user" : "cpu"} size={8} color={m.role === "user" ? PURPLE : CYAN} />
              <Text style={[styles.rolePillText, { color: m.role === "user" ? PURPLE : CYAN }]}>
                {m.role === "user" ? "YOU" : "AI"}
              </Text>
            </View>
            <Text style={[styles.convTime, { color: colors.mutedForeground }]}>{formatTime(m.ts)}</Text>
          </View>
          <Text style={[styles.convText, { color: colors.foreground }]} numberOfLines={8}>
            {m.content}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ChatHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try { setSessions(JSON.parse(raw)); } catch {}
      }
      setLoading(false);
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    Alert.alert("Delete Session", "Remove this conversation from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = sessions.filter((s) => s.id !== id);
          setSessions(updated);
          await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [sessions]);

  const clearAll = useCallback(() => {
    Alert.alert("Clear All History", "This will delete all saved conversations.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          setSessions([]);
          await AsyncStorage.removeItem(HISTORY_KEY);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, []);

  const filtered = sessions.filter((s) =>
    !search || s.preview.toLowerCase().includes(search.toLowerCase()) ||
    s.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()))
  );

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
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>AI Studio</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Chat History</Text>
        </View>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={[styles.clearAllBtn, { borderColor: colors.border }]} activeOpacity={0.75}>
            <Feather name="trash-2" size={12} color={colors.mutedForeground} />
            <Text style={[styles.clearAllText, { color: colors.mutedForeground }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={14} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search conversations…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Count row */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {filtered.length} CONVERSATION{filtered.length !== 1 ? "S" : ""}
            {search ? ` matching "${search}"` : ""}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/ai-studio")}
            style={[styles.newChatBtn, { backgroundColor: PURPLE + "14", borderColor: PURPLE + "28" }]}
            activeOpacity={0.75}
          >
            <Feather name="plus" size={11} color={PURPLE} />
            <Text style={[styles.newChatText, { color: PURPLE }]}>New Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.emptyCenter}>
          <MotiView
            from={{ opacity: 0.3 }} animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 800, loop: true }}
          >
            <Feather name="loader" size={28} color={PURPLE} />
          </MotiView>
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>Loading…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyCenter}>
          <View style={[styles.emptyIcon, { backgroundColor: PURPLE + "12", borderColor: PURPLE + "25" }]}>
            <Feather name="message-circle" size={28} color={PURPLE} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {search ? "No matches found" : "No chat history yet"}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            {search
              ? "Try a different search term"
              : "Start a conversation in AI Studio. When you clear or start a new chat it saves here."}
          </Text>
          {!search && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/ai-studio")}
              style={[styles.goBtn, { backgroundColor: PURPLE }]}
              activeOpacity={0.8}
            >
              <Feather name="cpu" size={14} color="#fff" />
              <Text style={styles.goBtnText}>Open AI Studio</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 20, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: session, index }) => {
            const isOpen = expanded.has(session.id);
            const userCount = session.messages.filter((m) => m.role === "user").length;
            return (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250, delay: Math.min(index * 40, 400) }}
                style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Accent bar */}
                <View style={[styles.accentBar, { backgroundColor: PURPLE }]} />

                {/* Session header row */}
                <TouchableOpacity
                  onPress={() => toggleExpand(session.id)}
                  style={styles.sessionHeader}
                  activeOpacity={0.8}
                >
                  <View style={styles.sessionMeta}>
                    <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
                      {formatDate(session.ts)}  ·  {formatTime(session.ts)}
                    </Text>
                    <Text style={[styles.sessionPreview, { color: colors.foreground }]} numberOfLines={2}>
                      {session.preview}
                    </Text>
                    <View style={styles.sessionStats}>
                      <View style={[styles.statPill, { backgroundColor: PURPLE + "10", borderColor: PURPLE + "20" }]}>
                        <Feather name="message-square" size={9} color={PURPLE} />
                        <Text style={[styles.statPillText, { color: PURPLE }]}>{userCount} MSG{userCount !== 1 ? "S" : ""}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      onPress={() => deleteSession(session.id)}
                      style={[styles.iconBtn, { borderColor: colors.border }]}
                      activeOpacity={0.75}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="trash-2" size={12} color={colors.mutedForeground} />
                    </TouchableOpacity>
                    <View style={[styles.chevronWrap, { backgroundColor: PURPLE + "10" }]}>
                      <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={14} color={PURPLE} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded conversation */}
                {isOpen && (
                  <MotiView
                    from={{ opacity: 0, translateY: -4 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 220 }}
                    style={styles.convWrap}
                  >
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <ConversationView messages={session.messages} />
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/ai-studio")}
                      style={[styles.continueBtn, { backgroundColor: PURPLE + "12", borderColor: PURPLE + "28" }]}
                      activeOpacity={0.75}
                    >
                      <Feather name="corner-down-right" size={12} color={PURPLE} />
                      <Text style={[styles.continueBtnText, { color: PURPLE }]}>Continue in AI Studio</Text>
                    </TouchableOpacity>
                  </MotiView>
                )}
              </MotiView>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  clearAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 8 },
  clearAllText: { fontSize: 11, fontFamily: "Eczar_400Regular" },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Eczar_400Regular" },

  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 10 },
  countText: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 1 },
  newChatBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderRadius: 8 },
  newChatText: { fontSize: 11, fontFamily: "Eczar_400Regular" },

  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  emptyTitle: { fontSize: 18, fontFamily: "AlegreyaSansSC_700Bold", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Eczar_400Regular", textAlign: "center", lineHeight: 20 },
  goBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  goBtnText: { fontSize: 14, fontFamily: "AlegreyaSansSC_700Bold", color: "#fff" },

  sessionCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  accentBar: { height: 3, width: "100%" },
  sessionHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 },
  sessionMeta: { flex: 1, gap: 4 },
  sessionDate: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 0.8 },
  sessionPreview: { fontSize: 14, fontFamily: "AlegreyaSansSC_700Bold", lineHeight: 20 },
  sessionStats: { flexDirection: "row", gap: 6, marginTop: 4 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statPillText: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 0.5 },
  sessionActions: { alignItems: "center", gap: 8, paddingTop: 2 },
  iconBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chevronWrap: { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center" },

  convWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  divider: { height: 1, marginBottom: 4 },

  convBubble: { maxWidth: "88%", borderRadius: 10, borderWidth: 1, padding: 10, gap: 5 },
  convBubbleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  rolePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rolePillText: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 0.8 },
  convTime: { fontSize: 9, fontFamily: "Eczar_400Regular" },
  convText: { fontSize: 12, fontFamily: "Eczar_400Regular", lineHeight: 18 },

  continueBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginTop: 12, alignSelf: "flex-start" },
  continueBtnText: { fontSize: 12, fontFamily: "Eczar_400Regular" },
});
