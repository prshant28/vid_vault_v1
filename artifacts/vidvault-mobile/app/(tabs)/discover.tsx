import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useColors } from "@/hooks/useColors";
import { useGetStats } from "@workspace/api-client-react";
import { router } from "expo-router";

const { width: SCREEN_W } = Dimensions.get("window");
const INDIGO = "#6366f1";

const TOOLS = [
  {
    id: "knowledge-graph",
    icon: "share-2" as const,
    label: "Knowledge Graph",
    desc: "See how your videos connect through shared topics.",
    color: "#10b981",
    badge: null,
  },
  {
    id: "templates",
    icon: "layout" as const,
    label: "Template Library",
    desc: "Export AI outputs in 8+ professional formats.",
    color: "#f59e0b",
    badge: "8+ FREE",
  },
  {
    id: "ai-studio",
    icon: "cpu" as const,
    label: "AI Studio",
    desc: "Generate summaries, flashcards, MCQs, and more.",
    color: "#ec4899",
    badge: null,
  },
  {
    id: "study-plan",
    icon: "target" as const,
    label: "AI Study Plan",
    desc: "Personalized study sessions based on your vault.",
    color: "#6366f1",
    badge: "COMING SOON",
  },
  {
    id: "flashcards",
    icon: "book-open" as const,
    label: "Flashcard Deck",
    desc: "Review key concepts with spaced repetition cards.",
    color: "#06b6d4",
    badge: null,
  },
  {
    id: "notes",
    icon: "edit-3" as const,
    label: "Timestamped Notes",
    desc: "Capture insights at specific moments in any video.",
    color: "#8b5cf6",
    badge: null,
  },
];

const TEMPLATES = [
  { id: "cornell",    name: "Cornell Notes",    icon: "book-open" as const, color: "#8b5cf6", category: "Study" },
  { id: "academic",   name: "Academic Paper",   icon: "file-text" as const, color: "#06b6d4", category: "Research" },
  { id: "mindmap",    name: "Mind Map",         icon: "share-2" as const,   color: "#f59e0b", category: "Visual" },
  { id: "executive",  name: "Executive Brief",  icon: "align-left" as const, color: "#6366f1", category: "Business" },
  { id: "podcast",    name: "Podcast Notes",    icon: "mic" as const,       color: "#ec4899", category: "Media" },
  { id: "studyguide", name: "Study Guide",      icon: "list" as const,      color: "#10b981", category: "Study" },
];

function SectionHeader({ label, code }: { label: string; code: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, color: colors.mutedForeground, letterSpacing: 2, textTransform: "uppercase" }}>
        //{code}
      </Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, color: colors.mutedForeground, letterSpacing: 2, textTransform: "uppercase" }}>
        {label}
      </Text>
    </View>
  );
}

