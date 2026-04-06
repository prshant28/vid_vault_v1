import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import Svg, { Polygon } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { router } from "expo-router";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import type { ComponentProps } from "react";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

const PURPLE = "#6366f1";
const CYAN   = "#06b6d4";
const GREEN  = "#10b981";
const PINK   = "#ec4899";
const AMBER  = "#f59e0b";
const BLUE   = "#3b82f6";

const TOOLS: Array<{
  id: string;
  icon: FeatherIconName;
  label: string;
  desc: string;
  color: string;
  badge: string | null;
  route?: string;
}> = [
  { id: "ai-studio",  icon: "cpu",         label: "AI Studio",          desc: "Generate summaries, flashcards, MCQs & more.",              color: PURPLE, badge: null,          route: "/(tabs)/ai-studio" },
  { id: "flashcards", icon: "book-open",   label: "Flashcard Deck",     desc: "Review key concepts with spaced repetition.",               color: CYAN,   badge: null          },
  { id: "kg",         icon: "share-2",     label: "Knowledge Graph",    desc: "See how your videos connect through shared topics.",        color: GREEN,  badge: null          },
  { id: "notes",      icon: "edit-3",      label: "Timestamped Notes",  desc: "Capture insights at exact moments in any video.",           color: PINK,   badge: null          },
  { id: "templates",  icon: "layout",      label: "Template Library",   desc: "Export AI outputs in 10 professional HTML formats.",        color: AMBER,  badge: "10 FREE"     },
  { id: "study-plan", icon: "target",      label: "AI Study Plan",      desc: "Personalized sessions based on your entire vault.",         color: BLUE,   badge: "COMING SOON" },
];

const TEMPLATES = [
  { id: "dark-academic",  name: "Dark Academic",   icon: "book-open"   as FeatherIconName, color: PURPLE, category: "Study"    },
  { id: "neon-cyberpunk", name: "Neon Cyberpunk",  icon: "zap"         as FeatherIconName, color: CYAN,   category: "Design"   },
  { id: "paper-ink",      name: "Paper & Ink",     icon: "file-text"   as FeatherIconName, color: AMBER,  category: "Classic"  },
  { id: "ocean",          name: "Ocean Depths",    icon: "droplet"     as FeatherIconName, color: BLUE,   category: "Visual"   },
  { id: "emerald",        name: "Emerald Forest",  icon: "feather"     as FeatherIconName, color: GREEN,  category: "Nature"   },
  { id: "bauhaus",        name: "Bauhaus Minimal", icon: "align-left"  as FeatherIconName, color: PINK,   category: "Minimal"  },
];

/* ── Polygon button matching AppButton style ── */
function PolygonBtn({ label, icon, color = PURPLE, onPress }: { label: string; icon?: FeatherIconName; color?: string; onPress?: () => void }) {
  const h = 42;
  const cut = 9;
  const px = 18;
  const charW = 11 * 0.62;
  const iconW = icon ? 18 : 0;
  const btnW = Math.ceil(px * 2 + iconW + (icon && label ? 8 : 0) + label.length * charW);
  const points = `${cut},0 ${btnW},0 ${btnW},${h - cut} ${btnW - cut},${h} 0,${h} 0,${cut}`;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={{ width: btnW, height: h }}>
        <Svg width={btnW} height={h} style={StyleSheet.absoluteFillObject}>
          <Polygon points={points} fill={color} />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }]}>
          {icon && <Feather name={icon} size={14} color="#fff" />}
          <Text style={{ fontFamily: "JetBrainsMono_600SemiBold", fontSize: 11, letterSpacing: 1.4, color: "#fff" }}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ── Section header matching home screen style ── */
function SectionHead({ micro, title, delay = 0 }: { micro: string; title: string; delay?: number }) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 380, delay }}
      style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}
    >
      <View>
        <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, color: colors.mutedForeground, letterSpacing: 2.5, marginBottom: 3 }}>
          {micro}
        </Text>
        <Text style={{ fontFamily: "AlegreyaSansSC_700Bold", fontSize: 20, color: colors.foreground, letterSpacing: -0.2 }}>
          {title}
        </Text>
      </View>
      <View style={{ height: 1, flex: 1, marginLeft: 12, marginBottom: 6, backgroundColor: colors.border }} />
    </MotiView>
  );
}

