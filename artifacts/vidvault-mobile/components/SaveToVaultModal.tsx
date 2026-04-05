import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { AppButton } from "@/components/ui/AppButton";
import { api } from "@/services/api";

const SCREEN_W = Dimensions.get("window").width;

type Phase = "idle" | "loading" | "preview";
type VideoType = "video" | "playlist" | "web";

interface Preview {
  title: string;
  thumbnail: string | null;
  type: VideoType;
  ytId?: string | null;
}

function extractYtId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isPlaylistUrl(url: string) {
  return /youtube\.com\/playlist\?list=/.test(url) && !/[?&]v=/.test(url);
}

function TypeBadge({ type }: { type: VideoType }) {
  const configs: Record<VideoType, { label: string; color: string; bg: string }> = {
    video:    { label: "VIDEO",    color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    playlist: { label: "PLAYLIST", color: "#818cf8", bg: "rgba(129,140,248,0.15)" },
    web:      { label: "WEB URL",  color: "#06b6d4", bg: "rgba(6,182,212,0.15)" },
  };
  const c = configs[type];
  return (
    <View style={[styles.typeBadge, { backgroundColor: c.bg, borderColor: c.color + "50" }]}>
      <Text style={[styles.typeBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

interface SaveToVaultModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SaveToVaultModal({ visible, onClose }: SaveToVaultModalProps) {
  const colors = useColors();
  const qc = useQueryClient();
  const isDark = colors.background === "#0a0a0f" || colors.background.startsWith("#0");

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: foldersData } = useQuery({
    queryKey: ["folders"],
    queryFn: () => api.listFolders(),
    enabled: visible,
  });

  const folders = foldersData?.folders ?? [];

  const addMutation = useMutation({
    mutationFn: ({ url, folderId }: { url: string; folderId?: string }) =>
      api.addVideo(url, folderId || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    },
    onError: (e: Error) => {
      setErrorMsg(e.message || "Failed to save");
      setSaving(false);
    },
  });

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || !trimmed.startsWith("http")) {
      setPhase("idle");
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPhase("loading");
      setErrorMsg("");
      try {
        const ytId = extractYtId(trimmed);
        const isPlaylist = isPlaylistUrl(trimmed);

        if (ytId) {
          let title = "YouTube Video";
          try {
            const oe = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
            );
            if (oe.ok) {
              const od = await oe.json();
              title = od.title || title;
            }
          } catch {}

          setPreview({
            title,
            thumbnail: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
            type: isPlaylist ? "playlist" : "video",
            ytId,
          });
          setEditTitle(title);
          setPhase("preview");
        } else if (isPlaylist) {
          setPreview({ title: "YouTube Playlist", thumbnail: null, type: "playlist" });
          setEditTitle("YouTube Playlist");
          setPhase("preview");
        } else if (trimmed.startsWith("http")) {
          setPreview({ title: trimmed, thumbnail: null, type: "web" });
          setEditTitle(trimmed);
          setPhase("preview");
        }
      } catch {
        setPhase("idle");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [url]);

  const handleClose = () => {
    setUrl("");
    setPhase("idle");
    setPreview(null);
    setEditTitle("");
    setEditingTitle(false);
    setSelectedFolderId(null);
    setSaving(false);
    setErrorMsg("");
    onClose();
  };

  const handleSave = async () => {
    if (!url.trim()) return;
    setSaving(true);
    setErrorMsg("");
    addMutation.mutate({ url: url.trim(), folderId: selectedFolderId || undefined });
  };

  const bg = isDark ? "#0e0e12" : "#ffffff";
  const borderCol = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "#12121a" : "#f4f3ff";
  const surfaceBg = isDark ? "#18181f" : "#f8f7ff";

  const subtitleLabel = phase === "preview" && preview
    ? (preview.type === "playlist" ? "PLAYLIST_DETECTED" : `${preview.type.toUpperCase()}_DETECTED`)
    : "PASTE_URL_BELOW";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredContent}
        >
          <View style={[styles.modalBox, { backgroundColor: bg, borderColor: borderCol }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: borderCol }]}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Feather name="link-2" size={16} color="#818cf8" />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.foreground }]}>SAVE TO VAULT</Text>
                  <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{subtitleLabel}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalBody}
            >
              {/* URL Input */}
              <View style={[styles.urlInputRow, { backgroundColor: inputBg, borderColor: url ? "rgba(129,140,248,0.5)" : borderCol }]}>
                <Feather name="youtube" size={14} color={phase === "preview" ? "#10b981" : colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://youtube.com/watch?v=..."
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.urlInput, { color: colors.foreground }]}
                  autoFocus
                />
                {phase === "loading" && <ActivityIndicator size="small" color="#818cf8" />}
                {phase === "preview" && <Feather name="check-circle" size={16} color="#10b981" />}
              </View>

              {/* Preview Card */}
              {phase === "preview" && preview && (
                <View style={[styles.previewCard, { borderColor: borderCol }]}>
                  {preview.thumbnail ? (
                    <View style={styles.previewThumbContainer}>
                      <Image
                        source={{ uri: preview.thumbnail }}
                        style={styles.previewThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.previewThumbOverlay} />
                      <View style={styles.previewBadgeRow}>
                        <TypeBadge type={preview.type} />
                      </View>
                      <View style={styles.previewTitleOverlay}>
                        <Text style={styles.previewThumbTitle} numberOfLines={2}>{preview.title}</Text>
                        <Text style={styles.previewDomain}>WWW.YOUTUBE.COM</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.previewNoThumb, { backgroundColor: surfaceBg }]}>
                      <TypeBadge type={preview.type} />
                      <Feather name="link" size={24} color={colors.mutedForeground} />
                    </View>
                  )}

                  {/* Editable Title */}
                  <View style={[styles.titleSection, { borderTopColor: borderCol }]}>
                    <View style={styles.titleLabelRow}>
                      <Text style={[styles.titleLabel, { color: colors.mutedForeground }]}>TITLE (EDITABLE)</Text>
                      <TouchableOpacity onPress={() => setEditingTitle(!editingTitle)}>
                        <Text style={styles.editLink}>{editingTitle ? "DONE" : "EDIT"}</Text>
                      </TouchableOpacity>
                    </View>
                    {editingTitle ? (
                      <TextInput
                        value={editTitle}
                        onChangeText={setEditTitle}
                        style={[styles.titleInput, { color: colors.foreground, borderColor: "rgba(129,140,248,0.45)" }]}
                        multiline
                        autoFocus
                      />
                    ) : (
                      <Text style={[styles.titleDisplay, { color: colors.foreground }]} numberOfLines={3}>
                        {editTitle}
                      </Text>
                    )}
                  </View>

                  {/* Folder Picker */}
                  {folders.length > 0 && (
                    <View style={[styles.folderSection, { borderTopColor: borderCol }]}>
                      <View style={styles.folderLabelRow}>
                        <Feather name="folder" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.folderLabel, { color: colors.mutedForeground }]}>ADD TO FOLDER (OPTIONAL)</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderScroll}>
                        <TouchableOpacity
                          onPress={() => setSelectedFolderId(null)}
                          style={[
                            styles.folderChip,
                            {
                              backgroundColor: selectedFolderId === null ? "rgba(129,140,248,0.15)" : isDark ? "#1a1a1f" : "#f0f0f8",
                              borderColor: selectedFolderId === null ? "rgba(129,140,248,0.5)" : borderCol,
                            },
                          ]}
                        >
                          <Text style={[styles.folderChipText, { color: selectedFolderId === null ? "#818cf8" : colors.mutedForeground }]}>
                            No folder
                          </Text>
                        </TouchableOpacity>
                        {folders.map((f: { id: string; name: string; color?: string | null }) => (
                          <TouchableOpacity
                            key={f.id}
                            onPress={() => setSelectedFolderId(f.id)}
                            style={[
                              styles.folderChip,
                              {
                                backgroundColor: selectedFolderId === f.id ? (f.color || "#818cf8") + "20" : isDark ? "#1a1a1f" : "#f0f0f8",
                                borderColor: selectedFolderId === f.id ? (f.color || "#818cf8") + "80" : borderCol,
                              },
                            ]}
                          >
                            <View style={[styles.folderDot, { backgroundColor: f.color || "#818cf8" }]} />
                            <Text style={[styles.folderChipText, { color: selectedFolderId === f.id ? (f.color || "#818cf8") : colors.mutedForeground }]}>
                              {f.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* AI hint */}
                  <View style={[styles.aiHint, { borderTopColor: borderCol, backgroundColor: "rgba(129,140,248,0.06)" }]}>
                    <Feather name="cpu" size={11} color="#818cf8" />
                    <Text style={styles.aiHintText}>AI WILL AUTO-TAG THIS VIDEO AFTER SAVING</Text>
                  </View>
                </View>
              )}

              {errorMsg ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
              ) : null}
            </ScrollView>

            {/* Footer Actions */}
            <View style={[styles.modalFooter, { borderTopColor: borderCol }]}>
              <AppButton
                label="CANCEL"
                size="sm"
                variant="ghost"
                onPress={handleClose}
              />
              <AppButton
                label="SAVE TO VAULT"
                icon="arrow-up-right"
                size="sm"
                variant="primary"
                loading={saving}
                disabled={saving || !url.trim()}
                onPress={handleSave}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  centeredContent: {
    width: "100%",
    maxWidth: 480,
  },
  modalBox: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(129,140,248,0.12)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Raleway_900Black",
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    marginTop: 2,
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  urlInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 46,
  },
  urlInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "JetBrainsMono_400Regular",
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewThumbContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  previewThumb: {
    width: "100%",
    height: "100%",
  },
  previewThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  previewBadgeRow: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  previewTitleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  previewThumbTitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    lineHeight: 19,
  },
  previewDomain: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1,
    marginTop: 2,
  },
  previewNoThumb: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    flexDirection: "row",
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
  },
  titleSection: {
    padding: 14,
    borderTopWidth: 1,
    gap: 6,
  },
  titleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleLabel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },
  editLink: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    color: "#818cf8",
  },
  titleInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    lineHeight: 20,
  },
  titleDisplay: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  folderSection: {
    padding: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  folderLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  folderLabel: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },
  folderScroll: {
    flexGrow: 0,
  },
  folderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
  },
  folderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  folderChipText: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
  },
  aiHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderTopWidth: 1,
  },
  aiHintText: {
    fontSize: 9,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.5,
    color: "#818cf8",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelBtnText: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 2,
    fontWeight: "700",
  },
});
