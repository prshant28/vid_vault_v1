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
  ActivityIndicator,
} from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import Svg, {
  Path, Rect, Circle, Line, Ellipse,
  Defs, RadialGradient, LinearGradient, Stop,
} from "react-native-svg";
import { MotiView, MotiText } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { VidVaultLogo } from "@/components/VidVaultLogo";

const { width: W, height: SH } = Dimensions.get("window");

const BG           = "#07070c";
const CARD_BG      = "rgba(255,255,255,0.025)";
const CARD_BORDER  = "rgba(99,102,241,0.15)";
const PURPLE       = "#6366f1";
const VIOLET       = "#8b5cf6";
const CYAN         = "#06b6d4";
const WHITE        = "#ffffff";
const MUTED        = "rgba(255,255,255,0.50)";
const MUTED2       = "rgba(255,255,255,0.28)";
const INPUT_BG     = "rgba(255,255,255,0.04)";
const INPUT_BORDER = "rgba(99,102,241,0.20)";
const FOCUS_BORDER = "#6366f1";
const FOCUS_SHADOW = "rgba(99,102,241,0.30)";
const ERROR_COLOR  = "#f87171";
const ERROR_BG     = "rgba(239,68,68,0.08)";

function MailIcon({ focused }: { focused: boolean }) {
  const c = focused ? PURPLE : MUTED;
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={4} width={20} height={16} rx={2} stroke={c} strokeWidth={1.5} />
      <Path d="M2 7l10 7 10-7" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
function LockIcon({ focused }: { focused: boolean }) {
  const c = focused ? PURPLE : MUTED;
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={c} strokeWidth={1.5} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={16} r={1.5} fill={c} />
    </Svg>
  );
}
function UserIcon({ focused }: { focused: boolean }) {
  const c = focused ? PURPLE : MUTED;
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={7} r={4} stroke={c} strokeWidth={1.5} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      {visible ? (
        <>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke={MUTED} strokeWidth={1.5} />
          <Circle cx={12} cy={12} r={3} stroke={MUTED} strokeWidth={1.5} />
        </>
      ) : (
        <>
          <Path d="M3 3l18 18M10.5 10.7A3 3 0 0013.3 13.5" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M6.2 6.2C4 7.9 2 12 2 12s3.5 7 10 7a9.9 9.9 0 005.8-1.8M9 5.3A9.9 9.9 0 0112 5c6.5 0 10 7 10 7a16.5 16.5 0 01-2.2 3.3" stroke={MUTED} strokeWidth={1.5} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

function BackgroundDecor() {
  const spin  = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const pulseGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spin,  { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(spin2, { toValue: 1, duration: 32000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseGlow, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
    return () => { spin.stopAnimation(); spin2.stopAnimation(); pulseGlow.stopAnimation(); };
  }, []);

  const rot1 = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const rot2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });
  const cx = W / 2, cy = SH * 0.3;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={SH} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <RadialGradient id="loginGlow1" cx="50%" cy="32%" rx="55%" ry="40%">
            <Stop offset="0%"   stopColor={PURPLE} stopOpacity="0.22" />
            <Stop offset="55%"  stopColor={VIOLET} stopOpacity="0.07" />
            <Stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="loginGlow2" cx="80%" cy="70%" rx="35%" ry="30%">
            <Stop offset="0%"   stopColor={CYAN}   stopOpacity="0.10" />
            <Stop offset="100%" stopColor={CYAN}   stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="bgFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={BG} stopOpacity="0" />
            <Stop offset="100%" stopColor={BG} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={SH} fill="url(#loginGlow1)" />
        <Rect x={0} y={0} width={W} height={SH} fill="url(#loginGlow2)" />

        {Array.from({ length: 9 }).map((_, i) => (
          <Line key={`v${i}`} x1={i * (W / 8)} y1={0} x2={i * (W / 8)} y2={SH * 0.6}
            stroke="rgba(99,102,241,0.035)" strokeWidth={1} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <Line key={`h${i}`} x1={0} y1={i * 90} x2={W} y2={i * 90}
            stroke="rgba(99,102,241,0.035)" strokeWidth={1} />
        ))}

        <Path d="M18 52 L18 26 L44 26" stroke={`${PURPLE}45`} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M${W - 18} 52 L${W - 18} 26 L${W - 44} 26`} stroke={`${CYAN}38`} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M18 ${SH - 52} L18 ${SH - 26} L44 ${SH - 26}`} stroke={`${VIOLET}30`} strokeWidth={1} fill="none" strokeLinecap="round" />
        <Path d={`M${W - 18} ${SH - 52} L${W - 18} ${SH - 26} L${W - 44} ${SH - 26}`} stroke={`${CYAN}28`} strokeWidth={1} fill="none" strokeLinecap="round" />

        {[
          { x: 36, y: 130, c: PURPLE, r: 2 },
          { x: W - 32, y: 170, c: CYAN, r: 2 },
          { x: 28, y: SH * 0.55, c: VIOLET, r: 1.5 },
          { x: W - 24, y: SH * 0.48, c: PURPLE, r: 1.5 },
          { x: W * 0.3, y: 80, c: CYAN, r: 1 },
          { x: W * 0.72, y: 60, c: PURPLE, r: 1 },
        ].map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} fillOpacity={0.35} />
        ))}
      </Svg>

      <Animated.View style={[styles.ringWrap, {
        width: 300, height: 300,
        top: cy - 150, left: cx - 150,
        transform: [{ rotate: rot1 }],
      }]}>
        <Svg width={300} height={300}>
          <Circle cx={150} cy={150} r={145} fill="none" stroke={PURPLE}
            strokeWidth={1} strokeDasharray="6,18" opacity={0.13} />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.ringWrap, {
        width: 420, height: 420,
        top: cy - 210, left: cx - 210,
        transform: [{ rotate: rot2 }],
      }]}>
        <Svg width={420} height={420}>
          <Circle cx={210} cy={210} r={205} fill="none" stroke={CYAN}
            strokeWidth={0.8} strokeDasharray="3,24" opacity={0.08} />
        </Svg>
      </Animated.View>
    </View>
  );
}

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
}

