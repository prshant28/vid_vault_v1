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

const BG = "#09090c";
const PURPLE = "#8b5cf6";
const CYAN = "#06b6d4";
const GREEN = "#10b981";
const WHITE = "#ffffff";
const MUTED = "#4a4a5a";
const MUTED2 = "#2a2a3a";
const GRID_LINE = "rgba(139,92,246,0.07)";
const CELL = 56;

const SLIDES = [
  {
    icon: "film" as const,
    code: "01",
    badge: "SAVE_CONTENT",
    title: "Save Any\nYouTube Video",
    subtitle:
      "Paste any YouTube URL to instantly save it to your personal knowledge vault.",
    accent: PURPLE,
    accentGlow: "rgba(139,92,246,0.12)",
    accentBorder: "rgba(139,92,246,0.3)",
  },
  {
    icon: "cpu" as const,
    code: "02",
    badge: "AI_INSIGHTS",
    title: "Instant AI\nAnalysis",
    subtitle:
      "Generate summaries, study notes, flashcards, and quizzes from any video with one tap.",
    accent: CYAN,
    accentGlow: "rgba(6,182,212,0.10)",
    accentBorder: "rgba(6,182,212,0.28)",
  },
  {
    icon: "folder" as const,
    code: "03",
    badge: "ORGANIZE",
    title: "Organize &\nDiscover",
    subtitle:
      "Sort videos into folders, add tags, and chat with AI to find exactly what you need.",
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

/* Grid background — SVG lines forming subtle dark grid */
function GridBg() {
  const cols = Math.ceil(W / CELL) + 1;
  const rows = Math.ceil(H / CELL) + 1;
  return (
    <Svg width={W} height={H} style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}>
      {Array.from({ length: cols }).map((_, i) => (
        <Line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H} stroke={GRID_LINE} strokeWidth={1} />
      ))}
      {Array.from({ length: rows }).map((_, i) => (
        <Line key={`h${i}`} x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke={GRID_LINE} strokeWidth={1} />
      ))}
    </Svg>
  );
}

/* Polygon CTA button */
function PolyBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const btnW = W - 48;
  const btnH = 52;
  const cut = 12;
  const pts = `${cut},0 ${btnW},0 ${btnW},${btnH - cut} ${btnW - cut},${btnH} 0,${btnH} 0,${cut}`;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={{ width: btnW, height: btnH }}>
        <Svg width={btnW} height={btnH} style={StyleSheet.absoluteFillObject}>
          <Polygon points={pts} fill={pressed ? "#d8d8d8" : WHITE} />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={styles.polyLabel}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <GridBg />

      {/* Corner brackets */}
      <View style={[styles.bracketTL, { borderColor: PURPLE + "30" }]} />
      <View style={[styles.bracketBR, { borderColor: slide.accent + "25" }]} />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        {/* Logo wordmark */}
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { borderColor: PURPLE + "35", backgroundColor: PURPLE + "0d" }]}>
            <Image source={require("@/assets/images/logo.png")} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={styles.logoName}>VidVault</Text>
        </View>

        {/* Skip */}
        <TouchableOpacity onPress={completeOnboarding} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* ── Slide body ── */}
      <View style={styles.body}>
        {/* Large faded code number — decorative */}
        <Text style={[styles.bigCode, { color: slide.accent }]}>{slide.code}</Text>

        {/* Icon in sharp bordered box */}
        <View style={[styles.iconBox, { backgroundColor: slide.accentGlow, borderColor: slide.accentBorder }]}>
          <Feather name={slide.icon} size={44} color={slide.accent} />
        </View>

        {/* Badge */}
        <View style={[styles.badge, { borderColor: slide.accent + "50" }]}>
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
        {/* Step counter */}
        <View style={styles.stepRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.stepDot, {
              backgroundColor: i === current ? WHITE : MUTED2,
              width: i === current ? 24 : 6,
            }]} />
          ))}
          <Text style={styles.stepLabel}>
            {current + 1} / {SLIDES.length}
          </Text>
        </View>

        {/* CTA */}
        <PolyBtn label={isLast ? "GET STARTED" : "CONTINUE →"} onPress={next} />

        {/* Bottom hint */}
        <Text style={styles.hint}>KNOWLEDGE_BASE // ACTIVE</Text>
      </View>
    </View>
  );
}

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
    marginBottom: 0,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 22,
    height: 22,
  },
  logoName: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 17,
    color: WHITE,
    letterSpacing: -0.3,
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
    gap: 16,
  },
  bigCode: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 80,
    lineHeight: 80,
    opacity: 0.08,
    position: "absolute",
    top: 0,
    right: 0,
    letterSpacing: -4,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
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
    fontSize: 34,
    color: WHITE,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
    maxWidth: 320,
  },

  /* Footer */
  footer: {
    paddingBottom: 12,
    alignItems: "center",
    gap: 18,
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
  polyLabel: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 13,
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
