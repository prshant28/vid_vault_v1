import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import Svg, {
  Defs, RadialGradient, LinearGradient, Stop,
  Circle, Ellipse, Line, Path, Rect, Polygon,
} from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, MotiText } from "moti";
import { AppButton } from "@/components/ui/AppButton";
import { VidVaultLogo } from "@/components/VidVaultLogo";

const { width: W, height: H } = Dimensions.get("window");

const BG       = "#08080d";
const CARD     = "#0f0f1a";
const PURPLE   = "#6366f1";
const VIOLET   = "#8b5cf6";
const CYAN     = "#06b6d4";
const WHITE    = "#ffffff";
const MUTED    = "rgba(255,255,255,0.50)";
const MUTED2   = "rgba(255,255,255,0.22)";
const BORDER   = "rgba(99,102,241,0.18)";

const ONBOARDING_KEY = "vidvault_onboarding_done";

const completeOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/login");
};

/* ─── Slide data ─── */
const SLIDES = [
  {
    badge: "SAVE · COLLECT",
    title: "Your Video\nKnowledge Vault",
    subtitle: "Save any YouTube video with one tap. Build a personal library of everything that matters to you.",
    illustration: "save",
  },
  {
    badge: "AI · ANALYZE",
    title: "Instant AI\nInsights",
    subtitle: "Auto-generate summaries, flashcards, quizzes and study notes from any video in seconds.",
    illustration: "ai",
  },
  {
    badge: "ORGANIZE · DISCOVER",
    title: "Find What You\nNeed, Fast",
    subtitle: "Folders, tags and AI chat — everything organized so you can retrieve any insight instantly.",
    illustration: "organize",
  },
];

/* ─── Animated rotating ring ─── */
function RotatingRing({ radius, color, duration, opacity = 0.3, dash = "6,10" }: {
  radius: number; color: string; duration: number; opacity?: number; dash?: string;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    ).start();
    return () => spin.stopAnimation();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const d = radius * 2 + 4;
  return (
    <Animated.View style={{ position: "absolute", width: d, height: d, transform: [{ rotate }] }}>
      <Svg width={d} height={d} viewBox={`0 0 ${d} ${d}`}>
        <Circle
          cx={d / 2} cy={d / 2} r={radius}
          fill="none" stroke={color} strokeWidth={1}
          strokeDasharray={dash} opacity={opacity}
        />
      </Svg>
    </Animated.View>
  );
}

