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

const BG       = "#07070c";
const CARD     = "#0f0f1a";
const PURPLE   = "#6366f1";
const VIOLET   = "#8b5cf6";
const CYAN     = "#06b6d4";
const WHITE    = "#ffffff";
const MUTED    = "rgba(255,255,255,0.52)";
const MUTED2   = "rgba(255,255,255,0.24)";
const BORDER   = "rgba(99,102,241,0.15)";
const GLASS_BG = "rgba(255,255,255,0.025)";

const ONBOARDING_KEY = "vidvault_onboarding_done";

const completeOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/login");
};

const SLIDES = [
  {
    badge: "Save · Collect",
    accent: PURPLE,
    title: "Your Video\nKnowledge Vault",
    subtitle: "Save any YouTube video with one tap. Build a personal library of everything that matters to you.",
    illustration: "save",
  },
  {
    badge: "AI · Analyze",
    accent: CYAN,
    title: "Instant AI\nInsights",
    subtitle: "Auto-generate summaries, flashcards, quizzes and study notes from any video in seconds.",
    illustration: "ai",
  },
  {
    badge: "Organize · Discover",
    accent: VIOLET,
    title: "Find What You\nNeed, Fast",
    subtitle: "Folders, tags and AI chat — everything organized so you can retrieve any insight instantly.",
    illustration: "organize",
  },
];

function RotatingRing({ radius, color, duration, opacity = 0.3, dash = "6,10", reverse = false }: {
  radius: number; color: string; duration: number; opacity?: number; dash?: string; reverse?: boolean;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    ).start();
    return () => spin.stopAnimation();
  }, []);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
  });
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

