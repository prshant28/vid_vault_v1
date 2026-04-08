import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions, Alert, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import Svg, { Polygon } from "react-native-svg";
import { useColors, useTheme } from "@/hooks/useColors";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { router } from "expo-router";
import { GridBackground } from "@/components/GridBackground";
import { TopAppBar } from "@/components/TopAppBar";
import type { ComponentProps } from "react";
import { TabFadeWrapper } from "@/components/TabFadeWrapper";

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
  action?: "templates" | "coming-soon";
}> = [
  { id: "ai-studio",  icon: "cpu",         label: "AI Studio",          desc: "Generate summaries, flashcards, MCQs & more.",              color: PURPLE, badge: null,          route: "/(tabs)/ai-studio" },
  { id: "videos",     icon: "film",        label: "Video Library",      desc: "Browse and manage your entire knowledge vault.",            color: CYAN,   badge: null,          route: "/(tabs)/videos"    },
  { id: "notes",      icon: "edit-3",      label: "Timestamped Notes",  desc: "Capture insights at exact moments in any video.",           color: PINK,   badge: null,          route: "/(tabs)/videos"    },
  { id: "folders",    icon: "folder",      label: "Folders",            desc: "Organize your vault into custom collections.",              color: GREEN,  badge: null,          route: "/(tabs)/folders"   },
  { id: "templates",  icon: "layout",      label: "Template Library",   desc: "Export AI outputs in 10 professional HTML formats.",        color: AMBER,  badge: "10 FREE",     action: "templates"        },
  { id: "study-plan", icon: "target",      label: "AI Study Plan",      desc: "Personalized sessions based on your entire vault.",         color: BLUE,   badge: "COMING SOON", action: "coming-soon"      },
  { id: "sr-review",  icon: "layers",      label: "SR Review",          desc: "Review flashcards with SM-2 spaced repetition algorithm.",  color: PINK,   badge: "NEW",          route: "/review"           },
  { id: "pomodoro",   icon: "clock",       label: "Study Timer",        desc: "Pomodoro focus timer inside any video. 25m focus + 5m break.", color: AMBER, badge: "NEW",         action: "coming-soon"      },
  { id: "search",       icon: "search",      label: "Global Search",      desc: "Search across video titles, notes, and AI outputs at once.",    color: CYAN,   badge: "NEW",          route: "/search"           },
  { id: "playlist",    icon: "list",        label: "Playlist Import",    desc: "Paste a YouTube playlist URL and bulk-save all videos.",        color: GREEN,  badge: "NEW",          route: "/(tabs)/folders"   },
  { id: "chat-hist",   icon: "clock",       label: "Chat History",       desc: "Browse all past AI Studio conversations, searchable.",          color: PURPLE, badge: "NEW",          route: "/chat-history"     },
  { id: "cross-ai",    icon: "layers",      label: "Cross-Vault AI",     desc: "Ask the AI questions that draw from your entire video vault.",  color: CYAN,   badge: "NEW",          route: "/cross-video-ai"   },
  { id: "key-terms",   icon: "book-open",   label: "Key Terms Tracker",  desc: "AI extracts recurring concepts and builds your glossary.",      color: AMBER,  badge: "NEW",          route: "/key-terms"        },
];

