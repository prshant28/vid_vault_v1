import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  useWindowDimensions,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, useTheme } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { api } from "@/services/api";
import type { Video, Stats, RecentAiOutput } from "@/types/api";
import { Skeleton } from "@/components/SkeletonLoader";
import { EmptyState } from "@/components/EmptyState";
import { VideoCard } from "@/components/VideoCard";
import { SaveToVaultModal } from "@/components/SaveToVaultModal";
import { TabFadeWrapper } from "@/components/TabFadeWrapper";
import { getStreak, updateStreak } from "@/lib/notifications";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const PURPLE = "#6366f1";
const CYAN = "#06b6d4";
const GREEN = "#10b981";
const PINK = "#ec4899";
const AMBER = "#f59e0b";

const STAT_CONFIG = [
  {
    label: "Videos",
    code: "01",
    icon: "film" as FeatherIconName,
    accent: PURPLE,
    key: "totalVideos",
  },
  {
    label: "Folders",
    code: "02",
    icon: "folder" as FeatherIconName,
    accent: CYAN,
    key: "totalFolders",
  },
  {
    label: "Notes",
    code: "03",
    icon: "edit-3" as FeatherIconName,
    accent: GREEN,
    key: "totalNotes",
  },
  {
    label: "AI Outputs",
    code: "04",
    icon: "cpu" as FeatherIconName,
    accent: PINK,
    key: "totalAiOutputs",
  },
  {
    label: "Starred",
    code: "05",
    icon: "heart" as FeatherIconName,
    accent: AMBER,
    key: "totalFavorites",
  },
  {
    label: "Tags",
    code: "06",
    icon: "tag" as FeatherIconName,
    accent: "#8b8bf6",
    key: "totalTags",
  },
];

const AI_TYPE_META: Record<
  string,
  { label: string; icon: FeatherIconName; color: string }
> = {
  summary: { label: "Summary", icon: "file-text", color: PURPLE },
  flashcards: { label: "Flashcards", icon: "book-open", color: CYAN },
  mcq: { label: "MCQ", icon: "help-circle", color: GREEN },
  studynotes: { label: "Study Notes", icon: "list", color: AMBER },
  transcript: { label: "Transcript", icon: "message-square", color: PINK },
  chat: { label: "AI Chat", icon: "message-circle", color: "#6366f1" },
};

/* ── Animated number counter ── */
function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [value]);
  return (
    <Animated.Text style={[styles.etchedValue, { color }]}>
      {
        anim.interpolate({
          inputRange: [0, value || 1],
          outputRange: ["00", value.toString().padStart(2, "0")],
        }) as any
      }
    </Animated.Text>
  );
}

