import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { EXPORT_TEMPLATES, ExportTemplate, TemplateOpts } from "../lib/html-export-templates";
import { useColors } from "../hooks/useColors";

interface Props {
  visible: boolean;
  opts: TemplateOpts;
  onClose: () => void;
  onExport: (html: string, templateName: string) => void;
}

const { width: SW, height: SH } = Dimensions.get("window");

export default function HtmlTemplatePicker({ visible, opts, onClose, onExport }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<ExportTemplate>(EXPORT_TEMPLATES[0]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [webLoading, setWebLoading] = useState(false);

  const openPreview = (t: ExportTemplate) => {
    setSelected(t);
    setWebLoading(true);
    setPreviewHtml(t.generate(opts));
  };

  const closePreview = () => {
    setPreviewHtml(null);
    setWebLoading(false);
  };

  const handleExport = () => {
    const html = selected.generate(opts);
    onExport(html, selected.name);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: "#09090c" }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="x" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Template</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.sub}>Select a style, preview it, then export your HTML file.</Text>

        {/* Template list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {EXPORT_TEMPLATES.map((t) => {
            const isSelected = selected.id === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelected(t)}
                activeOpacity={0.75}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  isSelected && { borderColor: opts.toolColor },
                ]}
              >
                {/* Palette dots */}
                <View style={styles.palette}>
                  {t.palette.map((col, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: col, borderColor: "#333" }]} />
                  ))}
                  <View style={[styles.badge, { backgroundColor: t.dark ? "#1a1a2e" : "#f5f0e8" }]}>
                    <Text style={[styles.badgeText, { color: t.dark ? "#8b9cf6" : "#6b6456" }]}>
                      {t.dark ? "DARK" : "LIGHT"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{t.name}</Text>
                  <Text style={styles.cardDesc}>{t.desc}</Text>
                </View>

                <View style={styles.cardRight}>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: opts.toolColor }]}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => openPreview(t)}
                    style={[styles.previewBtn, { borderColor: isSelected ? opts.toolColor : "#333" }]}
                  >
                    <Feather name="eye" size={12} color={isSelected ? opts.toolColor : "#888"} />
                    <Text style={[styles.previewBtnText, { color: isSelected ? opts.toolColor : "#888" }]}>
                      Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Export button */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Feather name="code" size={14} color={opts.toolColor} />
            <Text style={[styles.footerInfoText, { color: opts.toolColor }]}>{selected.name}</Text>
          </View>
          <TouchableOpacity
            onPress={handleExport}
            style={[styles.exportBtn, { backgroundColor: opts.toolColor }]}
            activeOpacity={0.8}
          >
            <Feather name="download" size={16} color="#fff" />
            <Text style={styles.exportBtnText}>Export as HTML</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview modal */}
      {previewHtml !== null && (
        <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={closePreview}>
          <View style={[styles.previewRoot, { backgroundColor: "#000" }]}>
            <View style={styles.previewHeader}>
              <TouchableOpacity onPress={closePreview} style={styles.previewClose}>
                <Feather name="arrow-left" size={20} color="#fff" />
                <Text style={styles.previewCloseText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.previewTitle}>{selected.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  closePreview();
                  onExport(previewHtml, selected.name);
                }}
                style={[styles.previewExport, { backgroundColor: opts.toolColor }]}
              >
                <Text style={styles.previewExportText}>Export</Text>
              </TouchableOpacity>
            </View>

            {webLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={opts.toolColor} size="large" />
                <Text style={styles.loadingText}>Rendering preview…</Text>
              </View>
            )}

            <WebView
              source={{ html: previewHtml, baseUrl: "" }}
              style={styles.webview}
              onLoadEnd={() => setWebLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              scalesPageToFit
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontFamily: "JetBrainsMono_700Bold", fontSize: 16, color: "#fff", letterSpacing: 0.5 },
  sub: { fontFamily: "JetBrainsMono_400Regular", fontSize: 11, color: "#666", paddingHorizontal: 20, marginBottom: 16 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  card: {
    backgroundColor: "#111",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#222",
    padding: 14,
    gap: 10,
  },
  cardSelected: { borderWidth: 2 },
  palette: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1 },
  badge: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontFamily: "JetBrainsMono_700Bold", fontSize: 9, letterSpacing: 1.5 },
  cardBody: { gap: 3 },
  cardName: { fontFamily: "Raleway_700Bold", fontSize: 15, color: "#fff" },
  cardDesc: { fontFamily: "JetBrainsMono_400Regular", fontSize: 11, color: "#666" },
  cardRight: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewBtnText: { fontFamily: "JetBrainsMono_700Bold", fontSize: 11 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  footerInfoText: { fontFamily: "JetBrainsMono_700Bold", fontSize: 12 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  exportBtnText: { fontFamily: "Raleway_700Bold", fontSize: 14, color: "#fff" },
  previewRoot: { flex: 1 },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "#09090c",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  previewClose: { flexDirection: "row", alignItems: "center", gap: 6 },
  previewCloseText: { fontFamily: "JetBrainsMono_400Regular", fontSize: 13, color: "#fff" },
  previewTitle: { fontFamily: "Raleway_700Bold", fontSize: 14, color: "#fff" },
  previewExport: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  previewExportText: { fontFamily: "Raleway_700Bold", fontSize: 13, color: "#fff" },
  loadingOverlay: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  loadingText: { fontFamily: "JetBrainsMono_400Regular", fontSize: 12, color: "#666" },
  webview: { flex: 1 },
});
