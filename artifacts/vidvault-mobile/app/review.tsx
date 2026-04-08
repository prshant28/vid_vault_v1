import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useColors";
import { api } from "@/services/api";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import type { ComponentProps } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

const PURPLE = "#6366f1";
const GREEN  = "#10b981";
const ORANGE = "#f59e0b";
const PINK   = "#ec4899";
const RED    = "#ef4444";
const CYAN   = "#06b6d4";

const SR_KEY = "sr-state-v2";

interface CardState {
  id: string;
  n: number;
  ef: number;
  interval: number;
  nextReview: number;
  lapses: number;
}

interface ParsedCard {
  id: string;
  front: string;
  back: string;
  videoId: string;
  videoTitle: string;
}

function sm2(q: number, state: CardState): CardState {
  let { n, ef, interval, lapses } = state;
  if (q >= 3) {
    if (n === 0)      interval = 1;
    else if (n === 1) interval = 6;
    else              interval = Math.round(interval * ef);
    n++;
    ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  } else {
    lapses++;
    n = 0;
    interval = 1;
  }
  return {
    ...state,
    n, ef, interval, lapses,
    nextReview: Date.now() + interval * 24 * 60 * 60 * 1000,
  };
}

function parseFlashcards(content: string, videoId: string, videoTitle: string): ParsedCard[] {
  const cards: ParsedCard[] = [];
  const blocks = content.split(/\*\*Front:\*\*|\bFront:/gi);
  for (const block of blocks.slice(1)) {
    const backMatch = block.match(/\*\*Back:\*\*|Back:/i);
    if (!backMatch || backMatch.index == null) continue;
    const front = block.slice(0, backMatch.index).trim().replace(/^[:\-\s]+/, "").trim();
    const afterBack = block.slice(backMatch.index + backMatch[0].length);
    const nextFront = afterBack.search(/\*\*Front:\*\*|\bFront:/i);
    const back = (nextFront !== -1 ? afterBack.slice(0, nextFront) : afterBack).trim().replace(/^[:\-\s]+/, "").trim();
    if (front.length > 3 && back.length > 3) {
      const id = `${videoId}::${cards.length}`;
      cards.push({ id, front, back, videoId, videoTitle });
    }
  }
  return cards;
}

