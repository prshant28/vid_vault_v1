import { Link, useLocation } from "wouter";
import { LayoutDashboard, Library, FolderOpen, Star, Bot, Plus, LogOut } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useListFolders } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/videos", label: "All Videos", icon: Library },
  { href: "/folders", label: "Folders", icon: FolderOpen },
  { href: "/videos?favorites=true", label: "Favorites", icon: Star },
  { href: "/ai", label: "AI Assistant", icon: Bot },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: folderData } = useListFolders();

  return (
    <div className="w-64 h-screen border-r border-border bg-card/30 backdrop-blur-xl flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">VidVault AI</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        <div className="space-y-1.5">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Folders</p>
            <Button variant="ghost" size="icon" className="w-5 h-5 rounded-full hover:bg-secondary">
              <Plus className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
          
          {folderData?.folders?.slice(0, 5).map(folder => (
            <Link 
              key={folder.id} 
              href={`/videos?folderId=${folder.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color || 'var(--primary)' }} />
              <span className="truncate">{folder.name}</span>
            </Link>
          ))}
          {folderData?.folders && folderData.folders.length > 5 && (
            <Link href="/folders" className="block px-3 py-2 text-xs text-primary font-medium hover:underline">
              View all folders...
            </Link>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-3">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="w-9 h-9 rounded-full border border-border" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border text-sm font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none mb-1">{user?.firstName || user?.username}</span>
              <span className="text-xs text-muted-foreground leading-none">Free Plan</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