const FormInput = React.forwardRef<TextInput, FormInputProps>(function FormInput(
  { value, onChangeText, placeholder, label, keyboardType, autoCapitalize,
    secureTextEntry, onSubmitEditing, returnKeyType, icon, rightNode, autoFocus, delay = 0 },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const innerRef = useRef<TextInput>(null);
  const resolvedRef = (ref as React.RefObject<TextInput>) || innerRef;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [INPUT_BORDER, FOCUS_BORDER] });
  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 340, delay }}
    >
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity activeOpacity={1} onPress={() => resolvedRef.current?.focus()}>
        <Animated.View style={[
          styles.inputRow,
          { borderColor, backgroundColor: INPUT_BG },
          Platform.OS !== "web" && focused && {
            shadowColor: FOCUS_SHADOW,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity,
            shadowRadius: 8,
          },
        ]}>
          {icon && (
            <View style={styles.inputIcon}>
              {icon === "mail" ? <MailIcon focused={focused} />
                : icon === "lock" ? <LockIcon focused={focused} />
                : <UserIcon focused={focused} />}
            </View>
          )}
          <TextInput
            ref={resolvedRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={MUTED2}
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
            style={styles.inputText}
            selectionColor={PURPLE}
            cursorColor={PURPLE}
          />
          {rightNode && <View style={styles.inputRight}>{rightNode}</View>}
        </Animated.View>
      </TouchableOpacity>
    </MotiView>
  );
});

