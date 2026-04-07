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
  Path, Rect, Circle, Line,
  Defs, RadialGradient, LinearGradient, Stop,
} from "react-native-svg";
import { MotiView, MotiText } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { AppButton } from "@/components/ui/AppButton";
import { VidVaultLogo } from "@/components/VidVaultLogo";

const { width: W } = Dimensions.get("window");

/* ── Always-dark palette (login/register is always on dark bg) ── */
const BG           = "#08080d";
const PURPLE       = "#6366f1";
const VIOLET       = "#8b5cf6";
const CYAN         = "#06b6d4";
const WHITE        = "#ffffff";
const MUTED        = "rgba(255,255,255,0.55)";
const MUTED2       = "rgba(255,255,255,0.30)";
const INPUT_BG     = "#0f0f1a";
const INPUT_BORDER = "rgba(99,102,241,0.22)";
const FOCUS_BORDER = "rgba(99,102,241,0.70)";
const ERROR_COLOR  = "#f87171";
const ERROR_BG     = "rgba(239,68,68,0.08)";

/* ── Tiny SVG icons ── */
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
function ReplitIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h7v5H4V4zM11 9h5v5h-5V9zM4 14h7v6H4v-6z" fill={MUTED} />
    </Svg>
  );
}

/* ── Background decoration ── */
function BackgroundDecor() {
  const spin = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(spin2, { toValue: 1, duration: 28000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    return () => { spin.stopAnimation(); spin2.stopAnimation(); };
  }, []);
  const rot1 = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const rot2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });
  const cx = W / 2, cy = 200;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={480} style={{ position: "absolute", top: 0, left: 0 }}>
        <Defs>
          <RadialGradient id="loginGlow" cx="50%" cy="40%" rx="50%" ry="35%">
            <Stop offset="0%" stopColor={PURPLE} stopOpacity="0.18" />
            <Stop offset="60%" stopColor={VIOLET} stopOpacity="0.06" />
            <Stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={480} fill="url(#loginGlow)" />
        {/* Static grid lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Line key={`v${i}`} x1={i * (W / 7)} y1={0} x2={i * (W / 7)} y2={480}
            stroke="rgba(99,102,241,0.04)" strokeWidth={1} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <Line key={`h${i}`} x1={0} y1={i * 80} x2={W} y2={i * 80}
            stroke="rgba(99,102,241,0.04)" strokeWidth={1} />
        ))}
        {/* Corner brackets */}
        <Path d="M16 48 L16 24 L40 24" stroke={`${PURPLE}40`} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d={`M${W - 16} 48 L${W - 16} 24 L${W - 40} 24`} stroke={`${CYAN}35`} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      </Svg>

      {/* Rotating ring 1 */}
      <Animated.View style={[styles.ringWrap, { width: 280, height: 280, top: cy - 140, left: cx - 140, transform: [{ rotate: rot1 }] }]}>
        <Svg width={280} height={280}>
          <Circle cx={140} cy={140} r={135} fill="none" stroke={PURPLE} strokeWidth={1}
            strokeDasharray="8,16" opacity={0.12} />
        </Svg>
      </Animated.View>

      {/* Rotating ring 2 */}
      <Animated.View style={[styles.ringWrap, { width: 380, height: 380, top: cy - 190, left: cx - 190, transform: [{ rotate: rot2 }] }]}>
        <Svg width={380} height={380}>
          <Circle cx={190} cy={190} r={185} fill="none" stroke={CYAN} strokeWidth={1}
            strokeDasharray="4,22" opacity={0.07} />
        </Svg>
      </Animated.View>

      {/* Small node dots */}
      {[
        { x: 32, y: 120, c: PURPLE },
        { x: W - 28, y: 160, c: CYAN },
        { x: 24, y: 380, c: VIOLET },
        { x: W - 20, y: 340, c: PURPLE },
      ].map((dot, i) => (
        <View key={i} style={{
          position: "absolute", left: dot.x - 3, top: dot.y - 3,
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: dot.c, opacity: 0.25,
        }} />
      ))}
    </View>
  );
}

/* ── Form input ── */
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
    Animated.timing(glowAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(glowAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1], outputRange: [INPUT_BORDER, FOCUS_BORDER],
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 340, delay }}
    >
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => resolvedRef.current?.focus()}
      >
        <Animated.View style={[styles.inputRow, { borderColor, backgroundColor: INPUT_BG }]}>
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

