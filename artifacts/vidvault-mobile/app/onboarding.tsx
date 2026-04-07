import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { TouchableOpacity } from "react-native";
import Svg, { Line, Defs, RadialGradient, Stop, Ellipse, Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, MotiText } from "moti";
import { AppButton } from "@/components/ui/AppButton";
import { VidVaultLogo } from "@/components/VidVaultLogo";

const { width: W, height: H } = Dimensions.get("window");

const BG     = "#09090c";
const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const WHITE  = "#ffffff";
const MUTED  = "rgba(255,255,255,0.55)";
const MUTED2 = "rgba(255,255,255,0.28)";

const CELL = Platform.OS === "android" ? 60 : 56;
const GRID_LINE = "rgba(139,92,246,0.05)";

const SLIDES = [
  {
    code: "01",
    badge: "SAVE_CONTENT",
    title: "Your Second\nBrain for Video",
    subtitle: "Paste any YouTube URL to instantly save it to your personal knowledge vault — forever.",
    accent: PURPLE,
    accentGlow: "rgba(99,102,241,0.18)",
    accentBorder: "rgba(99,102,241,0.35)",
    icon: "▶",
  },
  {
    code: "02",
    badge: "AI_INSIGHTS",
    title: "Instant AI\nAnalysis",
    subtitle: "Summaries, study notes, flashcards and quizzes — generated from any video in seconds.",
    accent: CYAN,
    accentGlow: "rgba(6,182,212,0.16)",
    accentBorder: "rgba(6,182,212,0.30)",
    icon: "◈",
  },
  {
    code: "03",
    badge: "ORGANIZE",
    title: "Organize &\nDiscover",
    subtitle: "Sort videos into folders, add tags, and chat with AI to find exactly what you need.",
    accent: GREEN,
    accentGlow: "rgba(16,185,129,0.16)",
    accentBorder: "rgba(16,185,129,0.30)",
    icon: "⬡",
  },
];

const ONBOARDING_KEY = "vidvault_onboarding_done";

const completeOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/login");
};

/* ── Animated grid background ── */
function GridBg() {
  const cols = Math.ceil(W / CELL) + 1;
  const rows = Math.ceil(H / CELL) + 1;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="45%" rx="55%" ry="50%">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={W / 2} cy={H * 0.42} rx={W * 0.65} ry={H * 0.38} fill="url(#glow)" />
        {Array.from({ length: cols }).map((_, i) => (
          <Line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H} stroke={GRID_LINE} strokeWidth={1} />
        ))}
        {Array.from({ length: rows }).map((_, i) => (
          <Line key={`h${i}`} x1={0} y1={i * CELL} x2={W} y2={i * CELL} stroke={GRID_LINE} strokeWidth={1} />
        ))}
        {/* Corner accent dots */}
        <Circle cx={0} cy={0} r={1.5} fill={PURPLE} fillOpacity={0.4} />
        <Circle cx={W} cy={0} r={1.5} fill={PURPLE} fillOpacity={0.4} />
        <Circle cx={0} cy={H} r={1.5} fill={PURPLE} fillOpacity={0.3} />
        <Circle cx={W} cy={H} r={1.5} fill={PURPLE} fillOpacity={0.3} />
      </Svg>
    </View>
  );
}

/* ── Pulsing glow ring around icon ── */
function GlowRing({ color, size }: { color: string; size: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const outerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] });
  const innerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.20, 0.45] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: outerOpacity,
          transform: [{ scale }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: size * 0.75,
          height: size * 0.75,
          borderRadius: (size * 0.75) / 2,
          backgroundColor: color,
          opacity: innerOpacity,
        }}
      />
    </View>
  );
}

/* ── Floating particles ── */
function FloatingParticles({ accent }: { accent: string }) {
  const particles = [
    { x: W * 0.08, y: H * 0.18, size: 2.5, delay: 0,    dur: 3200 },
    { x: W * 0.88, y: H * 0.22, size: 2,   delay: 400,  dur: 2800 },
    { x: W * 0.15, y: H * 0.72, size: 1.8, delay: 800,  dur: 3600 },
    { x: W * 0.82, y: H * 0.68, size: 2.2, delay: 200,  dur: 3000 },
    { x: W * 0.50, y: H * 0.10, size: 1.5, delay: 1000, dur: 2600 },
    { x: W * 0.70, y: H * 0.85, size: 2,   delay: 600,  dur: 3400 },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <MotiView
          key={i}
          from={{ opacity: 0.1, translateY: -5 }}
          animate={{ opacity: 0.5, translateY: 5 }}
          transition={{
            type: "timing",
            duration: p.dur,
            delay: p.delay,
            loop: true,
            repeatReverse: true,
          }}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: accent,
          }}
          pointerEvents="none"
        />
      ))}
    </>
  );
}

/* ── Slide icon box with glow ── */
function SlideIcon({ slide, key: _k }: { slide: typeof SLIDES[0]; key?: number }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
      <GlowRing color={slide.accent} size={130} />
      <View
        style={[
          styles.iconBox,
          { backgroundColor: slide.accentGlow, borderColor: slide.accentBorder },
        ]}
      >
        <Text style={{ fontSize: 46, color: slide.accent }}>{slide.icon}</Text>
      </View>
    </View>
  );
}

