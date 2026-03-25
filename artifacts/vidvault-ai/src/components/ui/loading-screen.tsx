import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
      </div>
      <h2 className="mt-6 text-xl font-display font-medium text-foreground tracking-tight">
        Loading VidVault AI...
      </h2>
    </div>
  );
}
