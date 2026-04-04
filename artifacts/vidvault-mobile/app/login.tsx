import React, { useState } from "react";
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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

const LOGO = require("@/assets/images/logo.png");

const PURPLE = "#8b5cf6";
const PURPLE_DIM = "#6d28d9";
const BG = "#0a0a0f";
const CARD_BG = "#13131a";
const BORDER = "#1e1e2e";
const BORDER_FOCUS = "rgba(139,92,246,0.55)";
const TEXT = "#f1f5f9";
const MUTED = "#64748b";
const INPUT_BG = "#1a1a27";
const ERROR_BG = "rgba(239,68,68,0.12)";
const ERROR_COLOR = "#f87171";

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Text style={{ color: MUTED, fontSize: 16 }}>👁</Text>
    );
  }
  return (
    <Text style={{ color: MUTED, fontSize: 16 }}>🙈</Text>
  );
}

function FocusableInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  secureTextEntry,
  onSubmitEditing,
  returnKeyType,
  rightElement,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "words" | "sentences";
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "next" | "go";
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputWrapper,
        {
          borderColor: focused ? BORDER_FOCUS : BORDER,
          backgroundColor: INPUT_BG,
          shadowColor: focused ? PURPLE : "transparent",
          shadowOpacity: focused ? 0.2 : 0,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: focused ? 4 : 0,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={autoCorrect ?? true}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        style={styles.inputField}
      />
      {rightElement && (
        <View style={styles.inputRight}>{rightElement}</View>
      )}
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
  };

  const submit = async () => {
    const emailTrimmed = email.trim();
    const passTrimmed = password.trim();

    if (!emailTrimmed) {
      setError("Please enter your email address");
      return;
    }
    if (!emailTrimmed.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!passTrimmed) {
      setError("Please enter your password");
      return;
    }
    if (mode === "register" && passTrimmed.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(emailTrimmed, passTrimmed);
      } else {
        await register(
          emailTrimmed,
          passTrimmed,
          firstName.trim() || undefined,
          lastName.trim() || undefined,
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>VidVault AI</Text>
          <Text style={styles.tagline}>Your second brain for videos</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tab switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => switchMode("login")}
              style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchMode("register")}
              style={[styles.tabBtn, mode === "register" && styles.tabBtnActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name fields (register only) */}
          {mode === "register" && (
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>First Name</Text>
                <FocusableInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Prashant"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Last Name</Text>
                <FocusableInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Maurya"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View>
            <Text style={styles.label}>Email Address</Text>
            <FocusableInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordOuter}>
              <FocusableInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                secureTextEntry={!showPass}
                onSubmitEditing={submit}
                returnKeyType="done"
                rightElement={
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <EyeIcon visible={showPass} />
                  </TouchableOpacity>
                }
              />
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch hint */}
          <View style={styles.switchHint}>
            <Text style={styles.switchHintText}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => switchMode(mode === "login" ? "register" : "login")}>
              <Text style={styles.switchHintLink}>
                {mode === "login" ? "Register" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer badge */}
        <View style={styles.footerBadge}>
          <Text style={styles.footerBadgeText}>✦ AI-POWERED VIDEO KNOWLEDGE</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "stretch",
    gap: 24,
  },

  /* Header */
  header: {
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: "#12101e",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: PURPLE,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  appName: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: TEXT,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    letterSpacing: 0.3,
  },

  /* Card */
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  /* Tab bar */
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#0a0a0f",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: PURPLE,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: MUTED,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: "#fff",
  },

  /* Name row */
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },

  /* Labels */
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 7,
  },

  /* Input */
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: TEXT,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  inputRight: {
    paddingLeft: 8,
  },
  passwordOuter: {},

  /* Error */
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: ERROR_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorIcon: {
    color: ERROR_COLOR,
    fontSize: 14,
    marginTop: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: ERROR_COLOR,
    lineHeight: 18,
  },

  /* Submit button */
  submitBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 2,
    shadowColor: PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: PURPLE_DIM,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },

  /* Switch hint */
  switchHint: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  switchHintText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: MUTED,
  },
  switchHintLink: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: PURPLE,
  },

  /* Footer */
  footerBadge: {
    alignItems: "center",
    marginTop: 8,
  },
  footerBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(139,92,246,0.5)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
