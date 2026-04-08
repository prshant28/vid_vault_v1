import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Switch,
  ScrollView, Platform, Alert, TextInput, FlatList, Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";
import { TabFadeWrapper } from "@/components/TabFadeWrapper";
import {
  getReminderSettings, saveReminderSettings, requestNotificationPermission,
  checkNotificationPermission, scheduleDaily, cancelDaily, getStreak,
  type ReminderSettings, type StreakData,
} from "@/lib/notifications";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const PINK   = "#ec4899";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";

const AVATAR_KEY   = "vv_profile_image_uri";
const DNAME_KEY    = "vv_display_name";

const TAG_COLORS    = [PURPLE, PINK, GREEN, AMBER, CYAN, "#a78bfa", "#f87171", "#4ade80", "#facc15", "#38bdf8"];
const FOLDER_COLORS = [PURPLE, AMBER, GREEN, PINK, CYAN, "#a78bfa", "#f87171", "#facc15", "#38bdf8", "#fb923c"];

type Tag    = { id: string; name: string; color?: string | null; userId: string; videoCount?: number };
type Folder = { id: string; name: string; color: string | null; videoCount: number };

/* ── Achievement definition ── */
const ACHIEVEMENTS: Array<{
  id: string; icon: FeatherIconName; label: string; desc: string;
  color: string; check: (s: any) => boolean;
}> = [
  { id: "first_save",   icon: "video",      label: "First Save",       desc: "Save your first YouTube video",        color: PURPLE, check: s => s.totalVideos >= 1   },
  { id: "ai_explorer",  icon: "cpu",        label: "AI Explorer",      desc: "Generate 5 AI outputs",                color: PINK,   check: s => s.totalAiOutputs >= 5 },
  { id: "note_taker",   icon: "edit-3",     label: "Note Taker",       desc: "Write 10 timestamped notes",           color: CYAN,   check: s => s.totalNotes >= 10    },
  { id: "organizer",    icon: "folder",     label: "Organizer",        desc: "Create 3 folders",                     color: AMBER,  check: s => s.totalFolders >= 3   },
  { id: "tag_master",   icon: "tag",        label: "Tag Master",       desc: "Add 10 tags to your vault",            color: GREEN,  check: s => s.totalTags >= 10     },
  { id: "binge",        icon: "play-circle",label: "Binge Learner",    desc: "Watch 20 videos",                      color: "#a78bfa", check: s => s.totalWatched >= 20 },
  { id: "collector",    icon: "star",       label: "Collector",        desc: "Save 25 videos to your vault",         color: AMBER,  check: s => s.totalVideos >= 25   },
  { id: "ai_master",    icon: "zap",        label: "AI Master",        desc: "Generate 50 AI outputs",               color: PURPLE, check: s => s.totalAiOutputs >= 50},
];

/* ── Setting row ── */
function SettingRow({
  icon, label, value, onPress, danger, rightElement, color, delay = 0,
}: {
  icon: FeatherIconName; label: string; value?: string;
  onPress?: () => void; danger?: boolean; rightElement?: React.ReactNode;
  color?: string; delay?: number;
}) {
  const colors = useColors();
  const accent = danger ? RED : (color || PURPLE);
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
        <View style={[styles.rowIcon, { backgroundColor: accent + "15", borderColor: accent + "28", borderWidth: 1 }]}>
          <Feather name={icon} size={16} color={accent} />
        </View>
        <Text style={[styles.rowLabel, { color: danger ? RED : colors.foreground }]}>{label}</Text>
        <View style={styles.rowRight}>
          {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]} numberOfLines={1}>{value}</Text> : null}
          {rightElement}
          {onPress && !rightElement ? <Feather name="chevron-right" size={13} color={colors.mutedForeground + "70"} /> : null}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Settings group ── */
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