function SaveIllustration() {
  const IW = W * 0.78;
  const IH = IW * 0.78;
  const cx = IW / 2, cy = IH / 2;
  const r0 = IW * 0.36;

  return (
    <View style={{ width: IW, height: IH, alignItems: "center", justifyContent: "center" }}>
      <RotatingRing radius={r0 * 0.52} color={PURPLE} duration={8000} opacity={0.20} dash="4,8" />
      <RotatingRing radius={r0 * 0.70} color={CYAN}   duration={14000} opacity={0.13} dash="8,14" reverse />
      <RotatingRing radius={r0 * 0.90} color={VIOLET} duration={22000} opacity={0.08} dash="3,20" />

      <Svg width={IW} height={IH} style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="saveGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%"   stopColor={PURPLE} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="playGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#c4b5fd" />
            <Stop offset="100%" stopColor={PURPLE} />
          </LinearGradient>
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#16163a" />
            <Stop offset="100%" stopColor="#0d0d22" />
          </LinearGradient>
        </Defs>

        <Ellipse cx={cx} cy={cy} rx={r0} ry={r0 * 0.88} fill="url(#saveGlow)" />
        <Circle cx={cx} cy={cy} r={r0 * 0.54} fill={CARD} />
        <Circle cx={cx} cy={cy} r={r0 * 0.54} fill="none" stroke={BORDER} strokeWidth={1} />

        {[
          { x: cx - r0 * 0.62, y: cy - r0 * 0.52, w: r0 * 0.44, h: r0 * 0.28, op: 0.55 },
          { x: cx + r0 * 0.22, y: cy - r0 * 0.58, w: r0 * 0.38, h: r0 * 0.25, op: 0.42 },
          { x: cx - r0 * 0.52, y: cy + r0 * 0.38, w: r0 * 0.36, h: r0 * 0.22, op: 0.38 },
          { x: cx + r0 * 0.30, y: cy + r0 * 0.42, w: r0 * 0.42, h: r0 * 0.26, op: 0.48 },
        ].map((c, i) => (
          <Rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={4}
            fill="url(#cardGrad)" stroke={PURPLE} strokeWidth={0.7} opacity={c.op} />
        ))}

        <Circle cx={cx} cy={cy} r={r0 * 0.24} fill={PURPLE} fillOpacity={0.18} />
        <Circle cx={cx} cy={cy} r={r0 * 0.18} fill={PURPLE} fillOpacity={0.30} />
        <Polygon
          points={`${cx + r0 * 0.09},${cy} ${cx - r0 * 0.06},${cy - r0 * 0.11} ${cx - r0 * 0.06},${cy + r0 * 0.11}`}
          fill="url(#playGrad)"
        />

        {[0, 72, 144, 216, 288].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const nx = cx + Math.cos(rad) * r0 * 0.72;
          const ny = cy + Math.sin(rad) * r0 * 0.72;
          return (
            <React.Fragment key={i}>
              <Circle cx={nx} cy={ny} r={4} fill={i === 0 ? CYAN : PURPLE} fillOpacity={0.2} />
              <Circle cx={nx} cy={ny} r={2.5} fill={i === 0 ? CYAN : PURPLE} fillOpacity={0.75} />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function AIIllustration() {
  const IW = W * 0.78;
  const IH = IW * 0.78;
  const cx = IW / 2, cy = IH / 2;
  const r0 = IW * 0.36;

  const nodes = [
    { x: cx,           y: cy - r0 * 0.58, r: 7,  c: "#c4b5fd" },
    { x: cx - r0 * 0.52, y: cy - r0 * 0.18, r: 5,  c: PURPLE },
    { x: cx + r0 * 0.52, y: cy - r0 * 0.18, r: 5,  c: CYAN },
    { x: cx - r0 * 0.32, y: cy + r0 * 0.40, r: 5,  c: PURPLE },
    { x: cx + r0 * 0.32, y: cy + r0 * 0.40, r: 5,  c: "#c4b5fd" },
    { x: cx,           y: cy,              r: 14, c: PURPLE },
  ];
  const edges = [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [0, 1], [0, 2], [1, 3], [2, 4]];

  return (
    <View style={{ width: IW, height: IH, alignItems: "center", justifyContent: "center" }}>
      <RotatingRing radius={r0 * 0.60} color={PURPLE} duration={10000} opacity={0.16} dash="5,10" />
      <RotatingRing radius={r0 * 0.85} color={CYAN}   duration={18000} opacity={0.10} dash="2,18" reverse />

      <Svg width={IW} height={IH} style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="aiGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%"   stopColor={PURPLE} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={CYAN}   stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="aiCenter" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#c4b5fd" />
            <Stop offset="100%" stopColor={PURPLE} />
          </LinearGradient>
        </Defs>

        <Ellipse cx={cx} cy={cy} rx={r0} ry={r0 * 0.88} fill="url(#aiGlow)" />

        {edges.map(([a, b], i) => (
          <Line key={i}
            x1={nodes[a].x} y1={nodes[a].y}
            x2={nodes[b].x} y2={nodes[b].y}
            stroke={PURPLE} strokeWidth={1} opacity={0.28}
          />
        ))}

        {nodes.map((n, i) => (
          <React.Fragment key={i}>
            <Circle cx={n.x} cy={n.y} r={n.r * 2.2} fill={n.c} fillOpacity={0.08} />
            <Circle cx={n.x} cy={n.y} r={n.r} fill={n.c} fillOpacity={0.90} />
            {i === 5 && (
              <>
                <Circle cx={n.x} cy={n.y} r={n.r + 7} fill="none" stroke={PURPLE} strokeWidth={1} opacity={0.35} />
                <Circle cx={n.x} cy={n.y} r={n.r + 14} fill="none" stroke={PURPLE} strokeWidth={0.5} opacity={0.15} />
              </>
            )}
          </React.Fragment>
        ))}

        {[-10, 0, 10].map((offset, i) => (
          <Line key={i}
            x1={cx - 5.5} y1={cy + offset}
            x2={cx + 5.5} y2={cy + offset}
            stroke={WHITE} strokeWidth={1.5} opacity={0.55} strokeLinecap="round"
          />
        ))}
      </Svg>
    </View>
  );
}

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
      <RotatingRing radius={r0 * 0.65} color={VIOLET}  duration={12000} opacity={0.15} dash="6,12" />
      <RotatingRing radius={r0 * 0.88} color={PURPLE}  duration={22000} opacity={0.08} dash="4,22" reverse />

      <Svg width={IW} height={IH} style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="orgGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%"   stopColor={VIOLET} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Ellipse cx={cx} cy={cy} rx={r0} ry={r0 * 0.88} fill="url(#orgGlow)" />

        <Circle cx={cx} cy={cy} r={r0 * 0.22} fill={CARD} />
        <Circle cx={cx} cy={cy} r={r0 * 0.22} fill="none" stroke={PURPLE} strokeWidth={1} opacity={0.32} />

        {folders.map((f, i) => (
          <React.Fragment key={i}>
            <Line
              x1={f.x + f.w / 2} y1={f.y + f.h / 2}
              x2={cx} y2={cy}
              stroke={f.c} strokeWidth={0.8} opacity={0.28}
            />
            <Rect x={f.x} y={f.y - 6} width={f.w * 0.4} height={7} rx={2} fill={f.c} opacity={0.75} />
            <Rect x={f.x} y={f.y} width={f.w} height={f.h} rx={4}
              fill="#11111e" stroke={f.c} strokeWidth={0.8} opacity={0.85} />
            <Rect x={f.x + 6} y={f.y + 8} width={f.w - 12} height={2} rx={1} fill={f.c} opacity={0.35} />
            <Rect x={f.x + 6} y={f.y + 14} width={(f.w - 12) * 0.65} height={2} rx={1} fill={f.c} opacity={0.22} />
          </React.Fragment>
        ))}

        <Circle cx={cx} cy={cy} r={5.5} fill={PURPLE} />
        <Circle cx={cx} cy={cy} r={10} fill="none" stroke={PURPLE} strokeWidth={0.8} opacity={0.42} />
      </Svg>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey]   = useState(0);

  const slide  = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const topPad = insets.top + (Platform.OS === "web" ? 60 : 0);
  const botPad = Math.max(insets.bottom, Platform.OS === "android" ? 16 : 0) + (Platform.OS === "web" ? 24 : 0);

  const next = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrent((c) => c + 1);
      setAnimKey((k) => k + 1);
    }
  };

  const illustrations = [SaveIllustration, AIIllustration, OrganizeIllustration];
  const Illustration  = illustrations[current];

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: botPad }]}>

      {/* ── Top bar ── */}
      <MotiView
        from={{ opacity: 0, translateY: -12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 440 }}
        style={styles.topBar}
      >
        <View style={styles.logoRow}>
          <VidVaultLogo size={30} />
          <Text style={styles.logoName}>VidVault</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={completeOnboarding}
          activeOpacity={0.65}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </MotiView>

      {/* ── Illustration ── */}
      <MotiView
        key={`illo-${animKey}`}
        from={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 180, delay: 40 }}
        style={styles.illustrationWrap}
      >
        <Illustration />
      </MotiView>

      {/* ── Content card ── */}
      <View style={styles.card}>
        {/* Accent top gradient line */}
        <Animated.View style={[styles.cardTopAccent, { backgroundColor: slide.accent }]} />

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <MotiView
              key={i}
              animate={{
                width: i === current ? 32 : 7,
                backgroundColor: i === current ? s.accent : "rgba(255,255,255,0.15)",
                opacity: i === current ? 1 : 0.5,
              }}
              transition={{ type: "timing", duration: 300 }}
              style={[styles.dot, i === current && { shadowColor: s.accent, shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } }]}
            />
          ))}
        </View>

        {/* Badge */}
        <MotiView
          key={`badge-${animKey}`}
          from={{ opacity: 0, translateX: -14 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 340, delay: 60 }}
          style={[styles.badge, { borderColor: slide.accent + "50", backgroundColor: slide.accent + "0f" }]}
        >
          <View style={[styles.badgeDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.badgeText, { color: slide.accent }]}>{slide.badge}</Text>
        </MotiView>

        {/* Title */}
        <MotiText
          key={`title-${animKey}`}
          from={{ opacity: 0, translateY: 16 }}
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
            label={isLast ? "Get Started" : "Continue"}
            onPress={next}
            variant="primary"
            size="lg"
            fullWidth
          />
        </MotiView>

        {/* Bottom hint */}
        {isLast ? (
          <TouchableOpacity onPress={completeOnboarding} activeOpacity={0.7} style={styles.hintRow}>
            <Text style={styles.signInHint}>
              Already have an account?{" "}
              <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.hintRow}>
            <Text style={styles.hintLine}>{current + 1} of {SLIDES.length}</Text>
          </View>
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
    backgroundColor: "rgba(99,102,241,0.18)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.38)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  aiBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 8,
    color: "#a78bfa",
    letterSpacing: 0.3,
  },
  skipBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  skipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: MUTED,
  },

  illustrationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: H * 0.30,
    maxHeight: H * 0.43,
  },

  card: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 12,
    gap: 14,
    alignItems: "flex-start",
    backgroundColor: GLASS_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    overflow: "hidden",
  },
  cardTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.6,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 10,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.2,
  },

  title: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 33,
    color: WHITE,
    lineHeight: 41,
  },

  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13.5,
    color: MUTED,
    lineHeight: 22,
    maxWidth: W - 48,
  },

  hintRow: {
    alignSelf: "center",
  },
  signInHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED2,
    textAlign: "center",
  },
  signInLink: {
    fontFamily: "Poppins_600SemiBold",
    color: "#a78bfa",
  },
  hintLine: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: MUTED2,
    letterSpacing: 0.2,
  },
});
