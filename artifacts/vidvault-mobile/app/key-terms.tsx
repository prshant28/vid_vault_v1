import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Platform, ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";

const AMBER  = "#f59e0b";
const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const PINK   = "#ec4899";

const CACHE_KEY = "key-terms-cache-v1";
const ACCENT_COLORS = [PURPLE, CYAN, GREEN, AMBER, PINK];

interface KeyTerm {
  term: string;
  definition: string;
  videoCount: number;
}

interface CacheEntry {
  terms: KeyTerm[];
  videoCount: number;
  generatedAt: number;
}

function accentFor(term: string): string {
  let h = 0;
  for (let i = 0; i < term.length; i++) h = (h * 31 + term.charCodeAt(i)) | 0;
  return ACCENT_COLORS[Math.abs(h) % ACCENT_COLORS.length];
}

function LoadingCard({ index }: { index: number }) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ type: "timing", duration: 1000, loop: true, delay: index * 120 }}
      style={[styles.termCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonBody, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonBody, { backgroundColor: colors.border, width: "60%" }]} />
    </MotiView>
  );
}

function TermCard({ term, index }: { term: KeyTerm; index: number }) {
  const colors = useColors();
  const accent = accentFor(term.term);
  const letter = term.term.trim().charAt(0).toUpperCase();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 260, delay: Math.min(index * 50, 500) }}
      style={[styles.termCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.termAccentBar, { backgroundColor: accent }]} />
      <View style={styles.termBody}>
        <View style={styles.termHeader}>
          <View style={[styles.letterBadge, { backgroundColor: accent + "18", borderColor: accent + "30" }]}>
            <Text style={[styles.letterText, { color: accent }]}>{letter}</Text>
          </View>
          <Text style={[styles.termName, { color: colors.foreground }]}>{term.term}</Text>
        </View>
        <Text style={[styles.termDef, { color: colors.mutedForeground }]}>{term.definition}</Text>
        <View style={styles.termFooter}>
          <View style={[styles.videoBadge, { backgroundColor: accent + "10", borderColor: accent + "25" }]}>
            <Feather name="film" size={9} color={accent} />
            <Text style={[styles.videoBadgeText, { color: accent }]}>
              {term.videoCount} VIDEO{term.videoCount !== 1 ? "S" : ""}
            </Text>
          </View>
        </View>
      </View>
    </MotiView>
  );
}