/* ── Achievement badge ── */
function AchievementBadge({ item, unlocked }: { item: typeof ACHIEVEMENTS[0]; unlocked: boolean }) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 14 }}
      style={{ alignItems: "center", width: 72 }}
    >
      <View style={[
        styles.achieveOrb,
        { borderColor: unlocked ? item.color + "60" : colors.border },
        unlocked ? { backgroundColor: item.color + "18" } : { backgroundColor: colors.card },
      ]}>
        <Feather name={item.icon} size={20} color={unlocked ? item.color : colors.mutedForeground + "40"} />
        {unlocked && (
          <View style={[styles.achieveCheck, { backgroundColor: item.color }]}>
            <Feather name="check" size={7} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.achieveLabel, { color: unlocked ? colors.foreground : colors.mutedForeground + "50" }]} numberOfLines={2}>
        {item.label}
      </Text>
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

  const [avatarUri, setAvatarUri]         = useState<string | null>(null);
  const [nameOverride, setNameOverride]   = useState<string | null>(null);
  const [showEditName, setShowEditName]   = useState(false);
  const [editNameVal, setEditNameVal]     = useState("");
  const [showTagManager, setShowTagManager]       = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [reminder, setReminder]   = useState<ReminderSettings | null>(null);
  const [streak, setStreak]       = useState<StreakData>({ lastDate: "", count: 0 });
  const [notifGranted, setNotifGranted] = useState(false);
  const [newTagName, setNewTagName]           = useState("");
  const [selectedColor, setSelectedColor]     = useState(TAG_COLORS[0]);
  const [newFolderName, setNewFolderName]     = useState("");
  const [selectedFolderColor, setSelectedFolderColor] = useState(FOLDER_COLORS[0]);

  /* ── Immediately-resolved display name from user (no async delay) ── */
  const autoName = useMemo(() =>
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "User"
  , [user?.firstName, user?.lastName, user?.email]);

  const displayName = nameOverride ?? autoName;

  /* ── Load persisted avatar + custom display name override ── */
  useEffect(() => {
    AsyncStorage.multiGet([AVATAR_KEY, DNAME_KEY]).then(pairs => {
      const av = pairs[0][1];
      const dn = pairs[1][1];
      if (av) setAvatarUri(av);
      setNameOverride(dn || null);
    });
  }, []);

  /* ── Load notification settings + streak ── */
  useEffect(() => {
    getReminderSettings().then(setReminder);
    getStreak().then(setStreak);
    checkNotificationPermission().then(setNotifGranted);
  }, []);

  const toggleReminder = async (enabled: boolean) => {
    const granted = notifGranted || (await requestNotificationPermission());
    setNotifGranted(granted);
    if (enabled && !granted) {
      Alert.alert("Permission Needed", "Please allow notifications in your device settings to enable daily reminders.");
      return;
    }
    const settings: ReminderSettings = { ...(reminder ?? { hour: 8, minute: 0 }), enabled };
    setReminder(settings);
    await saveReminderSettings(settings);
    if (enabled) {
      await scheduleDaily(settings.hour, settings.minute, streak.count);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await cancelDaily();
    }
  };

  const initials = (displayName || "??").slice(0, 2).toUpperCase();

  /* ── Data queries ── */
  const { data: statsData }   = useQuery({ queryKey: ["stats"],   queryFn: () => api.getStats()    });
  const { data: tagsData  }   = useQuery({ queryKey: ["tags"],    queryFn: () => api.listTags()    });
  const { data: foldersData } = useQuery({ queryKey: ["folders"], queryFn: () => api.listFolders() });
  const tags: Tag[]     = tagsData?.tags       ?? [];
  const folders: Folder[] = (foldersData?.folders ?? []) as Folder[];

  /* ── Tag mutations ── */
  const createTagMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => api.createTag(name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName(""); setSelectedColor(TAG_COLORS[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not create tag."),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => api.deleteTag(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
    onError:   (err: any) => Alert.alert("Error", err.message || "Could not delete tag."),
  });

  /* ── Folder mutations ── */
  const createFolderMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => api.createFolder(name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setNewFolderName(""); setSelectedFolderColor(FOLDER_COLORS[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not create folder."),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: (err: any) => Alert.alert("Error", err.message || "Could not delete folder."),
  });

  /* ── Pick profile image ── */
  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow access to photos to set a profile picture."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_KEY, uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  /* ── Take photo ── */
  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow camera access to take a profile photo."); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_KEY, uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  /* ── Remove photo ── */
  const handleRemovePhoto = async () => {
    setAvatarUri(null);
    await AsyncStorage.removeItem(AVATAR_KEY);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /* ── Avatar picker sheet ── */
  const handleAvatarPress = () => {
    const opts: Array<{ text: string; onPress?: () => void; style?: "cancel" | "destructive" }> = [
      { text: "Choose from Library", onPress: handlePickImage },
      { text: "Take Photo",          onPress: handleTakePhoto },
    ];
    if (avatarUri) opts.push({ text: "Remove Photo", onPress: handleRemovePhoto, style: "destructive" });
    opts.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Profile Photo", "Update your profile picture", opts);
  };

  /* ── Save display name ── */
  const handleSaveName = async () => {
    const trimmed = editNameVal.trim();
    if (!trimmed) return;
    setNameOverride(trimmed);
    await AsyncStorage.setItem(DNAME_KEY, trimmed);
    setShowEditName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /* ── Folder handlers ── */
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({ name: newFolderName.trim(), color: selectedFolderColor });
  };

  const handleDeleteFolder = (folder: Folder) => {
    Alert.alert(
      `Delete "${folder.name}"?`,
      folder.videoCount > 0
        ? `This folder contains ${folder.videoCount} video${folder.videoCount !== 1 ? "s" : ""}. Videos will not be deleted, only unassigned.`
        : "This will remove the empty folder.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteFolderMutation.mutate(folder.id) },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
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

  const botInset  = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const level       = statsData?.level       ?? 1;
  const levelTitle  = statsData?.levelTitle  ?? "Novice";
  const levelColor  = statsData?.levelColor  ?? "#6b7280";
  const xp          = statsData?.xp          ?? 0;
  const nextLevelXP = statsData?.nextLevelXP ?? 100;
  const progressPct = statsData?.progressPct ?? 0;

  const STAT_ITEMS = [
    { label: "Videos",     key: "totalVideos",    icon: "film"     as FeatherIconName, color: PURPLE },
    { label: "AI Outputs", key: "totalAiOutputs", icon: "cpu"      as FeatherIconName, color: PINK   },
    { label: "Notes",      key: "totalNotes",     icon: "edit-3"   as FeatherIconName, color: CYAN   },
    { label: "Watched",    key: "totalWatched",   icon: "play"     as FeatherIconName, color: GREEN  },
    { label: "Favorites",  key: "totalFavorites", icon: "heart"    as FeatherIconName, color: AMBER  },
    { label: "Folders",    key: "totalFolders",   icon: "folder"   as FeatherIconName, color: "#a78bfa" },
  ];

  return (
    <TabFadeWrapper>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GridBackground />
      <MotiView
        from={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 1200 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
      >
        <LinearGradient
          colors={[PURPLE + "14", "transparent"]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.35 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      <TopAppBar />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: botInset + 100 }} showsVerticalScrollIndicator={false}>
        {/* ── Page header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 18 }}>
          <Text style={[styles.pageCode,  { color: colors.mutedForeground }]}>Profile</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>
        </View>

        {/* ── Identity Card ── */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 450, delay: 60 }}
          style={{ marginHorizontal: 20, marginBottom: 16 }}
        >
          <View style={[styles.identityCard, { backgroundColor: colors.card, borderColor: PURPLE + "30" }]}>
            <LinearGradient colors={[PURPLE + "18", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={{ height: 2, backgroundColor: PURPLE, width: "20%" }} />
            <View style={{ padding: 22, alignItems: "center", gap: 12 }}>
              {/* Avatar */}
              <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85} style={{ position: "relative" }}>
                <View style={styles.avatarRing}>
                  <LinearGradient colors={[PURPLE, CYAN, PINK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <View style={[styles.avatarInner, { backgroundColor: colors.background }]}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%", borderRadius: 38 }} />
                    ) : (
                      <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 28, color: PURPLE }}>{initials}</Text>
                    )}
                  </View>
                </View>
                {/* Camera badge */}
                <View style={[styles.cameraBadge, { backgroundColor: PURPLE, borderColor: colors.background }]}>
                  <Feather name="camera" size={11} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Name + email */}
              <View style={{ alignItems: "center", gap: 2 }}>
                <TouchableOpacity onPress={() => { setEditNameVal(displayName); setShowEditName(true); }} activeOpacity={0.75} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontFamily: "AlegreyaSansSC_700Bold", fontSize: 22, color: colors.foreground, letterSpacing: -0.3 }}>{displayName}</Text>
                  <Feather name="edit-2" size={12} color={PURPLE + "90"} />
                </TouchableOpacity>
                {user?.email && (
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 12, color: colors.mutedForeground }}>{user.email}</Text>
                )}
              </View>

              {/* Pills row */}
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <View style={[styles.pill, { borderColor: PURPLE + "35", backgroundColor: PURPLE + "12" }]}>
                  <Feather name="shield" size={9} color={PURPLE} />
                  <Text style={[styles.pillText, { color: PURPLE }]}>FREE MEMBER</Text>
                </View>
                <View style={[styles.pill, { borderColor: levelColor + "50", backgroundColor: levelColor + "12" }]}>
                  <Feather name="award" size={9} color={levelColor} />
                  <Text style={[styles.pillText, { color: levelColor }]}>LVL {level} · {levelTitle.toUpperCase()}</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
                <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}
                  style={[styles.idBtn, { borderColor: PURPLE + "40", backgroundColor: PURPLE + "10" }]}>
                  <Feather name="camera" size={12} color={PURPLE} />
                  <Text style={[styles.idBtnText, { color: PURPLE }]}>PHOTO</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditNameVal(displayName); setShowEditName(true); }} activeOpacity={0.8}
                  style={[styles.idBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Feather name="edit-2" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.idBtnText, { color: colors.mutedForeground }]}>EDIT NAME</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </MotiView>

        {/* ── Level / XP Card ── */}
        {statsData && (
          <MotiView
            from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 380, delay: 140 }}
            style={{ marginHorizontal: 20, marginBottom: 16 }}
          >
            <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: levelColor + "35" }]}>
              <LinearGradient colors={[levelColor + "12", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={{ height: 2, backgroundColor: levelColor, width: "25%" }} />
              <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={[styles.levelOrb, { backgroundColor: levelColor + "20", borderColor: levelColor + "55", borderWidth: 2 }]}>
                  <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 22, color: levelColor }}>{level}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2, color: colors.mutedForeground, marginBottom: 2 }}>Current Rank</Text>
                  <Text style={{ fontFamily: "AlegreyaSansSC_700Bold", fontSize: 18, color: colors.foreground }}>{levelTitle}</Text>
                  <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden", marginTop: 8 }}>
                    <LinearGradient colors={[levelColor, levelColor + "aa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.round(progressPct * 100)}%`, height: "100%" }} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
                    <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, color: colors.mutedForeground }}>{xp} XP earned</Text>
                    <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, color: levelColor }}>{nextLevelXP - xp} XP to go</Text>
                  </View>
                </View>
              </View>
            </View>
          </MotiView>
        )}

        {/* ── Stats grid ── */}
        {statsData && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>Vault Stats</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {STAT_ITEMS.map((cfg, i) => (
                <MotiView
                  key={cfg.key}
                  from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 300, delay: 200 + i * 50 }}
                  style={{ flex: 1, minWidth: "28%" }}
                >
                  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: cfg.color + "25" }]}>
                    <LinearGradient colors={[cfg.color + "0a", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <View style={[styles.statIconWrap, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "30", borderWidth: 1 }]}>
                      <Feather name={cfg.icon} size={13} color={cfg.color} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{(statsData as any)[cfg.key] ?? 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{cfg.label.toUpperCase()}</Text>
                  </View>
                </MotiView>
              ))}
            </View>
          </View>
        )}

        {/* ── Achievements ── */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>Achievements</Text>
            <Text style={{ fontFamily: "AlegreyaSansSC_700Bold", fontSize: 18, color: colors.foreground, letterSpacing: -0.2 }}>Milestones</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {ACHIEVEMENTS.map((ach, i) => {
              const unlocked = statsData ? ach.check(statsData) : false;
              return (
                <MotiView
                  key={ach.id}
                  from={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 320, delay: 260 + i * 40 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => Alert.alert(ach.label, `${ach.desc}${unlocked ? "\n\n✅ Unlocked!" : "\n\n🔒 Keep going!"}`) }
                    style={[styles.achieveCard, { backgroundColor: colors.card, borderColor: unlocked ? ach.color + "50" : colors.border }]}
                  >
                    <LinearGradient colors={unlocked ? [ach.color + "12", "transparent"] : ["transparent", "transparent"]} style={StyleSheet.absoluteFill} />
                    <AchievementBadge item={ach} unlocked={unlocked} />
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Settings ── */}
        <SettingGroup title="//CONTENT">
          <SettingRow icon="folder"    label="Manage Folders"   value={`${folders.length} folder${folders.length !== 1 ? "s" : ""}`} onPress={() => setShowFolderManager(true)} color={AMBER} delay={355} />
          <SettingRow icon="tag"       label="Manage Tags"      value={`${tags.length} tag${tags.length !== 1 ? "s" : ""}`} onPress={() => setShowTagManager(true)} delay={365} />
          <SettingRow icon="download"  label="Export Vault Data" onPress={() => Alert.alert("Export", `Your vault has ${statsData?.totalVideos ?? 0} videos, ${statsData?.totalNotes ?? 0} notes, and ${statsData?.totalAiOutputs ?? 0} AI outputs.\n\nFull export feature coming in Pro.`)} delay={380} />
        </SettingGroup>

        <SettingGroup title="//APPEARANCE">
          <SettingRow icon="moon" label="Dark Mode" delay={400}
            rightElement={
              <Switch value={isDark} onValueChange={async v => { await setTheme(v ? "dark" : "light"); }}
                trackColor={{ false: colors.border, true: PURPLE + "70" }}
                thumbColor={isDark ? PURPLE : colors.mutedForeground}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="//ACCOUNT">
          <SettingRow icon="user"  label="Email"       value={user?.email ?? "—"}        delay={420} />
          <SettingRow icon="lock"  label="Change Password" onPress={() => Alert.alert("Password", "Password change is managed through your account portal.")} delay={440} color={CYAN} />
          <MotiView
            from={{ opacity: 0, translateX: -6 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 300, delay: 460 }}
          >
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: AMBER + "15", borderColor: AMBER + "28", borderWidth: 1 }]}>
                <Feather name="bell" size={16} color={AMBER} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Daily Reminder</Text>
                {streak.count > 0 && (
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 10, color: AMBER }}>
                    🔥 Day {streak.count} streak
                  </Text>
                )}
                {reminder?.enabled && Platform.OS !== "web" && (
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 10, color: colors.mutedForeground }}>
                    Daily at {String(reminder.hour).padStart(2, "0")}:{String(reminder.minute).padStart(2, "0")}
                  </Text>
                )}
                {Platform.OS === "web" && (
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 10, color: colors.mutedForeground }}>
                    Available on native app
                  </Text>
                )}
              </View>
              <Switch
                value={reminder?.enabled ?? false}
                onValueChange={toggleReminder}
                disabled={Platform.OS === "web"}
                trackColor={{ false: colors.border, true: AMBER + "70" }}
                thumbColor={reminder?.enabled ? AMBER : colors.mutedForeground}
              />
            </View>
          </MotiView>
          <SettingRow icon="globe" label="Language"         onPress={() => Alert.alert("Language", "English and Hindi supported in AI output generation.")} delay={480} color={GREEN} />
        </SettingGroup>

        <SettingGroup title="//APP_INFO">
          <SettingRow icon="info"        label="Version"        value="2.0.0"  delay={500} />
          <SettingRow icon="star"        label="Rate VidVault"  onPress={() => Alert.alert("Rate App", "Thank you! Please rate us on the App Store.")} delay={520} color={AMBER} />
          <SettingRow icon="help-circle" label="Help & Docs"    onPress={() => Alert.alert("Help", "Documentation and support coming soon.")} delay={540} />
          <SettingRow icon="share-2"     label="Share VidVault" onPress={() => Alert.alert("Share", "Share VidVault AI with friends!")} delay={560} color={PINK} />
        </SettingGroup>

        <SettingGroup title="//DANGER_ZONE">
          <SettingRow icon="log-out" label="Sign Out" onPress={handleLogout} danger delay={580} />
        </SettingGroup>
      </ScrollView>

      {/* ── Edit Name overlay ── */}
      {showEditName && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 200, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.65)" }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowEditName(false)} />
          <MotiView
            from={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "timing", duration: 220 }}
            style={[styles.editModal, { backgroundColor: colors.background, borderColor: PURPLE + "35" }]}
          >
            <LinearGradient colors={[PURPLE + "14", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={{ height: 2, backgroundColor: PURPLE, width: "20%", marginBottom: 20 }} />
            <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2, color: colors.mutedForeground, marginBottom: 4 }}>Display Name</Text>
            <Text style={{ fontFamily: "AlegreyaSansSC_700Bold", fontSize: 20, color: colors.foreground, marginBottom: 16 }}>Update Name</Text>
            <TextInput
              value={editNameVal}
              onChangeText={setEditNameVal}
              style={[styles.nameInput, { color: colors.foreground, borderColor: PURPLE + "40", backgroundColor: colors.card }]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="Your display name..."
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowEditName(false)} style={[styles.modalBtn, { borderColor: colors.border, backgroundColor: colors.card, flex: 1 }]}>
                <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 11, letterSpacing: 1, color: colors.mutedForeground }}>CANCEL</Text>
              </TouchableOpacity>
              <AppButton label="SAVE" icon="check" size="sm" variant="primary" onPress={handleSaveName} />
            </View>
          </MotiView>
        </View>
      )}

      {/* ── Folder Manager modal ── */}
      {showFolderManager && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 200, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.72)" }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowFolderManager(false)} />
          <MotiView
            from={{ scale: 0.93, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            style={[styles.centeredModal, { backgroundColor: colors.background, borderColor: AMBER + "40" }]}
          >
            <LinearGradient colors={[AMBER + "12", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            {/* Top accent bar */}
            <View style={{ height: 3, backgroundColor: AMBER, width: "30%", borderRadius: 2, marginBottom: 18 }} />

            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border, paddingHorizontal: 0, paddingTop: 0 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[styles.sheetIconWrap, { backgroundColor: AMBER + "18", borderColor: AMBER + "35", borderWidth: 1 }]}>
                  <Feather name="folder" size={17} color={AMBER} />
                </View>
                <View>
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2, color: colors.mutedForeground, marginBottom: 2 }}>// CONTENT</Text>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Manage Folders</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowFolderManager(false)} activeOpacity={0.75}>
                <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Create folder */}
            <View style={{ paddingVertical: 14, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
              <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 1.8, color: colors.mutedForeground }}>CREATE NEW FOLDER</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  value={newFolderName} onChangeText={setNewFolderName} placeholder="Folder name..."
                  placeholderTextColor={colors.mutedForeground + "70"}
                  style={[styles.tagInput, { color: colors.foreground, borderColor: AMBER + "45", backgroundColor: colors.card }]}
                  returnKeyType="done" onSubmitEditing={handleCreateFolder}
                />
                <TouchableOpacity onPress={handleCreateFolder} disabled={!newFolderName.trim() || createFolderMutation.isPending}
                  style={[styles.createTagBtn, { backgroundColor: newFolderName.trim() ? AMBER : colors.border }]} activeOpacity={0.8}>
                  <Feather name="plus" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {FOLDER_COLORS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setSelectedFolderColor(c)}
                    style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedFolderColor === c ? 3 : 1.5, borderColor: selectedFolderColor === c ? colors.foreground : c + "40" }]}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Folder list */}
            <FlatList
              data={folders} keyExtractor={item => item.id} style={{ maxHeight: 240 }}
              contentContainerStyle={{ paddingBottom: 8, paddingTop: 4 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ paddingVertical: 28, alignItems: "center", gap: 8 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: AMBER + "14", borderWidth: 1, borderColor: AMBER + "25", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="folder" size={20} color={AMBER + "80"} />
                  </View>
                  <Text style={{ fontFamily: "Eczar_500Medium", fontSize: 13, color: colors.mutedForeground }}>No folders yet</Text>
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 1, color: colors.mutedForeground + "55" }}>Create your first folder above</Text>
                </View>
              }
              renderItem={({ item: folder, index }) => (
                <View style={[styles.tagRow, { borderBottomColor: colors.border }]}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: (folder.color || AMBER) + "18", borderWidth: 1, borderColor: (folder.color || AMBER) + "35", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="folder" size={15} color={folder.color || AMBER} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Eczar_500Medium", fontSize: 14, color: colors.foreground }}>{folder.name}</Text>
                    <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 1, color: colors.mutedForeground, marginTop: 1 }}>
                      {folder.videoCount ?? 0} video{(folder.videoCount ?? 0) !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: (folder.color || AMBER) + "14", borderRadius: 20, borderWidth: 1, borderColor: (folder.color || AMBER) + "30", paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 7, letterSpacing: 1, color: folder.color || AMBER }}>
                      {(folder.color || AMBER).toUpperCase().slice(1, 4)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteFolder(folder)} style={{ padding: 8, marginLeft: 2 }} activeOpacity={0.7}>
                    <Feather name="trash-2" size={14} color={RED} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </MotiView>
        </View>
      )}

      {/* ── Tag Manager modal ── */}
      {showTagManager && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 200, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.72)" }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowTagManager(false)} />
          <MotiView
            from={{ scale: 0.93, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            style={[styles.centeredModal, { backgroundColor: colors.background, borderColor: PURPLE + "40" }]}
          >
            <LinearGradient colors={[PURPLE + "12", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            {/* Top accent bar */}
            <View style={{ height: 3, backgroundColor: PURPLE, width: "30%", borderRadius: 2, marginBottom: 18 }} />

            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border, paddingHorizontal: 0, paddingTop: 0 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[styles.sheetIconWrap, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "35", borderWidth: 1 }]}>
                  <Feather name="tag" size={17} color={PURPLE} />
                </View>
                <View>
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2, color: colors.mutedForeground, marginBottom: 2 }}>// CONTENT</Text>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Manage Tags</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowTagManager(false)} activeOpacity={0.75}>
                <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Create tag */}
            <View style={{ paddingVertical: 14, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
              <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 1.8, color: colors.mutedForeground }}>CREATE NEW TAG</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  value={newTagName} onChangeText={setNewTagName} placeholder="Tag name..."
                  placeholderTextColor={colors.mutedForeground + "70"}
                  style={[styles.tagInput, { color: colors.foreground, borderColor: PURPLE + "45", backgroundColor: colors.card }]}
                  returnKeyType="done" onSubmitEditing={handleCreateTag}
                />
                <TouchableOpacity onPress={handleCreateTag} disabled={!newTagName.trim() || createTagMutation.isPending}
                  style={[styles.createTagBtn, { backgroundColor: newTagName.trim() ? PURPLE : colors.border }]} activeOpacity={0.8}>
                  <Feather name="plus" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {TAG_COLORS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setSelectedColor(c)}
                    style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 1.5, borderColor: selectedColor === c ? colors.foreground : c + "40" }]}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Tag list */}
            <FlatList
              data={tags} keyExtractor={item => item.id} style={{ maxHeight: 240 }}
              contentContainerStyle={{ paddingBottom: 8, paddingTop: 4 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ paddingVertical: 28, alignItems: "center", gap: 8 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: PURPLE + "14", borderWidth: 1, borderColor: PURPLE + "25", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="tag" size={20} color={PURPLE + "80"} />
                  </View>
                  <Text style={{ fontFamily: "Eczar_500Medium", fontSize: 13, color: colors.mutedForeground }}>No tags yet</Text>
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 1, color: colors.mutedForeground + "55" }}>Create your first tag above</Text>
                </View>
              }
              renderItem={({ item: tag }) => (
                <View style={[styles.tagRow, { borderBottomColor: colors.border }]}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: (tag.color || PURPLE) + "18", borderWidth: 1, borderColor: (tag.color || PURPLE) + "35", alignItems: "center", justifyContent: "center" }}>
                    <View style={[styles.tagDot, { backgroundColor: tag.color || PURPLE }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Eczar_500Medium", fontSize: 14, color: colors.foreground }}>{tag.name}</Text>
                    <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 1, color: colors.mutedForeground, marginTop: 1 }}>
                      {tag.videoCount ?? 0} video{(tag.videoCount ?? 0) !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: (tag.color || PURPLE) + "14", borderRadius: 20, borderWidth: 1, borderColor: (tag.color || PURPLE) + "30", paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 8, letterSpacing: 0.8, color: tag.color || PURPLE }}>
                      TAG
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteTag(tag)} style={{ padding: 8, marginLeft: 2 }} activeOpacity={0.7}>
                    <Feather name="trash-2" size={14} color={RED} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </MotiView>
        </View>
      )}
    </View>
    </TabFadeWrapper>
  );
}

