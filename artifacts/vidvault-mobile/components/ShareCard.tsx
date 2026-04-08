import React, { useRef, forwardRef, useImperativeHandle } from "react";
import {
  View, Text, StyleSheet, Platform,
} from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const CARD_W = 360;
const CARD_H = 420;

export interface ShareCardProps {
  insight: string;
  videoTitle: string;
  toolLabel: string;
  accentColor: string;
}

export interface ShareCardRef {
  capture: () => Promise<void>;
}

function VVLogo() {
  return (
    <View style={styles.logoBox}>
      <Text style={styles.logoLetter}>V</Text>
    </View>
  );
}

export const ShareCard = forwardRef<ShareCardRef, ShareCardProps>(
  function ShareCard({ insight, videoTitle, toolLabel, accentColor }, ref) {
    const shotRef = useRef<ViewShot>(null);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (Platform.OS === "web") {
          alert("Image sharing is available on the mobile app.");
          return;
        }
        try {
          const uri = await (shotRef.current as any)?.capture();
          if (!uri) return;
          const dest = FileSystem.cacheDirectory + `vidvault_card_${Date.now()}.png`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(dest, { mimeType: "image/png", dialogTitle: "Share VidVault Card" });
          }
        } catch {}
      },
    }));

    return (
      <ViewShot
        ref={shotRef}
        options={{ format: "png", quality: 1 }}
        style={{ width: CARD_W, height: CARD_H }}
      >
        <View style={[styles.card, { width: CARD_W, height: CARD_H }]}>
          {/* Dark gradient background */}
          <LinearGradient
            colors={["#0f0f1a", "#09090c"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Subtle grid overlay */}
          <View style={styles.gridOverlay} pointerEvents="none">
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={`h${i}`} style={[styles.gridH, { top: i * 54 }]} />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={`v${i}`} style={[styles.gridV, { left: i * 54 }]} />
            ))}
          </View>

          {/* Accent top bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          {/* Glow */}
          <View style={[styles.glow, { backgroundColor: accentColor + "08" }]} />

          {/* Header row */}
          <View style={styles.headerRow}>
            <VVLogo />
            <View>
              <Text style={styles.brandName}>VidVault AI</Text>
              <Text style={[styles.toolLabel, { color: accentColor }]}>{toolLabel.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={[styles.aiPill, { borderColor: accentColor + "40" }]}>
              <View style={[styles.aiDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.aiPillText, { color: accentColor }]}>AI</Text>
            </View>
          </View>

          {/* Quote block */}
          <View style={styles.quoteBlock}>
            <View style={[styles.quoteBar, { backgroundColor: accentColor }]} />
            <View style={styles.quoteContent}>
              <Feather name="zap" size={16} color={accentColor} style={{ marginBottom: 10 }} />
              <Text style={styles.quoteText} numberOfLines={10}>
                {insight}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={[styles.dividerLine, { backgroundColor: accentColor + "25" }]} />
            <View style={styles.footerRow}>
              <Feather name="youtube" size={10} color="rgba(255,255,255,0.3)" />
              <Text style={styles.footerTitle} numberOfLines={2}>{videoTitle}</Text>
            </View>
            <Text style={styles.footerBrand}>vidvault.ai</Text>
          </View>

          {/* Corner mark */}
          <View style={[styles.cornerMark, { borderColor: accentColor + "20" }]} />
        </View>
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#09090c",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
  },
  gridH: {
    position: "absolute",
    left: 0, right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  gridV: {
    position: "absolute",
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  accentBar: {
    height: 4,
  },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 160,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 4,
  },
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  brandName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  toolLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginTop: 1,
  },
  aiPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  aiDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  aiPillText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  quoteBlock: {
    flex: 1,
    flexDirection: "row",
    marginHorizontal: 22,
    marginTop: 24,
    marginBottom: 20,
    gap: 12,
  },
  quoteBar: {
    width: 3,
    borderRadius: 2,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 20,
    gap: 8,
  },
  dividerLine: {
    height: 1,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    flex: 1,
  },
  footerTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  footerBrand: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  cornerMark: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 20,
    height: 20,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 2,
  },
});
