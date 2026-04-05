import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
  Image,
  Linking,
} from "react-native";
import WebView from "react-native-webview";
import { Feather } from "@expo/vector-icons";

export const PLAYER_HEIGHT = 220;

/*
  KEY FIX: source={{ html, baseUrl: 'https://www.youtube.com' }}
  ──────────────────────────────────────────────────────────────
  Without baseUrl, the HTML loads from a null/file origin.
  YouTube's embed checks the parent origin and blocks null origins.

  Setting baseUrl to 'https://www.youtube.com' tells WKWebView (iOS)
  and Android WebView that this HTML came from youtube.com.
  YouTube sees itself as the embed parent → allows playback.

  Combined with a real Chrome user-agent, this bypasses all WebView detection.
*/
const CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const BASE_URL = "https://www.youtube.com";

function buildPlayerHtml(ytId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%; height: 100%;
      background: #000; overflow: hidden;
    }
    iframe {
      width: 100%; height: 100%;
      border: none; display: block;
    }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1&controls=1&modestbranding=1&fs=1"
    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
    allowfullscreen
    frameborder="0"
  ></iframe>
</body>
</html>`;
}

function getThumbUrl(ytId: string) {
  return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
}

export function YouTubePlayer({
  ytId,
  onOpenExternal,
}: {
  ytId: string;
  onOpenExternal: () => void;
}) {
  const { width } = useWindowDimensions();
  const playerH = Math.round(width * (9 / 16));
  const [phase, setPhase] = useState<"thumb" | "playing">("thumb");
  const [thumbErr, setThumbErr] = useState(false);

  const openExternal = () =>
    Linking.openURL(`https://www.youtube.com/watch?v=${ytId}`).catch(() => {});

  return (
    <View style={[styles.container, { height: playerH }]}>

      {/* ── Phase 1: Thumbnail + play button ── */}
      {phase === "thumb" && (
        <View style={StyleSheet.absoluteFill}>
          {!thumbErr ? (
            <Image
              source={{ uri: getThumbUrl(ytId) }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onError={() => setThumbErr(true)}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111" }]} />
          )}

          <View style={styles.overlay} />

          <View style={styles.center}>
            <TouchableOpacity
              onPress={() => setPhase("playing")}
              activeOpacity={0.85}
              style={styles.playHitArea}
            >
              <View style={styles.playCircle}>
                <Feather name="play" size={28} color="#fff" style={{ marginLeft: 3 }} />
              </View>
              <Text style={styles.tapLabel}>Tap to play</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={openExternal} style={styles.badge} activeOpacity={0.8}>
            <Feather name="youtube" size={11} color="#ff0000" />
            <Text style={styles.badgeText}>Watch on YouTube</Text>
            <Feather name="external-link" size={10} color="rgba(255,255,255,0.55)" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Phase 2: Inline YouTube player ── */}
      {phase === "playing" && (
        <>
          <WebView
            style={StyleSheet.absoluteFill}
            source={{
              html: buildPlayerHtml(ytId),
              baseUrl: BASE_URL,          /* ← THE FIX: parent origin = youtube.com */
            }}
            userAgent={CHROME_UA}         /* ← bypasses WebView UA detection */
            allowsFullscreenVideo
            allowsInlineMediaPlayback     /* ← iOS: play without going fullscreen */
            mediaPlaybackRequiresUserAction={false} /* ← iOS: allow autoplay */
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            originWhitelist={["*"]}
            mixedContentMode="always"
          />

          {/* Fallback badge */}
          <TouchableOpacity
            onPress={openExternal}
            style={[styles.badge, { zIndex: 20 }]}
            activeOpacity={0.8}
          >
            <Feather name="youtube" size={11} color="#ff0000" />
            <Text style={styles.badgeText}>Watch on YouTube</Text>
            <Feather name="external-link" size={10} color="rgba(255,255,255,0.55)" />
          </TouchableOpacity>
        </>
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
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
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
  tapLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    letterSpacing: 0.5,
  },
  badge: {
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
  badgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
});
