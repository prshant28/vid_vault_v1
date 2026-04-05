import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

export const PLAYER_HEIGHT = 220;

/* ── open a URL in a new browser tab reliably from inside a sandboxed iframe ── */
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
  YouTube IFrame API error codes that mean "embedding not allowed":
  100 = video removed / private
  101 = owner disabled embedding
  150 = same as 101
  153 = embedding not permitted (newer code, same family)
  2   = invalid video ID
*/
const EMBED_BLOCK_CODES = new Set([2, 100, 101, 150, 153]);

/* ══════════════════════════════════════════
   Web YouTube Player — lazy-load + API events
   Flow:
   1. Thumbnail + play button shown (no iframe)
   2. User taps play → iframe injected with enablejsapi=1
   3. Listen for YouTube postMessage events:
      onReady → show the iframe (phase=playing)
      onError with block code → show fallback (phase=blocked)
   4. 8-second safety timeout → also shows fallback
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
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const youtubeUrl = `https://www.youtube.com/watch?v=${ytId}`;
  const embedUrl = [
    `https://www.youtube-nocookie.com/embed/${ytId}`,
    `?autoplay=1`,
    `&enablejsapi=1`,
    `&rel=0`,
    `&modestbranding=1`,
    `&playsinline=1`,
    `&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`,
  ].join("");

  /* ── YouTube IFrame API postMessage listener ── */
  useEffect(() => {
    if (phase !== "loading" && phase !== "playing") return;

    const handleMessage = (e: MessageEvent) => {
      try {
        const data: any =
          typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data || typeof data !== "object") return;

        if (data.event === "onReady") {
          clearTimeout(timerRef.current);
          setPhase("playing");
        } else if (data.event === "onError") {
          const code: number = data.info ?? data.arg ?? 0;
          clearTimeout(timerRef.current);
          // All error codes → fallback (some block codes, some network issues)
          setPhase("blocked");
          console.warn(`[YouTubePlayer] error code ${code}`);
        }
      } catch {
        // ignore non-JSON messages from other frames
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [phase]);

  /* ── safety timeout cleanup on unmount ── */
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handlePlay = () => {
    setPhase("loading");
    // Safety timeout: if YouTube never responds, show fallback
    timerRef.current = setTimeout(() => setPhase("blocked"), 8000);
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
      {/* ── Thumbnail / error state ── */}
      {(phase === "thumb" || phase === "blocked") && (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: getThumbUrl(ytId) }}
            style={[StyleSheet.absoluteFill, { opacity: phase === "blocked" ? 0.25 : 1 }]}
            resizeMode="cover"
          />
          <View style={styles.overlay} />

          <View style={styles.centerContent}>
            {phase === "blocked" ? (
              /* ── Embedding blocked ── */
              <View style={styles.blockedBox}>
                <View style={styles.blockedIconRing}>
                  <Feather name="shield-off" size={22} color="rgba(255,255,255,0.7)" />
                </View>
                <Text style={styles.blockedTitle}>Embedding restricted</Text>
                <Text style={styles.blockedSub}>
                  This video can't be played here.{"\n"}Watch it directly on YouTube.
                </Text>
                <TouchableOpacity
                  onPress={handleOpenYt}
                  style={styles.ytOpenBtn}
                  activeOpacity={0.85}
                >
                  <Feather name="youtube" size={13} color="#fff" />
                  <Text style={styles.ytOpenBtnText}>OPEN ON YOUTUBE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Play button ── */
              <TouchableOpacity
                onPress={handlePlay}
                activeOpacity={0.85}
                style={styles.playHitArea}
              >
                <View style={styles.playCircle}>
                  <Feather name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
                </View>
                <Text style={styles.tapToPlay}>Tap to play</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* "Watch on YouTube" badge (always) */}
          <TouchableOpacity
            onPress={handleOpenYt}
            style={styles.watchBadge}
            activeOpacity={0.8}
          >
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
            style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
            resizeMode="cover"
          />
          <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]} />
          <View style={styles.centerContent}>
            <View style={styles.loadingBox}>
              <View style={styles.spinnerRing} />
              <Text style={styles.loadingText}>Loading player…</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── YouTube iframe (lazy — only mounted after play tap) ── */}
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
            transition: "opacity 0.25s ease",
            zIndex: phase === "playing" ? 2 : -1,
          },
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowFullScreen: true,
          referrerPolicy: "strict-origin-when-cross-origin",
          sandbox:
            "allow-scripts allow-same-origin allow-presentation allow-popups allow-forms",
        })
      }

      {/* "Watch on YouTube" badge when playing */}
      {phase === "playing" && (
        <TouchableOpacity
          onPress={handleOpenYt}
          style={[styles.watchBadge, { zIndex: 10 }]}
          activeOpacity={0.8}
        >
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
    backgroundColor: "rgba(0,0,0,0.45)",
  } as any,
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  } as any,

  /* Play */
  playHitArea: { alignItems: "center", gap: 12 },
  playCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(129,140,248,0.90)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#818cf8",
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
  } as any,
  watchBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },

  /* Blocked */
  blockedBox: { alignItems: "center", gap: 10, paddingHorizontal: 28 },
  blockedIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  blockedTitle: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  blockedSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  ytOpenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#818cf8",
    borderRadius: 8,
  },
  ytOpenBtnText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "JetBrainsMono_600SemiBold",
    letterSpacing: 1.3,
  },

  /* Loading */
  loadingBox: { alignItems: "center", gap: 14 },
  spinnerRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: "rgba(129,140,248,0.2)",
    borderTopColor: "#818cf8",
  },
  loadingText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
});
