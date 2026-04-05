import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Svg, { Line } from "react-native-svg";

const CELL = 52;

export function GridBackground() {
  const { width: W, height: H } = Dimensions.get("window");
  const cols = Math.ceil(W / CELL) + 2;
  const rows = Math.ceil(H / CELL) + 2;

  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        {Array.from({ length: cols }).map((_, i) => (
          <Line
            key={`v${i}`}
            x1={i * CELL} y1={0}
            x2={i * CELL} y2={H}
            stroke="rgba(255,255,255,0.035)"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: rows }).map((_, i) => (
          <Line
            key={`h${i}`}
            x1={0} y1={i * CELL}
            x2={W} y2={i * CELL}
            stroke="rgba(255,255,255,0.035)"
            strokeWidth={1}
          />
        ))}
      </Svg>
    </View>
  );
}