const ALL_TEMPLATES = [
  { id: "dark-academic",   name: "Dark Academic",      icon: "book-open"   as FeatherIconName, color: PURPLE, category: "Study",   desc: "Elegant dark tones for scholarly notes."        },
  { id: "neon-cyberpunk",  name: "Neon Cyberpunk",     icon: "zap"         as FeatherIconName, color: CYAN,   category: "Design",  desc: "High-contrast neon glows on dark backgrounds."  },
  { id: "paper-ink",       name: "Paper & Ink",        icon: "file-text"   as FeatherIconName, color: AMBER,  category: "Classic", desc: "Clean serif layout mimicking printed pages."    },
  { id: "ocean",           name: "Ocean Depths",       icon: "droplet"     as FeatherIconName, color: "#3b82f6", category: "Visual", desc: "Deep blue gradients for immersive reading."  },
  { id: "emerald",         name: "Emerald Forest",     icon: "feather"     as FeatherIconName, color: GREEN,  category: "Nature",  desc: "Fresh greens with nature-inspired typography."  },
  { id: "bauhaus",         name: "Bauhaus Minimal",    icon: "align-left"  as FeatherIconName, color: PINK,   category: "Minimal", desc: "Bold geometry and clean whitespace."            },
  { id: "retro-terminal",  name: "Retro Terminal",     icon: "terminal"    as FeatherIconName, color: GREEN,  category: "Hacker",  desc: "Green-on-black terminal aesthetic."             },
  { id: "aurora",          name: "Aurora Borealis",    icon: "sun"         as FeatherIconName, color: PURPLE, category: "Vivid",   desc: "Northern lights palette with shimmer effects."  },
  { id: "sepia",           name: "Sepia Vintage",      icon: "camera"      as FeatherIconName, color: AMBER,  category: "Retro",   desc: "Warm sepia tones for a timeless feel."          },
  { id: "midnight-glass",  name: "Midnight Glass",     icon: "layers"      as FeatherIconName, color: CYAN,   category: "Dark",    desc: "Frosted glass panels on deep midnight canvas."  },
];

/* ── Polygon button ── */
function PolygonBtn({ label, icon, color = PURPLE, onPress }: { label: string; icon?: FeatherIconName; color?: string; onPress?: () => void }) {
  const h = 44;
  const cut = 9;
  const px = 20;
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
        <View style={[StyleSheet.absoluteFillObject, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }]}>
          {icon && <Feather name={icon} size={14} color="#fff" />}
          <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 11, letterSpacing: 1.4, color: "#fff" }}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ── Premium section header ── */
function SectionHead({ micro, title, delay = 0 }: { micro: string; title: string; delay?: number }) {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 380, delay }}
      style={{ marginBottom: 16 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <View style={{ width: 3, height: 14, borderRadius: 1.5, backgroundColor: PURPLE }} />
        <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8.5, color: colors.mutedForeground, letterSpacing: 2.5 }}>
          {micro}
        </Text>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      </View>
      <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 22, color: colors.foreground, letterSpacing: -0.3, paddingLeft: 11 }}>
        {title}
      </Text>
    </MotiView>
  );
}

