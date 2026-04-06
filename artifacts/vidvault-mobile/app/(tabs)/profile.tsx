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
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import Svg, { Polygon } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const PINK   = "#ec4899";
const AMBER  = "#f59e0b";

const TAG_COLORS = [PURPLE, PINK, GREEN, AMBER, CYAN, "#a78bfa", "#f87171", "#4ade80", "#facc15", "#38bdf8"];

type Tag = { id: string; name: string; color?: string | null; userId: string; videoCount?: number };

/* ── Stat card ── */
function StatCard({ label, value, icon, color, delay }: {
  label: string; value: number; icon: FeatherIconName; color: string; delay: number;
}) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 340, delay }}
      style={{ flex: 1, minWidth: "40%" }}
    >
      <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: color + "28" }]}>
        <LinearGradient
          colors={[color + "0c", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.statIconWrap, { backgroundColor: color + "18", borderColor: color + "30", borderWidth: 1 }]}>
          <Feather name={icon} size={14} color={color} />
        </View>
        <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </MotiView>
  );
}

/* ── Setting row ── */
function SettingRow({
  icon, label, value, onPress, danger, rightElement, delay = 0,
}: {
  icon: FeatherIconName; label: string; value?: string;
  onPress?: () => void; danger?: boolean; rightElement?: React.ReactNode; delay?: number;
}) {
  const colors = useColors();
  const accent = danger ? "#ef4444" : PURPLE;
  return (
    <MotiView
      from={{ opacity: 0, translateX: -6 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 300, delay }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress && !rightElement}
        activeOpacity={onPress ? 0.72 : 1}
        style={[styles.row, { borderBottomColor: colors.border }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: accent + "15", borderColor: accent + "25", borderWidth: 1 }]}>
          <Feather name={icon} size={16} color={accent} />
        </View>
        <Text style={[styles.rowLabel, { color: danger ? "#ef4444" : colors.foreground }]}>{label}</Text>
        <View style={styles.rowRight}>
          {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
          {rightElement}
          {onPress && !rightElement ? <Feather name="chevron-right" size={14} color={colors.mutedForeground + "80"} /> : null}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Settings group card ── */
function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 18, marginHorizontal: 20 }}>
      <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

