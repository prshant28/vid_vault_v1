import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Svg, {
  Path, Rect, Circle, Line, Ellipse,
  Defs, RadialGradient, LinearGradient, Stop,
} from "react-native-svg";
import { MotiView, MotiText } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "@/components/ui/AppButton";
import { VidVaultLogo } from "@/components/VidVaultLogo";
import { useTheme } from "@/hooks/useColors";

const { width: W, height: SH } = Dimensions.get("window");
const PURPLE = "#6366f1";
const VIOLET = "#8b5cf6";
const CYAN   = "#06b6d4";

/* ── Icons ── */
function MailIcon({ focused, isDark }: { focused: boolean; isDark: boolean }) {
  const c = focused ? PURPLE : isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={4} width={20} height={16} rx={2} stroke={c} strokeWidth={1.5} />
      <Path d="M2 7l10 7 10-7" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
function LockIcon({ focused, isDark }: { focused: boolean; isDark: boolean }) {
  const c = focused ? PURPLE : isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={c} strokeWidth={1.5} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={16} r={1.5} fill={c} />
    </Svg>
  );
}
function UserIcon({ focused, isDark }: { focused: boolean; isDark: boolean }) {
  const c = focused ? PURPLE : isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={7} r={4} stroke={c} strokeWidth={1.5} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
function EyeIcon({ visible, isDark }: { visible: boolean; isDark: boolean }) {
  const c = isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.32)";
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      {visible ? (
        <>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke={c} strokeWidth={1.5} />
          <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={1.5} />
        </>
      ) : (
        <>
          <Path d="M3 3l18 18M10.5 10.7A3 3 0 0013.3 13.5" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M6.2 6.2C4 7.9 2 12 2 12s3.5 7 10 7a9.9 9.9 0 005.8-1.8M9 5.3A9.9 9.9 0 0112 5c6.5 0 10 7 10 7a16.5 16.5 0 01-2.2 3.3" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

/* ── Animated background ── */
function BackgroundDecor({ isDark }: { isDark: boolean }) {
  const spin  = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spin,  { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 34000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(blob1, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(blob1, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(blob2, { toValue: 1, duration: 5500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(blob2, { toValue: 0, duration: 5500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    return () => { spin.stopAnimation(); spin2.stopAnimation(); blob1.stopAnimation(); blob2.stopAnimation(); };
  }, []);

  const rot1 = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const rot2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });
  const blob1Scale = blob1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const blob2Scale = blob2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const cx = W / 2;
  const cy = SH * 0.28;
  const ringOp1 = isDark ? 0.12 : 0.18;
  const ringOp2 = isDark ? 0.07 : 0.12;
  const glowOp  = isDark ? 0.22 : 0.12;
  const glowOp2 = isDark ? 0.10 : 0.07;
  const gridOp  = isDark ? 0.04 : 0.06;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* SVG layer */}
      <Svg width={W} height={SH} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <RadialGradient id="lglow1" cx="50%" cy="28%" rx="55%" ry="40%">
            <Stop offset="0%"   stopColor={PURPLE} stopOpacity={glowOp} />
            <Stop offset="60%"  stopColor={VIOLET} stopOpacity={glowOp * 0.3} />
            <Stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="lglow2" cx="80%" cy="72%" rx="35%" ry="28%">
            <Stop offset="0%"   stopColor={CYAN}   stopOpacity={glowOp2} />
            <Stop offset="100%" stopColor={CYAN}   stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={SH} fill="url(#lglow1)" />
        <Rect x={0} y={0} width={W} height={SH} fill="url(#lglow2)" />

        {/* Grid */}
        {Array.from({ length: 9 }).map((_, i) => (
          <Line key={`v${i}`} x1={i*(W/8)} y1={0} x2={i*(W/8)} y2={SH*0.65}
            stroke={`rgba(99,102,241,${gridOp})`} strokeWidth={1} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <Line key={`h${i}`} x1={0} y1={i*90} x2={W} y2={i*90}
            stroke={`rgba(99,102,241,${gridOp})`} strokeWidth={1} />
        ))}

        {/* Corner brackets */}
        <Path d="M18 52L18 26L44 26" stroke={`rgba(99,102,241,0.4)`}  strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M${W-18} 52L${W-18} 26L${W-44} 26`} stroke={`rgba(6,182,212,0.35)`} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M18 ${SH-52}L18 ${SH-26}L44 ${SH-26}`} stroke={`rgba(139,92,246,0.28)`} strokeWidth={1} fill="none" strokeLinecap="round" />
        <Path d={`M${W-18} ${SH-52}L${W-18} ${SH-26}L${W-44} ${SH-26}`} stroke={`rgba(6,182,212,0.25)`} strokeWidth={1} fill="none" strokeLinecap="round" />

        {/* Accent dots */}
        {[
          { x: 38, y: 125, c: PURPLE },{ x: W-33, y: 168, c: CYAN },
          { x: 30, y: SH*0.55, c: VIOLET },{ x: W-26, y: SH*0.48, c: PURPLE },
          { x: W*0.3, y: 78, c: CYAN },{ x: W*0.72, y: 58, c: PURPLE },
        ].map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={2} fill={d.c} fillOpacity={isDark ? 0.35 : 0.5} />
        ))}
      </Svg>

      {/* Animated blob 1 */}
      <Animated.View style={{
        position: "absolute",
        width: 260, height: 260,
        top: cy - 130, left: cx - 160,
        transform: [{ scale: blob1Scale }],
        opacity: isDark ? 0.18 : 0.10,
        backgroundColor: PURPLE,
        borderRadius: 130,
      }} />

      {/* Animated blob 2 */}
      <Animated.View style={{
        position: "absolute",
        width: 200, height: 200,
        top: cy - 40, left: cx + 40,
        transform: [{ scale: blob2Scale }],
        opacity: isDark ? 0.12 : 0.07,
        backgroundColor: CYAN,
        borderRadius: 100,
      }} />

      {/* Ring 1 */}
      <Animated.View style={{
        position: "absolute",
        width: 310, height: 310,
        top: cy - 155, left: cx - 155,
        transform: [{ rotate: rot1 }],
      }}>
        <Svg width={310} height={310}>
          <Circle cx={155} cy={155} r={150} fill="none" stroke={PURPLE}
            strokeWidth={1} strokeDasharray="6,20" opacity={ringOp1} />
        </Svg>
      </Animated.View>

      {/* Ring 2 */}
      <Animated.View style={{
        position: "absolute",
        width: 440, height: 440,
        top: cy - 220, left: cx - 220,
        transform: [{ rotate: rot2 }],
      }}>
        <Svg width={440} height={440}>
          <Circle cx={220} cy={220} r={215} fill="none" stroke={CYAN}
            strokeWidth={0.8} strokeDasharray="3,26" opacity={ringOp2} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ── Form Input ── */
interface FormInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  label: string;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "words" | "sentences";
  secureTextEntry?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "next" | "go";
  icon?: "mail" | "lock" | "user";
  rightNode?: React.ReactNode;
  autoFocus?: boolean;
  delay?: number;
  isDark: boolean;
  inputBg: string;
  inputBorder: string;
  focusBorder: string;
  textColor: string;
  labelColor: string;
}

const FormInput = React.forwardRef<TextInput, FormInputProps>(function FormInput(
  { value, onChangeText, placeholder, label, keyboardType, autoCapitalize,
    secureTextEntry, onSubmitEditing, returnKeyType, icon, rightNode,
    autoFocus, delay = 0, isDark, inputBg, inputBorder, focusBorder, textColor, labelColor },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const innerRef   = useRef<TextInput>(null);
  const resolvedRef = (ref as React.RefObject<TextInput>) || innerRef;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const bgAnim     = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.parallel([
      Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(bgAnim,   { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.parallel([
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(bgAnim,   { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [inputBorder, focusBorder] });
  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [inputBg, isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.05)"],
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18, stiffness: 180, delay }}
    >
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <TouchableOpacity activeOpacity={1} onPress={() => resolvedRef.current?.focus()}>
        <Animated.View style={[styles.inputRow, { borderColor, backgroundColor: bgColor }]}>
          {icon && (
            <View style={styles.inputIcon}>
              {icon === "mail" ? <MailIcon focused={focused} isDark={isDark} />
                : icon === "lock" ? <LockIcon focused={focused} isDark={isDark} />
                : <UserIcon focused={focused} isDark={isDark} />}
            </View>
          )}
          <TextInput
            ref={resolvedRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)"}
            keyboardType={keyboardType ?? "default"}
            autoCapitalize={autoCapitalize ?? "sentences"}
            autoCorrect={false}
            autoComplete="off"
            secureTextEntry={secureTextEntry}
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
            autoFocus={autoFocus}
            style={[styles.inputText, { color: textColor }]}
            selectionColor={PURPLE}
            cursorColor={PURPLE}
          />
          {rightNode && <View style={styles.inputRight}>{rightNode}</View>}
        </Animated.View>
      </TouchableOpacity>
    </MotiView>
  );
});

/* ── Main screen ── */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const { colors, isDark } = useTheme();

  const [mode, setMode]           = useState<"login" | "register">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [formKey, setFormKey]     = useState(0);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Animations
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim   = useRef(new Animated.Value(0)).current;
  const cardSlide   = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const logoSlide   = useRef(new Animated.Value(-30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tabSlide    = useRef(new Animated.Value(-20)).current;
  const tabOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance sequence: logo → tabs → card
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoSlide,   { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(tabSlide,   { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
        Animated.timing(tabOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardSlide,   { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();

    // Logo pulse
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.00, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();

    return () => { pulseAnim.stopAnimation(); };
  }, []);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
    setFormKey((k) => k + 1);
    Animated.spring(slideAnim, {
      toValue: m === "register" ? 0 : 1,
      useNativeDriver: false,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const submit = async () => {
    const e = email.trim();
    const p = password;
    if (!e)               { shakeError(); setError("Email address is required"); return; }
    if (!e.includes("@")) { shakeError(); setError("Please enter a valid email"); return; }
    if (!p)               { shakeError(); setError("Password is required"); return; }
    if (mode === "register" && p.length < 6) {
      shakeError(); setError("Password must be at least 6 characters"); return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(e, p);
      } else {
        await register(e, p, firstName.trim() || undefined, lastName.trim() || undefined);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      shakeError();
      if (mode === "login" && msg.toLowerCase().includes("no account found")) {
        setError("No account found — switch to Register to create one.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isReg   = mode === "register";
  const topPad  = Math.max(insets.top, 20) + 8;
  const botPad  = insets.bottom + 28;

  // Colors from theme
  const BG          = colors.background;
  const TEXT        = colors.foreground;
  const MUTED_TXT   = colors.mutedForeground;
  const CARD_BG     = colors.card;
  const INPUT_BG    = isDark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.04)";
  const INPUT_BDR   = isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.22)";
  const FOCUS_BDR   = PURPLE;
  const CARD_BDR    = isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.14)";
  const TAB_BG      = isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.05)";
  const TAB_ACTIVE  = isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.14)";
  const TAB_BDR     = isDark ? "rgba(99,102,241,0.28)" : "rgba(99,102,241,0.30)";
  const ERROR_BG    = isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.06)";

  const tabW = (W - 48) / 2;
  const indicatorLeft = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [4, tabW + 4] });

  const cardShadow = isDark
    ? {}
    : {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 24,
        elevation: 8,
      };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: BG }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <BackgroundDecor isDark={isDark} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Logo ── */}
        <Animated.View style={[styles.logoBlock, {
          opacity: logoOpacity,
          transform: [{ translateY: logoSlide }],
        }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <VidVaultLogo size={50} />
          </Animated.View>
          <View style={{ gap: 2 }}>
            <Text style={[styles.logoName, { color: TEXT }]}>VidVault</Text>
            <View style={styles.logoRow}>
              <Text style={[styles.logoSub, { color: MUTED_TXT }]}>AI Knowledge Vault</Text>
              <View style={[styles.versionBadge, {
                backgroundColor: "rgba(99,102,241,0.12)",
                borderColor: "rgba(99,102,241,0.30)",
              }]}>
                <Text style={styles.versionText}>AI</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Tab switcher ── */}
        <Animated.View style={[styles.tabRow, {
          backgroundColor: TAB_BG,
          borderColor: CARD_BDR,
          opacity: tabOpacity,
          transform: [{ translateY: tabSlide }],
        }]}>
          <Animated.View style={[styles.tabIndicator, {
            left: indicatorLeft,
            width: tabW,
            backgroundColor: TAB_ACTIVE,
            borderColor: TAB_BDR,
          }]} />
          {(["register", "login"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => switchMode(m)}
              activeOpacity={0.8}
              style={styles.tab}
            >
              <Text style={[styles.tabText, { color: mode === m ? TEXT : MUTED_TXT }]}>
                {m === "register" ? "Create Account" : "Sign In"}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Heading ── */}
        <MotiView
          key={`heading-${mode}`}
          from={{ opacity: 0, translateX: -16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200, delay: 40 }}
          style={styles.headingBlock}
        >
          <MotiText
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 180, delay: 80 }}
            style={[styles.heading, { color: TEXT }]}
          >
            {isReg ? "Join VidVault" : "Welcome Back"}
          </MotiText>
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 400, delay: 160 }}
            style={[styles.subheading, { color: MUTED_TXT }]}
          >
            {isReg
              ? "Start building your AI-powered knowledge library"
              : "Sign in to access your personal knowledge vault"}
          </MotiText>
        </MotiView>

        {/* ── Form card ── */}
        <Animated.View style={[
          styles.formCard,
          { backgroundColor: CARD_BG, borderColor: CARD_BDR, ...cardShadow },
          { opacity: cardOpacity, transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] },
        ]}>
          {/* Gradient top accent */}
          <View style={styles.cardAccentRow}>
            <Svg width="100%" height={2}>
              <Defs>
                <LinearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%"   stopColor={PURPLE} stopOpacity="0" />
                  <Stop offset="35%"  stopColor={PURPLE} stopOpacity="0.9" />
                  <Stop offset="65%"  stopColor={CYAN}   stopOpacity="0.9" />
                  <Stop offset="100%" stopColor={CYAN}   stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width="100%" height={2} fill="url(#accentGrad)" />
            </Svg>
          </View>

          <View style={styles.formInner} key={`form-${formKey}`}>
            {/* Name row */}
            {isReg && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" as any }}
                transition={{ type: "timing", duration: 280, delay: 40 }}
                style={styles.nameRow}
              >
                <View style={{ flex: 1 }}>
                  <FormInput
                    value={firstName} onChangeText={setFirstName}
                    placeholder="John" label="First Name"
                    autoCapitalize="words" returnKeyType="next"
                    icon="user"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    delay={80} isDark={isDark}
                    inputBg={INPUT_BG} inputBorder={INPUT_BDR}
                    focusBorder={FOCUS_BDR} textColor={TEXT} labelColor={MUTED_TXT}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MotiView
                    from={{ opacity: 0, translateY: 18 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", damping: 18, stiffness: 180, delay: 120 }}
                  >
                    <Text style={[styles.label, { color: MUTED_TXT }]}>Last Name</Text>
                    <TextInput
                      ref={lastNameRef}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Doe"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)"}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      style={[styles.inputRow, styles.inputText, {
                        borderColor: INPUT_BDR,
                        backgroundColor: INPUT_BG,
                        color: TEXT,
                      }]}
                      selectionColor={PURPLE}
                      cursorColor={PURPLE}
                    />
                  </MotiView>
                </View>
              </MotiView>
            )}

            <FormInput
              ref={emailRef}
              value={email} onChangeText={setEmail}
              placeholder="you@example.com" label="Email Address"
              keyboardType="email-address" autoCapitalize="none"
              icon="mail" returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              delay={isReg ? 150 : 60} isDark={isDark}
              inputBg={INPUT_BG} inputBorder={INPUT_BDR}
              focusBorder={FOCUS_BDR} textColor={TEXT} labelColor={MUTED_TXT}
            />

            <FormInput
              ref={passwordRef}
              value={password} onChangeText={setPassword}
              placeholder="••••••••" label="Password"
              secureTextEntry={!showPass} icon="lock"
              returnKeyType="done" onSubmitEditing={submit}
              rightNode={
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <EyeIcon visible={showPass} isDark={isDark} />
                </TouchableOpacity>
              }
              delay={isReg ? 190 : 100} isDark={isDark}
              inputBg={INPUT_BG} inputBorder={INPUT_BDR}
              focusBorder={FOCUS_BDR} textColor={TEXT} labelColor={MUTED_TXT}
            />

            {/* Forgot password */}
            {!isReg && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 300, delay: 140 }}
                style={{ alignSelf: "flex-end", marginTop: -4 }}
              >
                <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </MotiView>
            )}

            {/* Error */}
            {!!error && (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 220 }}
                style={[styles.errorBox, { backgroundColor: ERROR_BG }]}
              >
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{error}</Text>
              </MotiView>
            )}

            {/* Submit button — full width inside the card */}
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 160, delay: isReg ? 220 : 140 }}
              style={{ width: "100%" }}
            >
              <AppButton
                label={isReg ? "Create Account" : "Sign In"}
                onPress={submit}
                loading={loading}
                disabled={loading}
                size="lg"
                variant="primary"
                fullWidth
              />
            </MotiView>

            {/* Footer link */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 500, delay: isReg ? 280 : 180 }}
              style={styles.footerRow}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => switchMode(isReg ? "login" : "register")}
              >
                <Text style={[styles.footerText, { color: MUTED_TXT }]}>
                  {isReg ? "Already have an account? " : "Don't have an account? "}
                  <Text style={styles.footerLink}>
                    {isReg ? "Sign in" : "Create one"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </Animated.View>

        {/* ── Bottom decoration ── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 700, delay: 600 }}
          style={styles.bottomDecor}
        >
          <View style={[styles.decorLine, { backgroundColor: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.18)" }]} />
          <Text style={[styles.decorText, { color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.25)" }]}>
            Secure · Private · Yours
          </Text>
          <View style={[styles.decorLine, { backgroundColor: isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.18)" }]} />
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center" },

  /* Logo */
  logoBlock: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  logoRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  logoName:  { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 24, lineHeight: 26 },
  logoSub:   { fontFamily: "Poppins_400Regular", fontSize: 10, letterSpacing: 0.2 },
  versionBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  versionText:  { fontFamily: "Poppins_700Bold", fontSize: 8, color: "#818cf8", letterSpacing: 0.5 },

  /* Tabs */
  tabRow: {
    flexDirection: "row", marginBottom: 20,
    borderWidth: 1, borderRadius: 12, overflow: "hidden",
    height: 46, alignItems: "center", position: "relative",
  },
  tabIndicator: {
    position: "absolute", top: 4, height: 38,
    borderRadius: 9, borderWidth: 1,
  },
  tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  tabText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  /* Heading */
  headingBlock: { marginBottom: 18, gap: 6 },
  heading:    { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 38, lineHeight: 46 },
  subheading: { fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20 },

  /* Form card */
  formCard: {
    borderWidth: 1, borderRadius: 22, overflow: "hidden",
  },
  cardAccentRow: { height: 2, width: "100%" },
  formInner: { gap: 14, padding: 20 },

  /* Name row */
  nameRow: { flexDirection: "row", gap: 10, overflow: "hidden" },
  label: { fontFamily: "Poppins_500Medium", fontSize: 11, letterSpacing: 0.2, marginBottom: 7 },

  /* Input */
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, height: 52, paddingHorizontal: 14, borderRadius: 12,
  },
  inputIcon: { marginRight: 10 },
  inputText: {
    flex: 1, fontFamily: "Poppins_400Regular",
    fontSize: 14, padding: 0, height: 52,
  },
  inputRight: { paddingLeft: 8 },

  /* Forgot */
  forgotText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: PURPLE },

  /* Error */
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.22)",
    borderLeftColor: "#f87171", borderLeftWidth: 3,
    padding: 12, borderRadius: 10,
  },
  errorIcon: { color: "#f87171", fontSize: 13 },
  errorText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 12, color: "#f87171", lineHeight: 18 },

  /* Footer */
  footerRow:  { alignItems: "center", paddingTop: 2 },
  footerText: { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center" },
  footerLink: { fontFamily: "Poppins_600SemiBold", color: PURPLE },

  /* Bottom decor */
  bottomDecor: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 26, paddingHorizontal: 4 },
  decorLine:   { flex: 1, height: 1 },
  decorText:   { fontFamily: "Poppins_400Regular", fontSize: 10, letterSpacing: 0.5 },
});
