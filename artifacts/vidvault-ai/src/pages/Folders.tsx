import { useListFolders } from "@workspace/api-client-react";
import { Folder, Loader2, PlayCircle } from "lucide-react";
import { Link } from "wouter";

export default function Folders() {
  const { data, isLoading } = useListFolders();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-foreground">Folders</h1>
        <p className="text-muted-foreground">Organize your learning paths</p>
      </div>

      {isLoading ? (
        <div className="w-full h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data?.folders && data.folders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.folders.map(folder => (
            <Link 
              key={folder.id} 
              href={`/videos?folderId=${folder.id}`}
              className="glass-panel p-6 rounded-2xl group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 hover:border-primary/30 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary/50 group-hover:bg-background transition-colors border border-white/5" style={{ color: folder.color || 'var(--primary)' }}>
                <Folder className="w-6 h-6 fill-current opacity-20" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{folder.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {folder.videoCount} Videos
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card/20 rounded-3xl border border-white/5 border-dashed">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-display font-medium text-foreground mb-2">No folders yet</h3>
          <p className="text-muted-foreground">
            Create folders to organize your videos by topic.
          </p>
        </div>
      )}
    </div>
  );
}