/* ── Stat card — etched-slab style matching web design system ── */
function EtchedStatCard({
  label,
  code,
  value,
  icon,
  accent,
  delay,
  onPress,
}: {
  label: string;
  code: string;
  value: number;
  icon: FeatherIconName;
  accent: string;
  delay: number;
  onPress?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.2,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0.08,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.78 : 1} disabled={!onPress}>
        <View
          style={[
            styles.etchedCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: isDark ? "#000" : accent,
              shadowOpacity: isDark ? 0.4 : 0.10,
              shadowRadius: isDark ? 12 : 8,
              elevation: isDark ? 8 : 2,
            },
          ]}
        >
          {/* Etch highlight overlay */}
          <LinearGradient
            colors={isDark
              ? ["rgba(255,255,255,0.07)", "transparent", "rgba(0,0,0,0.3)"]
              : ["rgba(255,255,255,0.9)", "transparent", "rgba(0,0,0,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View style={styles.etchedTop}>
            <Text
              style={[styles.etchedCode, { color: colors.mutedForeground + "55" }]}
            >
              {code}
            </Text>
            <Feather
              name={icon}
              size={14}
              color={accent}
              style={{ opacity: 0.6 }}
            />
          </View>
          <Text style={[styles.etchedLabel, { color: accent + "99" }]}>
            {label.toUpperCase()}
          </Text>
          <Text style={[styles.etchedValue, { color: colors.foreground }]}>
            {value.toString().padStart(2, "0")}
          </Text>
          {onPress && (
            <View style={{ position: "absolute", bottom: 10, right: 10, opacity: 0.35 }}>
              <Feather name="chevron-right" size={10} color={accent} />
            </View>
          )}
          <Animated.View
            style={[styles.etchedGlow, { backgroundColor: accent, opacity: pulse }]}
          />
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Streak + Daily Goal Card ── */
function StreakCard({ streak, goal, done }: { streak: number; goal: number; done: number }) {
  const { colors, isDark } = useTheme();
  const ORANGE = "#f97316";
  const flameScale = useRef(new Animated.Value(1)).current;
  const pct = goal > 0 ? Math.min(done / goal, 1) : 0;
  const barW = useRef(new Animated.Value(0)).current;
  const SCR_W = Dimensions.get("window").width;
  const innerW = SCR_W - 40 - 32;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(flameScale, { toValue: 1.20, duration: 700, useNativeDriver: true }),
      Animated.timing(flameScale, { toValue: 0.90, duration: 700, useNativeDriver: true }),
    ])).start();
    Animated.timing(barW, { toValue: pct * innerW, duration: 1000, delay: 300, useNativeDriver: false }).start();
    return () => flameScale.stopAnimation();
  }, [pct]);

  const days = ["M","T","W","T","F","S","S"];
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "spring", damping: 18, stiffness: 180, delay: 80 }}
      style={[styles.streakCard, {
        backgroundColor: colors.card,
        borderColor: ORANGE + "35",
        shadowColor: isDark ? "#000" : ORANGE,
        shadowOpacity: isDark ? 0.3 : 0.10,
        shadowRadius: isDark ? 10 : 8,
        elevation: isDark ? 6 : 2,
      }]}
    >
      <LinearGradient
        colors={[ORANGE + "0f", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.streakTop}>
        {/* Flame + streak */}
        <View style={styles.streakLeft}>
          <Animated.Text style={[styles.streakFlame, { transform: [{ scale: flameScale }] }]}>🔥</Animated.Text>
          <View>
            <Text style={[styles.streakNum, { color: ORANGE }]}>{streak}</Text>
            <Text style={[styles.streakLabel, { color: colors.mutedForeground }]}>DAY STREAK</Text>
          </View>
        </View>
        {/* Day dots — only filled for actual streak days */}
        <View style={styles.streakDays}>
          {days.map((d, i) => {
            const isToday    = i === todayIdx;
            const startIdx   = Math.max(0, todayIdx - streak + 1);
            const isStreakDay = streak > 0 && i >= startIdx && i <= todayIdx;
            return (
              <View key={i} style={styles.streakDayWrap}>
                <View style={[styles.streakDayDot, {
                  backgroundColor: isStreakDay
                    ? ORANGE + (isToday ? "ff" : "cc")
                    : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
                  borderWidth: isToday ? 2 : 0,
                  borderColor: ORANGE,
                  shadowColor: isToday ? ORANGE : "transparent",
                  shadowOpacity: isToday ? 0.6 : 0,
                  shadowRadius: isToday ? 4 : 0,
                  elevation: isToday ? 3 : 0,
                }]}>
                  {isStreakDay && <Feather name="check" size={7} color="#fff" />}
                </View>
                <Text style={[styles.streakDayLabel, { color: isToday ? ORANGE : colors.mutedForeground }]}>{d}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {/* Daily goal progress */}
      <View style={styles.streakGoal}>
        <View style={styles.streakGoalRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Feather name="target" size={10} color={ORANGE} />
            <Text style={[styles.streakGoalLabel, { color: colors.mutedForeground }]}>DAILY GOAL</Text>
          </View>
          <Text style={[styles.streakGoalVal, { color: ORANGE }]}>{done}/{goal} videos</Text>
        </View>
        <View style={[styles.streakTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}>
          <Animated.View style={[styles.streakFill, { width: barW }]}>
            <LinearGradient colors={[ORANGE, "#fbbf24"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
      </View>
    </MotiView>
  );
}

/* ── Daily AI Tip card ── */
const AI_TIPS = [
  { icon: "zap"        as FeatherIconName, color: PURPLE, tip: "Use AI Summaries to grasp the main ideas of any video in under 30 seconds." },
  { icon: "book-open"  as FeatherIconName, color: CYAN,   tip: "Generate Flashcards to review key concepts — spaced repetition boosts retention by 80%." },
  { icon: "help-circle"as FeatherIconName, color: GREEN,  tip: "Test yourself with AI-generated MCQs right after watching to lock in long-term memory." },
  { icon: "message-circle" as FeatherIconName, color: AMBER, tip: "Chat with the AI about any video to ask follow-up questions and deepen your understanding." },
  { icon: "tag"        as FeatherIconName, color: PINK,   tip: "Tag your videos by topic — then filter your vault to create focused study sessions." },
];

function DailyTipCard() {
  const { colors, isDark } = useTheme();
  const [tipIdx] = useState(() => new Date().getDate() % AI_TIPS.length);
  const tip = AI_TIPS[tipIdx];
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, useNativeDriver: false }),
    ])).start();
    return () => glowAnim.stopAnimation();
  }, []);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, stiffness: 180, delay: 120 }}
      style={[styles.tipCard, {
        backgroundColor: colors.card,
        borderColor: tip.color + "28",
      }]}
    >
      <LinearGradient
        colors={[tip.color + "0d", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Left stripe */}
      <View style={[styles.tipStripe, { backgroundColor: tip.color }]} />
      <View style={styles.tipContent}>
        <View style={styles.tipHeaderRow}>
          <Animated.View style={[styles.tipIconWrap, {
            backgroundColor: tip.color + "18",
            borderColor: tip.color + "30",
            shadowColor: tip.color,
            shadowOpacity: glowAnim,
            shadowRadius: 6,
            elevation: 3,
          }]}>
            <Feather name={tip.icon} size={14} color={tip.color} />
          </Animated.View>
          <View>
            <Text style={[styles.tipLabel, { color: tip.color }]}>AI TIP OF THE DAY</Text>
            <Text style={[styles.tipDate, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
        </View>
        <Text style={[styles.tipText, { color: colors.foreground }]}>{tip.tip}</Text>
      </View>
    </MotiView>
  );
}

/* ── Quick action button ── */
function QuickAction({
  icon,
  label,
  accent,
  sublabel,
  onPress,
  delay,
}: {
  icon: FeatherIconName;
  label: string;
  accent: string;
  sublabel: string;
  onPress: () => void;
  delay: number;
}) {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12, scale: 0.88 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "spring", delay, damping: 16, stiffness: 180 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          style={[
            styles.quickBtn,
            {
              backgroundColor: colors.card,
              borderColor: accent + (isDark ? "35" : "28"),
              shadowColor: accent,
              shadowOpacity: isDark ? 0.28 : 0.12,
              shadowRadius: isDark ? 10 : 7,
              elevation: isDark ? 5 : 2,
            },
          ]}
        >
          {/* Gradient BG */}
          <LinearGradient
            colors={[accent + (isDark ? "18" : "10"), "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          {/* Top accent line */}
          <View style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: 2, backgroundColor: accent, borderTopLeftRadius: 14, borderTopRightRadius: 14,
          }} />

          <View style={[styles.quickBtnIcon, {
            backgroundColor: accent + (isDark ? "22" : "16"),
            borderWidth: 1,
            borderColor: accent + (isDark ? "40" : "28"),
          }]}>
            <Feather name={icon} size={17} color={accent} />
          </View>
          <Text style={[styles.quickBtnLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.quickBtnSub, { color: colors.mutedForeground }]}>
            {sublabel}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </MotiView>
  );
}

