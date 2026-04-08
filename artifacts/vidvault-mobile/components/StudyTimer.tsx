import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, AppState,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useColors";

const PURPLE  = "#6366f1";
const GREEN   = "#10b981";
const ORANGE  = "#f59e0b";
const RED_CLR = "#ef4444";

const WORK_SECS  = 25 * 60;
const BREAK_SECS = 5  * 60;
const TODAY_KEY  = "study-timer-today-v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function addFocusSeconds(secs: number) {
  const key = `${TODAY_KEY}:${todayKey()}`;
  const prev = parseInt((await AsyncStorage.getItem(key)) || "0", 10);
  await AsyncStorage.setItem(key, String(prev + secs));
}

async function getTodayFocusSeconds(): Promise<number> {
  const key = `${TODAY_KEY}:${todayKey()}`;
  return parseInt((await AsyncStorage.getItem(key)) || "0", 10);
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function StudyTimer() {
  const { colors, isDark } = useTheme();

  const [expanded, setExpanded]   = useState(false);
  const [running, setRunning]     = useState(false);
  const [mode, setMode]           = useState<"work" | "break">("work");
  const [secsLeft, setSecsLeft]   = useState(WORK_SECS);
  const [sessions, setSessions]   = useState(0);
  const [todaySecs, setTodaySecs] = useState(0);

  const secsLeftRef = useRef(secsLeft);
  const runningRef  = useRef(running);
  const modeRef     = useRef(mode);
  secsLeftRef.current = secsLeft;
  runningRef.current  = running;
  modeRef.current     = mode;

  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTs = useRef<number | null>(null);

  useEffect(() => {
    getTodayFocusSeconds().then(setTodaySecs);
  }, []);

  const onCycleComplete = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (modeRef.current === "work") {
      await addFocusSeconds(WORK_SECS);
      setSessions(n => n + 1);
      setTodaySecs(await getTodayFocusSeconds());
      setMode("break");
      setSecsLeft(BREAK_SECS);
    } else {
      setMode("work");
      setSecsLeft(WORK_SECS);
    }
  }, []);

  useEffect(() => {
    if (running) {
      lastTickTs.current = Date.now();
      tickRef.current = setInterval(() => {
        const now  = Date.now();
        const diff = Math.round((now - (lastTickTs.current ?? now)) / 1000);
        lastTickTs.current = now;
        setSecsLeft(prev => {
          const next = prev - diff;
          if (next <= 0) {
            onCycleComplete();
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running, onCycleComplete]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", state => {
      if (state !== "active") lastTickTs.current = null;
      else if (runningRef.current) lastTickTs.current = Date.now();
    });
    return () => sub.remove();
  }, []);

  const reset = () => {
    setRunning(false);
    setMode("work");
    setSecsLeft(WORK_SECS);
  };

  const total  = mode === "work" ? WORK_SECS : BREAK_SECS;
  const ratio  = secsLeft / total;
  const accent = mode === "work" ? PURPLE : GREEN;

  const todayMins = Math.floor(todaySecs / 60);

  return (
    <MotiView
      animate={{ height: expanded ? "auto" : 48 } as any}
      style={[S.wrap, { backgroundColor: colors.card, borderColor: accent + "35" }]}
    >
      <LinearGradient
        colors={[accent + "0d", "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Always-visible compact row */}
      <TouchableOpacity
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.85}
        style={S.compactRow}
      >
        <View style={[S.modeChip, { backgroundColor: accent + "18", borderColor: accent + "35" }]}>
          <Feather name={mode === "work" ? "target" : "coffee"} size={10} color={accent} />
          <Text style={[S.modeText, { color: accent }]}>{mode === "work" ? "FOCUS" : "BREAK"}</Text>
        </View>

        {/* Ring progress */}
        <View style={S.ringWrap}>
          <View style={[S.ringBg, { borderColor: colors.border }]} />
          <View
            style={[S.ringFill, {
              borderColor: accent,
              borderTopColor: ratio < 0.25 ? "transparent" : accent,
              borderRightColor: ratio < 0.5 ? "transparent" : accent,
              borderBottomColor: ratio < 0.75 ? "transparent" : accent,
            }]}
          />
          <Feather name="clock" size={8} color={accent} style={S.ringIcon} />
        </View>

        <Text style={[S.timerText, { color: secsLeft < 60 ? RED_CLR : colors.foreground }]}>
          {fmt(secsLeft)}
        </Text>

        {/* Play/Pause quick button */}
        <TouchableOpacity
          onPress={() => setRunning(r => !r)}
          style={[S.playBtn, { backgroundColor: accent + "22", borderColor: accent + "40" }]}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name={running ? "pause" : "play"} size={12} color={accent} />
        </TouchableOpacity>

        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Expanded panel */}
      {expanded && (
        <View style={S.expandedWrap}>
          <View style={[S.divider, { backgroundColor: colors.border }]} />

          {/* Progress bar */}
          <View style={[S.progressTrack, { backgroundColor: colors.border }]}>
            <MotiView
              animate={{ width: `${(1 - ratio) * 100}%` } as any}
              transition={{ type: "timing", duration: 600 }}
              style={[S.progressFill, { backgroundColor: accent }]}
            />
          </View>

          {/* Stats row */}
          <View style={S.statsRow}>
            {[
              { label: "Sessions Today", value: String(sessions), icon: "target" as const, color: PURPLE },
              { label: "Focus Time", value: todayMins < 60 ? `${todayMins}m` : `${Math.floor(todayMins/60)}h ${todayMins%60}m`, icon: "zap" as const, color: ORANGE },
              { label: "Next Up", value: mode === "work" ? "5m break" : "25m focus", icon: "arrow-right" as const, color: GREEN },
            ].map(s => (
              <View key={s.label} style={[S.statBox, { backgroundColor: s.color + "0d", borderColor: s.color + "25" }]}>
                <Feather name={s.icon} size={11} color={s.color} />
                <Text style={[S.statVal, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[S.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Control buttons */}
          <View style={S.controls}>
            <TouchableOpacity
              onPress={reset}
              style={[S.ctrlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Feather name="rotate-ccw" size={13} color={colors.mutedForeground} />
              <Text style={[S.ctrlText, { color: colors.mutedForeground }]}>RESET</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRunning(r => !r)}
              style={[S.ctrlBtn, S.ctrlPrimary, { backgroundColor: accent + "1a", borderColor: accent + "60" }]}
              activeOpacity={0.8}
            >
              <Feather name={running ? "pause" : "play"} size={13} color={accent} />
              <Text style={[S.ctrlText, { color: accent }]}>
                {running ? "PAUSE" : "START"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCycleComplete}
              style={[S.ctrlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Feather name="skip-forward" size={13} color={colors.mutedForeground} />
              <Text style={[S.ctrlText, { color: colors.mutedForeground }]}>SKIP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </MotiView>
  );
}

const S = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeText: { fontFamily: "Eczar_600SemiBold", fontSize: 8, letterSpacing: 1.2 },
  ringWrap: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  ringBg:   { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  ringFill: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  ringIcon: { position: "absolute" },
  timerText: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 15, letterSpacing: 0.5, flex: 1 },
  playBtn: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  expandedWrap: { paddingHorizontal: 12, paddingBottom: 14, gap: 10 },
  divider: { height: StyleSheet.hairlineWidth },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill:  { height: "100%" as any, borderRadius: 2 },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1, padding: 8, borderRadius: 8, borderWidth: 1,
    alignItems: "center", gap: 3,
  },
  statVal: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 14, letterSpacing: -0.3 },
  statLbl: { fontFamily: "Eczar_400Regular", fontSize: 7.5, letterSpacing: 0.8, textAlign: "center" },
  controls: { flexDirection: "row", gap: 8 },
  ctrlBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 9, borderRadius: 9, borderWidth: 1,
  },
  ctrlPrimary: { flex: 2 },
  ctrlText: { fontFamily: "Eczar_600SemiBold", fontSize: 10, letterSpacing: 1 },
});
