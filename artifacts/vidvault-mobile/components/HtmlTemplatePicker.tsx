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
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { EXPORT_TEMPLATES, ExportTemplate, TemplateOpts } from "../lib/html-export-templates";
import { useColors, useTheme } from "../hooks/useColors";

interface Props {
  visible: boolean;
  opts: TemplateOpts;
  onClose: () => void;
  onExport: (html: string, templateName: string) => void;
}

const { width: SW, height: SH } = Dimensions.get("window");
const PURPLE = "#6366f1";

export default function HtmlTemplatePicker({ visible, opts, onClose, onExport }: Props) {
  const colors = useColors();
  const { isDark } = useTheme();
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
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* Gradient header band */}
        <LinearGradient
          colors={[opts.toolColor + "22", "transparent"]}
          style={styles.headerGradient}
          pointerEvents="none"
        />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.headerCloseBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="x" size={16} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={[styles.headerMicro, { color: colors.mutedForeground }]}>EXPORT</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Choose Template</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Select a style, preview it, then export your HTML file.
        </Text>

        {/* Template list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {EXPORT_TEMPLATES.map((t) => {
            const isSelected = selected.id === t.id;
            const accentColor = isSelected ? opts.toolColor : (isDark ? "#333" : colors.border);
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelected(t)}
                activeOpacity={0.75}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? opts.toolColor : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                {isSelected && (
                  <LinearGradient
                    colors={[opts.toolColor + "14", "transparent"]}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                )}

                {/* Top color accent bar */}
                {isSelected && (
                  <View style={[styles.cardAccentBar, { backgroundColor: opts.toolColor }]} />
                )}

                {/* Palette dots */}
                <View style={styles.palette}>
                  {t.palette.map((col, i) => (
                    <View
                      key={i}
                      style={[styles.dot, { backgroundColor: col, borderColor: isDark ? "#333" : colors.border }]}
                    />
                  ))}
                  <View style={[
                    styles.badge,
                    { backgroundColor: t.dark
                        ? (isDark ? "#1a1a2e" : "#0f0f1a")
                        : (isDark ? "#2a2415" : "#fef9ee")
                    }
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: t.dark
                          ? (isDark ? "#8b9cf6" : "#6366f1")
                          : (isDark ? "#f59e0b" : "#92763e")
                      }
                    ]}>
                      {t.dark ? "DARK" : "LIGHT"}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{t.name}</Text>
                  <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
                </View>

                <View style={styles.cardRight}>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: opts.toolColor }]}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => openPreview(t)}
                    style={[styles.previewBtn, { borderColor: isSelected ? opts.toolColor : colors.border }]}
                  >
                    <Feather name="eye" size={12} color={isSelected ? opts.toolColor : colors.mutedForeground} />
                    <Text style={[styles.previewBtnText, { color: isSelected ? opts.toolColor : colors.mutedForeground }]}>
                      Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Export button */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.footerInfo}>
            <View style={[styles.footerIconWrap, { backgroundColor: opts.toolColor + "18", borderColor: opts.toolColor + "35", borderWidth: 1 }]}>
              <Feather name="code" size={14} color={opts.toolColor} />
            </View>
            <View>
              <Text style={[styles.footerMicro, { color: colors.mutedForeground }]}>SELECTED</Text>
              <Text style={[styles.footerInfoText, { color: opts.toolColor }]}>{selected.name}</Text>
            </View>
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
          <View style={[styles.previewRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.previewHeader, {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            }]}>
              <TouchableOpacity
                onPress={closePreview}
                style={[styles.previewClose, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              >
                <Feather name="arrow-left" size={16} color={colors.foreground} />
                <Text style={[styles.previewCloseText, { color: colors.foreground }]}>Back</Text>
              </TouchableOpacity>
              <Text style={[styles.previewTitle, { color: colors.foreground }]}>{selected.name}</Text>
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
              <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={opts.toolColor} size="large" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Rendering preview…</Text>
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
  root:          { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCloseBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerMicro: { fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2, marginBottom: 1 },
  headerTitle: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 18, letterSpacing: -0.3 },
  sub: { fontFamily: "Eczar_400Regular", fontSize: 11, paddingHorizontal: 20, marginTop: 12, marginBottom: 16 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    overflow: "hidden",
  },
  cardAccentBar: { height: 2, borderRadius: 2, marginBottom: 2 },
  palette: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1 },
  badge: {
    marginLeft: "auto" as any,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontFamily: "Eczar_600SemiBold", fontSize: 9, letterSpacing: 1.5 },
  cardBody: { gap: 3 },
  cardName: { fontFamily: "Eczar_700Bold", fontSize: 15 },
  cardDesc: { fontFamily: "Eczar_400Regular", fontSize: 11 },
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
  previewBtnText: { fontFamily: "Eczar_600SemiBold", fontSize: 11 },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  footerIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  footerMicro: { fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 1.5, marginBottom: 1 },
  footerInfoText: { fontFamily: "Eczar_600SemiBold", fontSize: 12 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  exportBtnText: { fontFamily: "Eczar_700Bold", fontSize: 14, color: "#fff" },

  previewRoot: { flex: 1 },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewClose: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  previewCloseText: { fontFamily: "Eczar_400Regular", fontSize: 13 },
  previewTitle: { fontFamily: "Eczar_700Bold", fontSize: 14 },
  previewExport: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  previewExportText: { fontFamily: "Eczar_700Bold", fontSize: 13, color: "#fff" },
  loadingOverlay: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 10,
  },
  loadingText: { fontFamily: "Eczar_400Regular", fontSize: 12 },
  webview: { flex: 1 },
});