/* ── Level tier badge ── */
function LevelBadge({ level, title, color, xp, nextXP, pct }: {
  level: number; title: string; color: string; xp: number; nextXP: number; pct: number;
}) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 400, delay: 200 }}
      style={{ marginHorizontal: 20, marginBottom: 20 }}
    >
      <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: color + "35" }]}>
        <LinearGradient
          colors={[color + "14", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ height: 2, backgroundColor: color, width: "30%", borderBottomRightRadius: 2 }} />
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
          {/* Level orb */}
          <View style={[styles.levelOrb, { backgroundColor: color + "20", borderColor: color + "50", borderWidth: 2 }]}>
            <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 20, color, lineHeight: 24 }}>
              {level}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 2, color: colors.mutedForeground, marginBottom: 3 }}>
              // CURRENT_RANK
            </Text>
            <Text style={{ fontFamily: "AlegreyaSansSC_700Bold", fontSize: 18, color: colors.foreground, letterSpacing: -0.3 }}>
              {title}
            </Text>
            {/* XP bar */}
            <View style={{ marginTop: 8 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
                <LinearGradient
                  colors={[color, color + "aa"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: `${Math.round(pct * 100)}%`, height: "100%" }}
                />
              </View>
              <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 0.8, color: colors.mutedForeground, marginTop: 5 }}>
                {xp} XP · {nextXP - xp} XP to next rank
              </Text>
            </View>
          </View>
        </View>
      </View>
    </MotiView>
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
  const initials    = displayName.slice(0, 2).toUpperCase();

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not delete tag."),
  });

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate({ name: newTagName.trim(), color: selectedColor });
  };

  const handleDeleteTag = (tag: Tag) => {
    Alert.alert(`Delete "${tag.name}"?`, "This will remove the tag from all videos.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTagMutation.mutate(tag.id) },
    ]);
  };

  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const level       = statsData?.level       ?? 1;
  const levelTitle  = statsData?.levelTitle  ?? "Novice";
  const levelColor  = statsData?.levelColor  ?? "#6b7280";
  const xp          = statsData?.xp          ?? 0;
  const nextLevelXP = statsData?.nextLevelXP ?? 100;
  const progressPct = statsData?.progressPct ?? 0;

  const STAT_CARDS = [
    { label: "Videos",    key: "totalVideos",    icon: "film"    as FeatherIconName, color: PURPLE, delay: 260 },
    { label: "AI Outputs",key: "totalAiOutputs", icon: "cpu"     as FeatherIconName, color: PINK,   delay: 310 },
    { label: "Notes",     key: "totalNotes",     icon: "edit-3"  as FeatherIconName, color: CYAN,   delay: 360 },
    { label: "Favorites", key: "totalFavorites", icon: "heart"   as FeatherIconName, color: AMBER,  delay: 410 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GridBackground />

      {/* Ambient glow */}
      <MotiView
        from={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 1200 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[PURPLE + "14", "transparent"]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.35 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      <TopAppBar />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: botInset + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 }}>
          <Text style={[styles.pageCode,  { color: colors.mutedForeground }]}>//USER_PROFILE</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>
        </View>

        {/* ── Avatar + Identity Card ── */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450, delay: 80 }}
          style={{ marginHorizontal: 20, marginBottom: 20 }}
        >
          <View style={[styles.identityCard, { backgroundColor: colors.card, borderColor: PURPLE + "30" }]}>
            <LinearGradient
              colors={[PURPLE + "18", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Top accent */}
            <View style={{ height: 2, backgroundColor: PURPLE, width: "25%" }} />
            <View style={{ padding: 22, alignItems: "center", gap: 10 }}>
              {/* Avatar with gradient ring */}
              <View style={styles.avatarRing}>
                <LinearGradient
                  colors={[PURPLE, CYAN, PINK]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.avatarInner, { backgroundColor: colors.background }]}>
                  <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 28, color: PURPLE }}>
                    {initials}
                  </Text>
                </View>
              </View>
              {/* Name + email */}
              <View style={{ alignItems: "center", gap: 3 }}>
                <Text style={{ fontFamily: "AlegreyaSansSC_700Bold", fontSize: 22, color: colors.foreground, letterSpacing: -0.3 }}>
                  {displayName}
                </Text>
                {user?.email && (
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: colors.mutedForeground }}>
                    {user.email}
                  </Text>
                )}
              </View>
              {/* Member badge */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: PURPLE + "14", borderWidth: 1, borderColor: PURPLE + "30", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Feather name="shield" size={10} color={PURPLE} />
                <Text style={{ fontFamily: "JetBrainsMono_600SemiBold", fontSize: 9, letterSpacing: 1.2, color: PURPLE }}>
                  FREE MEMBER
                </Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* ── Level / XP Card ── */}
        {statsData && (
          <LevelBadge
            level={level}
            title={levelTitle}
            color={levelColor}
            xp={xp}
            nextXP={nextLevelXP}
            pct={progressPct}
          />
        )}

        {/* ── Stats grid ── */}
        {statsData && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>// VAULT_STATS</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {STAT_CARDS.map((cfg) => (
                <StatCard
                  key={cfg.key}
                  label={cfg.label.toUpperCase()}
                  value={(statsData as any)[cfg.key] ?? 0}
                  icon={cfg.icon}
                  color={cfg.color}
                  delay={cfg.delay}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Settings ── */}
        <SettingGroup title="// TAGS">
          <SettingRow
            icon="tag"
            label="Manage Tags"
            value={`${tags.length} tag${tags.length !== 1 ? "s" : ""}`}
            onPress={() => setShowTagManager(true)}
            delay={440}
          />
        </SettingGroup>

        <SettingGroup title="// APPEARANCE">
          <SettingRow
            icon="moon"
            label="Dark Mode"
            delay={470}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={async (v) => { await setTheme(v ? "dark" : "light"); }}
                trackColor={{ false: colors.border, true: PURPLE + "70" }}
                thumbColor={isDark ? PURPLE : colors.mutedForeground}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="// ACCOUNT">
          <SettingRow icon="user"         label="Account"       value={user?.email ?? "—"}        delay={500} />
          <SettingRow icon="lock"         label="Privacy"       onPress={() => {}}                delay={530} />
          <SettingRow icon="bell"         label="Notifications" onPress={() => {}}                delay={560} />
        </SettingGroup>

        <SettingGroup title="// APP_INFO">
          <SettingRow icon="info"         label="Version"       value="2.0.0"                     delay={590} />
          <SettingRow icon="star"         label="Rate VidVault" onPress={() => {}}                delay={620} />
          <SettingRow icon="help-circle"  label="Help & Docs"   onPress={() => {}}                delay={650} />
          <SettingRow icon="share-2"      label="Share App"     onPress={() => {}}                delay={680} />
        </SettingGroup>

        <SettingGroup title="// SESSION">
          <SettingRow icon="log-out"      label="Sign Out"      onPress={handleLogout} danger     delay={710} />
        </SettingGroup>
      </ScrollView>

      {/* ── Tag Manager Bottom Sheet ── */}
      <Modal visible={showTagManager} transparent animationType="slide" onRequestClose={() => setShowTagManager(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowTagManager(false)} />
          <View style={[styles.tagSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
              <View style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.sheetIconWrap, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "30", borderWidth: 1 }]}>
                  <Feather name="tag" size={16} color={PURPLE} />
                </View>
                <View>
                  <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 2, color: colors.mutedForeground, marginBottom: 1 }}>// TAG_MANAGER</Text>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Manage Tags</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowTagManager(false)} style={{ padding: 4 }}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Create new tag */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
              <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 1.5, color: colors.mutedForeground }}>NEW TAG</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  value={newTagName}
                  onChangeText={setNewTagName}
                  placeholder="Tag name..."
                  placeholderTextColor={colors.mutedForeground + "80"}
                  style={[styles.tagInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateTag}
                />
                <TouchableOpacity
                  onPress={handleCreateTag}
                  disabled={!newTagName.trim() || createTagMutation.isPending}
                  style={[styles.createTagBtn, { backgroundColor: newTagName.trim() ? PURPLE : colors.border }]}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              {/* Color picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {TAG_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setSelectedColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      selectedColor === c && { borderWidth: 3, borderColor: colors.foreground },
                    ]}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Tag list */}
            <FlatList
              data={tags}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 32 }}
              ListEmptyComponent={
                <View style={{ paddingTop: 32, alignItems: "center", gap: 8 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: PURPLE + "14", borderWidth: 1, borderColor: PURPLE + "25", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="tag" size={20} color={PURPLE + "80"} />
                  </View>
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: colors.mutedForeground }}>
                    No tags yet
                  </Text>
                  <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 9, letterSpacing: 1, color: colors.mutedForeground + "70" }}>
                    Create your first tag above
                  </Text>
                </View>
              }
              renderItem={({ item: tag, index }) => (
                <View style={[styles.tagRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.tagDot, { backgroundColor: tag.color || PURPLE }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 14, color: colors.foreground }}>{tag.name}</Text>
                    {tag.videoCount !== undefined && (
                      <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 1, color: colors.mutedForeground, marginTop: 1 }}>
                        {tag.videoCount} VIDEO{tag.videoCount !== 1 ? "S" : ""}
                      </Text>
                    )}
                  </View>
                  <View style={[{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, backgroundColor: (tag.color || PURPLE) + "14", borderColor: (tag.color || PURPLE) + "30" }]}>
                    <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 7, letterSpacing: 1, color: tag.color || PURPLE }}>
                      TAG_{(index + 1).toString().padStart(2, "0")}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteTag(tag)} style={{ padding: 6, marginLeft: 4 }} activeOpacity={0.7}>
                    <Feather name="trash-2" size={14} color="#ef4444" />
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
  pageCode:  { fontFamily: "JetBrainsMono_400Regular", fontSize: 9, letterSpacing: 2.5, marginBottom: 6 },
  pageTitle: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 40, letterSpacing: -1, lineHeight: 48 },

  identityCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },

  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center", padding: 3,
  },
  avatarInner: {
    flex: 1, width: "100%", borderRadius: 40,
    alignItems: "center", justifyContent: "center",
  },

  levelCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  levelOrb: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
  },

  statCard: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 1,
    alignItems: "center", gap: 6, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  statIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue:    { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 26, letterSpacing: -1 },
  statLabel:    { fontFamily: "JetBrainsMono_400Regular", fontSize: 7, letterSpacing: 2 },

  groupLabel: { fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 2.5, marginBottom: 8 },
  groupCard:  { borderRadius: 14, borderWidth: 1, overflow: "hidden" },

  row:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel:  { flex: 1, fontSize: 14, fontFamily: "Poppins_500Medium" },
  rowRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue:  { fontSize: 12, fontFamily: "Poppins_400Regular" },

  tagSheet:    { maxHeight: "82%", borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, overflow: "hidden" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetIconWrap:{ width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sheetTitle:   { fontSize: 17, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.3 },

  tagInput:     { flex: 1, height: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, fontSize: 14, fontFamily: "Poppins_400Regular" },
  createTagBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  colorDot:     { width: 26, height: 26, borderRadius: 13 },

  tagRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  tagDot:  { width: 10, height: 10, borderRadius: 5 },
});
