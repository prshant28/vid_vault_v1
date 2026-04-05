import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { useThemeToggle } from "@/hooks/useThemeToggle";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.destructive + "15" : colors.secondary }]}>
        <Feather name={icon as "moon"} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
        {rightElement}
        {onPress && !rightElement ? <Feather name="chevron-right" size={16} color={colors.mutedForeground} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { preference, setTheme } = useThemeToggle();

  const isDark = preference === "dark" || preference === "system";

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const handleThemeToggle = async (value: boolean) => {
    await setTheme(value ? "dark" : "light");
  };

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GridBackground />
      <TopAppBar />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botInset + 100 }}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.subHeader}>
        <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>//USER_SETTINGS</Text>
        <Text style={[styles.subTitle, { color: colors.foreground }]}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials}</Text>
        </View>
        <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
        {user?.email ? (
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
        ) : null}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APPEARANCE</Text>
        <SettingRow
          icon="moon"
          label="Dark Mode"
          rightElement={
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={isDark ? colors.primary : colors.mutedForeground}
            />
          }
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <SettingRow icon="user" label="Account" value={user?.email || "—"} />
        <SettingRow icon="shield" label="Privacy" onPress={() => { /* placeholder */ }} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APP</Text>
        <SettingRow icon="info" label="Version" value="1.0.0" />
        <SettingRow icon="star" label="Rate VidVault" onPress={() => { /* placeholder */ }} />
        <SettingRow icon="help-circle" label="Help & Support" onPress={() => { /* placeholder */ }} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="log-out" label="Sign Out" onPress={handleLogout} danger />
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  subLabel: { fontSize: 9, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2, marginBottom: 3 },
  subTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },

  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
  },
  displayName: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
});
