import React from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import Svg, { Line, Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const CELL = 52;

export function GridBackground() {
  const colors = useColors();
  const { width: W, height: H } = Dimensions.get("window");
  const cols = Math.ceil(W / CELL) + 2;
  const rows = Math.ceil(H / CELL) + 2;

  const isDark = colors.background.startsWith("#0") || colors.background === "#09090c";
  const lineColor = isDark ? "#ffffff06" : "#0000000a";

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor={isDark ? "#09090c" : "#f2f0ff"} stopOpacity="0" />
            <Stop offset="100%" stopColor={isDark ? "#09090c" : "#f2f0ff"} stopOpacity="0.7" />
          </RadialGradient>
        </Defs>

        {Array.from({ length: cols }).map((_, i) => (
          <Line
            key={`v${i}`}
            x1={i * CELL} y1={0}
            x2={i * CELL} y2={H}
            stroke={lineColor}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: rows }).map((_, i) => (
          <Line
            key={`h${i}`}
            x1={0} y1={i * CELL}
            x2={W} y2={i * CELL}
            stroke={lineColor}
            strokeWidth={1}
          />
        ))}

        <Rect x={0} y={0} width={W} height={H} fill="url(#vignette)" />
      </Svg>
    </View>
  );
}