const styles = StyleSheet.create({
  pageCode:  { fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 2.5, marginBottom: 6 },
  pageTitle: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 40, letterSpacing: -1, lineHeight: 48 },

  identityCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },

  avatarRing:  { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center", padding: 3, overflow: "hidden" },
  avatarInner: { flex: 1, width: "100%", borderRadius: 40, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  cameraBadge: { position: "absolute", bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2 },

  pill:     { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: "Eczar_600SemiBold", fontSize: 8, letterSpacing: 1.1 },

  idBtn:     { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  idBtnText: { fontFamily: "Eczar_600SemiBold", fontSize: 9, letterSpacing: 1 },

  levelCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  levelOrb:  { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },

  statCard:    { padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 5, overflow: "hidden" },
  statIconWrap:{ width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue:   { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 22, letterSpacing: -1 },
  statLabel:   { fontFamily: "Eczar_400Regular", fontSize: 6.5, letterSpacing: 1.5 },

  achieveCard: { width: 80, padding: 10, borderRadius: 14, borderWidth: 1, alignItems: "center", overflow: "hidden" },
  achieveOrb:  { width: 46, height: 46, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 8, position: "relative" },
  achieveCheck:{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  achieveLabel:{ fontFamily: "Eczar_400Regular", fontSize: 7.5, letterSpacing: 0.5, textAlign: "center", lineHeight: 11 },

  groupLabel: { fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2.5, marginBottom: 8 },
  groupCard:  { borderRadius: 14, borderWidth: 1, overflow: "hidden" },

  row:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel:  { flex: 1, fontSize: 14, fontFamily: "Eczar_500Medium" },
  rowRight:  { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 140 },
  rowValue:  { fontSize: 11, fontFamily: "Eczar_400Regular" },

  editModal: { borderRadius: 18, borderWidth: 1, overflow: "hidden", padding: 20 },
  nameInput: { height: 48, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, fontSize: 16, fontFamily: "Eczar_400Regular" },
  modalBtn:  { height: 40, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },

  centeredModal: { width: "100%", borderRadius: 20, borderWidth: 1, overflow: "hidden", padding: 20 },
  sheetHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetIconWrap:{ width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  sheetTitle:   { fontSize: 17, fontFamily: "AlegreyaSansSC_700Bold", letterSpacing: -0.3 },

  tagInput:     { flex: 1, height: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, fontSize: 14, fontFamily: "Eczar_400Regular" },
  createTagBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  colorDot:     { width: 26, height: 26, borderRadius: 13 },

  tagRow:  { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  tagDot:  { width: 10, height: 10, borderRadius: 5 },
});
