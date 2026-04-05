import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import * as Haptics from "expo-haptics";

const PURPLE = "#6366f1";

const TAG_COLORS = ["#6366f1","#f472b6","#34d399","#fb923c","#60a5fa","#a78bfa","#f87171","#4ade80","#facc15","#38bdf8"];

type Tag = { id: string; name: string; color?: string | null; userId: string; videoCount?: number };

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
  const qc = useQueryClient();

  const isDark = preference === "dark" || preference === "system";

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.listTags(),
  });
  const tags: Tag[] = tagsData?.tags ?? [];

  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => api.createTag(name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
      setSelectedColor(TAG_COLORS[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not create tag."),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => api.deleteTag(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not delete tag."),
  });

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const handleThemeToggle = async (value: boolean) => {
    await setTheme(value ? "dark" : "light");
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate({ name: newTagName.trim(), color: selectedColor });
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(`Delete tag "${tag.name}"?`, "This will remove the tag from all videos.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTagMutation.mutate(tag.id) },
    ]);
  };

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const stats = statsData ? [
    { label: "VIDEOS", value: statsData.totalVideos ?? 0, icon: "video" },
    { label: "FOLDERS", value: statsData.totalFolders ?? 0, icon: "folder" },
    { label: "TAGS", value: statsData.totalTags ?? tags.length, icon: "tag" },
    { label: "FAVORITES", value: statsData.totalFavorites ?? 0, icon: "heart" },
  ] : null;

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
          <View style={[styles.avatar, { backgroundColor: PURPLE }]}>
            <Text style={[styles.avatarText, { color: "#fff" }]}>{initials}</Text>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
          {user?.email ? (
            <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
          ) : null}
        </View>

        {/* Stats grid */}
        {stats && (
          <View style={styles.statsGrid}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIconWrap, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "30" }]}>
                  <Feather name={s.icon as "video"} size={14} color={PURPLE} />
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tags section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TAGS</Text>
          <SettingRow
            icon="tag"
            label="Manage Tags"
            value={`${tags.length} tag${tags.length !== 1 ? "s" : ""}`}
            onPress={() => setShowTagManager(true)}
          />
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
                trackColor={{ false: colors.border, true: PURPLE + "80" }}
                thumbColor={isDark ? PURPLE : colors.mutedForeground}
              />
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <SettingRow icon="user" label="Account" value={user?.email || "—"} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APP</Text>
          <SettingRow icon="info" label="Version" value="1.0.0" />
          <SettingRow icon="star" label="Rate VidVault" onPress={() => {}} />
          <SettingRow icon="help-circle" label="Help & Support" onPress={() => {}} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="log-out" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </ScrollView>

      {/* ── Tag Manager Modal ── */}
      <Modal visible={showTagManager} transparent animationType="slide" onRequestClose={() => setShowTagManager(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowTagManager(false)} />
          <View style={[styles.tagSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.tagSheetHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.tagSheetIconWrap, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "30" }]}>
                  <Feather name="tag" size={16} color={PURPLE} />
                </View>
                <Text style={[styles.tagSheetTitle, { color: colors.foreground }]}>Manage Tags</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTagManager(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Create new tag */}
            <View style={[styles.createTagRow, { borderBottomColor: colors.border }]}>
              <TextInput
                value={newTagName}
                onChangeText={setNewTagName}
                placeholder="New tag name..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.tagInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                returnKeyType="done"
                onSubmitEditing={handleCreateTag}
              />
              <TouchableOpacity
                onPress={handleCreateTag}
                disabled={!newTagName.trim() || createTagMutation.isPending}
                style={[styles.createTagBtn, { backgroundColor: PURPLE, opacity: newTagName.trim() ? 1 : 0.45 }]}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Color picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
              {TAG_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 1.5, borderColor: selectedColor === c ? colors.foreground : c + "40" }]}
                />
              ))}
            </ScrollView>

            {/* Tag list */}
            <FlatList
              data={tags}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
              ListEmptyComponent={
                <View style={{ paddingTop: 24, alignItems: "center" }}>
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Poppins_400Regular", fontSize: 13 }}>No tags yet. Create your first one above.</Text>
                </View>
              }
              renderItem={({ item: tag }) => (
                <View key={tag.id} style={[styles.tagRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.tagColorDot, { backgroundColor: tag.color || PURPLE }]} />
                  <Text style={[styles.tagName, { color: colors.foreground }]}>{tag.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteTag(tag)} style={styles.tagDeleteBtn} activeOpacity={0.7}>
                    <Feather name="trash-2" size={15} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  subHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },
  subLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2.5, marginBottom: 6 },
  subTitle: { fontSize: 40, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1, lineHeight: 48 },

  profileSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontFamily: "AlegreyaSansSC_700Bold" },
  displayName: { fontSize: 22, fontFamily: "AlegreyaSansSC_700Bold", marginBottom: 4 },
  email: { fontSize: 14, fontFamily: "Poppins_400Regular" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: "40%",
    borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 26, fontFamily: "AlegreyaSansSC_800ExtraBold", letterSpacing: -1 },
  statLabel: { fontSize: 8, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 2 },

  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionLabel: { fontSize: 10, fontFamily: "JetBrainsMono_400Regular", letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Poppins_500Medium" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { fontSize: 14, fontFamily: "Poppins_400Regular" },

  tagSheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  tagSheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  tagSheetIconWrap: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  tagSheetTitle: { fontSize: 17, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.3 },

  createTagRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  tagInput: { flex: 1, height: 42, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, fontSize: 14, fontFamily: "Poppins_400Regular" },
  createTagBtn: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  colorPicker: {},
  colorDot: { width: 26, height: 26, borderRadius: 13 },

  tagRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  tagColorDot: { width: 12, height: 12, borderRadius: 6 },
  tagName: { flex: 1, fontSize: 14, fontFamily: "Poppins_500Medium" },
  tagDeleteBtn: { padding: 4 },
});
