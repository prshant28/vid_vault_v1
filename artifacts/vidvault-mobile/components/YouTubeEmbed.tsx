import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import WebView from "react-native-webview";
import { Feather } from "@expo/vector-icons";

const { width: SCREEN_W } = Dimensions.get("window");
export const PLAYER_HEIGHT = Math.round(SCREEN_W * (9 / 16));

export function YouTubePlayer({
  ytId,
  onOpenExternal,
}: {
  ytId: string;
  onOpenExternal: () => void;
}) {
  const [error, setError] = useState(false);
  const embedUri = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`;

  if (error) {
    return (
      <View style={[styles.player, styles.errCenter]}>
        <Feather name="youtube" size={28} color="#ef4444" />
        <Text style={[styles.errTitle, { marginTop: 10 }]}>
          Embedding Restricted
        </Text>
        <Text style={styles.errSub}>Watch on YouTube instead.</Text>
        <TouchableOpacity
          onPress={onOpenExternal}
          style={styles.errBtn}
          activeOpacity={0.85}
        >
          <Feather name="external-link" size={14} color="#fff" />
          <Text style={styles.errBtnText}>OPEN IN YOUTUBE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.player}>
      <WebView
        style={{ flex: 1, backgroundColor: "#000" }}
        source={{ uri: embedUri }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 400) setError(true);
        }}
      />
      <TouchableOpacity
        onPress={onOpenExternal}
        style={styles.ytExtBtn}
        activeOpacity={0.8}
      >
        <Feather name="youtube" size={11} color="#ff0000" />
        <Text style={styles.ytExtText}>Watch on YouTube</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    width: "100%",
    height: PLAYER_HEIGHT,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  errCenter: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d14",
  },
  errTitle: { color: "#fff", fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  errSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
  errBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#ef4444",
    borderRadius: 6,
    marginTop: 12,
  },
  errBtnText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: 1.2,
  },
  ytExtBtn: {
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
  ytExtText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
});
