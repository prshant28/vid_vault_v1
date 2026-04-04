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
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const { register } = useAuth();

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, firstName.trim() || undefined, lastName.trim() || undefined);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.accent }]}>
            <Feather name="film" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>VidVault AI</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Your YouTube knowledge vault</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <View style={[styles.tabs, { backgroundColor: colors.secondary, borderRadius: colors.radius - 2 }]}>
            <TouchableOpacity
              onPress={() => { setMode("login"); setError(""); }}
              style={[styles.tab, mode === "login" && { backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: mode === "login" ? colors.foreground : colors.mutedForeground, fontFamily: mode === "login" ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setMode("register"); setError(""); }}
              style={[styles.tab, mode === "register" && { backgroundColor: colors.card, borderRadius: colors.radius - 4 }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: mode === "register" ? colors.foreground : colors.mutedForeground, fontFamily: mode === "register" ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "register" && (
            <View style={styles.row}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.halfInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
              />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, styles.halfInput, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
              />
            </View>
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
          />

          <View style={[styles.passwordRow, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius - 4 }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              style={[styles.passwordInput, { color: colors.foreground }]}
              onSubmitEditing={submit}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15", borderRadius: colors.radius - 4 }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: loading ? colors.primary + "80" : colors.primary, borderRadius: colors.radius - 4 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  card: {
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  tabs: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  submitBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