function ToolCard({ tool, index, isDark }: { tool: typeof TOOLS[0]; index: number; isDark: boolean }) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 320, delay: index * 60 } as any}
      style={{ width: (SCREEN_W - 48) / 2 }}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.toolCard, { backgroundColor: isDark ? "#111118" : "#f5f5fa", borderColor: isDark ? "#1e1e2e" : "#e0e0f0" }]}
        onPress={() => {
          if (tool.id === "ai-studio") router.push("/(tabs)/ai-studio");
        }}
      >
        <View style={[styles.toolIconCircle, { backgroundColor: tool.color + "20" }]}>
          <Feather name={tool.icon} size={18} color={tool.color} />
        </View>
        <Text style={[styles.toolLabel, { color: colors.foreground }]}>{tool.label}</Text>
        <Text style={[styles.toolDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{tool.desc}</Text>
        {tool.badge && (
          <View style={[styles.toolBadge, { backgroundColor: tool.color + "22", borderColor: tool.color + "44" }]}>
            <Text style={[styles.toolBadgeText, { color: tool.color }]}>{tool.badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

function TemplateCard({ template, index, isDark }: { template: typeof TEMPLATES[0]; index: number; isDark: boolean }) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 280, delay: index * 50 } as any}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.templateCard, { backgroundColor: isDark ? "#111118" : "#f5f5fa", borderColor: isDark ? "#1e1e2e" : "#e0e0f0" }]}
      >
        <View style={[styles.templateIcon, { backgroundColor: template.color + "20" }]}>
          <Feather name={template.icon} size={14} color={template.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.templateName, { color: colors.foreground }]} numberOfLines={1}>{template.name}</Text>
          <Text style={[styles.templateCategory, { color: template.color }]}>{template.category}</Text>
        </View>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </MotiView>
  );
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: stats } = useGetStats();
  const isDark = colors.background === "#0a0a0f" || colors.background.includes("0a");
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const totalVideos = stats?.totalVideos ?? 0;
  const totalAiOutputs = stats?.totalAiOutputs ?? 0;
  const totalTags = stats?.totalTags ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: botInset + 100 }]}
      >
        {/* Header */}
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 300 } as any}>
          <Text style={[styles.screenCode, { color: colors.mutedForeground }]}>//DISCOVER_MODE</Text>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Explore & Learn</Text>
          <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
            Tools, templates, and features to supercharge your learning.
          </Text>
        </MotiView>

        {/* Quick stats */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 350, delay: 100 } as any}
          style={[styles.statsRow, { borderColor: isDark ? "#1e1e2e" : "#e0e0f0" }]}
        >
          <LinearGradient
            colors={isDark ? ["#111118", "#0a0a0f"] : ["#f5f5fa", "#ebebf5"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          {[
            { label: "Videos", value: totalVideos, color: INDIGO },
            { label: "AI Outputs", value: totalAiOutputs, color: "#ec4899" },
            { label: "Topics", value: totalTags, color: "#10b981" },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </MotiView>

        {/* Tools Grid */}
        <View style={styles.section}>
          <SectionHeader label="Learning Tools" code="01" />
          <View style={styles.toolGrid}>
            {TOOLS.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} isDark={isDark} />
            ))}
          </View>
        </View>

        {/* Template Library */}
        <View style={styles.section}>
          <SectionHeader label="Template Library" code="02" />
          <Text style={[styles.templateIntro, { color: colors.mutedForeground }]}>
            Export your AI outputs in professional formats. Pick a template, apply it to a video, and download.
          </Text>
          <View style={styles.templateList}>
            {TEMPLATES.map((t, i) => (
              <TemplateCard key={t.id} template={t} index={i} isDark={isDark} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.viewAllBtn, { borderColor: INDIGO + "50", backgroundColor: INDIGO + "12" }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewAllText, { color: INDIGO }]}>VIEW ALL 8 TEMPLATES</Text>
            <Feather name="arrow-right" size={12} color={INDIGO} />
          </TouchableOpacity>
        </View>

        {/* Knowledge Graph promo */}
        <View style={styles.section}>
          <SectionHeader label="Knowledge Graph" code="03" />
          <View style={[styles.graphPromo, { borderColor: isDark ? "#1e1e2e" : "#e0e0f0" }]}>
            <LinearGradient
              colors={isDark ? ["#0f1a14", "#0a0a0f"] : ["#f0faf5", "#ebebf5"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.graphPromoContent}>
              <View style={[styles.graphIconCircle, { backgroundColor: "#10b98122" }]}>
                <Feather name="share-2" size={22} color="#10b981" />
              </View>
              <Text style={[styles.graphPromoTitle, { color: colors.foreground }]}>Concept Map</Text>
              <Text style={[styles.graphPromoDesc, { color: colors.mutedForeground }]}>
                See how all your saved videos and topics are interconnected. Add tags to your videos to build your knowledge map.
              </Text>
              <View style={styles.graphNodes}>
                {["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"].map((c, i) => (
                  <View
                    key={c}
                    style={[
                      styles.graphNode,
                      { backgroundColor: c + "40", borderColor: c, width: 24 + i * 4, height: 24 + i * 4, borderRadius: (24 + i * 4) / 2 },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.graphStat, { color: "#10b981" }]}>{totalTags} topics mapped</Text>
            </View>
          </View>
        </View>

        {/* Pro upgrade teaser */}
        <View style={styles.section}>
          <MotiView
            from={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 300, delay: 200 } as any}
          >
            <View style={[styles.proCard, { borderColor: "#f59e0b44" }]}>
              <LinearGradient
                colors={["#1a1400", "#0a0a0f"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={styles.proContent}>
                <Feather name="zap" size={20} color="#f59e0b" style={{ marginBottom: 8 }} />
                <Text style={styles.proTitle}>Unlock Pro</Text>
                <Text style={styles.proDesc}>
                  Twitter threads, Anki decks, PDF exports, custom templates, and priority AI processing.
                </Text>
                <TouchableOpacity style={styles.proBtn} activeOpacity={0.8}>
                  <Text style={styles.proBtnText}>UPGRADE TO PRO →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </MotiView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  screenCode: { fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6 },
  screenTitle: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 28, letterSpacing: -0.5, marginBottom: 4 },
  screenSub: { fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18, marginBottom: 20 },

  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 28,
    padding: 16,
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center" },
  statValue: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 26, lineHeight: 30 },
  statLabel: { fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 },

  section: { marginBottom: 28 },

  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  toolCard: {
    padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  toolIconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  toolLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 0.1 },
  toolDesc: { fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 14 },
  toolBadge: { alignSelf: "flex-start", borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  toolBadgeText: { fontFamily: "JetBrainsMono_400Regular", fontSize: 7, letterSpacing: 1, textTransform: "uppercase" },

  templateIntro: { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16, marginBottom: 12 },
  templateList: { gap: 8 },
  templateCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  templateIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  templateName: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  templateCategory: { fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 1 },
  viewAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 12, borderWidth: 1, paddingVertical: 10, marginTop: 12,
  },
  viewAllText: { fontFamily: "JetBrainsMono_400Regular", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" },

  graphPromo: {
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden", minHeight: 180,
  },
  graphPromoContent: { padding: 20, alignItems: "center" },
  graphIconCircle: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  graphPromoTitle: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 20, marginBottom: 6 },
  graphPromoDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center", marginBottom: 16 },
  graphNodes: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  graphNode: { borderWidth: 1 },
  graphStat: { fontFamily: "JetBrainsMono_400Regular", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" },

  proCard: {
    borderRadius: 20, borderWidth: 1,
    overflow: "hidden", minHeight: 160,
  },
  proContent: { padding: 24, alignItems: "center" },
  proTitle: { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 22, color: "#f59e0b", marginBottom: 8 },
  proDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16, textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: 20 },
  proBtn: { backgroundColor: "#f59e0b", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  proBtnText: { fontFamily: "JetBrainsMono_400Regular", fontSize: 10, letterSpacing: 1.5, color: "#000", textTransform: "uppercase" },
});
