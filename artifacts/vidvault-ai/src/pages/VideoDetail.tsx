import { useParams } from "wouter";
import { useGetVideo, useGenerateAiContent } from "@workspace/api-client-react";
import { extractYoutubeId } from "@/lib/youtube";
import { Loader2, Calendar, Folder as FolderIcon, Sparkles, FileText, CheckSquare, Presentation } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading } = useGetVideo(id || "");
  const [activeTab, setActiveTab] = useState<'notes'|'ai'>('ai');
  const generateMutation = useGenerateAiContent();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return <div className="text-center py-20 text-muted-foreground">Video not found.</div>;
  }

  const ytId = extractYoutubeId(video.url);

  const handleGenerate = async (type: any) => {
    try {
      await generateMutation.mutateAsync({ videoId: video.id, data: { type } });
      toast({ title: "Generated successfully!" });
    } catch (e) {
      toast({ title: "Failed to generate", variant: "destructive" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      {/* Left Column: Player & Info */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl overflow-hidden glass-panel aspect-video shadow-2xl">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Invalid Video URL
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-display font-bold text-foreground leading-tight">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{video.channelName}</span>
            {video.publishedAt && (
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {format(new Date(video.publishedAt), 'MMM d, yyyy')}</span>
            )}
            {video.folderName && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground"><FolderIcon className="w-3.5 h-3.5"/> {video.folderName}</span>
            )}
          </div>
          {video.description && (
            <div className="glass-panel p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto hide-scrollbar">
              {video.description}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI & Notes */}
      <div className="flex flex-col h-[calc(100vh-8rem)] sticky top-24">
        <div className="flex p-1 bg-secondary/50 rounded-xl mb-4 backdrop-blur">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'ai' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Insights
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'notes' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('notes')}
          >
            My Notes
          </button>
        </div>

        <div className="flex-1 overflow-y-auto glass-panel rounded-2xl p-5 hide-scrollbar">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => handleGenerate('summary')} disabled={generateMutation.isPending} variant="outline" className="h-auto py-3 flex-col gap-2 bg-secondary/20 hover:bg-secondary border-white/5">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-xs">Summary</span>
                </Button>
                <Button onClick={() => handleGenerate('key_insights')} disabled={generateMutation.isPending} variant="outline" className="h-auto py-3 flex-col gap-2 bg-secondary/20 hover:bg-secondary border-white/5">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span className="text-xs">Key Insights</span>
                </Button>
                <Button onClick={() => handleGenerate('mcq')} disabled={generateMutation.isPending} variant="outline" className="h-auto py-3 flex-col gap-2 bg-secondary/20 hover:bg-secondary border-white/5">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <span className="text-xs">Quiz</span>
                </Button>
                <Button onClick={() => handleGenerate('ppt_outline')} disabled={generateMutation.isPending} variant="outline" className="h-auto py-3 flex-col gap-2 bg-secondary/20 hover:bg-secondary border-white/5">
                  <Presentation className="w-5 h-5 text-orange-500" />
                  <span className="text-xs">PPT Outline</span>
                </Button>
              </div>

              {generateMutation.isPending && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              <div className="space-y-4">
                {video.aiOutputs?.map(output => (
                  <div key={output.id} className="bg-background/40 border border-white/5 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 border-b border-border/50 pb-2">
                      {output.type.replace('_', ' ')}
                    </h4>
                    <div className="text-sm whitespace-pre-wrap text-foreground/90 font-sans leading-relaxed">
                      {output.content}
                    </div>
                  </div>
                ))}
                {(!video.aiOutputs || video.aiOutputs.length === 0) && !generateMutation.isPending && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50 text-accent" />
                    <p className="text-sm">Generate AI insights to see them here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1 space-y-4">
                {video.notes?.map(note => (
                  <div key={note.id} className="bg-background/40 border border-white/5 rounded-xl p-4 group relative">
                    {note.timestamp !== null && (
                      <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/10">
                        {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}
                      </Badge>
                    )}
                    <p className="text-sm text-foreground/90">{note.content}</p>
                  </div>
                ))}
                {(!video.notes || video.notes.length === 0) && (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">No notes yet. Add one below!</p>
                  </div>
                )}
              </div>
              
              {/* Note Input Placeholder */}
              <div className="pt-4 border-t border-border/50 mt-auto">
                <textarea 
                  className="w-full bg-secondary/50 rounded-xl border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/50 p-3 text-sm resize-none"
                  placeholder="Take a note... (Auto-pauses video)"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm">Save Note</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