/* ─── Slide 1 illustration: Save / Video library ─── */
function SaveIllustration() {
  const IW = W * 0.78;
  const IH = IW * 0.78;
  const cx = IW / 2, cy = IH / 2;
  const r0 = IW * 0.36;

  return (
    <View style={{ width: IW, height: IH, alignItems: "center", justifyContent: "center" }}>
      {/* Rotating rings */}
      <RotatingRing radius={r0 * 0.55} color={PURPLE} duration={8000} opacity={0.18} dash="4,8" />
      <RotatingRing radius={r0 * 0.72} color={CYAN} duration={14000} opacity={0.12} dash="8,14" />
      <RotatingRing radius={r0 * 0.90} color={VIOLET} duration={20000} opacity={0.08} dash="3,18" />

      <Svg width={IW} height={IH} style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="saveGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={PURPLE} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="playGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#a78bfa" />
            <Stop offset="100%" stopColor={PURPLE} />
          </LinearGradient>
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#13132a" />
            <Stop offset="100%" stopColor="#0d0d1f" />
          </LinearGradient>
        </Defs>

        {/* Outer glow */}
        <Ellipse cx={cx} cy={cy} rx={r0} ry={r0 * 0.88} fill="url(#saveGlow)" />

        {/* Background circle */}
        <Circle cx={cx} cy={cy} r={r0 * 0.54} fill={CARD} />
        <Circle cx={cx} cy={cy} r={r0 * 0.54} fill="none" stroke={BORDER} strokeWidth={1} />

        {/* Floating video cards (background) */}
        {[
          { x: cx - r0 * 0.62, y: cy - r0 * 0.52, w: r0 * 0.44, h: r0 * 0.28, op: 0.5 },
          { x: cx + r0 * 0.22, y: cy - r0 * 0.58, w: r0 * 0.38, h: r0 * 0.25, op: 0.4 },
          { x: cx - r0 * 0.52, y: cy + r0 * 0.38, w: r0 * 0.36, h: r0 * 0.22, op: 0.35 },
          { x: cx + r0 * 0.30, y: cy + r0 * 0.42, w: r0 * 0.42, h: r0 * 0.26, op: 0.45 },
        ].map((c, i) => (
          <Rect
            key={i}
            x={c.x} y={c.y} width={c.w} height={c.h} rx={4}
            fill="#1a1a2e" stroke={PURPLE} strokeWidth={0.7} opacity={c.op}
          />
        ))}

        {/* Central play button */}
        <Circle cx={cx} cy={cy} r={r0 * 0.24} fill={PURPLE} fillOpacity={0.15} />
        <Circle cx={cx} cy={cy} r={r0 * 0.18} fill={PURPLE} fillOpacity={0.25} />
        <Polygon
          points={`${cx + r0 * 0.08},${cy} ${cx - r0 * 0.06},${cy - r0 * 0.1} ${cx - r0 * 0.06},${cy + r0 * 0.1}`}
          fill="url(#playGrad)"
        />

        {/* Node dots on ring */}
        {[0, 72, 144, 216, 288].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const nx = cx + Math.cos(rad) * r0 * 0.72;
          const ny = cy + Math.sin(rad) * r0 * 0.72;
          return <Circle key={i} cx={nx} cy={ny} r={2.5} fill={i === 0 ? CYAN : PURPLE} fillOpacity={0.7} />;
        })}
      </Svg>
    </View>
  );
}

/* ─── Slide 2 illustration: AI neural net ─── */
function AIIllustration() {
  const IW = W * 0.78;
  const IH = IW * 0.78;
  const cx = IW / 2, cy = IH / 2;
  const r0 = IW * 0.36;

  const nodes = [
    { x: cx, y: cy - r0 * 0.58, r: 7, c: "#a78bfa" },
    { x: cx - r0 * 0.52, y: cy - r0 * 0.18, r: 5, c: PURPLE },
    { x: cx + r0 * 0.52, y: cy - r0 * 0.18, r: 5, c: CYAN },
    { x: cx - r0 * 0.32, y: cy + r0 * 0.40, r: 5, c: PURPLE },
    { x: cx + r0 * 0.32, y: cy + r0 * 0.40, r: 5, c: "#a78bfa" },
    { x: cx, y: cy, r: 14, c: PURPLE },
  ];
  const edges = [
    [0, 5], [1, 5], [2, 5], [3, 5], [4, 5],
    [0, 1], [0, 2], [1, 3], [2, 4],
  ];

  return (
    <View style={{ width: IW, height: IH, alignItems: "center", justifyContent: "center" }}>
      <RotatingRing radius={r0 * 0.60} color={PURPLE} duration={10000} opacity={0.15} dash="5,10" />
      <RotatingRing radius={r0 * 0.85} color={CYAN} duration={18000} opacity={0.10} dash="2,16" />

      <Svg width={IW} height={IH} style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="aiGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={PURPLE} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={CYAN} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="aiCenter" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#a78bfa" />
            <Stop offset="100%" stopColor={PURPLE} />
          </LinearGradient>
        </Defs>

        <Ellipse cx={cx} cy={cy} rx={r0} ry={r0 * 0.88} fill="url(#aiGlow)" />

        {/* Edges */}
        {edges.map(([a, b], i) => (
          <Line
            key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke={PURPLE} strokeWidth={1} opacity={0.25}
          />
        ))}

        {/* Nodes */}
        {nodes.map((n, i) => (
          <React.Fragment key={i}>
            <Circle cx={n.x} cy={n.y} r={n.r * 1.8} fill={n.c} fillOpacity={0.1} />
            <Circle cx={n.x} cy={n.y} r={n.r} fill={n.c} fillOpacity={0.85} />
            {i === 5 && (
              <>
                <Circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke={PURPLE} strokeWidth={1} opacity={0.3} />
                <Circle cx={n.x} cy={n.y} r={n.r + 12} fill="none" stroke={PURPLE} strokeWidth={0.5} opacity={0.15} />
              </>
            )}
          </React.Fragment>
        ))}

        {/* AI spark lines */}
        {[-12, 0, 12].map((offset, i) => (
          <Line
            key={i}
            x1={cx - 6} y1={cy + offset} x2={cx + 6} y2={cy + offset}
            stroke={WHITE} strokeWidth={1.5} opacity={0.5} strokeLinecap="round"
          />
        ))}
      </Svg>
    </View>
  );
}

