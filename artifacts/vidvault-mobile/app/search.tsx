import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Platform, Image, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const PINK   = "#ec4899";

const AI_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  summary:        { label: "Summary",       color: PURPLE },
  key_insights:   { label: "Key Insights",  color: CYAN   },
  flashcards:     { label: "Flashcards",    color: PINK   },
  mcq:            { label: "MCQ",           color: GREEN  },
  study_guide:    { label: "Study Guide",   color: AMBER  },
  action_points:  { label: "Action Items",  color: CYAN   },
  blog_post:      { label: "Blog Post",     color: GREEN  },
  social_post:    { label: "Social Post",   color: PINK   },
  mindmap:        { label: "Mind Map",      color: AMBER  },
  quiz:           { label: "Quiz",          color: PURPLE },
};

function formatTs(secs: number | null): string {
  if (secs == null) return "";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Thumb({ uri, size = 44, radius = 8 }: { uri: string | null; size?: number; radius?: number }) {
  const colors = useColors();
  if (!uri) return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
      <Feather name="film" size={size * 0.4} color={colors.mutedForeground} />
    </View>
  );
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.card }}
      resizeMode="cover"
    />
  );
}

function SectionHead({ label, color, count }: { label: string; color: string; count: number }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHead}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.sectionBadge, { backgroundColor: color + "18", borderColor: color + "35" }]}>
        <Text style={[styles.sectionCount, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

type SearchResult =
  | { kind: "section-videos"; count: number }
  | { kind: "section-notes"; count: number }
  | { kind: "section-ai"; count: number }
  | { kind: "video"; item: any }
  | { kind: "note"; item: any }
  | { kind: "ai"; item: any };

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQ(text), 350);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQ],
    queryFn: () => api.globalSearch(debouncedQ),
    enabled: debouncedQ.trim().length >= 2,
    staleTime: 30_000,
  });

  const videos    = data?.videos    ?? [];
  const notes     = data?.notes     ?? [];
  const aiOutputs = data?.aiOutputs ?? [];
  const hasQuery  = debouncedQ.trim().length >= 2;
  const hasResults = videos.length > 0 || notes.length > 0 || aiOutputs.length > 0;

  const listData: SearchResult[] = [];
  if (videos.length > 0) {
    listData.push({ kind: "section-videos", count: videos.length });
    videos.forEach((v) => listData.push({ kind: "video", item: v }));
  }
  if (notes.length > 0) {
    listData.push({ kind: "section-notes", count: notes.length });
    notes.forEach((n) => listData.push({ kind: "note", item: n }));
  }
  if (aiOutputs.length > 0) {
    listData.push({ kind: "section-ai", count: aiOutputs.length });
    aiOutputs.forEach((a) => listData.push({ kind: "ai", item: a }));
  }

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  function renderItem({ item, index }: { item: SearchResult; index: number }) {
    if (item.kind === "section-videos") {
      return (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: 260 }}>
          <SectionHead label="Videos" color={PURPLE} count={item.count} />
        </MotiView>
      );
    }
    if (item.kind === "section-notes") {
      return (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: 260 }}>
          <SectionHead label="Notes" color={CYAN} count={item.count} />
        </MotiView>
      );
    }
    if (item.kind === "section-ai") {
      return (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "timing", duration: 260 }}>
          <SectionHead label="AI Outputs" color={PINK} count={item.count} />
        </MotiView>
      );
    }

    return (
      <MotiView
        from={{ opacity: 0, translateX: -8 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: "timing", duration: 240, delay: Math.min(index * 25, 300) }}
      >
        {item.kind === "video" && (
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => router.push(`/video/${item.item.id}`)}
            style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Thumb uri={item.item.thumbnail} size={52} radius={10} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>{item.item.title}</Text>
              {item.item.channelName ? (
                <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{item.item.channelName}</Text>
              ) : null}
            </View>
            <View style={[styles.kindBadge, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "30" }]}>
              <Feather name="film" size={10} color={PURPLE} />
            </View>
          </TouchableOpacity>
        )}

        {item.kind === "note" && (
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => router.push(`/video/${item.item.videoId}`)}
            style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Thumb uri={item.item.videoThumbnail} size={52} radius={10} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.resultSnippet, { color: colors.foreground }]} numberOfLines={2}>{item.item.snippet}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {item.item.timestamp != null && (
                  <View style={[styles.tsBadge, { backgroundColor: CYAN + "18", borderColor: CYAN + "30" }]}>
                    <Feather name="clock" size={9} color={CYAN} />
                    <Text style={[styles.tsText, { color: CYAN }]}>{formatTs(item.item.timestamp)}</Text>
                  </View>
                )}
                <Text style={[styles.resultMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{item.item.videoTitle}</Text>
              </View>
            </View>
            <View style={[styles.kindBadge, { backgroundColor: CYAN + "18", borderColor: CYAN + "30" }]}>
              <Feather name="edit-3" size={10} color={CYAN} />
            </View>
          </TouchableOpacity>
        )}

        {item.kind === "ai" && (() => {
          const tc = AI_TYPE_LABELS[item.item.type] ?? { label: item.item.type, color: PINK };
          return (
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => router.push(`/video/${item.item.videoId}`)}
              style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Thumb uri={item.item.videoThumbnail} size={52} radius={10} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={[styles.typeBadge, { backgroundColor: tc.color + "18", borderColor: tc.color + "30" }]}>
                  <Text style={[styles.typeText, { color: tc.color }]}>{tc.label.toUpperCase()}</Text>
                </View>
                <Text style={[styles.resultSnippet, { color: colors.foreground }]} numberOfLines={2}>{item.item.snippet}</Text>
                <Text style={[styles.resultMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{item.item.videoTitle}</Text>
              </View>
              <View style={[styles.kindBadge, { backgroundColor: PINK + "18", borderColor: PINK + "30" }]}>
                <Feather name="cpu" size={10} color={PINK} />
              </View>
            </TouchableOpacity>
          );
        })()}
      </MotiView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleChange}
            placeholder="Search videos, notes, AI outputs..."
            placeholderTextColor={colors.mutedForeground + "90"}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isFetching && <ActivityIndicator size="small" color={colors.mutedForeground} />}
          {query.length > 0 && !isFetching && (
            <TouchableOpacity onPress={() => { setQuery(""); setDebouncedQ(""); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x-circle" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scope pills */}
      <View style={styles.scopeRow}>
        {[
          { label: "Videos",    color: PURPLE, icon: "film"   },
          { label: "Notes",     color: CYAN,   icon: "edit-3" },
          { label: "AI Output", color: PINK,   icon: "cpu"    },
        ].map((s) => (
          <View key={s.label} style={[styles.scopePill, { backgroundColor: s.color + "14", borderColor: s.color + "28" }]}>
            <Feather name={s.icon as any} size={10} color={s.color} />
            <Text style={[styles.scopeText, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Results */}
      {!hasQuery ? (
        <View style={styles.emptyWrap}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 180 }}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Find anything in your vault</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Search across video titles, your notes,{"\n"}and all AI-generated content at once.
            </Text>
          </MotiView>
        </View>
      ) : hasQuery && !isFetching && !hasResults ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results for "{debouncedQ}"</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Try a shorter or different search term.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => {
            if (item.kind.startsWith("section")) return `sec-${item.kind}-${i}`;
            return `${item.kind}-${(item as any).item.id}`;
          }}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: botInset + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Eczar_400Regular",
  },

  scopeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  scopePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  scopeText: {
    fontSize: 10,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.5,
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingTop: 20,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 1.8,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: "Eczar_600SemiBold",
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 13,
    fontFamily: "Eczar_600SemiBold",
    lineHeight: 19,
  },
  resultSnippet: {
    fontSize: 12,
    fontFamily: "Eczar_400Regular",
    lineHeight: 18,
  },
  resultMeta: {
    fontSize: 10,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.3,
  },
  tsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  tsText: { fontSize: 9, fontFamily: "Eczar_400Regular" },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  typeText: { fontSize: 8, fontFamily: "Eczar_600SemiBold", letterSpacing: 1 },
  kindBadge: {
    width: 26, height: 26, borderRadius: 8,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 2,
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 24,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Eczar_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
