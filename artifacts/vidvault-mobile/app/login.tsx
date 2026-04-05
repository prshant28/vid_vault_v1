import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import Svg, { Path, Polygon, Rect, Circle, Line, G } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";

const BG = "#0a0a0b";
const CARD = "#0f0f12";
const PURPLE = "#8b5cf6";
const PURPLE_DIM = "rgba(139,92,246,0.15)";
const WHITE = "#ffffff";
const MUTED = "#555566";
const MUTED2 = "#3a3a4a";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_FOCUS = "rgba(139,92,246,0.5)";
const INPUT_BG = "#0c0c0e";
const ERROR_BG = "rgba(239,68,68,0.08)";
const ERROR_COLOR = "#f87171";

function MailIcon({ focused }: { focused: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={4} width={20} height={16} rx={2} stroke={focused ? PURPLE : MUTED} strokeWidth={1.5} />
      <Path d="M2 7l10 7 10-7" stroke={focused ? PURPLE : MUTED} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ focused }: { focused: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={focused ? PURPLE : MUTED} strokeWidth={1.5} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={focused ? PURPLE : MUTED} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={16} r={1.5} fill={focused ? PURPLE : MUTED} />
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
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h7v5H4V4zM11 9h5v5h-5V9zM4 14h7v6H4v-6z" fill={MUTED} />
    </Svg>
  );
}

function ArrowIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={PURPLE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* Polygon-style button using SVG backing (matches web app clip-path) */
function PolygonButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const { width } = Dimensions.get("window");
  const btnW = Math.min(width - 48, 500);
  const btnH = 52;
  const cut = 12;
  const points = `${cut},0 ${btnW},0 ${btnW},${btnH - cut} ${btnW - cut},${btnH} 0,${btnH} 0,${cut}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
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
        <View style={[StyleSheet.absoluteFillObject, styles.polygonInner]}>
          {loading ? (
            <ActivityIndicator color={BG} size="small" />
          ) : (
            <Text style={styles.polygonText}>{label}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* Ghost polygon button */
function GhostButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  const { width } = Dimensions.get("window");
  const btnW = Math.min(width - 48, 500);
  const btnH = 48;
  const cut = 10;
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
            fill={pressed ? "rgba(255,255,255,0.05)" : "transparent"}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.polygonInner]}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={styles.ghostText}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface FormInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "words" | "sentences";
  secureTextEntry?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "next" | "go";
  icon?: "mail" | "lock";
  rightNode?: React.ReactNode;
  autoFocus?: boolean;
}

/* Smart input — tracks focus for border color, no re-mount issues */
const FormInput = React.forwardRef<TextInput, FormInputProps>(function FormInput(
  {
    value,
    onChangeText,
    placeholder,
    keyboardType,
    autoCapitalize,
    secureTextEntry,
    onSubmitEditing,
    returnKeyType,
    icon,
    rightNode,
    autoFocus,
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const innerRef = useRef<TextInput>(null);
  const resolvedRef = (ref as React.RefObject<TextInput>) || innerRef;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => resolvedRef.current?.focus()}
      style={[
        styles.inputRow,
        {
          borderColor: focused ? BORDER_FOCUS : BORDER,
          backgroundColor: INPUT_BG,
        },
      ]}
    >
      {icon && (
        <View style={styles.inputIcon}>
          {icon === "mail" ? (
            <MailIcon focused={focused} />
          ) : (
            <LockIcon focused={focused} />
          )}
        </View>
      )}
      <TextInput
        ref={resolvedRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
        autoComplete="off"
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoFocus={autoFocus}
        style={[styles.inputText, { color: WHITE }]}
        selectionColor={PURPLE}
        cursorColor={PURPLE}
      />
      {rightNode && <View style={styles.inputRight}>{rightNode}</View>}
    </TouchableOpacity>
  );
});

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
  };

  const submit = async () => {
    const e = email.trim();
    const p = password;

    if (!e) { setError("Email address is required"); return; }
    if (!e.includes("@")) { setError("Please enter a valid email"); return; }
    if (!p) { setError("Password is required"); return; }
    if (mode === "register" && p.length < 6) {
      setError("Password must be at least 6 characters");
      return;
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
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loginWithReplit = () => {
    setError("Replit sign-in is available on the web app");
  };

  const isRegister = mode === "register";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <GridBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(insets.top, 20) + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <View style={styles.logoRing}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.logoName}>VidVault</Text>
        </View>

        {/* Mode badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isRegister ? "CREATE_ACCOUNT" : "SIGN_IN"}
          </Text>
        </View>

        {/* Heading */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>
            {isRegister ? "Join VidVault" : "Welcome Back"}
          </Text>
          <Text style={styles.subheading}>
            {isRegister ? "BUILD YOUR KNOWLEDGE VAULT" : "SIGN IN TO YOUR VAULT"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name row (register only) */}
          {isRegister && (
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>FIRST NAME</Text>
                <FormInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>LAST NAME</Text>
                <TextInput
                  ref={lastNameRef}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor={MUTED}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={[styles.inputRow, styles.inputText, { color: WHITE, borderColor: BORDER, backgroundColor: INPUT_BG }]}
                  selectionColor={PURPLE}
                  cursorColor={PURPLE}
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View>
            <Text style={styles.label}>EMAIL_ADDRESS</Text>
            <FormInput
              ref={emailRef}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* Password */}
          <View>
            <Text style={styles.label}>PASSWORD</Text>
            <FormInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              icon="lock"
              returnKeyType="done"
              onSubmitEditing={submit}
              rightNode={
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <EyeIcon visible={showPass} />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Main button */}
          <PolygonButton
            label={isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
            onPress={submit}
            loading={loading}
            disabled={loading}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Replit button */}
          <GhostButton
            label="CONTINUE WITH REPLIT"
            onPress={loginWithReplit}
            icon={<ReplitIcon />}
          />

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isRegister ? "HAVE AN ACCOUNT? " : "NEW TO VIDVAULT? "}
            </Text>
            <TouchableOpacity
              onPress={() => switchMode(isRegister ? "login" : "register")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={styles.switchLink}>
                  {isRegister ? "SIGN IN" : "REGISTER"}
                </Text>
                <ArrowIcon />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom grid dots decoration */}
        <View style={styles.gridDots}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { opacity: 0.06 + (i % 3) * 0.03 },
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  /* Logo */
  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  logoRing: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    backgroundColor: "rgba(139,92,246,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: 28,
    height: 28,
  },
  logoName: {
    fontFamily: "Raleway_900Black",
    fontSize: 22,
    color: WHITE,
    letterSpacing: -0.5,
  },

  /* Badge */
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: PURPLE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 10,
    color: PURPLE,
    letterSpacing: 1.5,
  },

  /* Heading */
  headingBlock: {
    marginBottom: 28,
    gap: 6,
  },
  heading: {
    fontFamily: "Raleway_900Black",
    fontSize: 34,
    color: WHITE,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  subheading: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1.8,
  },

  /* Form */
  form: {
    gap: 16,
  },

  /* Name row */
  nameRow: {
    flexDirection: "row",
    gap: 10,
  },

  /* Labels */
  label: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 9,
    color: MUTED,
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  /* Inputs */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    padding: 0,
    height: 52,
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
    borderColor: "rgba(239,68,68,0.15)",
    padding: 12,
    marginTop: -4,
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

  /* Polygon button internals */
  polygonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  polygonText: {
    fontFamily: "Raleway_700Bold",
    fontSize: 13,
    color: BG,
    letterSpacing: 2,
  },
  ghostText: {
    fontFamily: "Raleway_700Bold",
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 2,
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
    backgroundColor: BORDER,
  },
  dividerText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 2,
  },

  /* Switch row */
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    paddingTop: 4,
  },
  switchText: {
    fontFamily: "JetBrainsMono_400Regular",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1.2,
  },
  switchLink: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 10,
    color: PURPLE,
    letterSpacing: 1.2,
  },

  /* Grid dots decoration */
  gridDots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginTop: 32,
    paddingBottom: 8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: WHITE,
  },
});