/* ─── Slide 3 illustration: Organize / Folders ─── */
function OrganizeIllustration() {
  const IW = W * 0.78;
  const IH = IW * 0.78;
  const cx = IW / 2, cy = IH / 2;
  const r0 = IW * 0.36;

  const folders = [
    { x: cx - r0 * 0.50, y: cy - r0 * 0.22, w: r0 * 0.52, h: r0 * 0.36, c: PURPLE },
    { x: cx + r0 * 0.08, y: cy - r0 * 0.14, w: r0 * 0.44, h: r0 * 0.32, c: CYAN },
    { x: cx - r0 * 0.28, y: cy + r0 * 0.20, w: r0 * 0.48, h: r0 * 0.32, c: VIOLET },
  ];

  return (
    <View style={{ width: IW, height: IH, alignItems: "center", justifyContent: "center" }}>
      <RotatingRing radius={r0 * 0.65} color={VIOLET} duration={12000} opacity={0.14} dash="6,12" />
      <RotatingRing radius={r0 * 0.88} color={PURPLE} duration={22000} opacity={0.08} dash="4,20" />

      <Svg width={IW} height={IH} style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="orgGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={VIOLET} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Ellipse cx={cx} cy={cy} rx={r0} ry={r0 * 0.88} fill="url(#orgGlow)" />

        {/* Central hub circle */}
        <Circle cx={cx} cy={cy} r={r0 * 0.22} fill={CARD} />
        <Circle cx={cx} cy={cy} r={r0 * 0.22} fill="none" stroke={PURPLE} strokeWidth={1} opacity={0.3} />

        {/* Folder cards */}
        {folders.map((f, i) => (
          <React.Fragment key={i}>
            {/* Connection line to center */}
            <Line
              x1={f.x + f.w / 2} y1={f.y + f.h / 2}
              x2={cx} y2={cy}
              stroke={f.c} strokeWidth={0.8} opacity={0.25}
            />
            {/* Folder tab */}
            <Rect x={f.x} y={f.y - 6} width={f.w * 0.4} height={7} rx={2} fill={f.c} opacity={0.7} />
            {/* Folder body */}
            <Rect x={f.x} y={f.y} width={f.w} height={f.h} rx={4}
              fill="#11111d" stroke={f.c} strokeWidth={0.8} opacity={0.8} />
            {/* Folder content lines */}
            <Rect x={f.x + 6} y={f.y + 7} width={f.w - 12} height={2} rx={1} fill={f.c} opacity={0.3} />
            <Rect x={f.x + 6} y={f.y + 13} width={(f.w - 12) * 0.65} height={2} rx={1} fill={f.c} opacity={0.2} />
          </React.Fragment>
        ))}

        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={5} fill={PURPLE} />
        <Circle cx={cx} cy={cy} r={9} fill="none" stroke={PURPLE} strokeWidth={0.8} opacity={0.4} />
      </Svg>
    </View>
  );
}

/* ─── Main onboarding screen ─── */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const slide  = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const topPad = insets.top + (Platform.OS === "web" ? 60 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "android" ? 20 : 0) + (Platform.OS === "web" ? 24 : 0);

  const next = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrent((c) => c + 1);
      setAnimKey((k) => k + 1);
    }
  };

  const illustrations = [SaveIllustration, AIIllustration, OrganizeIllustration];
  const Illustration = illustrations[current];

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>

      {/* ── Top bar ── */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 450 }}
        style={styles.topBar}
      >
        <View style={styles.logoRow}>
          <VidVaultLogo size={32} />
          <Text style={styles.logoName}>VidVault</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={completeOnboarding}
          activeOpacity={0.65}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </MotiView>

      {/* ── Illustration ── */}
      <MotiView
        key={`illo-${animKey}`}
        from={{ opacity: 0, scale: 0.90 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 180, delay: 40 }}
        style={styles.illustrationWrap}
      >
        <Illustration />
      </MotiView>

      {/* ── Content card ── */}
      <View style={styles.card}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              animate={{
                width: i === current ? 28 : 6,
                backgroundColor: i === current ? PURPLE : "rgba(99,102,241,0.25)",
              }}
              transition={{ type: "timing", duration: 280 }}
              style={styles.dot}
            />
          ))}
        </View>

        {/* Badge */}
        <MotiView
          key={`badge-${animKey}`}
          from={{ opacity: 0, translateX: -12 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 340, delay: 60 }}
          style={styles.badge}
        >
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{slide.badge}</Text>
        </MotiView>

        {/* Title */}
        <MotiText
          key={`title-${animKey}`}
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 80 }}
          style={styles.title}
        >
          {slide.title}
        </MotiText>

        {/* Subtitle */}
        <MotiText
          key={`sub-${animKey}`}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 120 }}
          style={styles.subtitle}
        >
          {slide.subtitle}
        </MotiText>

        {/* CTA */}
        <MotiView
          key={`cta-${animKey}`}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 320, delay: 160 }}
          style={{ width: "100%" }}
        >
          <AppButton
            label={isLast ? "GET STARTED" : "CONTINUE"}
            onPress={next}
            variant="primary"
            size="lg"
            fullWidth
          />
        </MotiView>

        {/* Sign in hint on last slide */}
        {isLast ? (
          <TouchableOpacity onPress={completeOnboarding} activeOpacity={0.7}>
            <Text style={styles.signInHint}>
              ALREADY HAVE AN ACCOUNT?{"  "}
              <Text style={{ color: WHITE, fontFamily: "Poppins_600SemiBold" }}>Sign in →</Text>
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hintLine}>KNOWLEDGE_BASE // {current + 1}/{SLIDES.length}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
  },

  /* Top bar */
  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 8,
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoName: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 18,
    color: WHITE,
  },
  aiBadge: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 8,
    color: PURPLE,
    letterSpacing: 0.5,
  },
  skipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: MUTED,
    letterSpacing: 0.3,
  },

  /* Illustration */
  illustrationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: H * 0.32,
    maxHeight: H * 0.44,
  },

  /* Content card */
  card: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 14,
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  /* Progress dots */
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },

  /* Badge */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: "rgba(99,102,241,0.06)",
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: PURPLE,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: PURPLE,
    letterSpacing: 0.3,
  },

  /* Title */
  title: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 34,
    color: WHITE,
    lineHeight: 42,
  },

  /* Subtitle */
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13.5,
    color: MUTED,
    lineHeight: 22,
    maxWidth: W - 48,
  },

  signInHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED2,
    letterSpacing: 0.2,
    alignSelf: "center",
  },

  hintLine: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED2,
    letterSpacing: 0.3,
    alignSelf: "center",
  },
});
