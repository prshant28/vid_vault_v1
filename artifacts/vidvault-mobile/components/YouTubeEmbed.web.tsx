import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

export const PLAYER_HEIGHT = 220;

function openInNewTab(url: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch { /**/ }
  }
}

function getThumbUrl(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
}

/*
  Simplified YouTube web player:
  - Thumbnail with play button shown initially (no iframe)
  - Tap play → iframe injected immediately with autoplay=1
  - No postMessage listening (unreliable in sandboxed Replit iframe context)
  - "Watch on YouTube" always accessible
*/
export function YouTubePlayer({
  ytId,
  onOpenExternal,
}: {
  ytId: string;
  onOpenExternal: () => void;
}) {
  const [phase, setPhase] = useState<"thumb" | "playing">("thumb");
  const [playerH, setPlayerH] = useState(PLAYER_HEIGHT);
  const [thumbError, setThumbError] = useState(false);

  const youtubeUrl = `https://www.youtube.com/watch?v=${ytId}`;

  const embedUrl = [
    `https://www.youtube.com/embed/${ytId}`,
    `?autoplay=1`,
    `&rel=0`,
    `&modestbranding=1`,
    `&playsinline=1`,
    `&fs=1`,
    `&controls=1`,
    `&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "https://www.youtube.com")}`,
  ].join("");

  const handlePlay = () => {
    setPhase("playing");
  };

  const handleOpenYt = () => openInNewTab(youtubeUrl);

  return (
    <View
      style={[styles.container, { height: playerH }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setPlayerH(Math.round(w * (9 / 16)));
      }}
    >
      {/* ── Thumbnail ── */}
      {phase === "thumb" && (
        <View style={StyleSheet.absoluteFill}>
          {!thumbError ? (
            <Image
              source={{ uri: getThumbUrl(ytId) }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setThumbError(true)}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111" }]} />
          )}
          <View style={styles.overlay} />

          <View style={styles.centerContent}>
            <TouchableOpacity onPress={handlePlay} activeOpacity={0.85} style={styles.playHitArea}>
              <View style={styles.playCircle}>
                <Feather name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.tapToPlay}>Tap to play</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleOpenYt} style={styles.watchBadge} activeOpacity={0.8}>
            <Feather name="youtube" size={11} color="#ff0000" />
            <Text style={styles.watchBadgeText}>Watch on YouTube</Text>
            <Feather name="external-link" size={10} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── YouTube iframe (shown immediately on tap) ── */}
      {phase === "playing" &&
        React.createElement("iframe", {
          key: `yt-${ytId}`,
          src: embedUrl,
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          },
          allow:
            "autoplay; fullscreen; accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowFullScreen: true,
        })
      }

      {/* Watch on YouTube badge while playing */}
      {phase === "playing" && (
        <TouchableOpacity onPress={handleOpenYt} style={[styles.watchBadge, { zIndex: 10 }]} activeOpacity={0.8}>
          <Feather name="youtube" size={11} color="#ff0000" />
          <Text style={styles.watchBadgeText}>Watch on YouTube</Text>
          <Feather name="external-link" size={10} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#0d0d14",
    overflow: "hidden",
    position: "relative",
  } as any,
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  } as any,
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  } as any,
  playHitArea: { alignItems: "center", gap: 12 },
  playCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(129,140,248,0.90)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  tapToPlay: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    letterSpacing: 0.5,
  },
  watchBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  } as any,
  watchBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
});