/* ── Main onboarding screen ── */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const [key, setKey] = useState(0);

  const slide  = SLIDES[Math.min(current, SLIDES.length - 1)];
  const isLast = current === SLIDES.length - 1;

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "android" ? 20 : 0) + (Platform.OS === "web" ? 34 : 0);

  const next = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrent((c) => Math.min(c + 1, SLIDES.length - 1));
      setKey((k) => k + 1);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <GridBg />
      <FloatingParticles accent={slide.accent} />

      {/* Corner brackets */}
      <View style={[styles.bracketTL, { borderColor: PURPLE + "50" }]} />
      <View style={[styles.bracketBR, { borderColor: slide.accent + "40" }]} />
      <View style={[styles.bracketTR, { borderColor: slide.accent + "25" }]} />

      {/* ── Top bar ── */}
      <MotiView
        from={{ opacity: 0, translateY: -12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
        style={styles.topBar}
      >
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { borderColor: PURPLE + "50", backgroundColor: PURPLE + "14" }]}>
            <VidVaultLogo size={22} />
          </View>
          <Text style={styles.logoName}>VidVault</Text>
        </View>

        <TouchableOpacity
          onPress={completeOnboarding}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <View style={styles.skipBadge}>
            <Text style={styles.skipText}>SKIP</Text>
          </View>
        </TouchableOpacity>
      </MotiView>

      {/* ── Slide body ── */}
      <View style={styles.body}>
        {/* Faint large code number */}
        <MotiText
          key={`code-${key}`}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 400 }}
          style={[styles.bigCode, { color: slide.accent }]}
        >
          {slide.code}
        </MotiText>

        {/* Icon */}
        <MotiView
          key={`icon-${key}`}
          from={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 60 }}
        >
          <SlideIcon slide={slide} />
        </MotiView>

        {/* Badge */}
        <MotiView
          key={`badge-${key}`}
          from={{ opacity: 0, translateX: -14 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 380, delay: 80 }}
          style={[styles.badge, { borderColor: slide.accent + "55" }]}
        >
          <View style={[styles.badgeDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
        </MotiView>

        {/* Title */}
        <MotiText
          key={`title-${key}`}
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 420, delay: 100 }}
          style={styles.title}
        >
          {slide.title}
        </MotiText>

        {/* Accent rule */}
        <MotiView
          key={`rule-${key}`}
          from={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ type: "timing", duration: 400, delay: 140 }}
          style={[styles.accentRule, { backgroundColor: slide.accent }]}
        />

        {/* Subtitle */}
        <MotiText
          key={`sub-${key}`}
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 160 }}
          style={styles.subtitle}
        >
          {slide.subtitle}
        </MotiText>
      </View>

      {/* ── Footer ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 80 }}
        style={styles.footer}
      >
        {/* Progress indicators */}
        <View style={styles.stepRow}>
          {SLIDES.map((s, i) => (
            <MotiView
              key={i}
              animate={{
                width: i === current ? 32 : 6,
                backgroundColor: i === current ? WHITE : MUTED2,
              }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.stepDot}
            />
          ))}
          <Text style={styles.stepLabel}>{current + 1} / {SLIDES.length}</Text>
        </View>

        {/* CTA using the global AppButton */}
        <AppButton
          label={isLast ? "GET STARTED" : "CONTINUE"}
          onPress={next}
          variant="primary"
          size="lg"
          fullWidth
        />

        {/* Ghost skip/sign-in link on last slide */}
        {isLast && (
          <TouchableOpacity onPress={completeOnboarding} activeOpacity={0.7}>
            <Text style={styles.signInLink}>ALREADY HAVE AN ACCOUNT? <Text style={{ color: WHITE }}>SIGN IN →</Text></Text>
          </TouchableOpacity>
        )}

        <Text style={styles.hint}>KNOWLEDGE_BASE // ACTIVE</Text>
      </MotiView>
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
    top: 60,
    left: 14,
    width: 22,
    height: 22,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bracketBR: {
    position: "absolute",
    bottom: 108,
    right: 14,
    width: 22,
    height: 22,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  bracketTR: {
    position: "absolute",
    top: 60,
    right: 14,
    width: 14,
    height: 14,
    borderTopWidth: 1,
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
  logoName: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 17,
    color: WHITE,
  },
  skipBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  skipText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2,
  },

  /* Body */
  body: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 8,
  },

  bigCode: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 110,
    lineHeight: 110,
    opacity: 0.045,
    position: "absolute",
    top: -14,
    right: -8,
  },

  iconBox: {
    width: 106,
    height: 106,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
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
    fontSize: 38,
    color: WHITE,
    lineHeight: 46,
  },

  accentRule: {
    width: 44,
    height: 2,
    borderRadius: 1,
    opacity: 0.85,
    alignSelf: "flex-start",
  },

  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: MUTED,
    lineHeight: 23,
    maxWidth: 310,
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
    height: 10,
  },
  stepDot: {
    height: 4,
    borderRadius: 2,
  },
  stepLabel: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: MUTED2,
    letterSpacing: 1.5,
    marginLeft: 6,
  },

  signInLink: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1.2,
  },

  hint: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 8,
    color: MUTED2,
    letterSpacing: 2,
  },
});