/* ── Premium tool card ── */
function ToolCard({ tool, index, onPress }: { tool: typeof TOOLS[0]; index: number; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const cardW = (width - 48 - 10) / 2;
  const num = String(index + 1).padStart(2, "0");
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 340, delay: index * 60 }}
      style={{ width: cardW, elevation: 0, shadowOpacity: 0 }}
    >
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={onPress}
        style={[styles.toolCard, {
          backgroundColor: colors.card,
          borderColor: tool.color + "30",
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: "transparent",
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        }]}
      >
        {/* Top color accent bar */}
        <View style={{ height: 3, backgroundColor: tool.color, borderTopLeftRadius: 14, borderTopRightRadius: 14 }} />

        {/* Subtle gradient wash */}
        <LinearGradient
          colors={[tool.color + "12", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          pointerEvents="none"
        />

        <View style={{ padding: 14, paddingTop: 12 }}>
          {/* Top row: number + arrow */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 1.5, color: tool.color + "80" }}>{num}</Text>
            {tool.badge ? (
              <View style={[styles.toolBadge, { backgroundColor: tool.color + "18", borderColor: tool.color + "40" }]}>
                <Text style={[styles.toolBadgeText, { color: tool.color }]}>{tool.badge}</Text>
              </View>
            ) : (
              <Feather name="arrow-up-right" size={12} color={tool.color + "70"} />
            )}
          </View>

          {/* Icon */}
          <View style={[styles.toolIconWrap, { backgroundColor: tool.color + "16", borderColor: tool.color + "28" }]}>
            <Feather name={tool.icon} size={22} color={tool.color} />
          </View>

          {/* Label + desc */}
          <Text style={[styles.toolLabel, { color: colors.foreground }]}>{tool.label}</Text>
          <Text style={[styles.toolDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{tool.desc}</Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

/* ── Premium template row card ── */
function TemplateCard({ template, index, onPress }: { template: typeof ALL_TEMPLATES[0]; index: number; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateX: 16 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 300, delay: index * 50 }}
    >
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={[styles.templateCard, {
          backgroundColor: colors.card,
          borderColor: template.color + "25",
          elevation: 0,
          shadowOpacity: 0,
          shadowColor: "transparent",
        }]}
      >
        <LinearGradient
          colors={[template.color + "0a", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
          pointerEvents="none"
        />
        {/* Left accent line */}
        <View style={{ width: 3, alignSelf: "stretch", backgroundColor: template.color, borderRadius: 2, marginRight: 12 }} />
        <View style={[styles.templateIcon, { backgroundColor: template.color + "16", borderColor: template.color + "28", borderWidth: 1 }]}>
          <Feather name={template.icon} size={15} color={template.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.templateName, { color: colors.foreground }]} numberOfLines={1}>{template.name}</Text>
          <Text style={[styles.templateDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{template.desc}</Text>
        </View>
        <View style={[styles.templateCategoryBadge, { backgroundColor: template.color + "14", borderColor: template.color + "30" }]}>
          <Text style={[styles.templateCategoryText, { color: template.color }]}>{template.category.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

export default function DiscoverScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const botInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const [showTemplates, setShowTemplates] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const totalVideos    = stats?.totalVideos    ?? 0;
  const totalAiOutputs = stats?.totalAiOutputs ?? 0;
  const totalTags      = stats?.totalTags      ?? 0;
  const totalNotes     = stats?.totalNotes     ?? 0;

  const handleToolPress = (tool: typeof TOOLS[0]) => {
    if (tool.action === "templates")   { setShowTemplates(true); return; }
    if (tool.action === "coming-soon") { Alert.alert("Coming Soon", `${tool.label} is in development and will be available in a future update.`); return; }
    if (tool.route) router.push(tool.route as any);
  };

  const statItems: Array<{ label: string; value: number; color: string; icon: FeatherIconName }> = [
    { label: "Videos",  value: totalVideos,    color: PURPLE, icon: "film"    },
    { label: "AI Outs", value: totalAiOutputs, color: PINK,   icon: "cpu"     },
    { label: "Topics",  value: totalTags,      color: GREEN,  icon: "tag"     },
    { label: "Notes",   value: totalNotes,     color: CYAN,   icon: "edit-3"  },
  ];

  return (
    <TabFadeWrapper>
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Ambient glow */}
      <MotiView
        from={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 1400 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
      >
        <LinearGradient
          colors={[CYAN + "10", "transparent"]}
          start={{ x: 1, y: 0 }} end={{ x: 0, y: 0.5 }}
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
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={{ paddingTop: 4, paddingBottom: 22 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: CYAN }} />
            <View>
              <Text style={[styles.pageCode, { color: colors.mutedForeground }]}>// DISCOVER</Text>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Explore & Learn</Text>
            </View>
          </View>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tools, templates, and features to supercharge your knowledge vault.
          </Text>
        </MotiView>

        {/* ── Stats strip ── */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 80 }}
          style={[styles.statsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <LinearGradient
            colors={[PURPLE + "0c", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            pointerEvents="none"
          />
          {statItems.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={{ width: StyleSheet.hairlineWidth, height: 36, backgroundColor: colors.border }} />}
              <View style={styles.statItem}>
                <View style={[styles.statIconBadge, { backgroundColor: s.color + "18", borderColor: s.color + "30" }]}>
                  <Feather name={s.icon} size={11} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </MotiView>

        {/* ── Learning Tools Grid ── */}
        <View style={{ marginBottom: 32 }}>
          <SectionHead micro="// 01 · TOOLS" title="Learning Tools" delay={100} />
          <View style={styles.toolGrid}>
            {TOOLS.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} onPress={() => handleToolPress(tool)} />
            ))}
          </View>
        </View>

        {/* ── Template Library ── */}
        <View style={{ marginBottom: 32 }}>
          <SectionHead micro="// 02 · EXPORT" title="Template Library" delay={150} />
          <MotiView
            from={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 350, delay: 160 }}
            style={[styles.templateIntroCard, { backgroundColor: colors.card, borderColor: AMBER + "28" }]}
          >
            <LinearGradient
              colors={[AMBER + "10", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
              pointerEvents="none"
            />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: AMBER + "18", borderWidth: 1, borderColor: AMBER + "30", alignItems: "center", justifyContent: "center" }}>
                <Feather name="layout" size={18} color={AMBER} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 13, color: colors.foreground }}>10 Export Formats</Text>
                <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 10, color: colors.mutedForeground, lineHeight: 15 }}>
                  Open a video → generate AI content → tap Export to apply any template.
                </Text>
              </View>
            </View>
          </MotiView>
          <View style={{ gap: 8, marginTop: 12 }}>
            {ALL_TEMPLATES.slice(0, 6).map((t, i) => (
              <TemplateCard key={t.id} template={t} index={i} onPress={() => setShowTemplates(true)} />
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setShowTemplates(true)}
            style={[styles.viewAllBtn, { borderColor: PURPLE + "40", backgroundColor: PURPLE + "0e" }]}
            activeOpacity={0.75}
          >
            <Feather name="layout" size={12} color={PURPLE} />
            <Text style={[styles.viewAllText, { color: PURPLE }]}>VIEW ALL 10 TEMPLATES</Text>
            <Feather name="arrow-right" size={12} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {/* ── Knowledge Graph ── */}
        <View style={{ marginBottom: 32 }}>
          <SectionHead micro="// 03 · GRAPH" title="Knowledge Graph" delay={200} />
          <MotiView
            from={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 360, delay: 240 }}
            style={[styles.graphCard, { backgroundColor: colors.card, borderColor: GREEN + "35", elevation: 0, shadowOpacity: 0 }]}
          >
            <LinearGradient
              colors={[GREEN + "14", "transparent", CYAN + "08"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              pointerEvents="none"
            />
            <View style={{ height: 3, backgroundColor: GREEN, width: "35%", borderTopLeftRadius: 16, borderBottomRightRadius: 4 }} />
            <View style={{ padding: 20, alignItems: "center", gap: 14 }}>
              <View style={[styles.graphIconWrap, { backgroundColor: GREEN + "18", borderColor: GREEN + "35", borderWidth: 1 }]}>
                <Feather name="share-2" size={26} color={GREEN} />
              </View>
              <View style={{ alignItems: "center", gap: 4 }}>
                <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2, color: GREEN }}>CONCEPT MAP</Text>
                <Text style={[styles.graphTitle, { color: colors.foreground }]}>Knowledge Graph</Text>
              </View>
              <Text style={[styles.graphDesc, { color: colors.mutedForeground }]}>
                See how all your saved videos interconnect through shared topics and tags. Build a visual map of your knowledge.
              </Text>
              {/* Animated node visual */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                {[PURPLE, CYAN, GREEN, PINK, AMBER].map((c, i) => (
                  <MotiView
                    key={c}
                    from={{ scale: 0.85, opacity: 0.4 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "timing", duration: 1200, loop: true, delay: i * 200, repeatReverse: true }}
                  >
                    <View style={{
                      width: 16 + i * 5, height: 16 + i * 5,
                      borderRadius: (16 + i * 5) / 2,
                      backgroundColor: c + "30", borderWidth: 1.5, borderColor: c,
                    }} />
                  </MotiView>
                ))}
              </View>
              <View style={[styles.graphCountBadge, { backgroundColor: GREEN + "14", borderColor: GREEN + "30" }]}>
                <Feather name="tag" size={10} color={GREEN} />
                <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 10, letterSpacing: 1, color: GREEN }}>
                  {totalTags} TOPICS MAPPED
                </Text>
              </View>
            </View>
          </MotiView>
        </View>

        {/* ── Pro Upgrade Card ── */}
        <View style={{ marginBottom: 24 }}>
          <SectionHead micro="// 04 · PRO" title="Upgrade to Pro" delay={250} />
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 380, delay: 290 }}
            style={[styles.proCard, { borderColor: AMBER + "45", backgroundColor: colors.card, elevation: 0, shadowOpacity: 0 }]}
          >
            <LinearGradient
              colors={[AMBER + "18", PURPLE + "0e", "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              pointerEvents="none"
            />
            <View style={{ height: 3, backgroundColor: AMBER, width: "30%", borderTopLeftRadius: 16, borderBottomRightRadius: 4 }} />
            <View style={{ padding: 24, alignItems: "center", gap: 16 }}>
              <View style={[styles.proIconWrap, { backgroundColor: AMBER + "20", borderColor: AMBER + "40", borderWidth: 1 }]}>
                <Feather name="zap" size={26} color={AMBER} />
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: AMBER + "16", borderWidth: 1, borderColor: AMBER + "35", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Feather name="star" size={10} color={AMBER} />
                  <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 9, letterSpacing: 1.5, color: AMBER }}>PRO TIER</Text>
                </View>
                <Text style={[styles.proTitle, { color: colors.foreground }]}>Unlock Pro Features</Text>
                <Text style={[styles.proDesc, { color: colors.mutedForeground }]}>
                  Anki decks, PDF exports, custom templates, Twitter threads, and priority AI processing.
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[
                  { label: "Anki Decks",        icon: "layers"     as FeatherIconName },
                  { label: "PDF Export",         icon: "file-text"  as FeatherIconName },
                  { label: "Custom Templates",   icon: "layout"     as FeatherIconName },
                  { label: "Priority AI",        icon: "zap"        as FeatherIconName },
                  { label: "Unlimited Videos",   icon: "film"       as FeatherIconName },
                  { label: "API Access",         icon: "code"       as FeatherIconName },
                ].map((feat) => (
                  <View key={feat.label} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: AMBER + "12", borderWidth: 1, borderColor: AMBER + "28", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Feather name={feat.icon} size={9} color={AMBER} />
                    <Text style={{ fontFamily: "Eczar_500Medium", fontSize: 9, letterSpacing: 0.5, color: AMBER }}>{feat.label}</Text>
                  </View>
                ))}
              </View>
              <PolygonBtn label="UPGRADE TO PRO" icon="zap" color={AMBER} />
            </View>
          </MotiView>
        </View>
      </ScrollView>

      {/* ── Templates overlay ── */}
      {showTemplates && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 200, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowTemplates(false)} />
          <MotiView
            from={{ translateY: 90, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: "timing", duration: 280 }}
            style={[styles.tmplSheet, { backgroundColor: colors.background, borderColor: AMBER + "35" }]}
          >
            <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            <View style={[styles.tmplHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[styles.tmplHeaderIcon, { backgroundColor: AMBER + "18", borderColor: AMBER + "30", borderWidth: 1 }]}>
                  <Feather name="layout" size={18} color={AMBER} />
                </View>
                <View>
                  <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 8, letterSpacing: 2, color: colors.mutedForeground, marginBottom: 1 }}>TEMPLATE LIBRARY</Text>
                  <Text style={{ fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 20, color: colors.foreground, letterSpacing: -0.3 }}>Export Templates</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowTemplates(false)} style={{ padding: 4 }}>
                <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 11, color: colors.mutedForeground, paddingHorizontal: 16, paddingVertical: 10, lineHeight: 16 }}>
              Apply these templates when exporting AI outputs. Open a video → generate content → tap Export.
            </Text>
            <FlatList
              data={ALL_TEMPLATES}
              keyExtractor={t => t.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 8 }}
              renderItem={({ item: t }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => { setShowTemplates(false); router.push("/(tabs)/videos"); }}
                  style={[styles.tmplRow, { backgroundColor: colors.card, borderColor: t.color + "28", elevation: 0, shadowOpacity: 0 }]}
                >
                  <LinearGradient colors={[t.color + "0a", "transparent"]} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} pointerEvents="none" />
                  <View style={{ width: 3, alignSelf: "stretch", backgroundColor: t.color, borderRadius: 2, marginRight: 12 }} />
                  <View style={[styles.tmplRowIcon, { backgroundColor: t.color + "16", borderColor: t.color + "28", borderWidth: 1 }]}>
                    <Feather name={t.icon} size={17} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Eczar_600SemiBold", fontSize: 13, color: colors.foreground }}>{t.name}</Text>
                    <Text style={{ fontFamily: "Eczar_400Regular", fontSize: 10, color: colors.mutedForeground, marginTop: 1 }} numberOfLines={1}>{t.desc}</Text>
                  </View>
                  <View style={[styles.tmplCategoryBadge, { backgroundColor: t.color + "14", borderColor: t.color + "28" }]}>
                    <Text style={{ fontFamily: "Eczar_500Medium", fontSize: 7, letterSpacing: 1, color: t.color }}>{t.category.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
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
  root: { flex: 1 },

  pageCode:  { fontFamily: "Eczar_400Regular", fontSize: 9, letterSpacing: 2.5, marginBottom: 2 },
  pageTitle: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 34, letterSpacing: -1, lineHeight: 38 },
  pageSub:   { fontFamily: "Eczar_400Regular", fontSize: 12, lineHeight: 18, paddingLeft: 11 },

  statsStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderRadius: 16, borderWidth: 1, paddingVertical: 14,
    marginBottom: 28, overflow: "hidden",
  },
  statItem:      { flex: 1, alignItems: "center", gap: 4 },
  statIconBadge: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue:     { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 18, letterSpacing: -0.5 },
  statLabel:     { fontFamily: "Eczar_400Regular", fontSize: 7.5, letterSpacing: 1.2 },

  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  toolCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 170,
  },
  toolIconWrap: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  toolLabel: { fontFamily: "Eczar_600SemiBold", fontSize: 13, marginBottom: 4 },
  toolDesc:  { fontFamily: "Eczar_400Regular",  fontSize: 10, lineHeight: 14 },
  toolBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  toolBadgeText: { fontFamily: "Eczar_600SemiBold", fontSize: 7, letterSpacing: 0.8 },

  templateIntroCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, overflow: "hidden",
  },
  templateCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1, overflow: "hidden",
    paddingVertical: 12, paddingRight: 12,
  },
  templateIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 },
  templateName: { fontFamily: "Eczar_600SemiBold", fontSize: 13 },
  templateDesc: { fontFamily: "Eczar_400Regular", fontSize: 9.5, lineHeight: 13 },
  templateCategoryBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  templateCategoryText:  { fontFamily: "Eczar_600SemiBold", fontSize: 7, letterSpacing: 1 },

  viewAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1, borderRadius: 10,
    paddingVertical: 12, marginTop: 10,
  },
  viewAllText: { fontFamily: "Eczar_600SemiBold", fontSize: 10, letterSpacing: 1.5 },

  sectionIntro: { fontFamily: "Eczar_400Regular", fontSize: 11, lineHeight: 16, marginBottom: 12, marginTop: -8 },

  graphCard: {
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
  },
  graphIconWrap:  { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  graphTitle:     { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 22, letterSpacing: -0.3 },
  graphDesc:      { fontFamily: "Eczar_400Regular", fontSize: 12, lineHeight: 18, textAlign: "center" },
  graphCountBadge:{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },

  proCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  proIconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  proTitle: { fontFamily: "AlegreyaSansSC_800ExtraBold", fontSize: 22, letterSpacing: -0.3, textAlign: "center" },
  proDesc:  { fontFamily: "Eczar_400Regular", fontSize: 12, lineHeight: 18, textAlign: "center" },

  tmplSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: "85%",
  },
  tmplHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tmplHeaderIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  tmplRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1, overflow: "hidden",
    paddingVertical: 12, paddingRight: 12,
  },
  tmplRowIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  tmplCategoryBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
});