/* ─── Full-width submit button ─────────────────────────────────────────── */
function SubmitButton({
  label, onPress, loading, disabled,
}: {
  label: string; onPress: () => void; loading: boolean; disabled: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={{ borderRadius: 14, overflow: "hidden", width: "100%" }}
      >
        <ExpoLinearGradient
          colors={["#6366f1", "#8b5cf6", "#6366f1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 52,
            alignItems: "center",
            justifyContent: "center",
            opacity: disabled ? 0.65 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{
              color: "#fff",
              fontFamily: "Poppins_700Bold",
              fontSize: 15,
              letterSpacing: 0.4,
            }}>
              {label}
            </Text>
          )}
        </ExpoLinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

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

  const pulseAnim     = useRef(new Animated.Value(1)).current;
  const slideAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.055, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00,  duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    return () => pulseAnim.stopAnimation();
  }, []);

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
    if (!e)               { setError("Email address is required"); return; }
    if (!e.includes("@")) { setError("Please enter a valid email"); return; }
    if (!p)               { setError("Password is required"); return; }
    if (mode === "register" && p.length < 6) {
      setError("Password must be at least 6 characters"); return;
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

  const tabW = (W - 48) / 2;
  const indicatorLeft = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [4, tabW + 4] });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <BackgroundDecor />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Logo ── */}
        <MotiView
          from={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 160 }}
          style={styles.logoBlock}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <VidVaultLogo size={50} />
          </Animated.View>
          <View style={{ gap: 2 }}>
            <Text style={styles.logoName}>VidVault</Text>
            <View style={styles.logoRow}>
              <Text style={styles.logoSub}>AI Knowledge Vault</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>AI</Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* ── Tab switcher ── */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 360, delay: 70 }}
          style={styles.tabRow}
        >
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft, width: tabW }]} />
          {(["register", "login"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => switchMode(m)}
              activeOpacity={0.8}
              style={styles.tab}
            >
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === "register" ? "Create Account" : "Sign In"}
              </Text>
            </TouchableOpacity>
          ))}
        </MotiView>

        {/* ── Heading ── */}
        <MotiView
          key={`heading-${mode}`}
          from={{ opacity: 0, translateX: -14 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 300, delay: 50 }}
          style={styles.headingBlock}
        >
          <MotiText
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 340, delay: 90 }}
            style={styles.heading}
          >
            {isReg ? "Join VidVault" : "Welcome Back"}
          </MotiText>
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 380, delay: 160 }}
            style={styles.subheading}
          >
            {isReg
              ? "Start building your AI-powered knowledge library"
              : "Sign in to access your personal knowledge vault"}
          </MotiText>
        </MotiView>

        {/* ── Form card ── */}
        <View key={`form-${formKey}`} style={styles.formCard}>

          {/* Gradient top accent */}
          <View style={styles.cardAccent} />

          {/* Name row (register only) */}
          {isReg && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" as any }}
              transition={{ type: "timing", duration: 300, delay: 60 }}
              style={styles.nameRow}
            >
              <View style={{ flex: 1 }}>
                <FormInput
                  value={firstName} onChangeText={setFirstName}
                  placeholder="John" label="First Name"
                  autoCapitalize="words" returnKeyType="next"
                  icon="user"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  delay={80}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Last Name</Text>
                <MotiView
                  from={{ opacity: 0, translateY: 14 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 340, delay: 120 }}
                >
                  <TextInput
                    ref={lastNameRef}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    placeholderTextColor={MUTED2}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    style={[styles.inputRow, styles.inputText, {
                      borderColor: INPUT_BORDER,
                      backgroundColor: INPUT_BG,
                    }]}
                    selectionColor={PURPLE}
                    cursorColor={PURPLE}
                  />
                </MotiView>
              </View>
            </MotiView>
          )}

          {/* Email */}
          <FormInput
            ref={emailRef}
            value={email} onChangeText={setEmail}
            placeholder="you@example.com" label="Email Address"
            keyboardType="email-address" autoCapitalize="none"
            icon="mail" returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            delay={isReg ? 150 : 70}
          />

          {/* Password */}
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
                <EyeIcon visible={showPass} />
              </TouchableOpacity>
            }
            delay={isReg ? 190 : 110}
          />

          {/* Forgot password (login only) */}
          {!isReg && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "timing", duration: 300, delay: 160 }}
              style={{ alignSelf: "flex-end", marginTop: -6 }}
            >
              <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </MotiView>
          )}

          {/* Error */}
          {!!error && (
            <MotiView
              from={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 16, stiffness: 200 }}
              style={styles.errorBox}
            >
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{error}</Text>
            </MotiView>
          )}

          {/* Submit */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 340, delay: isReg ? 230 : 150 }}
          >
            <SubmitButton
              label={isReg ? "Create Account" : "Sign In"}
              onPress={submit}
              loading={loading}
              disabled={loading}
            />
          </MotiView>

          {/* Footer hint */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 500, delay: isReg ? 280 : 200 }}
            style={styles.footerRow}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => switchMode(isReg ? "login" : "register")}
            >
              <Text style={styles.footerText}>
                {isReg ? "Already have an account? " : "Don't have an account? "}
                <Text style={styles.footerLink}>{isReg ? "Sign in" : "Create one"}</Text>
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* ── Bottom decoration ── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 700, delay: 500 }}
          style={styles.bottomDecor}
        >
          <View style={styles.decorLine} />
          <Text style={styles.decorText}>Secure · Private · Yours</Text>
          <View style={styles.decorLine} />
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  ringWrap: {
    position: "absolute",
  },

  /* Logo */
  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 26,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoName: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 24,
    color: WHITE,
    lineHeight: 26,
  },
  logoSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 0.2,
  },
  versionBadge: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.38)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  versionText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 8,
    color: "#a78bfa",
    letterSpacing: 0.5,
  },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(99,102,241,0.04)",
    height: 46,
    alignItems: "center",
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    height: 38,
    backgroundColor: "rgba(99,102,241,0.20)",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.30)",
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: MUTED,
  },
  tabTextActive: {
    color: WHITE,
  },

  /* Heading */
  headingBlock: {
    marginBottom: 20,
    gap: 6,
  },
  heading: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 38,
    color: WHITE,
    lineHeight: 46,
  },
  subheading: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
  },

  /* Form card */
  formCard: {
    gap: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: PURPLE,
    opacity: 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  /* Name row */
  nameRow: {
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: MUTED,
    letterSpacing: 0.2,
    marginBottom: 7,
  },

  /* Input */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: WHITE,
    padding: 0,
    height: 52,
  },
  inputRight: {
    paddingLeft: 8,
  },

  /* Forgot */
  forgotText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: PURPLE,
    letterSpacing: 0.1,
  },

  /* Error */
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: ERROR_BG,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    borderLeftColor: ERROR_COLOR,
    borderLeftWidth: 3,
    padding: 12,
    borderRadius: 10,
  },
  errorIcon: {
    color: ERROR_COLOR,
    fontSize: 13,
  },
  errorText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: ERROR_COLOR,
    lineHeight: 18,
  },

  /* Footer */
  footerRow: {
    alignItems: "center",
    paddingTop: 4,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
  },
  footerLink: {
    fontFamily: "Poppins_600SemiBold",
    color: PURPLE,
  },

  /* Bottom decoration */
  bottomDecor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    paddingHorizontal: 8,
  },
  decorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(99,102,241,0.12)",
  },
  decorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: MUTED2,
    letterSpacing: 0.5,
  },
});
