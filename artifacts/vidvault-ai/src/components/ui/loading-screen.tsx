export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#0a0a0b" }}>
      <div className="text-center">
        <div className="w-12 h-12 border border-white/5 flex items-center justify-center mb-6 mx-auto" style={{ background: "#1a1a1c" }}>
          <span className="font-mono-ui font-black text-white text-sm">VV</span>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-1 h-1 bg-[#8b5cf6] animate-pulse" style={{ animationDelay: "0ms" }} />
          <div className="w-1 h-1 bg-[#8b5cf6] animate-pulse" style={{ animationDelay: "200ms" }} />
          <div className="w-1 h-1 bg-[#8b5cf6] animate-pulse" style={{ animationDelay: "400ms" }} />
        </div>
        <p className="font-mono-ui text-[10px] text-[#333] uppercase tracking-[0.3em] mt-4">
          INITIALIZING_VAULT
        </p>
      </div>
    </div>
  );
}