export default function KeyTermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [terms, setTerms] = useState<KeyTerm[]>([]);
  const [videoCount, setVideoCount] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadFromCache = useCallback(async () => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      try {
        const entry: CacheEntry = JSON.parse(raw);
        setTerms(entry.terms);
        setVideoCount(entry.videoCount);
        setGeneratedAt(entry.generatedAt);
        setHasLoaded(true);
        return true;
      } catch {}
    }
    return false;
  }, []);

  const generate = useCallback(async (force = false) => {
    if (loading) return;
    if (!force) {
      const hit = await loadFromCache();
      if (hit) return;
    }
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await api.getKeyTerms();
      if (res.terms.length === 0) {
        setError("No AI content found in your vault. Generate summaries or notes for your saved videos first.");
        setHasLoaded(true);
        setLoading(false);
        return;
      }
      setTerms(res.terms);
      setVideoCount(res.videoCount);
      const now = Date.now();
      setGeneratedAt(now);
      setHasLoaded(true);
      const entry: CacheEntry = { terms: res.terms, videoCount: res.videoCount, generatedAt: now };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message || "Failed to generate terms. Please try again.");
    }
    setLoading(false);
  }, [loading, loadFromCache]);

  React.useEffect(() => {
    loadFromCache();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return terms;
    const q = search.toLowerCase();
    return terms.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    );
  }, [terms, search]);

  const sortedFiltered = useMemo(() =>
    [...filtered].sort((a, b) => a.term.localeCompare(b.term)), [filtered]);

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const ageLabel = generatedAt
    ? (() => {
        const mins = Math.floor((Date.now() - generatedAt) / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

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
          <Text style={[styles.title, { color: colors.foreground }]}>Key Terms</Text>
        </View>
        <TouchableOpacity
          onPress={() => generate(true)}
          disabled={loading}
          style={[styles.refreshBtn, { borderColor: AMBER + "40", backgroundColor: AMBER + "10" }]}
          activeOpacity={0.75}
        >
          <MotiView
            animate={{ rotate: loading ? "360deg" : "0deg" }}
            transition={loading ? { type: "timing", duration: 1000, loop: true } : { type: "timing", duration: 300 }}
          >
            <Feather name="refresh-cw" size={13} color={AMBER} />
          </MotiView>
          <Text style={[styles.refreshText, { color: AMBER }]}>{loading ? "…" : "Generate"}</Text>
        </TouchableOpacity>
      </View>

      {/* Info + cache row */}
      <View style={styles.metaRow}>
        <View style={[styles.infoBanner, { backgroundColor: AMBER + "08", borderColor: AMBER + "20" }]}>
          <Feather name="book-open" size={12} color={AMBER} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            AI extracts recurring concepts from your vault
            {videoCount > 0 ? ` · ${videoCount} videos analysed` : ""}
            {ageLabel ? ` · Updated ${ageLabel}` : ""}
          </Text>
        </View>
      </View>

      {/* Search */}
      {terms.length > 0 && (
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={14} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Filter terms…"
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
      )}

      {/* States */}
      {!hasLoaded && !loading ? (
        <View style={styles.emptyCenter}>
          <View style={[styles.emptyIcon, { backgroundColor: AMBER + "12", borderColor: AMBER + "25" }]}>
            <Feather name="book-open" size={28} color={AMBER} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Build Your Glossary</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            AI will extract the most important and recurring concepts from all your video AI outputs and build a personal glossary.
          </Text>
          <TouchableOpacity
            onPress={() => generate()}
            style={[styles.generateBtn, { backgroundColor: AMBER }]}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={15} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Glossary</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={styles.loadingBanner}>
            <MotiView
              from={{ opacity: 0.4 }} animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 700, loop: true }}
            >
              <Feather name="cpu" size={14} color={AMBER} />
            </MotiView>
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Analysing your vault and extracting key concepts…
            </Text>
          </View>
          {[0, 1, 2, 3, 4, 5].map((i) => <LoadingCard key={i} index={i} />)}
        </View>
      ) : error ? (
        <View style={styles.emptyCenter}>
          <View style={[styles.emptyIcon, { backgroundColor: "#ef4444" + "12", borderColor: "#ef4444" + "25" }]}>
            <Feather name="alert-circle" size={28} color="#ef4444" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Couldn't Generate</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => generate(true)}
            style={[styles.generateBtn, { backgroundColor: AMBER }]}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text style={styles.generateBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : sortedFiltered.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No matches for "{search}"</Text>
          <TouchableOpacity onPress={() => setSearch("")} style={[styles.generateBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]} activeOpacity={0.8}>
            <Text style={[styles.generateBtnText, { color: colors.foreground }]}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedFiltered}
          keyExtractor={(t) => t.term}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botInset + 20, gap: 8 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.countRow}>
              <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                {sortedFiltered.length} TERM{sortedFiltered.length !== 1 ? "S" : ""}
                {search ? ` matching "${search}"` : ""}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => <TermCard term={item} index={index} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 1.5, textTransform: "uppercase" },
  title: { fontSize: 22, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: 0.3 },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  refreshText: { fontSize: 11, fontFamily: "Eczar_400Regular" },

  metaRow: { paddingHorizontal: 16, marginBottom: 10 },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 7, padding: 10, borderRadius: 10, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 11, fontFamily: "Eczar_400Regular", lineHeight: 17 },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Eczar_400Regular" },

  emptyCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  emptyTitle: { fontSize: 18, fontFamily: "AlegreyaSansSC_700Bold", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Eczar_400Regular", textAlign: "center", lineHeight: 20 },
  generateBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  generateBtnText: { fontSize: 14, fontFamily: "AlegreyaSansSC_700Bold", color: "#fff" },

  loadingBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 4 },
  loadingText: { fontSize: 12, fontFamily: "Eczar_400Regular", flex: 1 },

  countRow: { marginBottom: 6 },
  countText: { fontSize: 10, fontFamily: "Eczar_400Regular", letterSpacing: 1 },

  termCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  termAccentBar: { height: 3 },
  termBody: { padding: 14, gap: 8 },
  termHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  letterBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  letterText: { fontSize: 16, fontFamily: "AlegreyaSansSC_700Bold" },
  termName: { fontSize: 16, fontFamily: "AlegreyaSansSC_700Bold", flex: 1 },
  termDef: { fontSize: 13, fontFamily: "Eczar_400Regular", lineHeight: 20 },
  termFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  videoBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  videoBadgeText: { fontSize: 9, fontFamily: "Eczar_400Regular", letterSpacing: 0.5 },

  skeletonTitle: { height: 16, borderRadius: 4, width: "50%", marginBottom: 4 },
  skeletonBody: { height: 12, borderRadius: 4, width: "100%", marginBottom: 3 },
});