/* ── Activity node (timeline dot) ── */
function ActivityNode({
  video,
  index,
  onPress,
}: {
  video: Video;
  index: number;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const isFirst = index === 0;
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 320, delay: 80 * index }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.activityRow}
      >
        <View style={styles.activityLeft}>
          <View
            style={[
              styles.activityDot,
              {
                backgroundColor: isFirst ? PURPLE : colors.border,
                borderColor: isFirst ? PURPLE + "50" : "transparent",
              },
            ]}
          >
            {isFirst && (
              <MotiView
                from={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ type: "timing", duration: 1200, loop: true }}
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 8, backgroundColor: PURPLE },
                ]}
              />
            )}
          </View>
          {index < 4 && (
            <View
              style={[styles.activityLine, { backgroundColor: colors.border }]}
            />
          )}
        </View>
        <View
          style={[
            styles.activityCard,
            {
              backgroundColor: colors.card,
              borderColor: isFirst ? PURPLE + "25" : colors.border,
              shadowColor: isDark ? "#000" : PURPLE,
              shadowOpacity: isDark ? 0.25 : 0.07,
              shadowRadius: isDark ? 6 : 5,
              elevation: isDark ? 3 : 1,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.activityTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {video.title}
            </Text>
            {video.channelName && (
              <Text
                style={[
                  styles.activityChannel,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {video.channelName}
              </Text>
            )}
          </View>
          {isFirst && (
            <View style={[styles.newPill, { backgroundColor: PURPLE }]}>
              <Text style={styles.newPillText}>NEW</Text>
            </View>
          )}
          <Feather
            name="arrow-right"
            size={12}
            color={colors.mutedForeground + "80"}
            style={{ marginLeft: 8 }}
          />
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Level / XP Progress Card ── */
function LevelCard({
  level,
  levelTitle,
  levelColor,
  xp,
  nextLevelXP,
  progressPct,
  isMaxLevel,
}: {
  level: number;
  levelTitle: string;
  levelColor: string;
  xp: number;
  nextLevelXP: number;
  progressPct: number;
  isMaxLevel: boolean;
}) {
  const { colors, isDark } = useTheme();
  const barW = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const innerWidth = screenWidth - 40 - 32;

  useEffect(() => {
    Animated.timing(barW, {
      toValue: ((isMaxLevel ? 100 : progressPct) / 100) * innerWidth,
      duration: 1300,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, [progressPct, innerWidth, isMaxLevel]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay: 100 }}
      style={[
        styles.levelCard,
        {
          backgroundColor: colors.card,
          borderColor: levelColor + "40",
          shadowColor: isDark ? "#000" : levelColor,
          shadowOpacity: isDark ? 0.35 : 0.10,
          shadowRadius: isDark ? 12 : 8,
          elevation: isDark ? 7 : 2,
        },
      ]}
    >
      <LinearGradient
        colors={[levelColor + "0a", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.levelTop}>
        <View>
          <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>
            LEARNER_PROFILE
          </Text>
          <View style={styles.levelRow}>
            <View
              style={[
                styles.levelBadge,
                {
                  backgroundColor: levelColor + "20",
                  borderColor: levelColor + "40",
                },
              ]}
            >
              <Text style={[styles.levelNum, { color: levelColor }]}>
                {level}
              </Text>
            </View>
            <View>
              <Text style={[styles.levelTitle, { color: levelColor }]}>
                {levelTitle}
              </Text>
              <Text
                style={[styles.levelSub, { color: colors.mutedForeground }]}
              >
                Level {level} Collector
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.xpBlock}>
          <Text style={[styles.xpValue, { color: levelColor }]}>{xp}</Text>
          <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
            XP
          </Text>
        </View>
      </View>
      <View style={[styles.xpTrack, { backgroundColor: colors.border + "80" }]}>
        <Animated.View style={[styles.xpFill, { width: barW }]}>
          <LinearGradient
            colors={[levelColor + "80", levelColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <View style={styles.xpMeta}>
        <Text style={[styles.xpMetaText, { color: colors.mutedForeground }]}>
          {xp} XP
        </Text>
        <Text style={[styles.xpMetaText, { color: colors.mutedForeground }]}>
          {isMaxLevel ? "MAX LEVEL" : `${nextLevelXP} XP to next`}
        </Text>
      </View>
    </MotiView>
  );
}

/* ── Recent AI Output Card ── */
function RecentAiItemCard({
  output,
  index,
}: {
  output: RecentAiOutput;
  index: number;
}) {
  const colors = useColors();
  const meta = AI_TYPE_META[output.type] ?? {
    label: output.type,
    icon: "cpu" as FeatherIconName,
    color: PURPLE,
  };
  const date = new Date(output.createdAt);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const timeAgo =
    mins < 60
      ? `${mins}m ago`
      : mins < 1440
        ? `${Math.floor(mins / 60)}h ago`
        : `${Math.floor(mins / 1440)}d ago`;

  const thumbUri = output.videoThumbnail || null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{
        type: "spring",
        delay: 55 * index,
        damping: 18,
        stiffness: 200,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={() => router.push(`/video/${output.videoId}` as any)}
        style={[
          styles.aiCard,
          {
            backgroundColor: colors.card,
            borderColor: meta.color + "28",
            overflow: "hidden",
            padding: 0,
          },
        ]}
      >
        {/* Left accent stripe */}
        <View
          style={{
            width: 3,
            alignSelf: "stretch",
            backgroundColor: meta.color,
            borderRadius: 3,
          }}
        />

        {/* Gradient glow background */}
        <LinearGradient
          colors={[meta.color + "12", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            position: "absolute",
            left: 3,
            top: 0,
            width: 90,
            bottom: 0,
          }}
          pointerEvents="none"
        />

        {/* Inner content */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 12,
          }}
        >
          {/* Thumbnail with icon overlay */}
          <View style={{ position: "relative", flexShrink: 0 }}>
            <View
              style={{
                width: 80,
                height: 56,
                borderRadius: 10,
                backgroundColor: colors.secondary,
                overflow: "hidden",
              }}
            >
              {thumbUri ? (
                <Image
                  source={{ uri: thumbUri }}
                  style={{ width: 80, height: 56 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: meta.color + "12",
                  }}
                >
                  <Feather
                    name={meta.icon}
                    size={22}
                    color={meta.color + "60"}
                  />
                </View>
              )}
            </View>
            {/* Type icon badge on thumbnail corner */}
            <View
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: meta.color,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.background,
                shadowColor: meta.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Feather name={meta.icon} size={9} color="#fff" />
            </View>
          </View>

          {/* Info column */}
          <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
            {/* Type pill + time row — global button style */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 14,
                  backgroundColor: meta.color + "10",
                  borderWidth: 1,
                  borderColor: meta.color + "30",
                }}
              >
                <Feather name={meta.icon} size={8} color={meta.color} />
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "Eczar_600SemiBold",
                    color: meta.color,
                    letterSpacing: 0.3,
                  }}
                >
                  {meta.label}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Eczar_400Regular",
                  color: colors.mutedForeground + "60",
                  letterSpacing: 0.3,
                }}
              >
                {timeAgo}
              </Text>
            </View>

            {/* Video title */}
            <Text
              numberOfLines={2}
              style={{
                fontSize: 12.5,
                fontFamily: "Eczar_600SemiBold",
                lineHeight: 17,
                color: colors.foreground,
              }}
            >
              {output.videoTitle}
            </Text>

            {/* Channel row */}
            {output.channelName && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <View
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: 7,
                    backgroundColor: meta.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="user" size={7} color={meta.color} />
                </View>
                <Text
                  style={{
                    fontSize: 9.5,
                    fontFamily: "Eczar_400Regular",
                    color: colors.mutedForeground,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {output.channelName}
                </Text>
              </View>
            )}
          </View>

          {/* Arrow */}
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: meta.color + "12",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Feather name="chevron-right" size={12} color={meta.color + "80"} />
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Welcome Hero ── */
function WelcomeHero({
  name,
  totalVideos,
  totalAi,
  streak,
}: {
  name: string;
  totalVideos: number;
  totalAi: number;
  streak: number;
}) {
  const { colors, isDark } = useTheme();
  const hour = new Date().getHours();

  const firstName = name.split(" ")[0] || name;

  const { greetLine, emoji, sub, accent } = (() => {
    if (hour >= 5 && hour < 12)
      return { greetLine: "Good Morning,", emoji: "☀️", sub: "Ready to learn something new today?", accent: AMBER };
    if (hour >= 12 && hour < 17)
      return { greetLine: "Good Afternoon,", emoji: "🌤️", sub: "Keep the momentum going!", accent: CYAN };
    if (hour >= 17 && hour < 21)
      return { greetLine: "Good Evening,", emoji: "🌆", sub: "Time to review your knowledge vault.", accent: PINK };
    return { greetLine: "Good Night,", emoji: "🌙", sub: "Rest well, see you tomorrow.", accent: "#a78bfa" };
  })();

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();

  const CORNER_ICONS: Array<{ icon: FeatherIconName; color: string; delay: number }> = [
    { icon: "cpu",       color: PURPLE, delay: 0   },
    { icon: "zap",       color: accent, delay: 400 },
    { icon: "book-open", color: CYAN,   delay: 800 },
  ];

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 150, delay: 40 }}
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.card,
          borderColor: PURPLE + "30",
          shadowColor: PURPLE,
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: isDark ? 20 : 14,
          elevation: isDark ? 10 : 4,
          minHeight: 210,
        },
      ]}
    >
      {/* Full-card gradient */}
      <LinearGradient
        colors={isDark
          ? [PURPLE + "22", accent + "0e", "transparent"]
          : [PURPLE + "16", accent + "08", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Top gradient bar purple → accent */}
      <LinearGradient
        colors={[PURPLE, accent, "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ height: 3 }}
        pointerEvents="none"
      />

      {/* Floating corner icon cluster */}
      <View style={{ position: "absolute", top: 20, right: 16, gap: 8, alignItems: "flex-end" }} pointerEvents="none">
        {CORNER_ICONS.map(({ icon, color, delay }, i) => (
          <MotiView
            key={i}
            from={{ translateY: 0, opacity: 0.5 }}
            animate={{ translateY: -6, opacity: 1 }}
            transition={{ type: "timing", duration: 2000 + i * 300, loop: true, delay, repeatReverse: true }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: color + (isDark ? "20" : "14"),
              borderWidth: 1, borderColor: color + (isDark ? "40" : "28"),
              alignItems: "center", justifyContent: "center",
            }}>
              <Feather name={icon} size={14} color={color} />
            </View>
          </MotiView>
        ))}
      </View>

      {/* Main content */}
      <View style={{ padding: 20, paddingTop: 16, paddingRight: 72 }}>
        {/* Date row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Text style={{ fontSize: 14 }}>{emoji}</Text>
          <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2.5, color: colors.mutedForeground, textTransform: "uppercase" }}>
            {today}
          </Text>
          {streak > 0 && (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 3,
              marginLeft: 8, backgroundColor: "#f59e0b16",
              borderRadius: 12, borderWidth: 1, borderColor: "#f59e0b30",
              paddingHorizontal: 7, paddingVertical: 2,
            }}>
              <Text style={{ fontSize: 10 }}>🔥</Text>
              <Text style={{ fontFamily: "Eczar_700Bold", fontSize: 10, color: AMBER }}>{streak}</Text>
            </View>
          )}
        </View>

        {/* Greeting label: "Good Evening," */}
        <Text style={{
          fontFamily: "Eczar_400Regular",
          fontSize: 11, letterSpacing: 1.8,
          color: colors.mutedForeground,
          marginBottom: 2,
          textTransform: "uppercase",
        }}>
          {greetLine}
        </Text>

        {/* Big hero name */}
        <Text style={{
          fontFamily: "AlegreyaSansSC_800ExtraBold",
          fontSize: 52, lineHeight: 52, letterSpacing: -1.5,
          color: colors.foreground, marginBottom: 8,
        }}>
          {firstName}
        </Text>

        {/* Accent divider + sub */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: totalVideos > 0 ? 14 : 0 }}>
          <View style={{ width: 28, height: 2, borderRadius: 1, backgroundColor: accent }} />
          <Text style={{
            fontFamily: "Eczar_400Regular", fontSize: 11,
            color: colors.mutedForeground, flex: 1,
          }}>
            {sub}
          </Text>
        </View>

        {/* Stat pills row */}
        {totalVideos > 0 && (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 4,
              backgroundColor: PURPLE + "16", borderRadius: 20,
              borderWidth: 1, borderColor: PURPLE + "30",
              paddingHorizontal: 10, paddingVertical: 5,
            }}>
              <Feather name="film" size={10} color={PURPLE} />
              <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 11, color: PURPLE }}>
                {totalVideos} {totalVideos === 1 ? "video" : "videos"}
              </Text>
            </View>
            {totalAi > 0 && (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: CYAN + "16", borderRadius: 20,
                borderWidth: 1, borderColor: CYAN + "30",
                paddingHorizontal: 10, paddingVertical: 5,
              }}>
                <Feather name="cpu" size={10} color={CYAN} />
                <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 11, color: CYAN }}>
                  {totalAi} AI
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </MotiView>
  );
}

