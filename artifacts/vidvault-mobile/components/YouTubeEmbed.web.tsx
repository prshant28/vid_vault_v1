import React, { useState, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

export const PLAYER_HEIGHT = 220;

/* ── helpers ── */
function openInNewTab(url: string) {
  try {
    // Most reliable way to open a new tab from inside a sandboxed iframe:
    // create a temporary anchor element and click it programmatically
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.location.assign(url);
    }
  }
}

function getThumbUrl(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
}

/* ══════════════════════════════════════════
   Web YouTube Player
   Strategy:
   1. Show high-quality thumbnail + play button (no iframe initially)
   2. On play click → inject the iframe with autoplay=1
   3. If YouTube blocks it (sandboxed context) → graceful "Watch on YouTube" button
══════════════════════════════════════════ */
export function YouTubePlayer({
  ytId,
  onOpenExternal,
}: {
  ytId: string;
  onOpenExternal: () => void;
}) {
  const [phase, setPhase] = useState<"thumb" | "loading" | "playing" | "blocked">("thumb");
  const [playerH, setPlayerH] = useState(PLAYER_HEIGHT);
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);

  const youtubeUrl = `https://www.youtube.com/watch?v=${ytId}`;
  const embedUrl   = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`;

  const handlePlay = () => {
    setPhase("loading");

    // Try iframe — set a timeout to detect if it never loads (sandboxed context)
    const timer = setTimeout(() => {
      setPhase("blocked");
    }, 6000);

    // Store timer so we can cancel it if the iframe fires load
    (window as any).__ytLoadTimer = timer;
  };

  const handleIframeLoad = () => {
    clearTimeout((window as any).__ytLoadTimer);
    setPhase("playing");
  };

  const handleOpenYt = () => {
    openInNewTab(youtubeUrl);
  };

  return (
    <View
      style={[styles.container, { height: playerH }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setPlayerH(Math.round(w * (9 / 16)));
      }}
    >
      {/* ── Thumbnail / play state ── */}
      {(phase === "thumb" || phase === "blocked") && (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: getThumbUrl(ytId) }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {/* dark overlay */}
          <View style={styles.overlay} />

          {/* play / blocked content */}
          <View style={styles.centerContent}>
            {phase === "blocked" ? (
              <View style={styles.blockedBox}>
                <Feather name="shield-off" size={20} color="rgba(255,255,255,0.5)" />
                <Text style={styles.blockedTitle}>Embedding restricted</Text>
                <Text style={styles.blockedSub}>Watch directly on YouTube</Text>
                <TouchableOpacity onPress={handleOpenYt} style={styles.ytOpenBtn} activeOpacity={0.85}>
                  <Feather name="youtube" size={13} color="#fff" />
                  <Text style={styles.ytOpenBtnText}>OPEN ON YOUTUBE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handlePlay} activeOpacity={0.85} style={styles.playHitArea}>
                <View style={styles.playCircle}>
                  <Feather name="play" size={26} color="#fff" style={{ marginLeft: 3 }} />
                </View>
                <Text style={styles.tapToPlay}>Tap to play</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* bottom "Watch on YouTube" link */}
          <TouchableOpacity onPress={handleOpenYt} style={styles.watchBadge} activeOpacity={0.8}>
            <Feather name="youtube" size={11} color="#ff0000" />
            <Text style={styles.watchBadgeText}>Watch on YouTube</Text>
            <Feather name="external-link" size={10} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Loading skeleton ── */}
      {phase === "loading" && (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: getThumbUrl(ytId) }}
            style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
            resizeMode="cover"
          />
          <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.65)" }]} />
          <View style={styles.centerContent}>
            <View style={styles.loadingBox}>
              <View style={styles.spinnerRing} />
              <Text style={styles.loadingText}>Loading player…</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Iframe (only mounted after user clicks play) ── */}
      {(phase === "loading" || phase === "playing") &&
        React.createElement("iframe", {
          key: "yt-iframe",
          src: embedUrl,
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            opacity: phase === "playing" ? 1 : 0,
            transition: "opacity 0.3s ease",
            zIndex: phase === "playing" ? 1 : -1,
          },
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowFullScreen: true,
          referrerPolicy: "strict-origin-when-cross-origin",
          onLoad: handleIframeLoad,
          onError: () => setPhase("blocked"),
          sandbox:
            "allow-scripts allow-same-origin allow-presentation allow-popups allow-forms",
        })
      }

      {/* ── External link button (always visible when playing) ── */}
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  } as any,
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  } as any,

  /* Play button */
  playHitArea: { alignItems: "center", gap: 10 },
  playCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(129,140,248,0.88)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#818cf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  tapToPlay: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    letterSpacing: 0.5,
  },

  /* Watch badge */
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
  },
  watchBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },

  /* Blocked state */
  blockedBox: { alignItems: "center", gap: 8, paddingHorizontal: 24 },
  blockedTitle: { color: "#fff", fontSize: 14, fontFamily: "Poppins_600SemiBold", textAlign: "center" },
  blockedSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  ytOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: "#818cf8",
    borderRadius: 6,
  },
  ytOpenBtnText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "JetBrainsMono_600SemiBold",
    letterSpacing: 1.2,
  },

  /* Loading */
  loadingBox: { alignItems: "center", gap: 12 },
  spinnerRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: "rgba(129,140,248,0.25)",
    borderTopColor: "#818cf8",
  },
  loadingText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
});