/* ── Tool card matching AI Studio etched-slab style ── */
function ToolCard({ tool, index }: { tool: typeof TOOLS[0]; index: number }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const cardW = (width - 48 - 10) / 2;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 320, delay: index * 55 }}
      style={{ width: cardW }}
    >
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={() => { if (tool.route) router.push(tool.route as any); }}
        style={[styles.toolCard, { backgroundColor: colors.card, borderColor: tool.color + "28" }]}
      >
        <LinearGradient
          colors={[tool.color + "08", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Icon */}
        <View style={[styles.toolIconWrap, { backgroundColor: tool.color + "18", borderColor: tool.color + "30" }]}>
          <Feather name={tool.icon} size={18} color={tool.color} />
        </View>
        <Text style={[styles.toolLabel, { color: colors.foreground }]}>{tool.label}</Text>
        <Text style={[styles.toolDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{tool.desc}</Text>
        {/* Badge */}
        {tool.badge && (
          <View style={[styles.toolBadge, { backgroundColor: tool.color + "18", borderColor: tool.color + "40" }]}>
            <Text style={[styles.toolBadgeText, { color: tool.color }]}>{tool.badge}</Text>
          </View>
        )}
        {/* Arrow */}
        <View style={{ position: "absolute", top: 10, right: 10 }}>
          <Feather name="arrow-up-right" size={11} color={tool.color + "60"} />
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Template row card ── */
function TemplateCard({ template, index }: { template: typeof TEMPLATES[0]; index: number }) {
  const colors = useColors();
  return (
    <MotiView
      from={{ opacity: 0, translateX: 14 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 280, delay: index * 45 }}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.templateIcon, { backgroundColor: template.color + "18", borderColor: template.color + "30", borderWidth: 1 }]}>
          <Feather name={template.icon} size={14} color={template.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.templateName, { color: colors.foreground }]} numberOfLines={1}>{template.name}</Text>
          <Text style={[styles.templateCategory, { color: template.color }]}>{template.category.toUpperCase()}</Text>
        </View>
        <Feather name="chevron-right" size={13} color={colors.mutedForeground + "70"} />
      </TouchableOpacity>
    </MotiView>
  );
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const totalVideos    = stats?.totalVideos    ?? 0;
  const totalAiOutputs = stats?.totalAiOutputs ?? 0;
  const totalTags      = stats?.totalTags      ?? 0;
  const totalNotes     = stats?.totalNotes     ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Ambient glow */}
      <MotiView
        from={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 1200 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[CYAN + "12", "transparent"]}
          start={{ x: 1, y: 0 }} end={{ x: 0, y: 0.4 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>

      <TopAppBar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botInset + 100, paddingHorizontal: 20 }}
      >
        {/* ── Page Header ── */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={{ paddingTop: 4, paddingBottom: 20 }}
        >
          <Text style={[styles.pageCode, { color: colors.mutedForeground }]}>//DISCOVER_MODE</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Explore & Learn</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tools, templates, and features to supercharge your knowledge vault.
          </Text>
        </MotiView>

        {/* ── Stats strip ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 80 }}
          style={[styles.statsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <LinearGradient
            colors={[PURPLE + "0c", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          {[
            { label: "VIDEOS",  value: totalVideos,    color: PURPLE },
            { label: "AI OUTS", value: totalAiOutputs, color: PINK   },
            { label: "TOPICS",  value: totalTags,      color: GREEN  },
            { label: "NOTES",   value: totalNotes,     color: CYAN   },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </MotiView>

        {/* ── Learning Tools Grid ── */}
        <View style={{ marginBottom: 32 }}>
          <SectionHead micro="//01_TOOLS" title="Learning Tools" delay={100} />
          <View style={styles.toolGrid}>
            {TOOLS.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </View>
        </View>

        {/* ── Template Library ── */}
        <View style={{ marginBottom: 32 }}>
          <SectionHead micro="//02_EXPORT" title="Template Library" delay={150} />
          <Text style={[styles.sectionIntro, { color: colors.mutedForeground }]}>
            Export your AI outputs in 10 professionally designed HTML formats.
          </Text>
          <View style={{ gap: 8 }}>
            {TEMPLATES.map((t, i) => (
              <TemplateCard key={t.id} template={t} index={i} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.viewAllBtn, { borderColor: PURPLE + "45", backgroundColor: PURPLE + "0e" }]}
            activeOpacity={0.75}
          >
            <Feather name="layout" size={11} color={PURPLE} />
            <Text style={[styles.viewAllText, { color: PURPLE }]}>VIEW ALL 10 TEMPLATES</Text>
            <Feather name="arrow-right" size={11} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {/* ── Knowledge Graph Promo ── */}
        <View style={{ marginBottom: 32 }}>
          <SectionHead micro="//03_GRAPH" title="Knowledge Graph" delay={200} />
          <MotiView
            from={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 350, delay: 250 }}
            style={[styles.graphCard, { backgroundColor: colors.card, borderColor: GREEN + "35" }]}
          >
            <LinearGradient
              colors={[GREEN + "12", "transparent", CYAN + "08"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Top line */}
            <View style={{ height: 2, backgroundColor: GREEN, width: "30%", borderBottomRightRadius: 2 }} />
            <View style={{ padding: 20, alignItems: "center", gap: 12 }}>
              <View style={[styles.graphIconWrap, { backgroundColor: GREEN + "18", borderColor: GREEN + "35", borderWidth: 1 }]}>
                <Feather name="share-2" size={24} color={GREEN} />
              </View>
              <Text style={[styles.graphTitle, { color: colors.foreground }]}>Concept Map</Text>
              <Text style={[styles.graphDesc, { color: colors.mutedForeground }]}>
                See how all your saved videos interconnect through shared topics and tags. Build a visual map of your knowledge.
              </Text>
              {/* Node visual */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                {[PURPLE, CYAN, GREEN, PINK, AMBER].map((c, i) => (
                  <View
                    key={c}
                    style={{
                      width: 18 + i * 5, height: 18 + i * 5,
                      borderRadius: (18 + i * 5) / 2,
                      backgroundColor: c + "35", borderWidth: 1.5, borderColor: c,
                    }}
                  />
                ))}
              </View>
              <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 9, letterSpacing: 1.5, color: GREEN }}>
                {totalTags} TOPICS MAPPED
              </Text>
            </View>
          </MotiView>
        </View>

        {/* ── Pro Upgrade Card ── */}
        <View style={{ marginBottom: 24 }}>
          <SectionHead micro="//04_PRO" title="Upgrade to Pro" delay={250} />
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: 300 }}
            style={[styles.proCard, { borderColor: AMBER + "40", backgroundColor: colors.card }]}
          >
            <LinearGradient
              colors={[AMBER + "14", PURPLE + "10", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ height: 2, backgroundColor: AMBER, width: "25%", borderBottomRightRadius: 2 }} />
            <View style={{ padding: 24, alignItems: "center", gap: 14 }}>
              <View style={[styles.proIconWrap, { backgroundColor: AMBER + "18", borderColor: AMBER + "35", borderWidth: 1 }]}>
                <Feather name="zap" size={22} color={AMBER} />
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 9, letterSpacing: 2, color: AMBER }}>// PRO_TIER</Text>
                <Text style={[styles.proTitle, { color: colors.foreground }]}>Unlock Pro Features</Text>
                <Text style={[styles.proDesc, { color: colors.mutedForeground }]}>
                  Anki decks, PDF exports, custom templates, Twitter threads, and priority AI processing.
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {["Anki Decks", "PDF Export", "Custom Templates", "Priority AI"].map((feat) => (
                  <View key={feat} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: AMBER + "12", borderWidth: 1, borderColor: AMBER + "30", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Feather name="check" size={9} color={AMBER} />
                    <Text style={{ fontFamily: "JetBrainsMono_400Regular", fontSize: 8, letterSpacing: 0.8, color: AMBER }}>{feat}</Text>
                  </View>
                ))}
              </View>
              <PolygonBtn label="UPGRADE TO PRO" icon="zap" color={AMBER} />
            </View>
          </MotiView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  pageCode:  { fontFamily: "JetBrainsMono_400Regular", fontSize: 9, letterSpacing: 2.5, marginBottom: 6 },
  pageTitle: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 36, letterSpacing: -1, lineHeight: 42, marginBottom: 6 },
  pageSub:   { fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 },

  statsStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderRadius: 14, borderWidth: 1, overflow: "hidden",
    paddingVertical: 14, paddingHorizontal: 8, marginBottom: 28,
  },
  statItem:  { alignItems: "center", flex: 1 },
  statValue: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 24, lineHeight: 28 },
  statLabel: { fontFamily: "JetBrainsMono_400Regular", fontSize: 7, letterSpacing: 1.5, marginTop: 2 },

  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  toolCard: {
    padding: 14, borderRadius: 14, borderWidth: 1, gap: 6,
    overflow: "hidden", minHeight: 130,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  toolIconWrap: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  toolLabel:    { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 0.1 },
  toolDesc:     { fontFamily: "Poppins_400Regular", fontSize: 10, lineHeight: 14 },
  toolBadge:    { alignSelf: "flex-start", borderRadius: 20, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
  toolBadgeText:{ fontFamily: "JetBrainsMono_600SemiBold", fontSize: 7, letterSpacing: 1 },

  sectionIntro: { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 16, marginBottom: 12 },
  templateCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  templateIcon:     { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  templateName:     { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  templateCategory: { fontFamily: "JetBrainsMono_400Regular", fontSize: 7, letterSpacing: 1.4, marginTop: 1 },
  viewAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 20, borderWidth: 1, paddingVertical: 11, marginTop: 12,
  },
  viewAllText: { fontFamily: "JetBrainsMono_600SemiBold", fontSize: 9, letterSpacing: 1.5 },

  graphCard:    { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  graphIconWrap:{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  graphTitle:   { fontFamily: "AlegreyaSansSC_700Bold", fontSize: 20 },
  graphDesc:    { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17, textAlign: "center" },

  proCard:    { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  proIconWrap:{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  proTitle:   { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 22, letterSpacing: -0.5 },
  proDesc:    { fontFamily: "Poppins_400Regular", fontSize: 11, lineHeight: 17, textAlign: "center" },
});