async function loadAllStates(): Promise<Record<string, CardState>> {
  const raw = await AsyncStorage.getItem(SR_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function saveState(state: Record<string, CardState>) {
  await AsyncStorage.setItem(SR_KEY, JSON.stringify(state));
}

function RatingBtn({ label, color, icon, onPress }: { label: string; color: string; icon: FeatherName; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[S.ratingBtn, { backgroundColor: color + "18", borderColor: color + "45" }]}
    >
      <Feather name={icon} size={14} color={color} />
      <Text style={[S.ratingLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={[S.statChip, { backgroundColor: color + "0f", borderColor: color + "28" }]}>
      <Text style={[S.statChipVal, { color }]}>{value}</Text>
      <Text style={S.statChipLbl}>{label}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [allCards, setAllCards]     = useState<ParsedCard[]>([]);
  const [dueCards, setDueCards]     = useState<ParsedCard[]>([]);
  const [cardIdx, setCardIdx]       = useState(0);
  const [flipped, setFlipped]       = useState(false);
  const [states, setStates]         = useState<Record<string, CardState>>({});
  const [sessionDone, setSessionDone] = useState(0);
  const [finished, setFinished]     = useState(false);
  const [loading, setLoading]       = useState(true);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const flippedRef = useRef(false);

  const { data: videosData } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => api.listVideos({ limit: 200 }),
  });

  useEffect(() => {
    async function init() {
      if (!videosData?.videos?.length) return;
      setLoading(true);
      try {
        const savedStates = await loadAllStates();
        setStates(savedStates);

        const parsed: ParsedCard[] = [];
        for (const vid of videosData.videos) {
          try {
            const outputs = await api.listAiOutputs(vid.id);
            const fc = (outputs?.outputs || []).find((o: any) => o.type === "flashcards");
            if (fc?.content) {
              parsed.push(...parseFlashcards(fc.content, vid.id, vid.title || "Video"));
            }
          } catch {}
        }
        setAllCards(parsed);

        const now = Date.now();
        const due = parsed.filter(c => {
          const st = savedStates[c.id];
          if (!st) return true;
          return st.nextReview <= now;
        });
        setDueCards(due.length > 0 ? due : parsed.slice(0, Math.min(10, parsed.length)));
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [videosData]);

  const currentCard = dueCards[cardIdx];

  const flipCard = useCallback(() => {
    const toValue = flippedRef.current ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue, friction: 8, tension: 10, useNativeDriver: true,
    }).start();
    flippedRef.current = !flippedRef.current;
    setFlipped(f => !f);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleRate = useCallback(async (q: number) => {
    if (!currentCard) return;
    const prev = states[currentCard.id] ?? { id: currentCard.id, n: 0, ef: 2.5, interval: 1, nextReview: 0, lapses: 0 };
    const next = sm2(q, prev);
    const newStates = { ...states, [currentCard.id]: next };
    setStates(newStates);
    await saveState(newStates);

    setSessionDone(d => d + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (cardIdx + 1 >= dueCards.length) {
      setFinished(true);
    } else {
      flippedRef.current = false;
      flipAnim.setValue(0);
      setFlipped(false);
      setCardIdx(i => i + 1);
    }
  }, [currentCard, states, cardIdx, dueCards.length]);

  const restartSession = () => {
    flippedRef.current = false;
    flipAnim.setValue(0);
    setFlipped(false);
    setCardIdx(0);
    setSessionDone(0);
    setFinished(false);
  };

  const frontInterp = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
  const backInterp  = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });

  const dueCount  = dueCards.length;
  const newCount  = allCards.filter(c => !states[c.id]).length;
  const doneCount = allCards.filter(c => {
    const st = states[c.id];
    return st && st.nextReview > Date.now();
  }).length;

  const cardState = currentCard ? states[currentCard.id] : null;
  const nextInterval = cardState ? cardState.interval : 1;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <GridBackground />
      <TopAppBar
        showBack
        title="SR Review"
        rightAction={
          <View style={[S.headerBadge, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "35" }]}>
            <Feather name="layers" size={11} color={PURPLE} />
            <Text style={[S.headerBadgeText, { color: PURPLE }]}>{allCards.length} CARDS</Text>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingHorizontal: 20 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[S.eyebrow, { color: colors.mutedForeground }]}>// LEARNING</Text>
          <Text style={[S.pageTitle, { color: colors.foreground }]}>Spaced Review</Text>
        </View>

        {/* Stats row */}
        <View style={[S.statsRow, { marginBottom: 20 }]}>
          <StatChip label="Due"   value={dueCount}  color={ORANGE} />
          <StatChip label="New"   value={newCount}   color={PURPLE} />
          <StatChip label="Learned" value={doneCount} color={GREEN} />
          <StatChip label="Total" value={allCards.length} color={CYAN} />
        </View>

        {loading ? (
          <View style={[S.loadCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MotiView
              from={{ rotate: "0deg" }}
              animate={{ rotate: "360deg" }}
              transition={{ type: "timing", duration: 1200, loop: true }}
            >
              <Feather name="cpu" size={28} color={PURPLE + "80"} />
            </MotiView>
            <Text style={[S.loadText, { color: colors.mutedForeground }]}>Loading your flashcards…</Text>
            <Text style={[S.loadSub, { color: colors.mutedForeground + "80" }]}>
              First generate flashcards on a video to start reviewing
            </Text>
          </View>
        ) : allCards.length === 0 ? (
          <View style={[S.loadCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[S.emptyOrb, { backgroundColor: PURPLE + "14", borderColor: PURPLE + "25" }]}>
              <Feather name="layers" size={28} color={PURPLE + "80"} />
            </View>
            <Text style={[S.loadText, { color: colors.foreground }]}>No Flashcards Yet</Text>
            <Text style={[S.loadSub, { color: colors.mutedForeground }]}>
              Go to any video, open AI Tools, and generate Flashcards to start your spaced repetition practice.
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={[S.backBtn, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "40" }]}
            >
              <Feather name="arrow-left" size={13} color={PURPLE} />
              <Text style={[S.backBtnText, { color: PURPLE }]}>GO BACK</Text>
            </TouchableOpacity>
          </View>
        ) : finished ? (
          <MotiView
            from={{ scale: 0.93, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
          >
            <View style={[S.finishCard, { backgroundColor: colors.card, borderColor: GREEN + "40" }]}>
              <LinearGradient
                colors={[GREEN + "10", "transparent"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={[S.finishOrb, { backgroundColor: GREEN + "18", borderColor: GREEN + "30" }]}>
                <Feather name="check-circle" size={32} color={GREEN} />
              </View>
              <Text style={[S.finishTitle, { color: colors.foreground }]}>Session Complete!</Text>
              <Text style={[S.finishSub, { color: colors.mutedForeground }]}>
                You reviewed {sessionDone} card{sessionDone !== 1 ? "s" : ""} this session.{"\n"}
                Cards are scheduled based on how well you recalled them.
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={restartSession}
                  style={[S.finishBtn, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "40" }]}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={13} color={PURPLE} />
                  <Text style={[S.finishBtnText, { color: PURPLE }]}>REVIEW AGAIN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={[S.finishBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.8}
                >
                  <Feather name="arrow-left" size={13} color={colors.mutedForeground} />
                  <Text style={[S.finishBtnText, { color: colors.mutedForeground }]}>DONE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </MotiView>
        ) : currentCard ? (
          <>
            {/* Progress bar */}
            <View style={{ marginBottom: 16, gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[S.progressLabel, { color: colors.mutedForeground }]}>
                  Card {cardIdx + 1} of {dueCards.length}
                </Text>
                <Text style={[S.progressLabel, { color: PURPLE }]}>
                  {sessionDone} done this session
                </Text>
              </View>
              <View style={[S.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[S.progressFill, { backgroundColor: PURPLE, width: `${((cardIdx) / dueCards.length) * 100}%` as any }]} />
              </View>
            </View>

            {/* Video source */}
            <View style={[S.sourceChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="film" size={10} color={colors.mutedForeground} />
              <Text style={[S.sourceText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {currentCard.videoTitle}
              </Text>
            </View>

            {/* Flashcard (flip) */}
            <TouchableOpacity onPress={flipCard} activeOpacity={0.95} style={{ marginBottom: 14 }}>
              <View style={S.cardContainer}>
                {/* Front */}
                <Animated.View
                  style={[StyleSheet.absoluteFill, {
                    backfaceVisibility: "hidden",
                    transform: [{ rotateY: frontInterp }],
                  }]}
                >
                  <View style={[S.card, { backgroundColor: colors.card, borderColor: PURPLE + "35" }]}>
                    <LinearGradient
                      colors={[PURPLE + "0d", "transparent"]}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                    <View style={S.cardBadge}>
                      <Text style={[S.cardBadgeText, { color: colors.mutedForeground }]}>QUESTION</Text>
                    </View>
                    <Text style={[S.cardText, { color: colors.foreground }]}>
                      {currentCard.front}
                    </Text>
                    <View style={S.tapHint}>
                      <Feather name="rotate-cw" size={11} color={colors.mutedForeground + "80"} />
                      <Text style={[S.tapHintText, { color: colors.mutedForeground + "80" }]}>Tap to reveal answer</Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Back */}
                <Animated.View
                  style={[StyleSheet.absoluteFill, {
                    backfaceVisibility: "hidden",
                    transform: [{ rotateY: backInterp }],
                  }]}
                >
                  <View style={[S.card, { backgroundColor: colors.card, borderColor: GREEN + "35" }]}>
                    <LinearGradient
                      colors={[GREEN + "0d", "transparent"]}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                    <View style={S.cardBadge}>
                      <Text style={[S.cardBadgeText, { color: GREEN }]}>ANSWER</Text>
                    </View>
                    <Text style={[S.cardText, { color: colors.foreground }]}>
                      {currentCard.back}
                    </Text>
                    <View style={S.tapHint}>
                      <Feather name="rotate-cw" size={11} color={colors.mutedForeground + "80"} />
                      <Text style={[S.tapHintText, { color: colors.mutedForeground + "80" }]}>Tap to flip back</Text>
                    </View>
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>

            {/* Rating buttons — only show when flipped */}
            {flipped ? (
              <MotiView
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 220 }}
              >
                <Text style={[S.ratingHeading, { color: colors.mutedForeground }]}>How well did you recall?</Text>
                <View style={S.ratingRow}>
                  <RatingBtn label="FORGOT" color={RED}    icon="x-circle"     onPress={() => handleRate(0)} />
                  <RatingBtn label="HARD"   color={ORANGE} icon="alert-circle"  onPress={() => handleRate(3)} />
                  <RatingBtn label="GOOD"   color={PURPLE} icon="check-circle"  onPress={() => handleRate(4)} />
                  <RatingBtn label="EASY"   color={GREEN}  icon="zap"           onPress={() => handleRate(5)} />
                </View>
                {cardState && (
                  <Text style={[S.intervalHint, { color: colors.mutedForeground }]}>
                    Next review in ~{nextInterval} day{nextInterval !== 1 ? "s" : ""} (ease {cardState.ef.toFixed(1)})
                  </Text>
                )}
              </MotiView>
            ) : (
              <View style={[S.flipHintCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[S.flipHintText, { color: colors.mutedForeground }]}>
                  Tap the card to reveal the answer, then rate your recall
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* Algorithm info */}
        {!loading && allCards.length > 0 && !finished && (
          <View style={[S.algoCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Feather name="info" size={13} color={CYAN} />
              <Text style={[S.algoTitle, { color: colors.foreground }]}>SM-2 Algorithm</Text>
            </View>
            <Text style={[S.algoText, { color: colors.mutedForeground }]}>
              Cards are scheduled using the SuperMemo-2 spaced repetition algorithm. Rating "Easy" extends the next review by your ease factor, while "Forgot" resets the card to 1 day.
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {[
                { q: 0, label: "Forgot = 1d", color: RED },
                { q: 3, label: "Hard = 1d", color: ORANGE },
                { q: 4, label: "Good = ×EF", color: PURPLE },
                { q: 5, label: "Easy = ×EF+", color: GREEN },
              ].map(r => (
                <View key={r.q} style={[S.algoChip, { backgroundColor: r.color + "10", borderColor: r.color + "25" }]}>
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 9, color: r.color }}>{r.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:        { flex: 1 },
  eyebrow:     { fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 2.5, marginBottom: 4 },
  pageTitle:   { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 36, letterSpacing: -0.8, lineHeight: 42 },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeText: { fontFamily: "Eczar_600SemiBold", fontSize: 8, letterSpacing: 1 },

  statsRow:  { flexDirection: "row", gap: 8 },
  statChip:  { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center", gap: 3 },
  statChipVal: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 18, letterSpacing: -0.5 },
  statChipLbl: { fontFamily: "Eczar_400Regular", fontSize: 7.5, letterSpacing: 1, color: "#888" },

  loadCard:  { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: "center", gap: 12 },
  loadText:  { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 18, textAlign: "center" },
  loadSub:   { fontFamily: "Eczar_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 },
  emptyOrb:  { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  backBtn:   { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 9, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9, marginTop: 4 },
  backBtnText: { fontFamily: "Eczar_600SemiBold", fontSize: 11, letterSpacing: 1 },

  progressLabel: { fontFamily: "Eczar_400Regular", fontSize: 10, letterSpacing: 0.5 },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill:  { height: "100%" as any, borderRadius: 2 },

  sourceChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginBottom: 10, alignSelf: "flex-start", maxWidth: "100%" },
  sourceText: { fontFamily: "Eczar_400Regular", fontSize: 10, flex: 1 },

  cardContainer: { height: 220, width: "100%" },
  card: {
    flex: 1, borderRadius: 18, borderWidth: 1, overflow: "hidden",
    padding: 22, justifyContent: "center", alignItems: "center",
  },
  cardBadge:     { position: "absolute", top: 14, left: 14, flexDirection: "row", alignItems: "center" },
  cardBadgeText: { fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2 },
  cardText:      { fontFamily: "Eczar_500Medium", fontSize: 16, lineHeight: 24, textAlign: "center" },
  tapHint:       { position: "absolute", bottom: 14, flexDirection: "row", alignItems: "center", gap: 4 },
  tapHintText:   { fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 0.5 },

  ratingHeading: { fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 2, marginBottom: 10, textAlign: "center" },
  ratingRow:     { flexDirection: "row", gap: 8 },
  ratingBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center", gap: 5,
  },
  ratingLabel: { fontFamily: "Eczar_600SemiBold", fontSize: 9, letterSpacing: 1 },
  intervalHint: { fontFamily: "Eczar_400Regular", fontSize: 9, textAlign: "center", marginTop: 8, letterSpacing: 0.5 },

  flipHintCard: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  flipHintText: { fontFamily: "Eczar_400Regular", fontSize: 11, flex: 1, lineHeight: 16 },

  finishCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden", padding: 28, alignItems: "center", gap: 14 },
  finishOrb:  { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  finishTitle: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 26, letterSpacing: -0.5 },
  finishSub:   { fontFamily: "Eczar_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  finishBtn:   { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  finishBtnText: { fontFamily: "Eczar_600SemiBold", fontSize: 10, letterSpacing: 1 },

  algoCard:  { borderRadius: 12, borderWidth: 1, padding: 14 },
  algoTitle: { fontFamily: "Eczar_600SemiBold", fontSize: 13 },
  algoText:  { fontFamily: "Eczar_400Regular", fontSize: 11, lineHeight: 16 },
  algoChip:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
});
