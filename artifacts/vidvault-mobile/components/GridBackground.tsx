import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Svg, { Line, Defs, RadialGradient, Stop, Rect } from "react-native-svg";

const CELL = 56;
const PURPLE_LINE = "rgba(139,92,246,0.07)";
const PURPLE_GLOW = "rgba(139,92,246,0.18)";

export function GridBackground() {
  const { width: W, height: H } = Dimensions.get("window");
  const cols = Math.ceil(W / CELL) + 1;
  const rows = Math.ceil(H / CELL) + 1;

  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="gridGlow" cx="50%" cy="0%" rx="70%" ry="60%">
            <Stop offset="0%" stopColor={PURPLE_GLOW} stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(139,92,246,0)" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="vignette" cx="50%" cy="50%" rx="75%" ry="75%">
            <Stop offset="0%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.55)" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={W} height={H} fill="url(#gridGlow)" />

        {Array.from({ length: cols }).map((_, i) => (
          <Line
            key={`v${i}`}
            x1={i * CELL} y1={0}
            x2={i * CELL} y2={H}
            stroke={PURPLE_LINE}
            strokeWidth={1}
          />
        ))}

        {Array.from({ length: rows }).map((_, i) => (
          <Line
            key={`h${i}`}
            x1={0} y1={i * CELL}
            x2={W} y2={i * CELL}
            stroke={PURPLE_LINE}
            strokeWidth={1}
          />
        ))}

        <Rect x={0} y={0} width={W} height={H} fill="url(#vignette)" />
      </Svg>
    </View>
  );
}
