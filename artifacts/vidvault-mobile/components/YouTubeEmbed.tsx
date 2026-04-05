import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
  Linking,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { Feather } from "@expo/vector-icons";

/*
  react-native-youtube-iframe is the definitive solution for YouTube playback
  in React Native WebViews. It bundles its own HTML with the YouTube IFrame
  Player API and handles all origin/UA detection internally.
*/

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
  const [playing, setPlaying] = useState(false);

  const openExternal = useCallback(
    () => Linking.openURL(`https://www.youtube.com/watch?v=${ytId}`).catch(() => {}),
    [ytId]
  );

  const handleStateChange = useCallback((state: string) => {
    if (state === "ended") setPlaying(false);
  }, []);

  const handlePlay = () => {
    setPhase("playing");
    setPlaying(true);
  };

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
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111118" }]} />
          )}
          <View style={styles.overlay} />
          <View style={styles.center}>
            <TouchableOpacity onPress={handlePlay} activeOpacity={0.85} style={styles.playHitArea}>
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

      {/* ── Phase 2: YouTube IFrame Player ── */}
      {phase === "playing" && (
        <>
          <YoutubePlayer
            height={playerH}
            play={playing}
            videoId={ytId}
            onChangeState={handleStateChange}
            initialPlayerParams={{
              rel: false,
              modestbranding: true,
              controls: true,
            }}
            webViewProps={{
              allowsFullscreenVideo: true,
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
          />
          <TouchableOpacity onPress={openExternal} style={[styles.badge, { zIndex: 20 }]} activeOpacity={0.8}>
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
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playHitArea: { alignItems: "center", gap: 12 },
  playCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(129,140,248,0.90)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
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
