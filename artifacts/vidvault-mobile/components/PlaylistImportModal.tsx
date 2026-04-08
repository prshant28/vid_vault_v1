import React, { useState, useRef } from "react";
import {
  View, Text, Modal, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, useWindowDimensions, Keyboard,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";

const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const RED    = "#ef4444";

type Phase = "idle" | "loading" | "success" | "error";

interface PlaylistImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PlaylistImportModal({ visible, onClose }: PlaylistImportModalProps) {
  const colors = useColors();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();

  const [url, setUrl]             = useState("");
  const [folderName, setFolderName] = useState("");
  const [phase, setPhase]         = useState<Phase>("idle");
  const [errorMsg, setErrorMsg]   = useState("");
  const [result, setResult]       = useState<{ folderId: string; folderName: string; imported: number; total: number } | null>(null);
  const urlRef = useRef<TextInput>(null);

  function reset() {
    setUrl(""); setFolderName(""); setPhase("idle");
    setErrorMsg(""); setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) { setErrorMsg("Paste a YouTube playlist URL to continue."); return; }
    const isPlaylist = /list=[a-zA-Z0-9_-]+/.test(trimmed);
    if (!isPlaylist) { setErrorMsg("That doesn't look like a YouTube playlist URL. Make sure it contains 'list='."); return; }

    Keyboard.dismiss();
    setPhase("loading");
    setErrorMsg("");

    try {
      const res = await api.importPlaylist(trimmed, folderName.trim() || undefined);
      setResult({
        folderId: res.folder.id,
        folderName: res.folder.name,
        imported: res.imported,
        total: res.total,
      });
      setPhase("success");
      qc.invalidateQueries({ queryKey: ["folders"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setErrorMsg(e?.message || "Import failed. Check the URL and try again.");
      setPhase("error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleViewFolder() {
    if (!result) return;
    handleClose();
    router.push(`/folder/${result.folderId}?name=${encodeURIComponent(result.folderName)}`);
  }

  const btnW = Math.min(width - 88, 432);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={handleClose} />

        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: 16 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 240 }}
          style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
            pointerEvents="none"
          />

          {/* Accent bar */}
          <View style={[styles.accentBar, { backgroundColor: CYAN }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: CYAN + "20", borderColor: CYAN + "40" }]}>
              <Feather name="list" size={17} color={CYAN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>Bulk Playlist Import</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Save an entire YouTube playlist at once</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {phase === "success" && result ? (
            /* ── Success state ── */
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 320 }}
            >
              <View style={[styles.successBox, { backgroundColor: GREEN + "12", borderColor: GREEN + "30" }]}>
                <View style={[styles.successIconWrap, { backgroundColor: GREEN + "20" }]}>
                  <Feather name="check-circle" size={28} color={GREEN} />
                </View>
                <Text style={[styles.successTitle, { color: GREEN }]}>Import Complete!</Text>
                <Text style={[styles.successBody, { color: colors.foreground }]}>
                  Saved <Text style={{ fontFamily: "Eczar_600SemiBold" }}>{result.imported}</Text> of {result.total} videos
                </Text>
                <Text style={[styles.successFolder, { color: colors.mutedForeground }]} numberOfLines={1}>
                  → Folder: "{result.folderName}"
                </Text>
              </View>
              <View style={{ gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={handleViewFolder}
                  style={[styles.primaryBtn, { backgroundColor: GREEN, width: btnW }]}
                  activeOpacity={0.82}
                >
                  <Feather name="folder" size={15} color="#fff" />
                  <Text style={styles.primaryBtnText}>VIEW FOLDER</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { reset(); }} style={[styles.ghostBtn, { borderColor: colors.border, width: btnW }]} activeOpacity={0.75}>
                  <Text style={[styles.ghostBtnText, { color: colors.mutedForeground }]}>Import Another</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          ) : (
            /* ── Input state ── */
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* URL input */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>PLAYLIST URL</Text>
              <View style={[styles.inputWrap, { borderColor: errorMsg ? RED + "55" : colors.border, backgroundColor: colors.background }]}>
                <Feather name="link" size={15} color={errorMsg ? RED : colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  ref={urlRef}
                  value={url}
                  onChangeText={(t) => { setUrl(t); setErrorMsg(""); }}
                  placeholder="https://youtube.com/playlist?list=..."
                  placeholderTextColor={colors.mutedForeground + "88"}
                  style={[styles.input, { color: colors.foreground }]}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="url"
                  returnKeyType="next"
                  editable={phase !== "loading"}
                />
                {url.length > 0 && (
                  <TouchableOpacity onPress={() => { setUrl(""); setErrorMsg(""); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x-circle" size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
              {errorMsg ? (
                <Text style={[styles.errorText, { color: RED }]}>{errorMsg}</Text>
              ) : null}

              {/* Optional folder name */}
              <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 14 }]}>FOLDER NAME <Text style={{ opacity: 0.5 }}>(optional)</Text></Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="folder" size={15} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  value={folderName}
                  onChangeText={setFolderName}
                  placeholder="Auto-detected from playlist title"
                  placeholderTextColor={colors.mutedForeground + "70"}
                  style={[styles.input, { color: colors.foreground }]}
                  editable={phase !== "loading"}
                  returnKeyType="done"
                  onSubmitEditing={handleImport}
                />
              </View>

              {/* Info hint */}
              <View style={[styles.hintRow, { backgroundColor: CYAN + "0e", borderColor: CYAN + "25" }]}>
                <Feather name="info" size={12} color={CYAN} />
                <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                  All videos are saved instantly. Duration and channel info are enriched in the background.
                </Text>
              </View>

              {/* Import button */}
              <TouchableOpacity
                onPress={handleImport}
                disabled={phase === "loading"}
                style={[styles.primaryBtn, { backgroundColor: CYAN, width: btnW, marginTop: 16, opacity: phase === "loading" ? 0.8 : 1 }]}
                activeOpacity={0.82}
              >
                {phase === "loading" ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.primaryBtnText}>Fetching Playlist...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="download-cloud" size={15} color="#fff" />
                    <Text style={styles.primaryBtnText}>IMPORT PLAYLIST</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dialog: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 24,
  },
  accentBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 6,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "AlegreyaSansSC_700Bold",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Eczar_400Regular",
    marginTop: 1,
  },
  closeBtn: {
    width: 32, height: 32,
    alignItems: "center", justifyContent: "center",
  },
  divider: { height: StyleSheet.hairlineWidth },
  label: {
    fontSize: 9,
    fontFamily: "Eczar_400Regular",
    letterSpacing: 2,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Eczar_400Regular",
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Eczar_400Regular",
    marginTop: 6,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Eczar_400Regular",
    lineHeight: 16,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    alignSelf: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Eczar_600SemiBold",
    letterSpacing: 1.2,
  },
  ghostBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "center",
  },
  ghostBtnText: {
    fontSize: 12,
    fontFamily: "Eczar_400Regular",
  },
  successBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  successIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: "AlegreyaSansSC_800ExtraBold",
    letterSpacing: -0.3,
  },
  successBody: {
    fontSize: 14,
    fontFamily: "Eczar_400Regular",
  },
  successFolder: {
    fontSize: 11,
    fontFamily: "Eczar_400Regular",
    maxWidth: "90%",
  },
});
