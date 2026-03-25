import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { AISidebar } from "./AISidebar";
import { UrlPasteModal } from "../videos/UrlPasteModal";
import { useAuth } from "@workspace/replit-auth-web";
import Login from "@/pages/Login";
import { LoadingScreen } from "../ui/loading-screen";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Login />;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative selection:bg-primary/30 selection:text-primary-foreground">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-[20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-8 hide-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <AISidebar />
      <UrlPasteModal />
    </div>
  );
}