/* ── Watch Progress bar ── */
function WatchProgressBar({
  watched,
  total,
}: {
  watched: number;
  total: number;
}) {
  const colors = useColors();
  const width = useWindowDimensions().width - 40;
  const pct = total > 0 ? Math.min(watched / total, 1) : 0;
  const barW = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barW, {
      toValue: pct * (width - 32),
      duration: 1200,
      delay: 600,
      useNativeDriver: false,
    }).start();
  }, [pct, width]);

  const pctLabel = total > 0 ? `${Math.round(pct * 100)}%` : "0%";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400, delay: 500 }}
      style={[
        styles.intelBar,
        { backgroundColor: colors.card, borderColor: GREEN + "22" },
      ]}
    >
      <View style={styles.intelTop}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MotiView
            from={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 800, loop: true }}
            style={[styles.intelDot, { backgroundColor: GREEN }]}
          />
          <Text style={[styles.intelLabel, { color: colors.mutedForeground }]}>
            WATCH PROGRESS
          </Text>
        </View>
        <Text style={[styles.intelCount, { color: GREEN }]}>
          {watched}/{total} watched
        </Text>
      </View>
      <View
        style={[styles.intelTrack, { backgroundColor: colors.border + "80" }]}
      >
        <Animated.View style={[styles.intelFill, { width: barW }]}>
          <LinearGradient
            colors={[GREEN, CYAN]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={[styles.intelSub, { color: colors.mutedForeground }]}>
        {pctLabel} of your vault watched · keep going!
      </Text>
    </MotiView>
  );
}

