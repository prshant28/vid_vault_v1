import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Svg, { Polygon, Line, Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const BG = "#0a0a0b";
const CARD = "#0f0f12";
const PURPLE = "#8b5cf6";
const CYAN = "#06b6d4";
const GREEN = "#10b981";
const MUTED = "#555566";
const MUTED2 = "#3a3a4a";
const WHITE = "#ffffff";
const BORDER = "rgba(255,255,255,0.07)";

const SLIDES = [
  {
    icon: "film" as const,
    code: "01",
    badge: "SAVE_CONTENT",
    title: "Save Any Video",
    subtitle: "Paste any YouTube URL to instantly save it to your personal knowledge vault.",
    accent: PURPLE,
    accentDim: "rgba(139,92,246,0.12)",
    accentBorder: "rgba(139,92,246,0.25)",
  },
  {
    icon: "cpu" as const,
    code: "02",
    badge: "AI_INSIGHTS",
    title: "AI-Powered Analysis",
    subtitle: "Generate summaries, study notes, flashcards, and quizzes with one tap.",
    accent: CYAN,
    accentDim: "rgba(6,182,212,0.10)",
    accentBorder: "rgba(6,182,212,0.22)",
  },
  {
    icon: "folder" as const,
    code: "03",
    badge: "ORGANIZE",
    title: "Organize & Discover",
    subtitle: "Sort videos into folders, tag them, and chat with AI to find exactly what you need.",
    accent: GREEN,
    accentDim: "rgba(16,185,129,0.10)",
    accentBorder: "rgba(16,185,129,0.22)",
  },
];

const ONBOARDING_KEY = "vidvault_onboarding_done";

const completeOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/login");
};

/* Polygon CTA button — matches login screen style */
function PolygonButton({
  label,
  onPress,
  accent,
}: {
  label: string;
  onPress: () => void;
  accent: string;
}) {
  const [pressed, setPressed] = useState(false);
  const btnW = Math.min(width - 48, 500);
  const btnH = 52;
  const cut = 12;
  const points = `${cut},0 ${btnW},0 ${btnW},${btnH - cut} ${btnW - cut},${btnH} 0,${btnH} 0,${cut}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={{ width: btnW, height: btnH }}>
        <Svg width={btnW} height={btnH} style={StyleSheet.absoluteFillObject}>
          <Polygon
            points={points}
            fill={pressed ? "#d0d0d0" : WHITE}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.polyInner]}>
          <Text style={styles.polyText}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* Ghost polygon button for Skip */
function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const btnW = 100;
  const btnH = 34;
  const cut = 7;
  const points = `${cut},0 ${btnW},0 ${btnW},${btnH - cut} ${btnW - cut},${btnH} 0,${btnH} 0,${cut}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={{ width: btnW, height: btnH }}>
        <Svg width={btnW} height={btnH} style={StyleSheet.absoluteFillObject}>
          <Polygon
            points={points}
            fill={pressed ? "rgba(255,255,255,0.04)" : "transparent"}
            stroke={BORDER}
            strokeWidth={1}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.polyInner]}>
          <Text style={styles.ghostText}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* Geometric icon block — sharp corners, no circles */
function SlideIcon({
  icon,
  accent,
  accentDim,
  accentBorder,
}: {
  icon: "film" | "cpu" | "folder";
  accent: string;
  accentDim: string;
  accentBorder: string;
}) {
  return (
    <View style={styles.iconWrap}>
      {/* Outer frame */}
      <View
        style={[
          styles.iconOuter,
          { backgroundColor: accentDim, borderColor: accentBorder },
        ]}
      >
        {/* Corner brackets */}
        <View style={[styles.bracketTL, { borderColor: accent + "60" }]} />
        <View style={[styles.bracketBR, { borderColor: accent + "60" }]} />
        {/* Inner box */}
        <View
          style={[
            styles.iconInner,
            { backgroundColor: accentDim, borderColor: accent + "30" },
          ]}
        >
          <Feather name={icon} size={40} color={accent} />
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

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
      {/* Background grid dots */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {Array.from({ length: 60 }).map((_, i) => {
          const col = i % 10;
          const row = Math.floor(i / 10);
          return (
            <View
              key={i}
              style={[
                styles.gridDot,
                {
                  left: col * (width / 10) + width / 20,
                  top: row * (height / 6) + height / 12,
                  opacity: 0.035 + (col % 3) * 0.01,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Corner accents */}
      <View style={[styles.cornerTL, { borderColor: PURPLE + "25" }]} />
      <View style={[styles.cornerBR, { borderColor: slide.accent + "20" }]} />

      {/* Top bar: code + skip */}
      <View style={styles.topBar}>
        <View style={styles.codeTag}>
          <Text style={[styles.codeTagText, { color: MUTED }]}>{slide.code}/{SLIDES.length.toString().padStart(2, "0")}</Text>
        </View>
        <GhostButton label="SKIP" onPress={completeOnboarding} />
      </View>

      {/* Slide content */}
      <View style={styles.slideContent}>
        {/* Icon */}
        <SlideIcon
          icon={slide.icon}
          accent={slide.accent}
          accentDim={slide.accentDim}
          accentBorder={slide.accentBorder}
        />

        {/* Badge */}
        <View style={[styles.badge, { borderColor: slide.accent }]}>
          <Text style={[styles.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === current ? WHITE : MUTED2,
                  width: i === current ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <PolygonButton
          label={isLast ? "GET STARTED" : "CONTINUE"}
          onPress={next}
          accent={slide.accent}
        />

        {/* Bottom mono hint */}
        <Text style={styles.hint}>
          {isLast ? "YOUR_VAULT_AWAITS" : `STEP_${current + 1}_OF_${SLIDES.length}`}
        </Text>
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
  gridDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: WHITE,
  },
  cornerTL: {
    position: "absolute",
    top: 80,
    left: 20,
    width: 32,
    height: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBR: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 32,
    height: 32,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    marginBottom: 8,
  },
  codeTag: {
    borderWidth: 1,
    borderColor: MUTED2,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  codeTagText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    letterSpacing: 2,
  },

  /* Ghost button internals */
  polyInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  polyText: {
    fontFamily: "Raleway_900Black",
    fontSize: 13,
    color: BG,
    letterSpacing: 2,
  },
  ghostText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 2,
  },

  /* Slide content */
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  iconWrap: {
    marginBottom: 8,
  },
  iconOuter: {
    width: 140,
    height: 140,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bracketTL: {
    position: "absolute",
    top: -1,
    left: -1,
    width: 20,
    height: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  bracketBR: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  iconInner: {
    width: 90,
    height: 90,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
  },
  title: {
    fontFamily: "Raleway_900Black",
    fontSize: 30,
    color: WHITE,
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: MUTED,
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 320,
  },

  /* Footer */
  footer: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  hint: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: MUTED2,
    letterSpacing: 2,
    marginTop: -4,
  },
});
