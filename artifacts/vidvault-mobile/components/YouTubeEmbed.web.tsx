import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export const PLAYER_HEIGHT = 220;

export function YouTubePlayer({
  ytId,
  onOpenExternal,
}: {
  ytId: string;
  onOpenExternal: () => void;
}) {
  const [playerH, setPlayerH] = useState(PLAYER_HEIGHT);

  return (
    <View
      style={{ width: "100%", backgroundColor: "#000", overflow: "hidden" }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setPlayerH(Math.round(w * (9 / 16)));
      }}
    >
      <View style={{ height: playerH, width: "100%" }}>
        {React.createElement("iframe", {
          src: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`,
          style: {
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          },
          allow:
            "autoplay; encrypted-media; fullscreen; picture-in-picture",
          allowFullScreen: true,
          referrerPolicy: "no-referrer-when-downgrade",
        })}
      </View>
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
