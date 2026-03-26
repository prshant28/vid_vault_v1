import { Component, lazy, Suspense, type ReactNode } from "react";
import { motion } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

/* ─── Fallback animated scene (shown when WebGL unavailable) ─── */
function SplineFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Floating orbs */}
      {[
        { size: 280, x: "50%", y: "45%", color: "#8b5cf6", duration: 8, delay: 0 },
        { size: 180, x: "30%", y: "60%", color: "#06b6d4", duration: 10, delay: 2 },
        { size: 120, x: "70%", y: "30%", color: "#8b5cf6", duration: 7, delay: 4 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size, height: orb.size,
            left: orb.x, top: orb.y, translateX: "-50%", translateY: "-50%",
            background: orb.color,
            filter: `blur(${orb.size * 0.5}px)`,
            opacity: 0.08,
          }}
          animate={{ scale: [1, 1.2, 0.9, 1.1, 1], x: [0, 30, -20, 15, 0], y: [0, -25, 15, -10, 0] }}
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Rotating geometric ring */}
      <motion.div
        className="absolute"
        style={{ width: 340, height: 340, border: "1px solid rgba(139,92,246,0.15)", borderRadius: "50%" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3"
          style={{ background: "#8b5cf6", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
        />
      </motion.div>
      <motion.div
        className="absolute"
        style={{ width: 220, height: 220, border: "1px solid rgba(139,92,246,0.1)", borderRadius: "50%" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#06b6d4]"
          style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)", transform: "rotate(180deg)" }}
        />
      </motion.div>

      {/* Center monolith cube */}
      <motion.div
        className="absolute w-16 h-16 flex items-center justify-center"
        style={{
          background: "#111113",
          border: "1px solid rgba(139,92,246,0.3)",
          boxShadow: "0 0 40px rgba(139,92,246,0.15)",
          clipPath: "polygon(10% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%, 0% 10%)",
        }}
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-mono-ui font-black text-[#8b5cf6] text-lg">VV</span>
      </motion.div>

      {/* Particle dots */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 150;
        const cx = Math.cos(angle) * radius;
        const cy = Math.sin(angle) * radius;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-[#8b5cf6]"
            style={{ opacity: 0.3 }}
            animate={{ x: [cx, cx + 8, cx - 5, cx], y: [cy, cy - 8, cy + 6, cy], opacity: [0.2, 0.6, 0.1, 0.2] }}
            transition={{ duration: 4 + (i % 3), delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}

/* ─── Error Boundary ─── */
interface EBState { hasError: boolean }
class SplineErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, EBState> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {}
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

/* ─── Public export ─── */
export function SplineScene({ scene, style }: { scene: string; style?: React.CSSProperties }) {
  return (
    <SplineErrorBoundary fallback={<SplineFallback />}>
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center font-mono-ui font-black text-[#8b5cf6] text-xs"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>3D</div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-1 h-1 bg-[#8b5cf6]"
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                  transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }} />
              ))}
            </div>
          </div>
        </div>
      }>
        <Spline scene={scene} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, ...style }} />
      </Suspense>
    </SplineErrorBoundary>
  );
}
