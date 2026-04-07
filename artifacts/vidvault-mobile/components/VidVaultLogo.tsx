import React from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Line,
} from "react-native-svg";

interface VidVaultLogoProps {
  size?: number;
  showBackground?: boolean;
}

export function VidVaultLogo({ size = 40, showBackground = true }: VidVaultLogoProps) {
  const s = size / 56;
  const r = size * 0.2;

  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Defs>
        <LinearGradient id="vvBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#0d0d1a" />
          <Stop offset="100%" stopColor="#0a0a14" />
        </LinearGradient>
        <LinearGradient id="vvBorder" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
        </LinearGradient>
        <LinearGradient id="vvMark" x1="0" y1="0" x2="0.5" y2="1">
          <Stop offset="0%" stopColor="#a78bfa" />
          <Stop offset="100%" stopColor="#6366f1" />
        </LinearGradient>
        <LinearGradient id="vvAccent" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#6366f1" />
          <Stop offset="100%" stopColor="#06b6d4" />
        </LinearGradient>
      </Defs>

      {/* Background */}
      {showBackground && (
        <>
          <Rect x="0" y="0" width="56" height="56" rx={r} fill="url(#vvBg)" />
          <Rect x="0.75" y="0.75" width="54.5" height="54.5" rx={r - 0.75}
            fill="none" stroke="url(#vvBorder)" strokeWidth="1.5" />
        </>
      )}

      {/* Inner subtle glow circle */}
      <Circle cx="28" cy="28" r="18" fill="rgba(99,102,241,0.06)" />

      {/* Main V mark — bold, clean, modern */}
      {/* Left arm of V */}
      <Path
        d="M14 16 L28 40"
        stroke="url(#vvMark)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Right arm of V — shorter, forms play indicator */}
      <Path
        d="M28 40 L42 16"
        stroke="url(#vvMark)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Horizontal top bar — vault motif */}
      <Path
        d="M14 16 L42 16"
        stroke="url(#vvAccent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Node dots at key points */}
      <Circle cx="14" cy="16" r="3" fill="#6366f1" />
      <Circle cx="42" cy="16" r="3" fill="#06b6d4" />
      <Circle cx="28" cy="40" r="3.5" fill="url(#vvMark)" />

      {/* Small circuit lines from top nodes */}
      <Line x1="14" y1="9" x2="14" y2="13" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <Line x1="42" y1="9" x2="42" y2="13" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* Corner micro-sparks */}
      <Circle cx="8" cy="8" r="1.2" fill="#6366f1" fillOpacity="0.4" />
      <Circle cx="48" cy="8" r="1.2" fill="#06b6d4" fillOpacity="0.4" />
    </Svg>
  );
}