/* ═══════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════ */
export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { width: screenWidth } = useWindowDimensions();
  const CARD_W = screenWidth - 40;
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeSection, setActiveSection] = useState("feed");

  const {
    data: stats,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const favoriteMutation = useMutation({
    mutationFn: (videoId: string) => api.toggleFavorite(videoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stats"] }),
  });

  // ── Custom display name — synced from AsyncStorage on every focus ──
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const loadName = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem("vv_display_name");
      setNameOverride(saved || null);
    } catch (_) {}
  }, []);
  useEffect(() => { loadName(); }, []);
  useFocusEffect(useCallback(() => { loadName(); }, [loadName]));

  const rawName = nameOverride || user?.firstName || user?.email?.split("@")[0] || "there";
  const displayName = rawName;
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  // ── Streak tracking (unified with notifications.ts) ──
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    updateStreak().then(d => setStreak(d.count)).catch(() => getStreak().then(d => setStreak(d.count)));
  }, []);
  const recentVideos: Video[] = stats?.recentVideos ?? [];
  const favoriteVideos: Video[] = stats?.favoriteVideos ?? [];
  const recentAiOutputs: RecentAiOutput[] = stats?.recentAiOutputs ?? [];
  const totalWatched = stats?.totalWatched ?? 0;
  const totalVideos = stats?.totalVideos ?? 0;
  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const levelTitle = stats?.levelTitle ?? "Novice";
  const levelColor = stats?.levelColor ?? "#6b7280";
  const progressPct = stats?.progressPct ?? 0;
  const nextLevelXP = stats?.nextLevelXP ?? 100;
  const isMaxLevel = stats?.isMaxLevel ?? false;

  return (
    <TabFadeWrapper>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* ── Ambient glow behind header ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 1200 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[PURPLE + "18", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      <TopAppBar
        rightAction={
          <AppButton
            label="SAVE"
            icon="plus"
            size="sm"
            variant="primary"
            onPress={() => setShowSaveModal(true)}
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botInset + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={PURPLE}
          />
        }
      >
      
        {/* ── Welcome Hero ── */}
        <WelcomeHero
          name={displayName}
          totalVideos={totalVideos}
          totalAi={stats?.totalAiOutputs ?? 0}
          streak={streak}
        />

        {/* ── Streak + Daily Goal Card ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <StreakCard
            streak={streak}
            goal={3}
            done={Math.min(totalWatched, 3)}
          />
        </View>

        {/* ── Welcome Banner (first-time / empty vault) ── */}
        {!isLoading && totalVideos === 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 200 }}
            style={{ marginHorizontal: 20, marginBottom: 20 }}
          >
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: PURPLE + "35",
                overflow: "hidden",
                backgroundColor: PURPLE + "0a",
              }}
            >
              <LinearGradient
                colors={[PURPLE + "22", "transparent", CYAN + "14"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Top accent line */}
              <View
                style={{
                  height: 2,
                  backgroundColor: PURPLE,
                  width: "40%",
                  borderBottomRightRadius: 2,
                }}
              />
              <View style={{ padding: 22, gap: 16 }}>
                {/* Header */}
                <View style={{ gap: 4 }}>
                  <Text
                    style={{
                      fontFamily: "Eczar_400Regular",
                      fontSize: 9,
                      letterSpacing: 2,
                      color: PURPLE,
                    }}
                  ></Text>
                  <Text
                    style={{
                      fontFamily: "AlegreyaSansSC_700Bold",
                      fontSize: 26,
                      color: colors.foreground,
                      letterSpacing: 0.5,
                      lineHeight: 30,
                    }}
                  >
                    Welcome to{"\n"}VidVault AI
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Eczar_400Regular",
                      fontSize: 12,
                      color: colors.mutedForeground,
                      lineHeight: 18,
                      marginTop: 2,
                    }}
                  >
                    Your AI-powered video knowledge base. Save YouTube videos,
                    generate summaries, flashcards & more.
                  </Text>
                </View>
                {/* Feature list */}
                <View style={{ gap: 10 }}>
                  {[
                    {
                      icon: "youtube" as FeatherIconName,
                      color: PINK,
                      text: "Save any YouTube video instantly",
                    },
                    {
                      icon: "cpu" as FeatherIconName,
                      color: PURPLE,
                      text: "AI summaries, MCQs & flashcards",
                    },
                    {
                      icon: "edit-3" as FeatherIconName,
                      color: CYAN,
                      text: "Timestamped notes & AI chat",
                    },
                    {
                      icon: "folder" as FeatherIconName,
                      color: AMBER,
                      text: "Organize with folders & tags",
                    },
                  ].map(({ icon, color, text }) => (
                    <View
                      key={text}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: color + "18",
                          borderWidth: 1,
                          borderColor: color + "35",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name={icon} size={13} color={color} />
                      </View>
                      <Text
                        style={{
                          fontFamily: "Eczar_400Regular",
                          fontSize: 12,
                          color: colors.desc,
                          flex: 1,
                        }}
                      >
                        {text}
                      </Text>
                    </View>
                  ))}
                </View>
                {/* CTA */}
                <View style={{ alignItems: "flex-start", marginTop: 4 }}>
                  <AppButton
                    label="SAVE FIRST VIDEO"
                    icon="plus"
                    size="sm"
                    variant="primary"
                    onPress={() => setShowSaveModal(true)}
                  />
                </View>
              </View>
            </View>
          </MotiView>
        )}

        {/* ── Quick Actions (horizontal scroll, 7 items) ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 180, delay: 80 }}
          style={{ marginBottom: 20 }}
        >
          <View style={styles.sectionHeaderInline}>
            <Feather name="grid" size={13} color={PURPLE} style={{ marginTop: 1 }} />
            <Text style={[styles.sectionInlineTitle, { color: colors.foreground }]}>Quick Access</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {[
              { icon: "plus-circle" as FeatherIconName, label: "Save Video",    sublabel: "Add to vault",   accent: PURPLE, onPress: () => setShowSaveModal(true) },
              { icon: "cpu"         as FeatherIconName, label: "AI Studio",     sublabel: "Generate AI",    accent: CYAN,   onPress: () => router.push("/(tabs)/ai-studio") },
              { icon: "bookmark"    as FeatherIconName, label: "Watch Later",   sublabel: "Queue videos",   accent: "#06b6d4", onPress: () => router.push("/watch-later") },
              { icon: "search"      as FeatherIconName, label: "Search",        sublabel: "Find anything",  accent: GREEN,  onPress: () => router.push("/search") },
              { icon: "layers"      as FeatherIconName, label: "SR Review",     sublabel: "Flashcards",     accent: PINK,   onPress: () => router.push("/review") },
              { icon: "folder"      as FeatherIconName, label: "Folders",       sublabel: "Organize",       accent: AMBER,  onPress: () => router.push("/(tabs)/folders") },
              { icon: "compass"     as FeatherIconName, label: "Discover",      sublabel: "All tools",      accent: GREEN,  onPress: () => router.push("/(tabs)/discover") },
            ].map((qa, i) => (
              <QuickAction key={qa.label} {...qa} delay={60 + i * 50} />
            ))}
          </ScrollView>
        </MotiView>

        {/* ── Stats 2×3 grid ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="bar-chart-2" size={12} color={PURPLE} />
            <Text
              style={[styles.sectionLabel, { color: colors.mutedForeground }]}
            >
              VAULT METRICS
            </Text>
            <View
              style={[styles.sectionLine, { backgroundColor: colors.border }]}
            />
          </View>
          {isLoading ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  height={100}
                  style={{ width: (screenWidth - 50) / 2 }}
                  borderRadius={4}
                />
              ))}
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {STAT_CONFIG.map((cfg, i) => {
                const statRoutes: Record<string, (() => void) | undefined> = {
                  "01": () => router.push("/(tabs)/videos"),
                  "02": () => router.push("/(tabs)/folders"),
                  "03": () => router.push("/(tabs)/videos"),
                  "04": () => router.push("/(tabs)/ai-studio"),
                  "05": () => router.push("/(tabs)/videos"),
                  "06": () => router.push("/(tabs)/videos"),
                };
                return (
                  <View key={cfg.code} style={{ width: (screenWidth - 50) / 2 }}>
                    <EtchedStatCard
                      code={cfg.code}
                      label={cfg.label}
                      icon={cfg.icon}
                      accent={cfg.accent}
                      delay={i * 80}
                      value={(stats as any)?.[cfg.key] ?? 0}
                      onPress={statRoutes[cfg.code]}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Level / XP Card ── */}
        {!isLoading && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="trending-up" size={12} color={GREEN} />
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                LEARNER PROGRESS
              </Text>
              <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
            </View>
            <LevelCard
              level={level}
              levelTitle={levelTitle}
              levelColor={levelColor}
              xp={xp}
              nextLevelXP={nextLevelXP}
              progressPct={progressPct}
              isMaxLevel={isMaxLevel}
            />
          </View>
        )}

        {/* ── Watch Progress bar ── */}
        {totalVideos > 0 && (
          <View style={styles.sectionPad}>
            <WatchProgressBar watched={totalWatched} total={totalVideos} />
          </View>
        )}

        {/* ── Recent AI Activity ── */}
        {recentAiOutputs.length > 0 && (
          <View style={styles.section}>
            <MotiView
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 380, delay: 150 }}
              style={styles.sectionHeader2}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <Feather name="cpu" size={10} color={PURPLE} />
                  <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>RECENT</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Activity</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/ai-studio")} activeOpacity={0.7}>
                <Text style={[styles.viewAll, { color: PURPLE }]}>STUDIO →</Text>
              </TouchableOpacity>
            </MotiView>
            <View style={{ gap: 8 }}>
              {recentAiOutputs.slice(0, 5).map((output, i) => (
                <RecentAiItemCard key={output.id} output={output} index={i} />
              ))}
            </View>
          </View>
        )}

        {/* ── Recent Captures — vertical full-width ── */}
        <View style={styles.section}>
          <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 380, delay: 200 }}
            style={styles.sectionHeader2}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <Feather name="film" size={10} color={CYAN} />
                <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>VIDVAULT</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest Captures</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
              <Text style={[styles.viewAll, { color: PURPLE }]}>VIEW ALL →</Text>
            </TouchableOpacity>
          </MotiView>

          {isLoading ? (
            <View style={{ gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={170} borderRadius={4} />
              ))}
            </View>
          ) : recentVideos.length > 0 ? (
            <View style={{ gap: 0 }}>
              {recentVideos.slice(0, 5).map((video: Video, index: number) => (
                <MotiView
                  key={video.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 340,
                    delay: index * 70,
                  }}
                >
                  <VideoCard
                    video={video}
                    cardWidth={CARD_W}
                    isNew={index === 0}
                    onPress={() => router.push(`/video/${video.id}`)}
                    onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                  />
                </MotiView>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="film"
              title="Vault is empty"
              subtitle="Save your first YouTube video to get started"
              actionLabel="Save Video"
              onAction={() => setShowSaveModal(true)}
              code="00"
            />
          )}
        </View>

        {/* ── Explore AI Tools shortcut hub ── */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          style={{ marginHorizontal: 20, marginBottom: 20 }}
        >
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Feather name="cpu" size={12} color={CYAN} />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI TOOLS</Text>
            <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
            <TouchableOpacity onPress={() => router.push("/(tabs)/discover")} activeOpacity={0.7}>
              <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 1.5, color: CYAN }}>ALL →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { icon: "book-open" as FeatherIconName, label: "Key Terms", color: AMBER, route: "/key-terms" },
              { icon: "message-circle" as FeatherIconName, label: "Cross-Vault AI", color: CYAN, route: "/cross-video-ai" },
              { icon: "clock" as FeatherIconName, label: "Chat History", color: PURPLE, route: "/chat-history" },
              { icon: "layers" as FeatherIconName, label: "SR Review", color: PINK, route: "/review" },
              { icon: "layout" as FeatherIconName, label: "Templates", color: AMBER, route: "/(tabs)/discover" },
            ].map((tool, i) => (
              <TouchableOpacity
                key={tool.label}
                onPress={() => router.push(tool.route as any)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 7,
                  backgroundColor: colors.card, borderWidth: 1,
                  borderColor: tool.color + "30", borderRadius: 12,
                  paddingHorizontal: 12, paddingVertical: 10,
                }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: tool.color + "18", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={tool.icon} size={13} color={tool.color} />
                </View>
                <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 12, color: colors.foreground }}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </MotiView>

        {/* ── Favorites ── */}
        {favoriteVideos.length > 0 && (
          <View style={styles.section}>
            <MotiView
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 380, delay: 350 }}
              style={styles.sectionHeader2}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <Feather name="heart" size={10} color={PINK} />
                  <Text style={[styles.sectionMicro, { color: colors.mutedForeground }]}>STARRED</Text>
                </View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Favorites</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/videos")} activeOpacity={0.7}>
                <Text style={[styles.viewAll, { color: PINK }]}>VIEW ALL →</Text>
              </TouchableOpacity>
            </MotiView>
            <View style={{ gap: 0 }}>
              {favoriteVideos.slice(0, 4).map((video: Video, index) => (
                <MotiView
                  key={video.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: "timing",
                    duration: 340,
                    delay: index * 70,
                  }}
                >
                  <VideoCard
                    video={video}
                    cardWidth={CARD_W}
                    onPress={() => router.push(`/video/${video.id}`)}
                    onToggleFavorite={() => favoriteMutation.mutate(video.id)}
                  />
                </MotiView>
              ))}
            </View>
          </View>
        )}

        {/* ── Daily AI Tip ── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <Feather name="zap" size={12} color={PURPLE} />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DAILY TIP</Text>
            <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
          </View>
          <DailyTipCard />
        </View>

        {/* ── Vault tagline ── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 600, delay: 800 }}
          style={[styles.tagline, { marginBottom: 10 }]}
        >
          <LinearGradient
            colors={[PURPLE + "00", PURPLE + "15", PURPLE + "00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
          />
          <Text style={[styles.taglineText, { color: colors.mutedForeground + "50" }]}>
            VidVault AI · Knowledge Amplified
          </Text>
        </MotiView>
      </ScrollView>

      <SaveToVaultModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
      />
    </View>
    </TabFadeWrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  ambientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 0,
  },

  heroCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 130,
    shadowOffset: { width: 0, height: 6 },
  },
  greeting: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  greetingTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  greetingLabel: {
    fontSize: 10,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2.5,
  },
  greetingName: {
    fontSize: 38,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 6,
  },
  greetingSub: {
    fontSize: 10,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 1.5,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#10b98115",
    borderWidth: 1,
    borderColor: "#10b98130",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 9,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 1.5,
  },

  quickActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickBtn: {
    width: 96,
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
  },
  quickBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnLabel: {
    fontSize: 10.5,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  quickBtnSub: {
    fontSize: 8,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  sectionPad: { paddingHorizontal: 20, marginBottom: 20 },
  section: { paddingHorizontal: 20, marginBottom: 28 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sectionHeader2: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  sectionLine: { flex: 1, height: 1 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2,
  },
  sectionMicro: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "AlegreyaSansSC_700Bold",
    letterSpacing: -0.4,
  },
  viewAll: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 1.5,
    paddingBottom: 3,
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  etchedCard: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  etchedTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  etchedCode: {
    fontSize: 8,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.2)",
  },
  etchedLabel: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  etchedValue: {
    fontSize: 36,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    lineHeight: 42,
    letterSpacing: -2,
  },
  etchedGlow: {
    position: "absolute",
    bottom: -24,
    right: -24,
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  intelBar: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffffff12",
    backgroundColor: "#111115",
    overflow: "hidden",
  },
  intelTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  intelDot: { width: 7, height: 7, borderRadius: 3.5 },
  intelLabel: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 1.8,
  },
  intelCount: {
    fontSize: 11,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 0.5,
  },
  intelTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  intelFill: { height: "100%", borderRadius: 2, overflow: "hidden" },
  intelSub: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.3,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  activityLeft: { width: 24, alignItems: "center" },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 14,
    borderWidth: 2,
    zIndex: 1,
    overflow: "visible",
  },
  activityLine: { flex: 1, width: 1, minHeight: 28 },
  activityCard: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  activityTitle: {
    fontSize: 12,
    fontFamily: "Eczar_600SemiBold",
    lineHeight: 17,
  },
  activityChannel: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  newPill: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  newPillText: {
    color: "#fff",
    fontSize: 7,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 1,
  },

  tagline: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    overflow: "hidden",
  },
  taglineText: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2.5,
  },

  /* Section nav bar */
  navPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  navPillText: { fontSize: 11, letterSpacing: 0.2 },

  /* Section inline header (Quick Actions) */
  sectionHeaderInline: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, marginBottom: 10,
  },
  sectionInlineTitle: {
    fontFamily: "Eczar_600SemiBold", fontSize: 13, letterSpacing: 0.1,
  },

  /* Streak card */
  streakCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
  },
  streakTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  streakLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakFlame: { fontSize: 28 },
  streakNum: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 32, lineHeight: 36 },
  streakLabel: { fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 1.5 },
  streakDays: { flexDirection: "row", gap: 5 },
  streakDayWrap: { alignItems: "center", gap: 3 },
  streakDayDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
  },
  streakDayLabel: { fontFamily: "Eczar_400Regular", fontSize: 8 },
  streakGoal: { gap: 7 },
  streakGoalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  streakGoalLabel: { fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 1.5 },
  streakGoalVal: { fontFamily: "Eczar_600SemiBold", fontSize: 10 },
  streakTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  streakFill: { height: "100%", borderRadius: 3, overflow: "hidden" },

  /* Daily tip card */
  tipCard: {
    borderRadius: 14, borderWidth: 1, flexDirection: "row",
    overflow: "hidden", shadowOffset: { width: 0, height: 3 },
  },
  tipStripe: { width: 3 },
  tipContent: { flex: 1, padding: 14, gap: 10 },
  tipHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
  },
  tipLabel: { fontFamily: "Eczar_600SemiBold", fontSize: 9, letterSpacing: 1.2 },
  tipDate:  { fontFamily: "Eczar_400Regular",  fontSize: 9, marginTop: 1 },
  tipText:  { fontFamily: "Eczar_400Regular",  fontSize: 12.5, lineHeight: 20 },

  levelCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  levelTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  levelLabel: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2,
    marginBottom: 8,
  },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNum: {
    fontSize: 18,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    lineHeight: 22,
  },
  levelTitle: {
    fontSize: 13,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 0.2,
  },
  levelSub: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.5,
  },
  xpBlock: { alignItems: "flex-end" },
  xpValue: {
    fontSize: 32,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    lineHeight: 36,
    letterSpacing: -1,
  },
  xpLabel: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2,
  },
  xpTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  xpFill: { height: "100%", borderRadius: 3, overflow: "hidden" },
  xpMeta: { flexDirection: "row", justifyContent: "space-between" },
  xpMetaText: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.5,
  },

  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  aiCardThumb: { flexShrink: 0 },
  aiCardTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  aiCardType: {
    fontSize: 8,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 1.5,
  },
  aiCardTitle: {
    fontSize: 12,
    fontFamily: "Eczar_500Medium",
    lineHeight: 17,
  },
  aiCardTime: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
