import React from "react";
import Svg, {
  Rect,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

interface VidVaultLogoProps {
  size?: number;
  showBackground?: boolean;
}

export function VidVaultLogo({ size = 40, showBackground = true }: VidVaultLogoProps) {
  const gradId = "vvGrad";
  const gradId2 = "vvGrad2";

  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6366f1" stopOpacity="1" />
          <Stop offset="1" stopColor="#06b6d4" stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id={gradId2} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6366f1" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#06b6d4" stopOpacity="0.22" />
        </LinearGradient>
      </Defs>

      {showBackground && (
        <>
          <Rect x="0" y="0" width="56" height="56" rx="11" fill="#0a0a12" />
          <Rect
            x="0.9"
            y="0.9"
            width="54.2"
            height="54.2"
            rx="10.2"
            fill="none"
            stroke="rgba(129,140,248,0.28)"
            strokeWidth="1.8"
          />
        </>
      )}

      {/* Film strip sprockets — top row */}
      <Rect x="7"  y="4.5" width="6" height="4" rx="1.2" fill="rgba(129,140,248,0.45)" />
      <Rect x="25" y="4.5" width="6" height="4" rx="1.2" fill="rgba(129,140,248,0.45)" />
      <Rect x="43" y="4.5" width="6" height="4" rx="1.2" fill="rgba(129,140,248,0.45)" />

      {/* Film strip sprockets — bottom row */}
      <Rect x="7"  y="47.5" width="6" height="4" rx="1.2" fill="rgba(129,140,248,0.45)" />
      <Rect x="25" y="47.5" width="6" height="4" rx="1.2" fill="rgba(129,140,248,0.45)" />
      <Rect x="43" y="47.5" width="6" height="4" rx="1.2" fill="rgba(129,140,248,0.45)" />

      {/* Inner echo V (subtle, slightly inset) */}
      <Path
        d="M18 18 L28 33 L38 18"
        fill="none"
        stroke={`url(#${gradId2})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main bold V */}
      <Path
        d="M12 16 L28 40 L44 16"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Circuit nodes — side accents */}
      <Circle cx="6.5" cy="28" r="2.2" fill="rgba(129,140,248,0.5)" />
      <Circle cx="49.5" cy="28" r="2.2" fill="rgba(129,140,248,0.5)" />

      {/* Corner micro dots */}
      <Circle cx="5.5" cy="13" r="1.2" fill="rgba(129,140,248,0.3)" />
      <Circle cx="50.5" cy="13" r="1.2" fill="rgba(129,140,248,0.3)" />
      <Circle cx="5.5" cy="43" r="1.2" fill="rgba(129,140,248,0.3)" />
      <Circle cx="50.5" cy="43" r="1.2" fill="rgba(129,140,248,0.3)" />
    </Svg>
  );
}
