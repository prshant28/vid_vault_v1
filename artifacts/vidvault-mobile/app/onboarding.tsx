import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import Svg, { Line, Polygon } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

const BG     = "#09090c";
const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const WHITE  = "#ffffff";
const MUTED  = "#4a4a5a";
const MUTED2 = "#2a2a3a";

/* ── Grid cell size — slightly larger on Android to reduce overdraw ── */
const CELL = Platform.OS === "android" ? 60 : 56;
const GRID_LINE = "rgba(139,92,246,0.06)";

const SLIDES = [
  {
    icon: "film"   as const,
    code: "01",
    badge: "SAVE_CONTENT",
    title: "Save Any\nYouTube Video",
    subtitle: "Paste any YouTube URL to instantly save it to your personal knowledge vault.",
    accent: PURPLE,
    accentGlow: "rgba(99,102,241,0.10)",
    accentBorder: "rgba(99,102,241,0.30)",
  },
  {
    icon: "cpu"    as const,
    code: "02",
    badge: "AI_INSIGHTS",
    title: "Instant AI\nAnalysis",
    subtitle: "Generate summaries, study notes, flashcards, and quizzes from any video with one tap.",
    accent: CYAN,
    accentGlow: "rgba(6,182,212,0.10)",
    accentBorder: "rgba(6,182,212,0.28)",
  },
  {
    icon: "folder" as const,
    code: "03",
    badge: "ORGANIZE",
    title: "Organize &\nDiscover",
    subtitle: "Sort videos into folders, add tags, and chat with AI to find exactly what you need.",
    accent: GREEN,
    accentGlow: "rgba(16,185,129,0.10)",
    accentBorder: "rgba(16,185,129,0.28)",
  },
];

const ONBOARDING_KEY = "vidvault_onboarding_done";

const completeOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/login");
};

/* ─────────────────────────────────────────────
   Grid background
   CRITICAL: wrap Svg in View with pointerEvents="none" (prop, not style)
   so touches pass through on Android.
───────────────────────────────────────────── */
function GridBg() {
  const cols = Math.ceil(W / CELL) + 1;
  const rows = Math.ceil(H / CELL) + 1;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        {Array.from({ length: cols }).map((_, i) => (
          <Line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H} stroke={GRID_LINE} strokeWidth={1} />
        ))}
        {Array.from({ length: rows }).map((_, i) => (
          <Line key={`h${i}`} x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke={GRID_LINE} strokeWidth={1} />
        ))}
      </Svg>
    </View>
  );
}

/* ─────────────────────────────────────────────
   CTA button — pure RN (no SVG) so it works
   reliably on Android and iOS.
───────────────────────────────────────────── */
function CtaButton({ label, onPress, accent }: { label: string; onPress: () => void; accent: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.ctaBtn,
        { backgroundColor: pressed ? "#d8d8d8" : WHITE, borderColor: accent + "40" },
      ]}
    >
      <Text style={styles.ctaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─────────────────────────────────────────────
   Main onboarding screen
───────────────────────────────────────────── */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  const slide   = SLIDES[current];
  const isLast  = current === SLIDES.length - 1;

  const next = () => {
    if (isLast) completeOnboarding();
    else setCurrent((c) => c + 1);
  };

  /* Safe area padding — ensure minimum on Android (nav bar) */
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "android" ? 20 : 0)
               + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <GridBg />

      {/* Corner bracket accents */}
      <View style={[styles.bracketTL, { borderColor: PURPLE + "40" }]} />
      <View style={[styles.bracketBR, { borderColor: slide.accent + "30" }]} />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { borderColor: PURPLE + "40", backgroundColor: PURPLE + "12" }]}>
            <Image source={require("@/assets/images/logo.png")} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={styles.logoName}>VidVault</Text>
        </View>

        <TouchableOpacity
          onPress={completeOnboarding}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* ── Slide body ── */}
      <View style={styles.body}>
        {/* Decorative large slide number — top-right (very faint) */}
        <Text style={[styles.bigCode, { color: slide.accent }]}>{slide.code}</Text>

        {/* Short accent line */}
        <View style={[styles.accentLine, { backgroundColor: slide.accent }]} />

        {/* Icon box */}
        <View style={[styles.iconBox, { backgroundColor: slide.accentGlow, borderColor: slide.accentBorder }]}>
          <Feather name={slide.icon} size={48} color={slide.accent} />
        </View>

        {/* Badge */}
        <View style={[styles.badge, { borderColor: slide.accent + "55" }]}>
          <View style={[styles.badgeDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {/* Progress dots */}
        <View style={styles.stepRow}>
          {SLIDES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  backgroundColor: i === current ? WHITE : MUTED2,
                  width: i === current ? 28 : 6,
                },
              ]}
            />
          ))}
          <Text style={styles.stepLabel}>{current + 1} / {SLIDES.length}</Text>
        </View>

        {/* CTA — pure RN button, works on Android and iOS */}
        <CtaButton
          label={isLast ? "GET STARTED" : "CONTINUE →"}
          onPress={next}
          accent={slide.accent}
        />

        <Text style={styles.hint}>KNOWLEDGE_BASE // ACTIVE</Text>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
  },

  /* Corner brackets */
  bracketTL: {
    position: "absolute",
    top: 70,
    left: 16,
    width: 28,
    height: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  bracketBR: {
    position: "absolute",
    bottom: 110,
    right: 16,
    width: 28,
    height: 28,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 24,
    height: 24,
  },
  logoName: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 17,
    color: WHITE,
    /* letterSpacing omitted — Android renders negative values incorrectly */
  },
  skipText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 2,
  },

  /* Body */
  body: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 18,
    paddingBottom: 12,
  },

  bigCode: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 96,
    lineHeight: 96,
    opacity: 0.05,
    position: "absolute",
    top: -8,
    right: -4,
    /* No negative letterSpacing — not reliable on Android */
  },

  accentLine: {
    width: 36,
    height: 2,
    borderRadius: 1,
    opacity: 0.8,
  },

  iconBox: {
    width: 100,
    height: 100,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 9,
    letterSpacing: 2,
  },

  title: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 36,
    color: WHITE,
    lineHeight: 44,
    /* No negative letterSpacing */
  },

  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
    maxWidth: 300,
  },

  /* Footer */
  footer: {
    alignItems: "center",
    gap: 16,
    paddingBottom: Platform.OS === "android" ? 8 : 12,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  stepDot: {
    height: 4,
    borderRadius: 2,
  },
  stepLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1.5,
    marginLeft: 6,
  },

  /* CTA button — pure RN, no SVG */
  ctaBtn: {
    width: W - 48,
    height: 52,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  ctaLabel: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 14,
    color: BG,
    letterSpacing: 2,
  },

  hint: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 8,
    color: MUTED2,
    letterSpacing: 2,
  },
});