/* ── Main screen ── */
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

  /* Pulse logo */
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    return () => pulseAnim.stopAnimation();
  }, []);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
    setFormKey((k) => k + 1);
  };

  const submit = async () => {
    const e = email.trim();
    const p = password;
    if (!e)            { setError("Email address is required"); return; }
    if (!e.includes("@")) { setError("Please enter a valid email"); return; }
    if (!p)            { setError("Password is required"); return; }
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

  const isReg = mode === "register";
  const topPad = Math.max(insets.top, 20) + 16;
  const botPad = insets.bottom + 32;

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
        {/* ── Logo block ── */}
        <MotiView
          from={{ opacity: 0, scale: 0.80 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 160 }}
          style={styles.logoBlock}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <VidVaultLogo size={52} />
          </Animated.View>
          <View>
            <Text style={styles.logoName}>VidVault</Text>
            <Text style={styles.logoSub}>AI KNOWLEDGE VAULT</Text>
          </View>
        </MotiView>

        {/* ── Mode toggle tabs ── */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 380, delay: 80 }}
          style={styles.tabRow}
        >
          {(["register", "login"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => switchMode(m)}
              activeOpacity={0.7}
              style={[styles.tab, mode === m && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === "register" ? "CREATE ACCOUNT" : "SIGN IN"}
              </Text>
            </TouchableOpacity>
          ))}
        </MotiView>

        {/* ── Heading ── */}
        <MotiView
          key={`heading-${mode}`}
          from={{ opacity: 0, translateX: -16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: 320, delay: 60 }}
          style={styles.headingBlock}
        >
          <MotiText
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 100 }}
            style={styles.heading}
          >
            {isReg ? "Join VidVault" : "Welcome Back"}
          </MotiText>
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 400, delay: 180 }}
            style={styles.subheading}
          >
            {isReg ? "BUILD YOUR KNOWLEDGE VAULT" : "SIGN IN TO YOUR VAULT"}
          </MotiText>
        </MotiView>

        {/* ── Form ── */}
        <View key={`form-${formKey}`} style={styles.form}>

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
                  placeholder="John" label="FIRST NAME"
                  autoCapitalize="words" returnKeyType="next"
                  icon="user"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  delay={80}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>LAST NAME</Text>
                <MotiView
                  from={{ opacity: 0, translateY: 12 }}
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
            placeholder="you@example.com" label="EMAIL ADDRESS"
            keyboardType="email-address" autoCapitalize="none"
            icon="mail" returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            delay={isReg ? 160 : 80}
          />

          {/* Password */}
          <FormInput
            ref={passwordRef}
            value={password} onChangeText={setPassword}
            placeholder="••••••••" label="PASSWORD"
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
            delay={isReg ? 200 : 120}
          />

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
            transition={{ type: "timing", duration: 340, delay: isReg ? 240 : 160 }}
          >
            <AppButton
              label={isReg ? "CREATE ACCOUNT" : "SIGN IN"}
              onPress={submit}
              loading={loading}
              disabled={loading}
              size="lg"
              variant="primary"
              fullWidth
            />
          </MotiView>

          {/* Divider */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 400, delay: isReg ? 280 : 200 }}
            style={styles.divider}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </MotiView>

          {/* Replit */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 340, delay: isReg ? 320 : 240 }}
          >
            <AppButton
              label="CONTINUE WITH REPLIT"
              onPress={() => setError("Replit sign-in is available on the web app")}
              customIcon={<ReplitIcon />}
              size="md"
              variant="ghost"
              fullWidth
            />
          </MotiView>
        </View>

        {/* ── Dots decoration ── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 600, delay: 400 }}
          style={styles.dotsRow}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={[styles.dot, { opacity: 0.06 + (i % 3) * 0.04 }]} />
          ))}
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
    gap: 12,
    marginBottom: 28,
  },
  logoName: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 22,
    color: WHITE,
    lineHeight: 24,
  },
  logoSub: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 8,
    color: MUTED,
    letterSpacing: 2.5,
    marginTop: 2,
  },

  /* Mode tabs */
  tabRow: {
    flexDirection: "row",
    gap: 0,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.22)",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(99,102,241,0.04)",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "rgba(99,102,241,0.18)",
    borderRadius: 9,
  },
  tabText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 9.5,
    color: MUTED,
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: WHITE,
  },

  /* Heading */
  headingBlock: {
    marginBottom: 24,
    gap: 4,
  },
  heading: {
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    fontSize: 40,
    color: WHITE,
    lineHeight: 48,
  },
  subheading: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9.5,
    color: MUTED,
    letterSpacing: 2,
  },

  /* Form */
  form: {
    gap: 14,
  },
  nameRow: {
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
  },
  label: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  /* Input */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 54,
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
    height: 54,
  },
  inputRight: {
    paddingLeft: 8,
  },

  /* Error */
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: ERROR_BG,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
    padding: 12,
    borderRadius: 10,
  },
  errorIcon: {
    color: ERROR_COLOR,
    fontSize: 13,
  },
  errorText: {
    flex: 1,
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 11,
    color: ERROR_COLOR,
    letterSpacing: 0.3,
    lineHeight: 17,
  },

  /* Divider */
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(99,102,241,0.15)",
  },
  dividerText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 2,
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
    marginTop: 28,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: PURPLE,
  },
});
